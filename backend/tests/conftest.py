"""Shared test helpers — authenticated TestClient fixtures."""

from __future__ import annotations

import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.services.auth import hash_password


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def register_and_get_token(
    email: str = "testuser@example.com",
    password: str = "testpass123",
    name: str = "Test User",
) -> tuple[TestClient, str, int]:
    """Register a fresh user via the API and return (client, token, user_id).
    
    If the email already exists (from a previous test run), log in instead.
    """
    client = TestClient(app)
    resp = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    if resp.status_code == 409:
        # User already exists — log in
        resp = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
    assert resp.status_code == 200 or resp.status_code == 201, resp.text
    data = resp.json()
    token = data["access_token"]
    user_id = data["user"]["id"]
    return client, token, user_id


def get_demo_token() -> tuple[TestClient, str]:
    """Log in as the migrated demo user and return (client, token)."""
    client = TestClient(app)
    resp = client.post(
        "/api/auth/login",
        json={"email": "demo@smartagri.local", "password": "demo"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return client, token


def make_authenticated_client(
    email: str = "authtest@example.com",
    password: str = "testpass123",
) -> tuple[TestClient, str]:
    """Return a TestClient with Authorization header pre-set."""
    client, token, _ = register_and_get_token(email=email, password=password)
    client.headers["Authorization"] = f"Bearer {token}"
    return client, token
