import jwt
from datetime import datetime, timedelta, timezone
from app.config.config import Config


# Token expiry duration
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


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token has expired
    except jwt.InvalidTokenError:
        return None  # Token is invalid
