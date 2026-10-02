"""Gemini Vision resilience tests — transient 503/high-demand handling.

Covers three release-critical behaviors:
* A transient HTTP 503/429/500 from Gemini is retried once and succeeds.
* A persistent transient failure (or a non-retryable error) surfaces as
  GeminiProviderError after exactly the expected number of attempts.
* POST /api/diagnosis/analyze maps provider failures to the 502
  diagnosis_provider_error envelope, and a 'diagnosed' scan creates a proper
  disease notification (status-contract regression).
"""

import io
import json
import urllib.error
from unittest.mock import patch

import pytest
from sqlalchemy import delete

from app.database import SessionLocal
from app.models.notification import Notification
from app.services.llm_service import (
    GeminiProviderError,
    analyze_image_with_gemini,
)
from tests.conftest import register_and_get_token


def _http_error(code: int) -> urllib.error.HTTPError:
    return urllib.error.HTTPError(
        url="https://generativelanguage.googleapis.com/v1beta/models/x",
        code=code,
        msg="Service Unavailable",
        hdrs={},
        fp=io.BytesIO(b'{"error":{"status":"UNAVAILABLE","message":"high demand"}}'),
    )


def _ok_response() -> dict:
    diagnosis = {
        "status": "diagnosed",
        "disease_id": "leaf-blight",
        "disease_name": "Leaf Blight",
        "confidence": 0.85,
        "severity": "high",
        "symptoms": ["brown lesions"],
        "treatment_steps": ["Apply copper fungicide."],
        "prevention": ["Crop rotation"],
        "care_tips": ["Monitor daily"],
    }
    return {
        "candidates": [
            {"content": {"parts": [{"text": json.dumps(diagnosis)}]}}
        ]
    }


class _FakeResponse:
    """Minimal stand-in for the urlopen context-manager result."""

    def __init__(self, payload: dict):
        self._data = json.dumps(payload).encode("utf-8")

    def read(self):
        return self._data

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


@pytest.fixture
def gemini_settings():
    with patch("app.services.llm_service.settings") as mock_s:
        mock_s.gemini_api_key = "test-key"
        mock_s.gemini_model = "gemini-2.0-flash"
        yield mock_s


def _analyze():
    return analyze_image_with_gemini(
        image_bytes=b"\xff\xd8fakejpeg",
        mime_type="image/jpeg",
        crop="wheat",
        notes=None,
        language="en",
    )


class TestGeminiTransientRetry:
    def test_503_then_success_returns_diagnosis(self, gemini_settings):
        """First call hits Gemini's high-demand 503; the retry succeeds."""
        with patch(
            "urllib.request.urlopen",
            side_effect=[_http_error(503), _FakeResponse(_ok_response())],
        ) as mock_urlopen, patch("app.services.llm_service.time.sleep") as mock_sleep:
            result = _analyze()

        assert mock_urlopen.call_count == 2
        assert mock_sleep.call_count == 1  # one backoff between attempts
        assert result.status == "diagnosed"
        assert result.disease_name == "Leaf Blight"

    def test_persistent_503_raises_after_two_attempts(self, gemini_settings):
        with patch(
            "urllib.request.urlopen",
            side_effect=[_http_error(503), _http_error(503)],
        ) as mock_urlopen, patch("app.services.llm_service.time.sleep"):
            with pytest.raises(GeminiProviderError, match="HTTP 503"):
                _analyze()

        assert mock_urlopen.call_count == 2  # exactly one retry, no storm

    def test_429_is_retried(self, gemini_settings):
        with patch(
            "urllib.request.urlopen",
            side_effect=[_http_error(429), _FakeResponse(_ok_response())],
        ) as mock_urlopen, patch("app.services.llm_service.time.sleep"):
            result = _analyze()

        assert mock_urlopen.call_count == 2
        assert result.status == "diagnosed"

    def test_non_retryable_400_fails_immediately(self, gemini_settings):
        with patch(
            "urllib.request.urlopen",
            side_effect=[_http_error(400)],
        ) as mock_urlopen, patch("app.services.llm_service.time.sleep"):
            with pytest.raises(GeminiProviderError, match="HTTP 400"):
                _analyze()

        assert mock_urlopen.call_count == 1

    def test_timeout_is_retried_then_raises(self, gemini_settings):
        with patch(
            "urllib.request.urlopen",
            side_effect=[TimeoutError("slow"), TimeoutError("slow")],
        ) as mock_urlopen, patch("app.services.llm_service.time.sleep"):
            with pytest.raises(GeminiProviderError):
                _analyze()

        assert mock_urlopen.call_count == 2


# ---------------------------------------------------------------------------
# Route-level behavior (authenticated, real DB like the rest of the suite)
# ---------------------------------------------------------------------------

ANALYZE_EMAIL = "gemini-resilience@example.com"


@pytest.fixture
def analyze_client():
    client, token, _ = register_and_get_token(email=ANALYZE_EMAIL)
    client.headers["Authorization"] = f"Bearer {token}"
    return client


def _post_analyze(client):
    return client.post(
        "/api/diagnosis/analyze",
        files={"image": ("leaf.jpg", b"\xff\xd8fakejpegbytes", "image/jpeg")},
        data={"language": "en", "crop": "wheat"},
    )


class TestAnalyzeRouteEnvelope:
    def test_provider_503_maps_to_502_diagnosis_provider_error(self, analyze_client):
        with patch(
            "app.routes.diagnosis.analyze_and_persist",
            side_effect=GeminiProviderError("Gemini API returned HTTP 503"),
        ):
            resp = _post_analyze(analyze_client)

        assert resp.status_code == 502
        body = resp.json()
        assert body["error"]["code"] == "diagnosis_provider_error"
        # No upstream secrets/details beyond the sanitized provider message.
        assert "key" not in json.dumps(body).lower()

    def test_unconfigured_gemini_maps_to_503(self, analyze_client):
        from app.services.llm_service import GeminiConfigurationError

        with patch(
            "app.routes.diagnosis.analyze_and_persist",
            side_effect=GeminiConfigurationError("no key"),
        ):
            resp = _post_analyze(analyze_client)

        assert resp.status_code == 503
        assert resp.json()["error"]["code"] == "gemini_not_configured"


class TestDiagnosedScanNotification:
    """Regression: the Gemini pipeline stores status 'diagnosed' (not the
    legacy 'disease'), and the inbox notification must reflect a positive
    diagnosis instead of the misleading 'no firm match' message."""

    def test_diagnosed_scan_creates_disease_notification(self, analyze_client):
        db = SessionLocal()
        try:
            user_id = analyze_client.get("/api/users/me").json()["id"]
            db.execute(delete(Notification).where(Notification.user_id == user_id))
            db.commit()
        finally:
            db.close()

        resp = analyze_client.post(
            "/api/diagnosis/scans",
            json={
                "status": "diagnosed",
                "crop": "wheat",
                "disease_id": "leaf-blight",
                "disease_name": "Leaf Blight",
                "confidence": 0.85,
                "severity": "high",
                "treatment_steps": ["Apply copper fungicide."],
            },
        )
        assert resp.status_code == 201
        scan_id = resp.json()["id"]

        notes = analyze_client.get("/api/notifications").json()
        assert len(notes) == 1
        note = notes[0]
        assert note["type"] == "disease"
        assert note["title"] == "Leaf Blight detected"
        assert note["body"] == "Apply copper fungicide."
        assert note["deep_link"] == f"/diagnosis/{scan_id}"
