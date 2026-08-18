import logging
import smtplib
import threading
from datetime import datetime, timezone
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import quote

from flask import request

from app.config.config import Config
from app.database.db import get_db
from app.services.email_templates import budget_alert_html, budget_alert_text, password_reset_html, welcome_email_html

logger = logging.getLogger(__name__)


def email_mode_is_code() -> bool:
    """True when EMAIL_MODE=code (send via this service). False → n8n webhooks."""
    return (Config.EMAIL_MODE or "code").strip().lower() == "code"


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


def _looks_like_placeholder(value):
    text = (value or "").strip().lower()
    return (
        text.startswith("your_")
        or text.startswith("sg.your")
        or text.startswith("your_email")
        or "example.com" in text
    )


def send_email(to_email, subject, html_body, attachments=None, plain_text=None):
    """Send an email via SMTP (Gmail). attachments = list of (filename, bytes, mime)."""
    host = (Config.SMTP_HOST or "").strip()
    port = int(Config.SMTP_PORT or 465)
    user = (Config.SMTP_USER or "").strip()
    password = (Config.SMTP_PASSWORD or "").strip()
    from_email = (Config.SMTP_FROM or user or "expendora.app@gmail.com").strip()

    if not user or not password:
        logger.error(
            "SMTP_USER/SMTP_PASSWORD not set; email to %s was NOT sent", to_email
        )
        return False

    if _looks_like_placeholder(password) or len(password) < 16:
        logger.error(
            "SMTP_PASSWORD looks invalid (placeholder or too short). Use a 16-character "
            "Gmail App Password in backend/.env — email to %s was NOT sent.",
            to_email,
        )
        return False

    if _looks_like_placeholder(from_email):
        logger.error(
            "SMTP_FROM '%s' looks like a placeholder. It must be your Gmail address — "
            "email to %s was NOT sent.",
            from_email,
            to_email,
        )
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = from_email
    message["To"] = to_email

    if plain_text:
        message.attach(MIMEText(plain_text, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))

    for filename, content, mime in attachments or []:
        part = MIMEBase(*mime.split("/", 1))
        part.set_payload(content)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment", filename=filename)
        message.attach(part)

    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=30)
        else:
            server = smtplib.SMTP(host, port, timeout=30)
            server.starttls()
        server.login(user, password)
        server.sendmail(from_email, [to_email], message.as_string())
        server.quit()
        return True
    except Exception as exc:
        logger.error("SMTP send failed: %s", exc)
        return False


def log_email_log(workflow, user_id, email, subject, status="sent", error=""):
    """Record an email event in the email_logs collection."""
    db = get_db()
    if db is None:
        logger.warning("Database not connected; skipping email log")
        return

    try:
        db["email_logs"].insert_one({
            "workflow": workflow,
            "userId": user_id,
            "userEmail": email,
            "subject": subject,
            "status": status,
            "error": error,
            "emailSentAt": datetime.now(timezone.utc),
        })
    except Exception as exc:
        logger.error("Failed to write email log: %s", exc)


def send_password_reset_email(email, reset_token, expires_at, user_name=""):
    """Fire-and-forget: send the password reset email via SMTP."""
    threading.Thread(
        target=_deliver_password_reset_email,
        args=(email, reset_token, expires_at, user_name),
        daemon=True,
    ).start()
    return True


def _deliver_password_reset_email(email, reset_token, expires_at, user_name=""):
    try:
        subject = "Reset your Expendora password"
        reset_link = _build_app_reset_link(reset_token)
        redirect_url = _build_http_reset_redirect_link(reset_token)
        link = redirect_url or reset_link
        html_body = password_reset_html(user_name, link)

        ok = send_email(email, subject, html_body)
        log_email_log(
            "forgot-password",
            None,
            email,
            subject,
            status="sent" if ok else "failed",
            error="" if ok else "email send failed",
        )
    except Exception as exc:
        logger.exception("[forgot-password] unexpected error sending reset email to %s: %s", email, exc)


def send_budget_alert(user_id, email, budget, spent, percentage):
    """Fire-and-forget: send the budget threshold alert email via SMTP."""
    threading.Thread(
        target=_deliver_budget_alert,
        args=(user_id, email, budget, spent, percentage),
        daemon=True,
    ).start()
    return True


def _deliver_budget_alert(user_id, email, budget, spent, percentage):
    try:
        subject = f"Budget Alert: You've used {percentage}% of your monthly budget!"
        html_body = budget_alert_html(percentage, budget, spent)
        text_body = budget_alert_text(percentage, budget, spent)

        ok = send_email(email, subject, html_body, plain_text=text_body)
        log_email_log(
            "budget-alert",
            user_id,
            email,
            subject,
            status="sent" if ok else "failed",
            error="" if ok else "email send failed",
        )
    except Exception as exc:
        logger.exception("[budget-alert] unexpected error sending alert to %s: %s", email, exc)
def send_welcome_email(email, user_name=""):
    """Fire-and-forget: send the welcome email via SMTP."""
    threading.Thread(
        target=_deliver_welcome_email,
        args=(email, user_name),
        daemon=True,
    ).start()
    return True


def _deliver_welcome_email(email, user_name=""):
    try:
        subject = f"Welcome to Expendora, {user_name}! 🎉"
        html_body = welcome_email_html(user_name)

        ok = send_email(email, subject, html_body)
        log_email_log(
            "welcome-email",
            None,
            email,
            subject,
            status="sent" if ok else "failed",
            error="" if ok else "email send failed",
        )
    except Exception as exc:
        logger.exception("[welcome-email] unexpected error sending welcome email to %s: %s", email, exc)


def send_monthly_report_email(user_id, email, user_name, month, pdf_bytes):
    """Fire-and-forget: send the monthly report PDF via SMTP."""
    threading.Thread(
        target=_deliver_monthly_report_email,
        args=(user_id, email, user_name, month, pdf_bytes),
        daemon=True,
    ).start()
    return True


def _deliver_monthly_report_email(user_id, email, user_name, month, pdf_bytes):
    try:
        subject = f"Your Monthly Spending Report - {month} 📊"
        html_body = f"""
        <html>
        <body style="font-family: sans-serif; background-color: #1A1A1A; color: #FFFFFF; padding: 20px;">
            <h2>Hi {user_name},</h2>
            <p>Your monthly spending report for {month} is ready!</p>
            <p>Please find your detailed PDF summary attached to this email.</p>
            <br>
            <p>Best regards,<br>The Expendora Team</p>
        </body>
        </html>
        """
        
        attachments = [(f"Expendora_Report_{month}.pdf", pdf_bytes, "application/pdf")]
        
        ok = send_email(email, subject, html_body, attachments=attachments)
        log_email_log(
            "monthly-report",
            user_id,
            email,
            subject,
            status="sent" if ok else "failed",
            error="" if ok else "email send failed",
        )
    except Exception as exc:
        logger.exception("[monthly-report] unexpected error sending report to %s: %s", email, exc)
