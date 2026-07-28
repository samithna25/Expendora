from datetime import datetime, timezone


def create_user(name, email, hashed_password):
    return {
        "name": name,
        "email": email,
        "password": hashed_password,
        "monthly_budget": None,
        "created_at": datetime.now(timezone.utc)
    }
