"""Unit tests for the Gemini service (app.services.gemini_service).

Covers:
  * configuration errors when GEMINI_API_KEY is missing
  * mapping of provider failures (HTTP errors, timeouts, network errors,
    empty replies) onto GeminiProviderError
  * one retry for transient connection failures, none for timeouts
  * API keys never leaking into error messages or log records
  * chat history converted into Gemini contents (user / model roles)
  * vision diagnosis returning a parsed GeminiDiagnosisResult

No real network calls are made — the SDK request boundary is mocked.
"""

from __future__ import annotations

import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx
import pytest
from google.genai import errors as gemini_errors

from app.services.gemini_service import (
    GeminiConfigurationError,
    GeminiDiagnosisResult,
    GeminiProviderError,
    _contents,
    analyze_image_with_gemini,
    generate_response,
)

FAKE_KEY = "test-gemini-key-abcdef123456"


class _Response:
    """Stand-in for the SDK's GenerateContentResponse."""

    def __init__(self, text=None, candidates=None, prompt_feedback=None):
        self.text = text
        self.candidates = candidates
        self.prompt_feedback = prompt_feedback


def _patched_settings():
    """A settings stub with a key configured (never a real secret)."""
    mock = MagicMock()
    mock.gemini_api_key = FAKE_KEY
    mock.gemini_model = "gemini-2.5-flash"
    return mock


def _client_returning(response=None, error=None):
    """Build a `_client` replacement whose generate_content yields/errors."""
    client = MagicMock()
    if error is not None:
        client.models.generate_content.side_effect = error
    else:
        client.models.generate_content.return_value = response
    return client


def _api_error(code: int, message: str = "provider failure"):
    return gemini_errors.APIError(code, {"error": {"message": message, "status": "ERROR"}})


# ===========================================================================
# 1. Configuration
# ===========================================================================


class TestConfiguration:
    def test_missing_key_raises_configuration_error(self):
        settings = MagicMock()
        settings.gemini_api_key = ""
        settings.gemini_model = "gemini-2.5-flash"
        with patch("app.services.gemini_service.settings", settings):
            with pytest.raises(GeminiConfigurationError):
                generate_response(history=[], user_message="Hello")

    def test_missing_key_raises_for_vision(self):
        settings = MagicMock()
        settings.gemini_api_key = ""
        settings.gemini_model = "gemini-2.5-flash"
        with patch("app.services.gemini_service.settings", settings):
            with pytest.raises(GeminiConfigurationError):
                analyze_image_with_gemini(
                    image_bytes=b"fake", mime_type="image/png"
                )


# ===========================================================================
# 2. Provider failures are translated, never leaked
# ===========================================================================


class TestProviderErrors:
    def _generate_with(self, error):
        with patch("app.services.gemini_service.settings", _patched_settings()), patch(
            "app.services.gemini_service._client",
            return_value=_client_returning(error=error),
        ):
            return generate_response(history=[], user_message="My wheat is yellowing")

    def test_http_error_becomes_provider_error(self):
        with pytest.raises(GeminiProviderError):
            self._generate_with(_api_error(503))

    def test_missing_model_message_is_actionable(self):
        with pytest.raises(GeminiProviderError) as exc_info:
            self._generate_with(_api_error(404, "model no longer available"))
        assert "GEMINI_MODEL" in str(exc_info.value)

    def test_rate_limit_message(self):
        with pytest.raises(GeminiProviderError) as exc_info:
            self._generate_with(_api_error(429))
        assert "rate limit" in str(exc_info.value).lower()

    def test_timeout_becomes_provider_error(self):
        with pytest.raises(GeminiProviderError) as exc_info:
            self._generate_with(httpx.ReadTimeout("timed out"))
        assert "timed out" in str(exc_info.value).lower()

    def test_network_error_becomes_provider_error(self):
        with pytest.raises(GeminiProviderError):
            self._generate_with(httpx.ConnectError("connection refused"))

    def test_empty_response_becomes_provider_error(self):
        with patch("app.services.gemini_service.settings", _patched_settings()), patch(
            "app.services.gemini_service._client",
            return_value=_client_returning(response=_Response(text="   ")),
        ):
            with pytest.raises(GeminiProviderError):
                generate_response(history=[], user_message="Hello")

    def test_key_never_appears_in_error_or_logs(self, caplog):
        error = _api_error(500, f"bad request using key {FAKE_KEY}")
        with caplog.at_level("ERROR"):
            with pytest.raises(GeminiProviderError) as exc_info:
                self._generate_with(error)
        assert FAKE_KEY not in str(exc_info.value)
        assert FAKE_KEY not in caplog.text


# ===========================================================================
# 3. Transient network failures
# ===========================================================================


class TestTransientNetworkRetry:
    """Connection-level drops are retried once; timeouts are not."""

    def _run(self, error, response=None):
        """Call generate_response with a client that fails *error* first."""
        client = MagicMock()
        client.models.generate_content.side_effect = [
            error,
            response if response is not None else _Response(text="recovered reply"),
        ]
        with patch("app.services.gemini_service.settings", _patched_settings()), patch(
            "app.services.gemini_service._client", return_value=client
        ), patch("app.services.gemini_service.time.sleep") as sleep:
            result = generate_response(history=[], user_message="Hello")
        return result, client, sleep

    def test_server_disconnect_is_retried_and_recovers(self, caplog):
        drop = httpx.RemoteProtocolError("Server disconnected without sending a response.")
        with caplog.at_level("WARNING"):
            result, client, sleep = self._run(drop)
        assert result.content == "recovered reply"
        assert client.models.generate_content.call_count == 2
        assert sleep.call_count == 1
        # The retry is visible in the logs, but carries no secret.
        assert "transient" in caplog.text
        assert FAKE_KEY not in caplog.text

    def test_persistent_network_error_still_fails_after_retry(self):
        client = MagicMock()
        client.models.generate_content.side_effect = httpx.ConnectError("connection refused")
        with patch("app.services.gemini_service.settings", _patched_settings()), patch(
            "app.services.gemini_service._client", return_value=client
        ), patch("app.services.gemini_service.time.sleep"):
            with pytest.raises(GeminiProviderError):
                generate_response(history=[], user_message="Hello")
        assert client.models.generate_content.call_count == 2

    def test_timeout_is_not_retried(self):
        client = MagicMock()
        client.models.generate_content.side_effect = httpx.ReadTimeout("timed out")
        with patch("app.services.gemini_service.settings", _patched_settings()), patch(
            "app.services.gemini_service._client", return_value=client
        ), patch("app.services.gemini_service.time.sleep") as sleep:
            with pytest.raises(GeminiProviderError):
                generate_response(history=[], user_message="Hello")
        # Retrying a timeout would double the caller's wait — so it must not.
        assert client.models.generate_content.call_count == 1
        assert sleep.call_count == 0

    def test_api_error_is_not_retried_by_the_service(self):
        client = MagicMock()
        client.models.generate_content.side_effect = _api_error(500)
        with patch("app.services.gemini_service.settings", _patched_settings()), patch(
            "app.services.gemini_service._client", return_value=client
        ), patch("app.services.gemini_service.time.sleep") as sleep:
            with pytest.raises(GeminiProviderError):
                generate_response(history=[], user_message="Hello")
        # HTTP-level retries belong to the SDK's retry_options, not here.
        assert client.models.generate_content.call_count == 1
        assert sleep.call_count == 0


# ===========================================================================
# 4. Request shape
# ===========================================================================


class TestRequestShape:
    def test_history_roles_map_to_gemini_content_roles(self):
        contents = _contents(
            [
                {"role": "user", "content": "Is this blight?"},
                {"role": "assistant", "content": "It looks like leaf blight."},
                {"role": "system", "content": "ignored"},
                {"role": "user", "content": ""},
            ],
            "What should I spray?",
        )
        assert [c.role for c in contents] == ["user", "model", "user"]
        assert contents[-1].parts[0].text == "What should I spray?"

    def test_system_instruction_and_model_are_sent(self):
        client = _client_returning(response=_Response(text="Scout the field weekly."))
        with patch("app.services.gemini_service.settings", _patched_settings()), patch(
            "app.services.gemini_service._client", return_value=client
        ):
            result = generate_response(
                history=[{"role": "user", "content": "Hello"}],
                user_message="How do I check crop health?",
                language="en",
                context="Farmer:\nName: Uneeb",
            )

        assert result.content == "Scout the field weekly."
        kwargs = client.models.generate_content.call_args.kwargs
        assert kwargs["model"] == "gemini-2.5-flash"
        assert "FARMER CONTEXT" in kwargs["config"].system_instruction
        assert "Uneeb" in kwargs["config"].system_instruction
        assert kwargs["config"].max_output_tokens == 800

    def test_vision_returns_parsed_diagnosis(self):
        payload = (
            '{"status": "diagnosed", "disease_id": "leaf-blight", '
            '"disease_name": "Leaf Blight", "confidence": 0.8, '
            '"severity": "high", "symptoms": ["brown lesions"], '
            '"treatment_steps": ["apply copper fungicide"], '
            '"prevention": ["crop rotation"], "care_tips": []}'
        )
        client = _client_returning(response=_Response(text=payload))
        with patch("app.services.gemini_service.settings", _patched_settings()), patch(
            "app.services.gemini_service._client", return_value=client
        ):
            result = analyze_image_with_gemini(
                image_bytes=b"\x89PNG-fake",
                mime_type="image/png",
                crop="Wheat",
                notes="lower leaves first",
                language="en",
            )

        assert isinstance(result, GeminiDiagnosisResult)
        assert result.status == "diagnosed"
        assert result.disease_name == "Leaf Blight"
        kwargs = client.models.generate_content.call_args.kwargs
        assert kwargs["config"].response_mime_type == "application/json"
        sent_parts = kwargs["contents"][0].parts
        assert len(sent_parts) == 2
        assert "Wheat" in sent_parts[0].text
