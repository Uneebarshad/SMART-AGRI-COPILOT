"""Tests for GET /api/users/me and PATCH /api/users/me.

These tests hit the real PostgreSQL database via FastAPI TestClient (same
pattern as test_weather.py).  Every request is authenticated against a
freshly-registered user so we exercise the JWT flow end-to-end.
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from tests.conftest import make_authenticated_client


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def auth_client():
    """Return a TestClient authenticated as a freshly-registered user."""
    client, token = make_authenticated_client(email="users-me@example.com")
    return client


@pytest.fixture(autouse=True)
def _snapshot_user():
    """Save and restore the test user so PATCH tests don't leak state."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "users-me@example.com").first()
        if user is None:
            yield
            return
        snapshot = {
            "name": user.name,
            "email": user.email,
            "language": user.language,
            "district": user.district,
            "preferences": user.preferences,
        }
        yield
        # Restore
        db.refresh(user)
        for attr, value in snapshot.items():
            setattr(user, attr, value)
        db.commit()
    finally:
        db.close()


# ===========================================================================
# 1. GET /api/users/me
# ===========================================================================


class TestGetCurrentUser:
    def test_returns_200(self, auth_client):
        resp = auth_client.get("/api/users/me")
        assert resp.status_code == 200

    def test_contains_all_fields(self, auth_client):
        data = auth_client.get("/api/users/me").json()
        for key in ("id", "name", "email", "language", "district",
                     "preferences", "created_at", "updated_at"):
            assert key in data, f"missing field: {key}"

    def test_id_is_int(self, auth_client):
        data = auth_client.get("/api/users/me").json()
        assert isinstance(data["id"], int)

    def test_language_defaults_to_en(self, auth_client):
        data = auth_client.get("/api/users/me").json()
        assert data["language"] == "en"

    def test_nullable_fields_are_null_or_string(self, auth_client):
        data = auth_client.get("/api/users/me").json()
        assert data["name"] is None or isinstance(data["name"], str)
        assert data["email"] is None or isinstance(data["email"], str)
        assert data["preferences"] is None or isinstance(data["preferences"], dict)

    def test_timestamps_present(self, auth_client):
        data = auth_client.get("/api/users/me").json()
        assert data["created_at"] is not None
        assert data["updated_at"] is not None

    def test_unauthenticated_returns_401(self):
        client = TestClient(app)
        resp = client.get("/api/users/me")
        assert resp.status_code == 401


# ===========================================================================
# 2. PATCH /api/users/me - scalar fields
# ===========================================================================


class TestPatchScalarFields:
    def test_update_name(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"name": "Rashid"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Rashid"

    def test_update_email(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"email": "rashid@example.com"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "rashid@example.com"

    def test_update_language(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"language": "ur"})
        assert resp.status_code == 200
        assert resp.json()["language"] == "ur"

    def test_update_district(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"district": "Multan"})
        assert resp.status_code == 200
        assert resp.json()["district"] == "Multan"

    def test_update_multiple_fields(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={
            "name": "Ayesha",
            "language": "ur-Latn",
            "district": "Vehari",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Ayesha"
        assert data["language"] == "ur-Latn"
        assert data["district"] == "Vehari"

    def test_partial_update_preserves_unspecified_fields(self, auth_client):
        auth_client.patch("/api/users/me", json={"name": "Original", "district": "Lahore"})
        resp = auth_client.patch("/api/users/me", json={"name": "Changed"})
        data = resp.json()
        assert data["name"] == "Changed"
        assert data["district"] == "Lahore"

    def test_empty_body_returns_current_state(self, auth_client):
        before = auth_client.get("/api/users/me").json()
        resp = auth_client.patch("/api/users/me", json={})
        assert resp.status_code == 200
        after = resp.json()
        assert after["name"] == before["name"]
        assert after["language"] == before["language"]


# ===========================================================================
# 3. PATCH - preferences merge
# ===========================================================================


class TestPatchPreferences:
    def test_preferences_merged_not_replaced(self, auth_client):
        auth_client.patch("/api/users/me", json={
            "preferences": {
                "temperature_unit": "C",
                "weather_alerts": True,
                "daily_summary": True,
            },
        })
        resp = auth_client.patch("/api/users/me", json={
            "preferences": {"weather_alerts": False},
        })
        prefs = resp.json()["preferences"]
        assert prefs["temperature_unit"] == "C"
        assert prefs["weather_alerts"] is False
        assert prefs["daily_summary"] is True

    def test_null_existing_preferences_treated_as_empty(self, auth_client):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == "users-me@example.com").first()
            user.preferences = None
            db.commit()
        finally:
            db.close()

        resp = auth_client.patch("/api/users/me", json={
            "preferences": {"crop_type": "Wheat"},
        })
        prefs = resp.json()["preferences"]
        assert prefs == {"crop_type": "Wheat"}

    def test_preferences_can_add_new_keys(self, auth_client):
        auth_client.patch("/api/users/me", json={"preferences": {}})
        resp = auth_client.patch("/api/users/me", json={
            "preferences": {"a": 1, "b": 2},
        })
        prefs = resp.json()["preferences"]
        assert prefs["a"] == 1
        assert prefs["b"] == 2

    def test_preferences_overwrite_existing_key(self, auth_client):
        auth_client.patch("/api/users/me", json={
            "preferences": {"theme": "light"},
        })
        resp = auth_client.patch("/api/users/me", json={
            "preferences": {"theme": "dark"},
        })
        assert resp.json()["preferences"]["theme"] == "dark"


# ===========================================================================
# 4. PATCH - validation
# ===========================================================================


class TestPatchValidation:
    def test_invalid_email_rejected(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"email": "not-an-email"})
        assert resp.status_code == 422

    def test_invalid_language_rejected(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"language": "fr"})
        assert resp.status_code == 422

    def test_blank_name_rejected(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"name": "   "})
        assert resp.status_code == 422

    def test_name_too_long_rejected(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"name": "x" * 121})
        assert resp.status_code == 422

    def test_email_too_long_rejected(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"email": "a" * 252 + "@b.cd"})
        assert resp.status_code == 422

    def test_preferences_must_be_object(self, auth_client):
        resp = auth_client.patch("/api/users/me", json={"preferences": [1, 2, 3]})
        assert resp.status_code == 422


# ===========================================================================
# 5. PATCH - updated_at behaviour
# ===========================================================================


class TestPatchTimestamp:
    def test_updated_at_changes_on_patch(self, auth_client):
        before = auth_client.get("/api/users/me").json()
        import time
        time.sleep(0.05)

        resp = auth_client.patch("/api/users/me", json={"name": "TimestampTest"})
        after = resp.json()

        assert after["updated_at"] != before["updated_at"]
        assert after["created_at"] == before["created_at"]


# ===========================================================================
# 6. Existing routes still work (authenticated)
# ===========================================================================


class TestExistingRoutesUnbroken:
    """Smoke-test that every existing route still starts and responds."""

    def test_health(self, auth_client):
        assert auth_client.get("/api/health").status_code == 200

    def test_dashboard(self, auth_client):
        resp = auth_client.get("/api/dashboard?lang=en")
        assert resp.status_code == 200
        assert "weather" in resp.json()

    def test_fields_list(self, auth_client):
        resp = auth_client.get("/api/fields")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_notifications_list(self, auth_client):
        resp = auth_client.get("/api/notifications")
        assert resp.status_code == 200

    def test_recommendations_list(self, auth_client):
        resp = auth_client.get("/api/recommendations")
        assert resp.status_code == 200

    def test_conversations_list(self, auth_client):
        resp = auth_client.get("/api/conversations")
        assert resp.status_code == 200

    def test_diagnosis_scans_list(self, auth_client):
        resp = auth_client.get("/api/diagnosis/scans")
        assert resp.status_code == 200


# ===========================================================================
# 7. District synchronization (Fix #2)
# ===========================================================================


class TestDistrictSync:
    """Onboarding/Settings district persistence via PATCH /api/users/me.

    The frontend pushes the district chosen on /welcome once the session is
    authenticated, and Settings changes go through this same endpoint; the
    backend must persist supported districts and reject unknown ones.
    """

    def test_selected_district_persists(self, auth_client):
        """Test 1 — a freshly authenticated user's district reaches the DB."""
        resp = auth_client.patch("/api/users/me", json={"district": "karachi"})
        assert resp.status_code == 200
        assert resp.json()["district"] == "karachi"
        # Confirmed persisted, not just echoed by the PATCH response.
        follow = auth_client.get("/api/users/me")
        assert follow.json()["district"] == "karachi"

    def test_other_supported_district_persists(self, auth_client):
        """Test 2 — display-name spelling of a supported district persists."""
        resp = auth_client.patch("/api/users/me", json={"district": "Faisalabad"})
        assert resp.status_code == 200
        assert resp.json()["district"] == "Faisalabad"

    def test_district_can_be_changed_later(self, auth_client):
        """Test 3 — the Settings flow (change district later) still works."""
        assert auth_client.patch(
            "/api/users/me", json={"district": "karachi"}
        ).status_code == 200
        resp = auth_client.patch("/api/users/me", json={"district": "Multan"})
        assert resp.status_code == 200
        assert resp.json()["district"] == "Multan"

    def test_invalid_district_rejected(self, auth_client):
        """Test 4 — an unsupported district cannot be persisted."""
        # Seed a valid district first so we can prove the invalid PATCH is a
        # full no-op rather than a partial write.
        auth_client.patch("/api/users/me", json={"district": "lahore"})
        resp = auth_client.patch("/api/users/me", json={"district": "Atlantis"})
        assert resp.status_code == 422
        assert auth_client.get("/api/users/me").json()["district"] == "lahore"

    def test_blank_district_clears(self, auth_client):
        """A blank district is normalised to the cleared (NULL) state."""
        auth_client.patch("/api/users/me", json={"district": "multan"})
        resp = auth_client.patch("/api/users/me", json={"district": "   "})
        assert resp.status_code == 200
        assert resp.json()["district"] is None
