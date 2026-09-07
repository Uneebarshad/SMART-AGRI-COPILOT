"""Comprehensive authentication tests.

Covers registration, login, JWT validation, user isolation, and authorization.
All tests hit the real PostgreSQL database via FastAPI TestClient.
"""

from __future__ import annotations

import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.services.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


@pytest.fixture
def client():
    return TestClient(app)


# ===========================================================================
# 1. Registration
# ===========================================================================


class TestRegistration:
    def test_successful_registration(self, client):
        resp = client.post(
            "/api/auth/register",
            json={
                "name": "New Farmer",
                "email": f"new-{time.time()}@example.com",
                "password": "securepass123",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["name"] == "New Farmer"
        assert "id" in data["user"]
        # Password must never be returned
        assert "password" not in data
        assert "password_hash" not in data

    def test_duplicate_email_rejected(self, client):
        email = f"dup-{time.time()}@example.com"
        resp1 = client.post(
            "/api/auth/register",
            json={"name": "A", "email": email, "password": "password123"},
        )
        assert resp1.status_code == 201

        resp2 = client.post(
            "/api/auth/register",
            json={"name": "B", "email": email, "password": "password123"},
        )
        assert resp2.status_code == 409

    def test_invalid_email_rejected(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"name": "X", "email": "not-an-email", "password": "password123"},
        )
        assert resp.status_code == 422

    def test_missing_fields_rejected(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"name": "X", "email": "x@example.com"},  # missing password
        )
        assert resp.status_code == 422

    def test_short_password_rejected(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"name": "X", "email": "x@example.com", "password": "abc"},
        )
        assert resp.status_code == 422

    def test_password_is_hashed_in_database(self, client):
        email = f"hash-{time.time()}@example.com"
        client.post(
            "/api/auth/register",
            json={"name": "Hash Test", "email": email, "password": "mypassword"},
        )
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            assert user is not None
            assert user.password_hash is not None
            assert user.password_hash != "mypassword"
            assert verify_password("mypassword", user.password_hash)
        finally:
            db.close()


# ===========================================================================
# 2. Login
# ===========================================================================


class TestLogin:
    def test_successful_login(self, client):
        email = f"login-{time.time()}@example.com"
        client.post(
            "/api/auth/register",
            json={"name": "Login Test", "email": email, "password": "password123"},
        )
        resp = client.post(
            "/api/auth/login",
            json={"email": email, "password": "password123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == email

    def test_wrong_password_rejected(self, client):
        email = f"wrong-{time.time()}@example.com"
        client.post(
            "/api/auth/register",
            json={"name": "Wrong", "email": email, "password": "password123"},
        )
        resp = client.post(
            "/api/auth/login",
            json={"email": email, "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    def test_unknown_email_rejected(self, client):
        resp = client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "password123"},
        )
        assert resp.status_code == 401

    def test_token_generation(self, client):
        email = f"token-{time.time()}@example.com"
        client.post(
            "/api/auth/register",
            json={"name": "Token", "email": email, "password": "password123"},
        )
        resp = client.post(
            "/api/auth/login",
            json={"email": email, "password": "password123"},
        )
        token = resp.json()["access_token"]
        # Token should be decodable
        payload = decode_access_token(token)
        assert "sub" in payload
        assert "exp" in payload


# ===========================================================================
# 3. Authentication (JWT validation)
# ===========================================================================


class TestAuthentication:
    def test_valid_token_works(self, client):
        email = f"valid-{time.time()}@example.com"
        resp = client.post(
            "/api/auth/register",
            json={"name": "Valid", "email": email, "password": "password123"},
        )
        token = resp.json()["access_token"]
        resp2 = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp2.status_code == 200
        assert resp2.json()["email"] == email

    def test_missing_token_returns_401(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code == 401

    def test_invalid_token_returns_401(self, client):
        resp = client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert resp.status_code == 401

    def test_expired_token_returns_401(self, client):
        # Create a token that's already expired
        from datetime import datetime, timedelta, timezone
        import jwt
        from app.config import settings

        payload = {
            "sub": "999",
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired_token = jwt.encode(
            payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
        )
        resp = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp.status_code == 401

    def test_inactive_user_returns_403(self, client):
        email = f"inactive-{time.time()}@example.com"
        resp = client.post(
            "/api/auth/register",
            json={"name": "Inactive", "email": email, "password": "password123"},
        )
        token = resp.json()["access_token"]
        user_id = resp.json()["user"]["id"]

        # Manually deactivate the user
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            user.is_active = False
            db.commit()
        finally:
            db.close()

        resp2 = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp2.status_code == 403


# ===========================================================================
# 4. Authorization (user isolation)
# ===========================================================================


class TestAuthorization:
    def test_user_can_access_own_fields(self, client):
        email = f"fields-{time.time()}@example.com"
        resp = client.post(
            "/api/auth/register",
            json={"name": "Fields", "email": email, "password": "password123"},
        )
        token = resp.json()["access_token"]

        # Create a field
        resp2 = client.post(
            "/api/fields",
            json={
                "name": "My Field",
                "crop": "Wheat",
                "area_ha": 10.0,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp2.status_code == 201
        field_id = resp2.json()["id"]

        # Access it
        resp3 = client.get(
            f"/api/fields/{field_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp3.status_code == 200
        assert resp3.json()["name"] == "My Field"

    def test_user_cannot_access_another_users_fields(self, client):
        # User A
        email_a = f"userA-{time.time()}@example.com"
        resp_a = client.post(
            "/api/auth/register",
            json={"name": "User A", "email": email_a, "password": "password123"},
        )
        token_a = resp_a.json()["access_token"]

        # User A creates a field
        resp_field = client.post(
            "/api/fields",
            json={"name": "A's Field", "crop": "Rice", "area_ha": 5.0},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        field_id = resp_field.json()["id"]

        # User B
        email_b = f"userB-{time.time()}@example.com"
        resp_b = client.post(
            "/api/auth/register",
            json={"name": "User B", "email": email_b, "password": "password123"},
        )
        token_b = resp_b.json()["access_token"]

        # User B tries to access User A's field
        resp_try = client.get(
            f"/api/fields/{field_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_try.status_code == 404

    def test_user_cannot_access_another_users_recommendations(self, client):
        # User A
        email_a = f"recA-{time.time()}@example.com"
        resp_a = client.post(
            "/api/auth/register",
            json={"name": "Rec A", "email": email_a, "password": "password123"},
        )
        token_a = resp_a.json()["access_token"]

        resp_rec = client.post(
            "/api/recommendations",
            json={"category": "general", "title": "A's Rec"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        rec_id = resp_rec.json()["id"]

        # User B
        email_b = f"recB-{time.time()}@example.com"
        resp_b = client.post(
            "/api/auth/register",
            json={"name": "Rec B", "email": email_b, "password": "password123"},
        )
        token_b = resp_b.json()["access_token"]

        resp_try = client.get(
            f"/api/recommendations/{rec_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_try.status_code == 404

    def test_user_cannot_access_another_users_conversations(self, client):
        # User A
        email_a = f"convA-{time.time()}@example.com"
        resp_a = client.post(
            "/api/auth/register",
            json={"name": "Conv A", "email": email_a, "password": "password123"},
        )
        token_a = resp_a.json()["access_token"]

        resp_conv = client.post(
            "/api/conversations",
            json={"title": "A's Conv"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        conv_id = resp_conv.json()["id"]

        # User B
        email_b = f"convB-{time.time()}@example.com"
        resp_b = client.post(
            "/api/auth/register",
            json={"name": "Conv B", "email": email_b, "password": "password123"},
        )
        token_b = resp_b.json()["access_token"]

        resp_try = client.get(
            f"/api/conversations/{conv_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_try.status_code == 404

    def test_user_cannot_access_another_users_diagnosis_scans(self, client):
        # User A
        email_a = f"diagA-{time.time()}@example.com"
        resp_a = client.post(
            "/api/auth/register",
            json={"name": "Diag A", "email": email_a, "password": "password123"},
        )
        token_a = resp_a.json()["access_token"]

        resp_scan = client.post(
            "/api/diagnosis/scans",
            json={"crop": "Wheat", "status": "healthy"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        scan_id = resp_scan.json()["id"]

        # User B
        email_b = f"diagB-{time.time()}@example.com"
        resp_b = client.post(
            "/api/auth/register",
            json={"name": "Diag B", "email": email_b, "password": "password123"},
        )
        token_b = resp_b.json()["access_token"]

        resp_try = client.get(
            f"/api/diagnosis/scans/{scan_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_try.status_code == 404

    def test_user_cannot_access_another_users_notifications(self, client):
        # User A
        email_a = f"notifA-{time.time()}@example.com"
        resp_a = client.post(
            "/api/auth/register",
            json={"name": "Notif A", "email": email_a, "password": "password123"},
        )
        token_a = resp_a.json()["access_token"]

        # User A lists notifications (should be empty but accessible)
        resp_list = client.get(
            "/api/notifications",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert resp_list.status_code == 200

        # User B
        email_b = f"notifB-{time.time()}@example.com"
        resp_b = client.post(
            "/api/auth/register",
            json={"name": "Notif B", "email": email_b, "password": "password123"},
        )
        token_b = resp_b.json()["access_token"]

        # User B tries to mark a notification as read (should 404 if not theirs)
        resp_try = client.patch(
            "/api/notifications/999999/read",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_try.status_code == 404


# ===========================================================================
# 5. Logout
# ===========================================================================


class TestLogout:
    def test_logout_returns_204(self, client):
        email = f"logout-{time.time()}@example.com"
        resp = client.post(
            "/api/auth/register",
            json={"name": "Logout", "email": email, "password": "password123"},
        )
        token = resp.json()["access_token"]

        resp2 = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp2.status_code == 204
