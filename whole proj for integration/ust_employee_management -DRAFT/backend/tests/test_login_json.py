#!/usr/bin/env python3
"""Quick integration tests for /api/login using JSON body.

These are intentionally small and exercise the common JSON login path
used by the frontend client.
"""

import os
from fastapi.testclient import TestClient
from app.main import app

# Ensure test env (optional overrides)
os.environ.setdefault("JWT_SECRET_KEY", "test_secret_key_for_testing_only_not_for_production")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")

client = TestClient(app)


def test_login_json_success():
    """Posting JSON credentials should return a token for seeded users."""
    resp = client.post("/api/login", json={"e_id": 1, "password": "admin123"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "access_token" in data
    assert data.get("token_type") == "bearer"


def test_login_json_invalid_credentials():
    """Wrong password should return 401 Unauthorized."""
    resp = client.post("/api/login", json={"e_id": 1, "password": "wrongpassword"})
    assert resp.status_code == 401
