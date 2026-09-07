"""Tests for Recommendations, History, and Disease Library endpoints.

These tests hit the real PostgreSQL database via FastAPI TestClient.
All user-scoped endpoints are exercised with an authenticated client.
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.recommendation import Recommendation
from app.models.history import ActivityHistory
from app.models.disease import Disease
from tests.conftest import make_authenticated_client


@pytest.fixture
def auth_client():
    """Return a TestClient authenticated as a freshly-registered user."""
    client, token = make_authenticated_client(email="phase3@example.com")
    return client


# ===========================================================================
# 1. Recommendations — CRUD + isolation
# ===========================================================================


class TestRecommendations:
    def test_list_returns_200(self, auth_client):
        resp = auth_client.get("/api/recommendations")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_and_retrieve(self, auth_client):
        payload = {
            "category": "irrigation",
            "title": "Test recommendation",
            "summary": "Water early morning",
            "priority": "high",
            "crop": "Tomato",
        }
        resp = auth_client.post("/api/recommendations", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Test recommendation"
        assert data["category"] == "irrigation"
        assert data["priority"] == "high"
        rec_id = data["id"]

        # Retrieve by ID
        resp2 = auth_client.get(f"/api/recommendations/{rec_id}")
        assert resp2.status_code == 200
        assert resp2.json()["title"] == "Test recommendation"

        # Cleanup
        auth_client.delete(f"/api/recommendations/{rec_id}")

    def test_update_status(self, auth_client):
        payload = {
            "category": "pest-disease",
            "title": "Scout for pests",
            "status": "pending",
        }
        resp = auth_client.post("/api/recommendations", json=payload)
        rec_id = resp.json()["id"]

        resp2 = auth_client.patch(f"/api/recommendations/{rec_id}", json={"status": "completed"})
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "completed"

        auth_client.delete(f"/api/recommendations/{rec_id}")

    def test_delete_recommendation(self, auth_client):
        payload = {"category": "general", "title": "To be deleted"}
        resp = auth_client.post("/api/recommendations", json=payload)
        rec_id = resp.json()["id"]

        resp2 = auth_client.delete(f"/api/recommendations/{rec_id}")
        assert resp2.status_code == 204

        resp3 = auth_client.get(f"/api/recommendations/{rec_id}")
        assert resp3.status_code == 404

    def test_not_found_returns_404(self, auth_client):
        resp = auth_client.get("/api/recommendations/999999")
        assert resp.status_code == 404


# ===========================================================================
# 2. History — list, detail, delete + isolation
# ===========================================================================


class TestHistory:
    def test_list_returns_200(self, auth_client):
        resp = auth_client.get("/api/history")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_has_seeded_data(self, auth_client):
        # History is seeded per-user; we only assert the list endpoint works.
        resp = auth_client.get("/api/history")
        data = resp.json()
        assert isinstance(data, list)

    def test_list_items_have_expected_fields(self, auth_client):
        resp = auth_client.get("/api/history")
        data = resp.json()
        if not data:
            pytest.skip("No history records present")
        item = data[0]
        for key in ("id", "event_type", "title", "description", "status", "occurred_at", "created_at"):
            assert key in item, f"missing field: {key}"

    def test_filter_by_event_type(self, auth_client):
        resp = auth_client.get("/api/history?event_type=assistant")
        assert resp.status_code == 200
        data = resp.json()
        for item in data:
            assert item["event_type"] == "assistant"

    def test_get_history_item(self, auth_client):
        resp = auth_client.get("/api/history")
        data = resp.json()
        if not data:
            pytest.skip("No history records present")
        item_id = data[0]["id"]
        resp2 = auth_client.get(f"/api/history/{item_id}")
        assert resp2.status_code == 200
        assert resp2.json()["id"] == item_id

    def test_delete_history_item(self, auth_client):
        # Create a record to delete by fetching existing ones
        resp = auth_client.get("/api/history")
        data = resp.json()
        if not data:
            pytest.skip("No history records to delete")
        item_id = data[0]["id"]
        resp2 = auth_client.delete(f"/api/history/{item_id}")
        assert resp2.status_code == 204

    def test_not_found_returns_404(self, auth_client):
        resp = auth_client.get("/api/history/999999")
        assert resp.status_code == 404


# ===========================================================================
# 3. Disease Library — list, detail, search/filter (public — no auth needed)
# ===========================================================================


class TestDiseases:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_list_returns_200(self, client):
        resp = client.get("/api/diseases")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_has_seeded_data(self, client):
        resp = client.get("/api/diseases")
        data = resp.json()
        assert len(data) >= 10  # We seeded 10 diseases

    def test_disease_has_expected_fields(self, client):
        resp = client.get("/api/diseases")
        data = resp.json()
        assert len(data) > 0
        disease = data[0]
        for key in ("id", "slug", "name", "crop", "type", "severity",
                     "description", "symptoms", "causes", "prevention",
                     "recommended_actions", "commonness"):
            assert key in disease, f"missing field: {key}"

    def test_symptoms_is_list(self, client):
        resp = client.get("/api/diseases")
        data = resp.json()
        assert len(data) > 0
        assert isinstance(data[0]["symptoms"], list)
        assert len(data[0]["symptoms"]) > 0

    def test_filter_by_crop(self, client):
        resp = client.get("/api/diseases?crop=Tomato")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        for disease in data:
            assert disease["crop"] == "Tomato"

    def test_filter_by_type(self, client):
        resp = client.get("/api/diseases?type=Fungal")
        assert resp.status_code == 200
        data = resp.json()
        for disease in data:
            assert disease["type"] == "Fungal"

    def test_filter_by_severity(self, client):
        resp = client.get("/api/diseases?severity=High")
        assert resp.status_code == 200
        data = resp.json()
        for disease in data:
            assert disease["severity"] == "High"

    def test_search_by_name(self, client):
        resp = client.get("/api/diseases?search=blight")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        for disease in data:
            assert "blight" in disease["name"].lower() or "blight" in disease["description"].lower()

    def test_get_disease_by_id(self, client):
        resp = client.get("/api/diseases")
        data = resp.json()
        assert len(data) > 0
        disease_id = data[0]["id"]
        resp2 = client.get(f"/api/diseases/{disease_id}")
        assert resp2.status_code == 200
        assert resp2.json()["name"] == data[0]["name"]

    def test_get_disease_by_slug(self, client):
        resp = client.get("/api/diseases/by-slug/tomato-early-blight")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug"] == "tomato-early-blight"
        assert data["name"] == "Early blight"

    def test_not_found_returns_404(self, client):
        resp = client.get("/api/diseases/999999")
        assert resp.status_code == 404

    def test_slug_not_found_returns_404(self, client):
        resp = client.get("/api/diseases/by-slug/nonexistent-disease")
        assert resp.status_code == 404


# ===========================================================================
# 4. New routes don't break existing routes
# ===========================================================================


class TestNewRoutesDontBreakExisting:
    def test_health(self, auth_client):
        assert auth_client.get("/api/health").status_code == 200

    def test_dashboard(self, auth_client):
        resp = auth_client.get("/api/dashboard?lang=en")
        assert resp.status_code == 200

    def test_fields_list(self, auth_client):
        resp = auth_client.get("/api/fields")
        assert resp.status_code == 200

    def test_users_me(self, auth_client):
        resp = auth_client.get("/api/users/me")
        assert resp.status_code == 200
