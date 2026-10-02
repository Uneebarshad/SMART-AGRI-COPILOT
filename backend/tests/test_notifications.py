"""Notification system tests — creation from real events, read state, dedupe.

Baseline behavior under test:
* GET/PATCH /api/notifications existed but nothing ever INSERTed rows, so the
  inbox was permanently empty.  Weather advisories (via the dashboard) and
  completed leaf scans now create genuine notifications.
* No fabricated notifications: only warning-tone advisories and scan results
  produce rows.
"""

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.notification import Notification
from app.routes import dashboard as dashboard_module
from tests.conftest import register_and_get_token

EMAIL = "notifications-q@example.com"


@pytest.fixture
def notif_user():
    """Authenticated client on a dedicated user whose inbox is emptied first."""
    client, token, user_id = register_and_get_token(email=EMAIL)
    db = SessionLocal()
    try:
        db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.commit()
    finally:
        db.close()
    client.headers["Authorization"] = f"Bearer {token}"
    return client, user_id


def _list(client):
    resp = client.get("/api/notifications")
    assert resp.status_code == 200
    return resp.json()


class TestNotificationBasics:
    def test_unauthenticated_list_rejected(self):
        client = TestClient(app)
        assert client.get("/api/notifications").status_code == 401

    def test_unauthenticated_read_all_rejected(self):
        client = TestClient(app)
        assert client.patch("/api/notifications/read-all").status_code == 401

    def test_fresh_inbox_is_empty(self, notif_user):
        client, _ = notif_user
        assert _list(client) == []


class TestScanNotifications:
    def test_disease_scan_creates_notification(self, notif_user):
        client, _ = notif_user
        resp = client.post(
            "/api/diagnosis/scans",
            json={
                "status": "disease",
                "crop": "wheat",
                "disease_name": "Yellow Rust",
                "treatment_steps": ["Apply recommended fungicide early morning."],
            },
        )
        assert resp.status_code == 201
        scan_id = resp.json()["id"]

        items = _list(client)
        assert len(items) == 1
        note = items[0]
        assert note["type"] == "disease"
        assert note["title"] == "Yellow Rust detected"
        assert note["body"] == "Apply recommended fungicide early morning."
        assert note["read"] is False
        assert note["deep_link"] == f"/diagnosis/{scan_id}"

    def test_healthy_scan_creates_success_notification(self, notif_user):
        client, _ = notif_user
        resp = client.post(
            "/api/diagnosis/scans",
            json={"status": "healthy", "crop": "cotton"},
        )
        assert resp.status_code == 201

        items = _list(client)
        assert len(items) == 1
        assert items[0]["type"] == "success"
        assert items[0]["title"] == "Leaf scan: no disease detected"

    def test_uncertain_scan_notification_is_honest(self, notif_user):
        client, _ = notif_user
        resp = client.post("/api/diagnosis/scans", json={"status": "uncertain"})
        assert resp.status_code == 201

        items = _list(client)
        assert items[0]["type"] == "info"
        # Must not claim a diagnosis that does not exist.
        assert "confidence" in items[0]["body"].lower()


class TestReadState:
    def test_mark_single_read(self, notif_user):
        client, _ = notif_user
        client.post("/api/diagnosis/scans", json={"status": "healthy"})
        note = _list(client)[0]

        resp = client.patch(f"/api/notifications/{note['id']}/read")
        assert resp.status_code == 200
        assert resp.json()["read"] is True

    def test_mark_all_read(self, notif_user):
        client, _ = notif_user
        client.post("/api/diagnosis/scans", json={"status": "healthy"})
        client.post("/api/diagnosis/scans", json={"status": "uncertain"})
        assert len(_list(client)) == 2

        resp = client.patch("/api/notifications/read-all")
        assert resp.status_code == 200
        assert resp.json()["updated"] == 2

        items = _list(client)
        assert all(item["read"] for item in items)

    def test_mark_all_read_on_empty_inbox(self, notif_user):
        client, _ = notif_user
        resp = client.patch("/api/notifications/read-all")
        assert resp.status_code == 200
        assert resp.json()["updated"] == 0


class TestWeatherAdvisoryNotifications:
    """Dashboard records real weather advisories as notifications."""

    def _fake_weather(self, advisories):
        def fake_fetch(district=None, lang=None):
            return {
                "current": {
                    "temperature": 31,
                    "precipitation_chance": 70,
                    "humidity": 85,
                    "wind_speed": 12,
                    "feels_like": 34,
                    "condition": "Rain",
                    "condition_text": "Light rain",
                },
                "advisories": advisories,
            }

        return fake_fetch

    _RAIN_ADVISORY = {
        "type": "rain_caution",
        "tone": "warning",
        "text_localized": {
            "en": "Heavy rain expected. Delay field operations.",
            "ur": "بارش",
            "ur-Latn": "Baarish mutawaqqa hai.",
        },
    }

    def test_warning_advisory_creates_notification(self, notif_user):
        client, _ = notif_user
        original = dashboard_module.fetch_weather
        dashboard_module.fetch_weather = self._fake_weather([self._RAIN_ADVISORY])
        try:
            resp = client.get("/api/dashboard?lang=en")
            assert resp.status_code == 200
        finally:
            dashboard_module.fetch_weather = original

        items = _list(client)
        assert len(items) == 1
        assert items[0]["type"] == "weather"
        assert items[0]["title"] == "Heavy rain expected"
        assert items[0]["deep_link"] == "/weather"

    def test_repeat_dashboard_call_deduplicates(self, notif_user):
        client, _ = notif_user
        original = dashboard_module.fetch_weather
        dashboard_module.fetch_weather = self._fake_weather([self._RAIN_ADVISORY])
        try:
            assert client.get("/api/dashboard?lang=en").status_code == 200
            assert client.get("/api/dashboard?lang=en").status_code == 200
        finally:
            dashboard_module.fetch_weather = original

        assert len(_list(client)) == 1

    def test_success_advisory_creates_no_noise(self, notif_user):
        client, _ = notif_user
        benign = {
            "type": "good_fieldwork",
            "tone": "success",
            "text_localized": {"en": "Favourable conditions for fieldwork."},
        }
        original = dashboard_module.fetch_weather
        dashboard_module.fetch_weather = self._fake_weather([benign])
        try:
            assert client.get("/api/dashboard?lang=en").status_code == 200
        finally:
            dashboard_module.fetch_weather = original

        assert _list(client) == []

    def test_weather_failure_creates_nothing(self, notif_user):
        """Fix #1 contract: provider failure stays honest — no fake weather
        and, consequently, no fabricated weather notifications."""

        def exploding_fetch(district=None, lang=None):
            raise RuntimeError("provider down")

        client, _ = notif_user
        original = dashboard_module.fetch_weather
        dashboard_module.fetch_weather = exploding_fetch
        try:
            resp = client.get("/api/dashboard?lang=en")
            assert resp.status_code == 200
            assert resp.json()["weather"]["current"] is None
        finally:
            dashboard_module.fetch_weather = original

        assert _list(client) == []
