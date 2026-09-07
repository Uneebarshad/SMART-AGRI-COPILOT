"""Tests for assistant context injection (user profile + fields + weather).

Covers:
  1. Assistant receives authenticated user's name.
  2. Assistant receives district.
  3. Assistant receives language preference.
  4. Assistant receives user's field/crop information.
  5. Assistant receives weather context when available.
  6. Weather failure does not break chat.
  7. Missing district does not break chat.
  8. User with no fields can still chat.
  9. Cross-user field data is never included.
 10. Sensitive fields are never included in LLM context.
 11. Existing chat behavior still works.
 12. Existing authentication tests still pass.
"""

from __future__ import annotations

import json
import sys
import os
import time
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.field import Field
from app.models.conversation import Conversation
from app.models.history import ActivityHistory
from app.routes.assistant import _build_assistant_context


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _register_user(
    name: str = "Context Farmer",
    email: str | None = None,
    password: str = "testpass123",
    district: str | None = None,
    language: str = "en",
) -> tuple[TestClient, str, int]:
    """Register a user and return (client, token, user_id)."""
    if email is None:
        email = f"ctx-{time.time()}@example.com"
    client = TestClient(app)
    payload = {"name": name, "email": email, "password": password}
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code in (200, 201), resp.text
    data = resp.json()
    token = data["access_token"]
    user_id = data["user"]["id"]
    client.headers["Authorization"] = f"Bearer {token}"

    # Update optional fields via DB
    if district is not None or language != "en":
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if district is not None:
                user.district = district
            if language != "en":
                user.language = language
            db.commit()
        finally:
            db.close()

    return client, token, user_id


def _create_conversation(user_id: int) -> str:
    """Create a conversation for a user and return its id."""
    db = SessionLocal()
    try:
        conv = Conversation(user_id=user_id, title="Test")
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv.id
    finally:
        db.close()


def _create_field(user_id: int, **kwargs) -> int:
    """Create a field for a user and return its id."""
    db = SessionLocal()
    try:
        field = Field(
            user_id=user_id,
            name=kwargs.get("name", "Test Field"),
            crop=kwargs.get("crop", "Wheat"),
            area_ha=kwargs.get("area_ha", 2.0),
            location=kwargs.get("location", ""),
            irrigation_method=kwargs.get("irrigation_method", ""),
            soil=kwargs.get("soil", {"ph": "Not measured", "moisture": "Not measured", "organicMatter": "Not measured"}),
        )
        db.add(field)
        db.commit()
        db.refresh(field)
        return field.id
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Mock LLM to capture the context passed to generate_response
# ---------------------------------------------------------------------------

def _mock_llm_response(**kwargs):
    """Return a fake LLMResponse and capture the call kwargs."""
    from app.services.llm_service import LLMResponse
    _mock_llm_response.last_call = kwargs
    return LLMResponse(content="Mock response")

_mock_llm_response.last_call = {}


# ===========================================================================
# 1. Context builder — profile fields
# ===========================================================================


class TestContextBuilder:
    """Unit tests for _build_assistant_context()."""

    def test_user_name_in_context(self):
        """User's name appears in the context."""
        client, token, user_id = _register_user(name="Uneeb")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            ctx = _build_assistant_context(user)
            assert "Uneeb" in ctx
        finally:
            db.close()

    def test_user_district_in_context(self):
        """User's district appears in the context."""
        client, token, user_id = _register_user(district="Karachi")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            ctx = _build_assistant_context(user)
            assert "Karachi" in ctx
        finally:
            db.close()

    def test_user_language_in_context(self):
        """User's language preference appears in the context."""
        client, token, user_id = _register_user(language="ur")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            ctx = _build_assistant_context(user)
            assert "ur" in ctx
        finally:
            db.close()

    def test_field_crop_in_context(self):
        """User's field crop appears in the context."""
        client, token, user_id = _register_user()
        _create_field(user_id, name="North Plot", crop="Cotton", area_ha=5.0)
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            ctx = _build_assistant_context(user)
            assert "Cotton" in ctx
            assert "North Plot" in ctx
        finally:
            db.close()

    def test_multiple_fields_in_context(self):
        """Multiple fields all appear in the context."""
        client, token, user_id = _register_user()
        _create_field(user_id, name="Field A", crop="Wheat", area_ha=3.0)
        _create_field(user_id, name="Field B", crop="Rice", area_ha=7.0)
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            ctx = _build_assistant_context(user)
            assert "Wheat" in ctx
            assert "Rice" in ctx
            assert "Field A" in ctx
            assert "Field B" in ctx
        finally:
            db.close()

    def test_no_fields_still_returns_profile(self):
        """User with no fields still gets profile context."""
        client, token, user_id = _register_user(name="NoFields Farmer", district="Lahore")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            ctx = _build_assistant_context(user)
            assert "NoFields Farmer" in ctx
            assert "Lahore" in ctx
        finally:
            db.close()

    def test_no_district_skips_weather(self):
        """User with no district gets context without weather."""
        client, token, user_id = _register_user(name="NoDistrict", district=None)
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            ctx = _build_assistant_context(user)
            assert "NoDistrict" in ctx
            assert "Weather" not in ctx
        finally:
            db.close()

    def test_sensitive_fields_excluded(self):
        """Password hash, reset tokens, and email are NOT in context."""
        client, token, user_id = _register_user(
            name="Secure", email=f"secure-{time.time()}@example.com", district="Multan"
        )
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            # Set some sensitive fields
            user.password_hash = "fake_hash_value_12345"
            user.password_reset_token_hash = "fake_reset_hash_67890"
            db.commit()
            db.refresh(user)

            ctx = _build_assistant_context(user)
            assert "fake_hash_value_12345" not in ctx
            assert "fake_reset_hash_67890" not in ctx
            assert "secure@example.com" not in ctx
            assert "password" not in ctx.lower()
        finally:
            db.close()


# ===========================================================================
# 2. Weather context
# ===========================================================================


class TestWeatherContext:
    """Weather injection tests."""

    def test_weather_included_when_available(self):
        """Weather data appears in context when district is set."""
        client, token, user_id = _register_user(district="lahore")
        fake_weather = {
            "district": "Lahore",
            "current": {
                "temperature": 35,
                "condition_text": "Clear sky",
                "humidity": 45,
                "wind_speed": 12,
                "wind_direction": "NW",
                "precipitation": 0.0,
                "precipitation_chance": 5,
            },
        }
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            with patch("app.routes.assistant.get_weather", return_value=fake_weather):
                ctx = _build_assistant_context(user)
            assert "35" in ctx
            assert "Clear sky" in ctx
            assert "Lahore" in ctx
        finally:
            db.close()

    def test_weather_failure_does_not_break_context(self):
        """Weather API failure does not prevent context generation."""
        from app.services.weather_service import WeatherProviderError

        client, token, user_id = _register_user(name="WeatherFail", district="vehari")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            with patch("app.routes.assistant.get_weather", side_effect=WeatherProviderError("fail")):
                ctx = _build_assistant_context(user)
            # Profile should still be there
            assert "WeatherFail" in ctx
            # Weather should NOT be there
            assert "Temperature" not in ctx
        finally:
            db.close()

    def test_weather_config_error_does_not_break_context(self):
        """WeatherConfigurationError does not prevent context generation."""
        from app.services.weather_service import WeatherConfigurationError

        client, token, user_id = _register_user(name="NoConfig", district="multan")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            with patch("app.routes.assistant.get_weather", side_effect=WeatherConfigurationError("no key")):
                ctx = _build_assistant_context(user)
            assert "NoConfig" in ctx
            assert "Temperature" not in ctx
        finally:
            db.close()

    def test_weather_district_error_does_not_break_context(self):
        """WeatherDistrictError does not prevent context generation."""
        from app.services.weather_service import WeatherDistrictError

        client, token, user_id = _register_user(name="BadDistrict", district="unknown-city")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            with patch("app.routes.assistant.get_weather", side_effect=WeatherDistrictError("nope")):
                ctx = _build_assistant_context(user)
            assert "BadDistrict" in ctx
            assert "Temperature" not in ctx
        finally:
            db.close()


# ===========================================================================
# 3. Cross-user isolation
# ===========================================================================


class TestCrossUserIsolation:
    """Verify that one user's fields never leak into another user's context."""

    def test_cross_user_fields_not_in_context(self):
        """User B's context does NOT contain User A's fields."""
        # User A with a field
        _, _, user_a_id = _register_user(name="UserA", email=f"a-{time.time()}@example.com")
        _create_field(user_a_id, name="A's Secret Field", crop="Opium", area_ha=100.0)

        # User B with no fields
        _, _, user_b_id = _register_user(name="UserB", email=f"b-{time.time()}@example.com")

        db = SessionLocal()
        try:
            user_b = db.query(User).filter(User.id == user_b_id).first()
            ctx = _build_assistant_context(user_b)
            assert "Opium" not in ctx
            assert "A's Secret Field" not in ctx
        finally:
            db.close()


# ===========================================================================
# 4. Integration — chat endpoint with context
# ===========================================================================


class TestChatWithContext:
    """Integration tests: the chat endpoint passes context to generate_response."""

    @patch("app.routes.assistant.generate_response")
    def test_chat_passes_context_with_name(self, mock_gen):
        """The chat endpoint passes user name in context."""
        mock_gen.side_effect = _mock_llm_response

        client, token, user_id = _register_user(name="Uneeb", district="Karachi")
        conv_id = _create_conversation(user_id)

        resp = client.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_id, "message": "What is my name?", "language": "en"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

        call_kwargs = _mock_llm_response.last_call
        context = call_kwargs.get("context", "")
        assert "Uneeb" in context

    @patch("app.routes.assistant.generate_response")
    def test_chat_passes_field_info(self, mock_gen):
        """The chat endpoint passes field/crop info in context."""
        mock_gen.side_effect = _mock_llm_response

        client, token, user_id = _register_user(name="Farmer", district="Vehari")
        _create_field(user_id, name="Main Field", crop="Wheat", area_ha=2.0)
        conv_id = _create_conversation(user_id)

        resp = client.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_id, "message": "When should I irrigate?", "language": "en"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

        call_kwargs = _mock_llm_response.last_call
        context = call_kwargs.get("context", "")
        assert "Wheat" in context
        assert "Main Field" in context

    @patch("app.routes.assistant.generate_response")
    def test_chat_passes_weather(self, mock_gen):
        """The chat endpoint passes weather data in context."""
        mock_gen.side_effect = _mock_llm_response

        client, token, user_id = _register_user(name="WeatherFarmer", district="lahore")
        conv_id = _create_conversation(user_id)

        fake_weather = {
            "district": "Lahore",
            "current": {
                "temperature": 32,
                "condition_text": "Partly cloudy",
                "humidity": 55,
                "wind_speed": 8,
                "wind_direction": "SE",
                "precipitation": 0.0,
                "precipitation_chance": 10,
            },
        }

        with patch("app.routes.assistant.get_weather", return_value=fake_weather):
            resp = client.post(
                "/api/assistant/chat",
                json={"conversation_id": conv_id, "message": "Should I spray today?", "language": "en"},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert resp.status_code == 201

        call_kwargs = _mock_llm_response.last_call
        context = call_kwargs.get("context", "")
        assert "32" in context
        assert "Partly cloudy" in context

    @patch("app.routes.assistant.generate_response")
    def test_chat_works_without_fields(self, mock_gen):
        """Chat works for a user with no fields."""
        mock_gen.side_effect = _mock_llm_response

        client, token, user_id = _register_user(name="NoFields")
        conv_id = _create_conversation(user_id)

        resp = client.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_id, "message": "Hello", "language": "en"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

    @patch("app.routes.assistant.generate_response")
    def test_chat_works_without_district(self, mock_gen):
        """Chat works for a user with no district (no weather)."""
        mock_gen.side_effect = _mock_llm_response

        client, token, user_id = _register_user(name="NoDistrict", district=None)
        conv_id = _create_conversation(user_id)

        resp = client.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_id, "message": "Hello", "language": "en"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

    @patch("app.routes.assistant.generate_response")
    def test_chat_weather_failure_still_works(self, mock_gen):
        """Chat works even when weather API fails."""
        from app.services.weather_service import WeatherProviderError
        mock_gen.side_effect = _mock_llm_response

        client, token, user_id = _register_user(name="WeatherFail2", district="vehari")
        conv_id = _create_conversation(user_id)

        with patch("app.routes.assistant.get_weather", side_effect=WeatherProviderError("down")):
            resp = client.post(
                "/api/assistant/chat",
                json={"conversation_id": conv_id, "message": "Hello", "language": "en"},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert resp.status_code == 201

    def test_chat_requires_authentication(self):
        """Unauthenticated chat request returns 401."""
        client = TestClient(app)
        resp = client.post(
            "/api/assistant/chat",
            json={"conversation_id": "fake", "message": "Hello", "language": "en"},
        )
        assert resp.status_code == 401


# ===========================================================================
# 5. LLM service — context parameter
# ===========================================================================


class TestLLMServiceContext:
    """Test that generate_response accepts and uses the context parameter."""

    def test_generate_response_accepts_context(self):
        """generate_response() accepts the context keyword argument."""
        from app.services.llm_service import generate_response, LLMConfigurationError
        import inspect

        sig = inspect.signature(generate_response)
        assert "context" in sig.parameters

    def test_build_system_prompt_includes_context(self):
        """_build_system_prompt() appends context when provided."""
        from app.services.llm_service import _build_system_prompt

        prompt_no_ctx = _build_system_prompt("en")
        prompt_with_ctx = _build_system_prompt("en", "Farmer:\nName: Uneeb")

        assert "Name: Uneeb" not in prompt_no_ctx
        assert "You have access to this data" not in prompt_no_ctx
        assert "Name: Uneeb" in prompt_with_ctx
        assert "You have access to this data" in prompt_with_ctx

    def test_build_system_prompt_context_none(self):
        """_build_system_prompt() with context=None has no data block."""
        from app.services.llm_service import _build_system_prompt

        prompt = _build_system_prompt("en", None)
        assert "You have access to this data" not in prompt


# ===========================================================================
# 6. HTTP-boundary integration — prove weather reaches the Gemini request
# ===========================================================================


class _FakeHTTPResponse:
    """Minimal stand-in for urllib.response to satisfy urlopen()."""

    def __init__(self, body: dict):
        self._body = json.dumps(body).encode("utf-8")

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


_FAKE_LLM_RESPONSE = {
    "choices": [{"message": {"content": "Mock reply"}}]
}


def _capture_llm_request(context: str | None, user_message: str = "Hello"):
    """Call generate_response() with urlopen mocked; return (captured_payload, result)."""
    import io
    captured = {}

    def fake_urlopen(request, timeout=None):
        captured["url"] = request.full_url
        captured["payload"] = json.loads(request.data.decode("utf-8"))
        captured["method"] = request.get_method()
        return _FakeHTTPResponse(_FAKE_LLM_RESPONSE)

    from app.services.llm_service import generate_response

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        result = generate_response(
            history=[],
            user_message=user_message,
            language="en",
            context=context,
        )
    return captured, result


def _get_system_message(captured: dict) -> str:
    """Extract the system message content from a captured LLM payload."""
    messages = captured["payload"]["messages"]
    system_msgs = [m for m in messages if m["role"] == "system"]
    assert len(system_msgs) == 1, f"Expected 1 system message, got {len(system_msgs)}"
    return system_msgs[0]["content"]


class TestHTTPBoundaryWeather:
    """Prove that weather data reaches the actual Gemini HTTP request."""

    def test_weather_in_gemini_request(self):
        """When context contains weather, the Gemini request system message includes it."""
        ctx = (
            "Farmer:\nName: Uneeb Arshad\nDistrict: Karachi\n\n"
            "Current weather (Karachi):\n"
            "Temperature: 27°C\nCondition: Patchy rain nearby\n"
            "Humidity: 82%\nWind: 31 km/h WSW\n"
            "Precipitation: 0.0 mm\nRain chance: 61%"
        )
        captured, result = _capture_llm_request(ctx, "What is the weather today?")

        system_msg = _get_system_message(captured)

        # Weather data is present
        assert "27" in system_msg
        assert "Patchy rain nearby" in system_msg
        assert "82%" in system_msg
        assert "Karachi" in system_msg

        # FARMER CONTEXT framing is present
        assert "FARMER CONTEXT" in system_msg
        assert "You have access to this data" in system_msg

    def test_no_weather_no_fake_weather(self):
        """When context has no weather, the Gemini request has no weather data."""
        ctx = "Farmer:\nName: Test Farmer\nDistrict: Lahore"
        captured, result = _capture_llm_request(ctx, "Hello")

        system_msg = _get_system_message(captured)
        assert "Test Farmer" in system_msg
        assert "Current weather" not in system_msg
        assert "Temperature:" not in system_msg

    def test_no_district_no_weather(self):
        """When context is just a name (no district), no weather is present."""
        ctx = "Farmer:\nName: NoDistrict"
        captured, result = _capture_llm_request(ctx, "Hello")

        system_msg = _get_system_message(captured)
        assert "NoDistrict" in system_msg
        assert "Current weather" not in system_msg

    def test_profile_always_present(self):
        """Profile name is always in the system message when context is provided."""
        ctx = "Farmer:\nName: Uneeb"
        captured, result = _capture_llm_request(ctx, "What is my name?")

        system_msg = _get_system_message(captured)
        assert "Uneeb" in system_msg
        assert "FARMER CONTEXT" in system_msg

    def test_multiple_fields_user_scoped(self):
        """Multiple fields are included and remain user-scoped."""
        ctx = (
            "Farmer:\nName: MultiFarmer\nDistrict: Karachi\n\n"
            "Fields:\n"
            "- Name: Cotton Field, Crop: Cotton, Area: 3.0 ha\n"
            "- Name: Wheat Field, Crop: Wheat, Area: 5.0 ha"
        )
        captured, result = _capture_llm_request(ctx, "Tell me about my fields")

        system_msg = _get_system_message(captured)
        assert "Cotton" in system_msg
        assert "Wheat" in system_msg
        assert "MultiFarmer" in system_msg

    def test_weather_question_contains_weather_data(self):
        """A weather question results in weather data being in the request."""
        ctx = (
            "Farmer:\nName: Uneeb\nDistrict: Karachi\n\n"
            "Current weather (Karachi):\n"
            "Temperature: 35°C\nCondition: Clear sky\n"
            "Humidity: 45%\nRain chance: 5%"
        )
        captured, result = _capture_llm_request(ctx, "What is the weather today?")

        system_msg = _get_system_message(captured)
        assert "35" in system_msg
        assert "Clear sky" in system_msg
        assert "Current weather" in system_msg

    def test_no_conflicting_denial_instructions(self):
        """The system prompt must NOT contain instructions that force denial of weather access."""
        from app.services.llm_service import SYSTEM_PROMPT_BASE

        # These phrases would cause Gemini to deny having weather data
        assert "capabilities you do not have" not in SYSTEM_PROMPT_BASE
        assert "If information" not in SYSTEM_PROMPT_BASE or "unavailable, say so" not in SYSTEM_PROMPT_BASE

        # The prompt must explicitly instruct the model to use provided weather
        assert "MUST use those exact values" in SYSTEM_PROMPT_BASE
        # The prompt must forbid claiming lack of weather access when data IS provided
        assert "Do NOT say you lack weather access" in SYSTEM_PROMPT_BASE

    def test_system_prompt_tells_model_to_use_provided_weather(self):
        """The system prompt instructs the model to use weather from FARMER CONTEXT."""
        from app.services.llm_service import SYSTEM_PROMPT_BASE

        assert "FARMER CONTEXT includes current weather data" in SYSTEM_PROMPT_BASE
        assert "Only say weather is unavailable when FARMER CONTEXT does NOT" in SYSTEM_PROMPT_BASE

    def test_farmer_context_framing_grants_access(self):
        """The FARMER CONTEXT block explicitly tells the model it has access to the data."""
        from app.services.llm_service import _build_system_prompt

        prompt = _build_system_prompt("en", "Farmer:\nName: Test")
        assert "You have access to this data" in prompt
        assert "use it directly" in prompt


# ===========================================================================
# 7. End-to-end: user → context → Gemini request
# ===========================================================================


class TestEndToEndWeather:
    """End-to-end: authenticated user → context builder → Gemini request."""

    @patch("app.routes.assistant.generate_response")
    def test_e2e_weather_reaches_generate_response(self, mock_gen):
        """Full flow: user with district → weather fetched → context passed to LLM."""
        from app.services.llm_service import LLMResponse
        mock_gen.return_value = LLMResponse(content="Weather reply")

        client, token, user_id = _register_user(name="E2EWeather", district="lahore")
        conv_id = _create_conversation(user_id)

        fake_weather = {
            "district": "Lahore",
            "current": {
                "temperature": 38,
                "condition_text": "Sunny",
                "humidity": 30,
                "wind_speed": 10,
                "wind_direction": "N",
                "precipitation": 0.0,
                "precipitation_chance": 2,
            },
        }

        with patch("app.routes.assistant.get_weather", return_value=fake_weather):
            resp = client.post(
                "/api/assistant/chat",
                json={"conversation_id": conv_id, "message": "What is the weather?", "language": "en"},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert resp.status_code == 201

        # Verify generate_response was called with weather in context
        call_kwargs = mock_gen.call_args.kwargs
        context = call_kwargs.get("context", "")
        assert "38" in context
        assert "Sunny" in context
        assert "Lahore" in context
        assert "Current weather" in context


# ===========================================================================
# 8. Assistant history — ONE entry per conversation, no duplicates
# ===========================================================================


class TestAssistantHistory:
    """Verify that assistant conversations create activity_history entries."""

    @patch("app.routes.assistant.generate_response")
    def test_first_chat_creates_history_entry(self, mock_gen):
        """The first chat exchange in a conversation creates exactly ONE history entry."""
        from app.services.llm_service import LLMResponse
        mock_gen.return_value = LLMResponse(content="Test reply")

        client, token, user_id = _register_user(name="HistFarmer")
        conv_id = _create_conversation(user_id)

        resp = client.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_id, "message": "Hello assistant", "language": "en"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

        # Verify history entry was created
        db = SessionLocal()
        try:
            entries = (
                db.query(ActivityHistory)
                .filter(
                    ActivityHistory.user_id == user_id,
                    ActivityHistory.related_entity_type == "conversation",
                    ActivityHistory.related_entity_id == conv_id,
                )
                .all()
            )
            assert len(entries) == 1
            assert entries[0].event_type == "assistant"
            assert entries[0].title == "Test"
            assert "Hello assistant" in entries[0].description
            assert entries[0].status == "Completed"
        finally:
            db.close()

    @patch("app.routes.assistant.generate_response")
    def test_second_chat_no_duplicate_history(self, mock_gen):
        """Sending a second message in the same conversation does NOT create another history entry."""
        from app.services.llm_service import LLMResponse
        mock_gen.return_value = LLMResponse(content="Reply")

        client, token, user_id = _register_user(name="NoDupFarmer")
        conv_id = _create_conversation(user_id)

        # First message
        resp1 = client.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_id, "message": "First question", "language": "en"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp1.status_code == 201

        # Second message
        resp2 = client.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_id, "message": "Second question", "language": "en"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp2.status_code == 201

        # Verify only ONE history entry exists
        db = SessionLocal()
        try:
            entries = (
                db.query(ActivityHistory)
                .filter(
                    ActivityHistory.user_id == user_id,
                    ActivityHistory.related_entity_type == "conversation",
                    ActivityHistory.related_entity_id == conv_id,
                )
                .all()
            )
            assert len(entries) == 1
        finally:
            db.close()

    @patch("app.routes.assistant.generate_response")
    def test_history_entry_contains_conversation_id(self, mock_gen):
        """The history entry's related_entity_id matches the conversation ID."""
        from app.services.llm_service import LLMResponse
        mock_gen.return_value = LLMResponse(content="Reply")

        client, token, user_id = _register_user(name="IdFarmer")
        conv_id = _create_conversation(user_id)

        resp = client.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_id, "message": "Check my ID", "language": "en"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

        # Fetch via /api/history and verify the conversation reference
        hist_resp = client.get(
            "/api/history?event_type=assistant",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert hist_resp.status_code == 200
        data = hist_resp.json()
        matching = [e for e in data if e.get("related_entity_id") == conv_id]
        assert len(matching) == 1
        assert matching[0]["related_entity_type"] == "conversation"

    @patch("app.routes.assistant.generate_response")
    def test_history_is_user_scoped(self, mock_gen):
        """Another user cannot see this user's assistant history entries."""
        from app.services.llm_service import LLMResponse
        mock_gen.return_value = LLMResponse(content="Private reply")

        client_a, token_a, user_a_id = _register_user(name="UserA_Hist", email=f"ah-{time.time()}@example.com")
        conv_a_id = _create_conversation(user_a_id)

        resp_a = client_a.post(
            "/api/assistant/chat",
            json={"conversation_id": conv_a_id, "message": "Secret question", "language": "en"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert resp_a.status_code == 201

        # User B registers and checks history
        client_b, token_b, user_b_id = _register_user(name="UserB_Hist", email=f"bh-{time.time()}@example.com")
        hist_resp = client_b.get(
            "/api/history?event_type=assistant",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert hist_resp.status_code == 200
        data = hist_resp.json()
        # User B should NOT see User A's conversation
        matching = [e for e in data if e.get("related_entity_id") == conv_a_id]
        assert len(matching) == 0

    @patch("app.routes.assistant.generate_response")
    def test_existing_field_diagnosis_history_still_works(self, mock_gen):
        """Existing field/diagnosis/recommendation history is not broken."""
        from app.services.llm_service import LLMResponse
        mock_gen.return_value = LLMResponse(content="Reply")

        client, token, user_id = _register_user(name="ExistingHist")

        # Create a field — this creates a history entry
        field_resp = client.post(
            "/api/fields",
            json={"name": "Test Field", "crop": "Wheat", "area_ha": 2.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert field_resp.status_code == 201

        # Verify field history entry exists
        hist_resp = client.get(
            "/api/history?event_type=field",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert hist_resp.status_code == 200
        data = hist_resp.json()
        assert len(data) >= 1
        assert any(e["event_type"] == "field" for e in data)


# ===========================================================================
# 9. System prompt — weather instruction rules
# ===========================================================================


class TestSystemPromptWeatherRules:
    """Verify the system prompt contains the correct weather instructions."""

    def test_prompt_instructs_to_use_provided_weather(self):
        """When FARMER CONTEXT has weather, the prompt tells the model to use it."""
        from app.services.llm_service import SYSTEM_PROMPT_BASE

        assert "FARMER CONTEXT includes current weather data" in SYSTEM_PROMPT_BASE
        assert "MUST use those exact values" in SYSTEM_PROMPT_BASE

    def test_prompt_forbids_denial_when_weather_present(self):
        """The prompt explicitly says not to claim lack of weather access when data exists."""
        from app.services.llm_service import SYSTEM_PROMPT_BASE

        assert "Do NOT say you lack weather access" in SYSTEM_PROMPT_BASE
        assert "Never respond with" in SYSTEM_PROMPT_BASE
        assert "I don't have access to weather" in SYSTEM_PROMPT_BASE

    def test_prompt_allows_unavailable_only_when_no_weather(self):
        """The prompt says weather may be unavailable only when FARMER CONTEXT has no weather."""
        from app.services.llm_service import SYSTEM_PROMPT_BASE

        assert "Only say weather is unavailable when FARMER CONTEXT does NOT include any weather data" in SYSTEM_PROMPT_BASE

    def test_prompt_does_not_ask_for_weather_when_provided(self):
        """The prompt does NOT tell the model to ask the farmer for weather when it's already in FARMER CONTEXT."""
        from app.services.llm_service import SYSTEM_PROMPT_BASE

        # The old contradictory phrase must be gone
        assert "recent weather, etc." not in SYSTEM_PROMPT_BASE
        # The replacement must explicitly say not to ask for weather
        assert "Do NOT ask the farmer" in SYSTEM_PROMPT_BASE
        assert "for weather information if FARMER CONTEXT already includes weather data" in SYSTEM_PROMPT_BASE

    def test_prompt_never_invents_weather(self):
        """The prompt says to never invent weather values."""
        from app.services.llm_service import SYSTEM_PROMPT_BASE

        assert "Never invent weather values" in SYSTEM_PROMPT_BASE

    def test_full_prompt_with_weather_contains_all_instructions(self):
        """The complete system prompt (with weather context) contains all weather rules."""
        from app.services.llm_service import _build_system_prompt

        weather_ctx = (
            "Farmer:\nName: Test\nDistrict: Karachi\n\n"
            "Current weather (Karachi):\n"
            "Temperature: 30°C\nCondition: Clear\nHumidity: 50%"
        )
        prompt = _build_system_prompt("en", weather_ctx)

        # FARMER CONTEXT block is present
        assert "FARMER CONTEXT" in prompt
        # Weather data is present
        assert "30°C" in prompt
        assert "Clear" in prompt
        # All weather instructions are present
        assert "MUST use those exact values" in prompt
        assert "Do NOT say you lack weather access" in prompt
        assert "Only say weather is unavailable when FARMER CONTEXT does NOT include any weather data" in prompt
        assert "Never invent weather values" in prompt
