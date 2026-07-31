import logging

import requests

from app.config.config import Config

logger = logging.getLogger(__name__)


def trigger_password_reset_email(email, reset_token, expires_at, user_name=""):
    """POST password reset payload to the n8n webhook."""
    url = Config.N8N_WEBHOOK_PASSWORD_RESET
    if not url:
        logger.warning("N8N_WEBHOOK_PASSWORD_RESET is not set; skipping password reset email")
        return False

    payload = {
        "email": email,
        "reset_token": reset_token,
        "expires_at": expires_at,
        "user_name": user_name,
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except requests.RequestException as exc:
        logger.error("Failed to trigger n8n password reset webhook: %s", exc)
        return False
