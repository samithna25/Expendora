import secrets

import jwt
from datetime import datetime, timedelta, timezone
from app.config.config import Config


# Access token (JWT) expiry duration
ACCESS_TOKEN_EXPIRY_HOURS = 24


def generate_token(user_id: str, email: str, session_id: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "session_id": session_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")
    return token


def generate_refresh_token() -> str:
    """Generate an opaque refresh token (stored hashed in the session doc)."""
    return secrets.token_urlsafe(32)


def hash_refresh_token(refresh_token: str) -> str:
    """SHA-256 hash of a refresh token, safe to store in MongoDB."""
    import hashlib
    return hashlib.sha256(refresh_token.encode()).hexdigest()


def as_naive_utc(dt):
    """Normalize a datetime to naive UTC (PyMongo returns naive UTC datetimes)."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def utcnow_naive() -> datetime:
    """Current UTC time as a naive datetime, comparable to values from MongoDB."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def session_is_expired(session: dict) -> bool:
    """True when the session's 20-day window has elapsed (handles naive/aware datetimes)."""
    expires_at = session.get("expires_at")
    if expires_at is None:
        return False
    return as_naive_utc(expires_at) < utcnow_naive()


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token has expired
    except jwt.InvalidTokenError:
        return None  # Token is invalid
