import logging
from urllib.parse import quote

import requests
from flask import request

from app.config.config import Config

logger = logging.getLogger(__name__)


def _build_app_reset_link(reset_token):
    token = quote(str(reset_token or ""), safe="")
    frontend_url = (Config.FRONTEND_URL or "expendora://").strip()

    if frontend_url.endswith("://"):
        return f"{frontend_url}reset-password?token={token}"

    normalized = frontend_url.rstrip("/")
    return f"{normalized}/reset-password?token={token}"


def _build_http_reset_redirect_link(reset_token):
    token = quote(str(reset_token or ""), safe="")
    base = (Config.BACKEND_PUBLIC_URL or "").strip()

    if not base:
        try:
            base = request.host_url
        except RuntimeError:
            return None

    base = base.rstrip("/")
    return f"{base}/auth/reset-redirect?token={token}"


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
        "reset_link": _build_app_reset_link(reset_token),
        "reset_redirect_url": _build_http_reset_redirect_link(reset_token),
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except requests.RequestException as exc:
        logger.error("Failed to trigger n8n password reset webhook: %s", exc)
        return False

def trigger_budget_alert_webhook(user_id, email, budget, spent, percentage):
    """POST budget alert payload to the n8n webhook."""
    url = Config.N8N_WEBHOOK_BUDGET_ALERT
    if not url:
        logger.warning("N8N_WEBHOOK_BUDGET_ALERT is not set; skipping budget alert webhook")
        return False

    payload = {
        "userId": user_id,
        "email": email,
        "budget": budget,
        "spent": spent,
        "percentage": percentage
    }

    try:
        import threading
        def _fire():
            try:
                requests.post(url, json=payload, timeout=10)
            except Exception as e:
                logger.error("Failed to trigger n8n budget alert webhook: %s", e)
        threading.Thread(target=_fire).start()
        return True
    except Exception as exc:
        logger.error("Failed to start thread for budget alert webhook: %s", exc)
        return False
