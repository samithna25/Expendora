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
from app.services.email_templates import budget_alert_html, budget_alert_text, password_reset_html

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
import smtplib
from email.message import EmailMessage
import logging
from app.config.config import Config

logger = logging.getLogger(__name__)

def send_welcome_email(user_email, user_name):
    """Send a welcome email using SMTP."""
    smtp_server = Config.SMTP_SERVER
    smtp_port = Config.SMTP_PORT
    smtp_username = Config.SMTP_USERNAME
    smtp_password = Config.SMTP_PASSWORD
    sender_email = Config.SENDER_EMAIL

    if not all([smtp_server, smtp_port, smtp_username, smtp_password, sender_email]):
        logger.warning("SMTP configuration is missing. Skipping welcome email.")
        return False

    try:
        msg = EmailMessage()
        msg['Subject'] = 'Welcome to Expendora!'
        msg['From'] = f"Expendora <{sender_email}>"
        msg['To'] = user_email

        body = f"""Hi new {user_name},

Welcome to Expendora! We're excited to help you take control of your finances.

Here are a few key features you'll love:
- Track expenses by category with receipt scanning
- Set a monthly budget and get smart alerts
- Receive AI-powered monthly spending reports

Tip: Start by scanning your first receipt to see where your money goes!

Happy budgeting!

© 2026 Expendora. All rights reserved.
"""
        msg.set_content(body)
        
        # HTML version
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #1A1A1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1A1A1A; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <!-- Header -->
                        <div style="margin-bottom: 24px;">
                            <span style="color: #FACC15; font-size: 20px; font-weight: 800; letter-spacing: 2px;">
                                <span style="font-size: 18px;">✦</span> EXPENDORA
                            </span>
                        </div>
                        
                        <!-- Main Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #2A2A2A; border-radius: 12px; max-width: 500px; width: 100%; margin: 0 auto; text-align: left;">
                            <tr>
                                <td style="padding: 40px 32px;">
                                    <h2 style="margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: bold; color: #FFFFFF;">Hi new {user_name},</h2>
                                    
                                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #D1D5DB;">
                                        Welcome to Expendora! We're excited to help you take control of your finances.
                                    </p>
                                    
                                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #D1D5DB;">
                                        Here are a few key features you'll love:
                                    </p>
                                    
                                    <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 14px; line-height: 1.8; color: #FFFFFF; font-weight: 500;">
                                        <li style="margin-bottom: 8px;">Track expenses by category with receipt scanning</li>
                                        <li style="margin-bottom: 8px;">Set a monthly budget and get smart alerts</li>
                                        <li style="margin-bottom: 8px;">Receive AI-powered monthly spending reports</li>
                                    </ul>
                                    
                                    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #9CA3AF;">
                                        Tip: Start by scanning your first receipt to see where your money goes!
                                    </p>
                                    
                                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #D1D5DB;">
                                        Happy budgeting!
                                    </p>
                                </td>
                            </tr>
                        </table>
                        
                        <!-- Footer -->
                        <div style="margin-top: 24px;">
                            <p style="margin: 0; font-size: 12px; color: #6B7280; text-align: center;">
                                © 2026 Expendora. All rights reserved.
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        msg.add_alternative(html_body, subtype='html')

        if int(smtp_port) == 465:
            # Use SMTP_SSL for port 465
            with smtplib.SMTP_SSL(smtp_server, int(smtp_port)) as server:
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
        else:
            # Use standard SMTP with starttls for port 587
            with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
            
        logger.info(f"Welcome email sent successfully to {user_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user_email}: {e}")
        return False
