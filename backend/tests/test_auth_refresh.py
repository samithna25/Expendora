import hashlib
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

import pytest
from bson import ObjectId

from app import create_app
from app.utils.jwt_utils import hash_refresh_token


MOCK_USER_ID = "507f1f77bcf86cd799439011"
MOCK_SESSION_ID = "507f1f77bcf86cd799439099"

VALID_REFRESH_TOKEN = "valid-refresh-token"


def _utcnow_naive():
    # PyMongo returns naive UTC datetimes, so mimic that in fixtures.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _fake_session(overrides=None):
    doc = {
        "_id": ObjectId(MOCK_SESSION_ID),
        "user_id": ObjectId(MOCK_USER_ID),
        "created_at": _utcnow_naive(),
        "expires_at": _utcnow_naive() + timedelta(days=20),
        "refresh_token_hash": hash_refresh_token(VALID_REFRESH_TOKEN),
    }
    doc.update(overrides or {})
    return doc


def _fake_user(overrides=None):
    doc = {"_id": ObjectId(MOCK_USER_ID), "email": "test@example.com", "name": "Test"}
    doc.update(overrides or {})
    return doc


@pytest.fixture
def app():
    app = create_app()
    app.config.update({"TESTING": True})
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def _build_mocks(session_doc, user_doc=None):
    mock_sessions = MagicMock()
    mock_sessions.find_one.return_value = session_doc
    mock_users = MagicMock()
    mock_users.find_one.return_value = user_doc
    mock_db = MagicMock()
    mock_db.sessions = mock_sessions
    mock_db.users = mock_users
    return mock_db, mock_sessions, mock_users


class TestRefreshSession:
    def test_missing_refresh_token(self, client):
        resp = client.post("/auth/refresh", json={})
        assert resp.status_code == 400
        assert resp.get_json()["message"] == "Refresh token is required"

    def test_success_rotates_refresh_token(self, client):
        mock_db, mock_sessions, _ = _build_mocks(_fake_session(), _fake_user())

        with patch("app.controllers.auth_controller.get_db", return_value=mock_db):
            with patch("app.controllers.auth_controller.generate_token", return_value="fresh-access-token") as mock_gen:
                resp = client.post("/auth/refresh", json={"refreshToken": VALID_REFRESH_TOKEN})

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "success"
        assert data["data"]["token"] == "fresh-access-token"
        assert data["data"]["refreshToken"]  # new opaque refresh token issued
        assert data["data"]["refreshToken"] != VALID_REFRESH_TOKEN

        mock_sessions.update_one.assert_called_once()
        args, kwargs = mock_sessions.update_one.call_args
        assert "refresh_token_hash" in args[1]["$set"]
        assert args[1]["$set"]["refresh_token_hash"] != hash_refresh_token(VALID_REFRESH_TOKEN)
        mock_gen.assert_called_once()

    def test_unknown_refresh_token(self, client):
        mock_db, mock_sessions, _ = _build_mocks(None)

        with patch("app.controllers.auth_controller.get_db", return_value=mock_db):
            resp = client.post("/auth/refresh", json={"refreshToken": "unknown-token"})

        assert resp.status_code == 401
        assert resp.get_json()["message"] == "Session expired. Please log in again."
        mock_sessions.delete_one.assert_not_called()

    def test_expired_session(self, client):
        expired = _fake_session({"expires_at": _utcnow_naive() - timedelta(minutes=1)})
        mock_db, mock_sessions, _ = _build_mocks(expired)

        with patch("app.controllers.auth_controller.get_db", return_value=mock_db):
            resp = client.post("/auth/refresh", json={"refreshToken": VALID_REFRESH_TOKEN})

        assert resp.status_code == 401
        assert resp.get_json()["message"] == "Session expired. Please log in again."
        mock_sessions.delete_one.assert_called_once()

    def test_expired_session_with_aware_datetime(self, client):
        # Regression: an aware expires_at (e.g. created before pymongo round-trip)
        # must also be handled without raising a TypeError.
        expired = _fake_session({"expires_at": datetime.now(timezone.utc) - timedelta(minutes=1)})
        mock_db, mock_sessions, _ = _build_mocks(expired)

        with patch("app.controllers.auth_controller.get_db", return_value=mock_db):
            resp = client.post("/auth/refresh", json={"refreshToken": VALID_REFRESH_TOKEN})

        assert resp.status_code == 401
        mock_sessions.delete_one.assert_called_once()

    def test_user_deleted(self, client):
        mock_db, mock_sessions, _ = _build_mocks(_fake_session(), user_doc=None)

        with patch("app.controllers.auth_controller.get_db", return_value=mock_db):
            resp = client.post("/auth/refresh", json={"refreshToken": VALID_REFRESH_TOKEN})

        assert resp.status_code == 401
        assert resp.get_json()["message"] == "Session expired. Please log in again."
        mock_sessions.delete_one.assert_called_once()


class TestMiddlewareSessionExpiry:
    def test_profile_returns_401_when_session_expired(self, app):
        # Regression for the naive-vs-aware datetime crash seen in production.
        expired = _fake_session({"expires_at": _utcnow_naive() - timedelta(minutes=1)})
        mock_sessions = MagicMock()
        mock_sessions.find_one.return_value = expired
        mock_db = MagicMock()
        mock_db.sessions = mock_sessions

        with (
            patch(
                "app.middleware.auth_middleware.verify_token",
                return_value={
                    "user_id": MOCK_USER_ID,
                    "email": "test@example.com",
                    "session_id": MOCK_SESSION_ID,
                },
            ),
            patch("app.middleware.auth_middleware.get_db", return_value=mock_db),
        ):
            client = app.test_client()
            resp = client.get("/auth/profile", headers={"Authorization": "Bearer testtoken"})

        assert resp.status_code == 401
        assert resp.get_json()["message"] == "Session expired. Please log in again."
        mock_sessions.delete_one.assert_called_once()

    def test_profile_returns_200_when_session_not_expired(self, app):
        mock_sessions = MagicMock()
        mock_sessions.find_one.return_value = _fake_session()
        mock_mw_db = MagicMock()
        mock_mw_db.sessions = mock_sessions

        mock_users = MagicMock()
        mock_users.find_one.return_value = _fake_user()
        mock_ctrl_db = MagicMock()
        mock_ctrl_db.users = mock_users

        with (
            patch(
                "app.middleware.auth_middleware.verify_token",
                return_value={
                    "user_id": MOCK_USER_ID,
                    "email": "test@example.com",
                    "session_id": MOCK_SESSION_ID,
                },
            ),
            patch("app.middleware.auth_middleware.get_db", return_value=mock_mw_db),
            patch("app.controllers.auth_controller.get_db", return_value=mock_ctrl_db),
        ):
            client = app.test_client()
            resp = client.get("/auth/profile", headers={"Authorization": "Bearer testtoken"})

        assert resp.status_code == 200
        mock_sessions.delete_one.assert_not_called()
