from unittest.mock import patch

from app.services import email_service
from app.services.email_templates import budget_alert_html, budget_alert_text, password_reset_html


class TestPasswordResetTemplate:
    def test_renders_name_and_link(self):
        html_body = password_reset_html("Samith", "https://expendora.app/reset?token=abc123")
        assert "Hi Samith," in html_body
        assert "https://expendora.app/reset?token=abc123" in html_body

    def test_falls_back_to_there(self):
        html_body = password_reset_html("", "expendora://reset-password?token=x")
        assert "Hi there," in html_body

    def test_escapes_unsafe_values(self):
        html_body = password_reset_html("<script>alert(1)</script>", "https://x?a=1&b=<x>")
        assert "<script>" not in html_body
        assert "&lt;script&gt;" in html_body
        assert "&amp;" in html_body


class TestEmailMode:
    def test_defaults_to_code(self):
        with patch("app.services.email_service.Config.EMAIL_MODE", "code"):
            assert email_service.email_mode_is_code() is True

    def test_n8n_mode(self):
        with patch("app.services.email_service.Config.EMAIL_MODE", "n8n"):
            assert email_service.email_mode_is_code() is False


class TestDeliverPasswordResetEmail:
    def test_sends_and_logs(self):
        with (
            patch("app.services.email_service.send_email", return_value=True) as mock_send,
            patch("app.services.email_service.log_email_log") as mock_log,
        ):
            email_service._deliver_password_reset_email(
                email="samith@example.com",
                reset_token="sometoken123",
                expires_at="2026-08-16T10:00:00+00:00",
                user_name="Samith",
            )

        mock_send.assert_called_once()
        args, kwargs = mock_send.call_args
        assert args[0] == "samith@example.com"
        assert args[1] == "Reset your Expendora password"
        assert "Hi Samith," in args[2]

        mock_log.assert_called_once()
        log_args = mock_log.call_args[0]
        assert log_args[0] == "forgot-password"
        assert log_args[2] == "samith@example.com"
        assert mock_log.call_args.kwargs["status"] == "sent"

    def test_logs_failure(self):
        with (
            patch("app.services.email_service.send_email", return_value=False),
            patch("app.services.email_service.log_email_log") as mock_log,
        ):
            email_service._deliver_password_reset_email(
                email="a@b.com", reset_token="tok", expires_at="2026-08-16T10:00:00+00:00"
            )

        assert mock_log.call_args.kwargs["status"] == "failed"
        assert mock_log.call_args.kwargs["error"] == "email send failed"

    def test_builds_app_reset_link_when_no_redirect(self):
        with (
            patch("app.services.email_service.Config.BACKEND_PUBLIC_URL", ""),
            patch("app.services.email_service.Config.FRONTEND_URL", "expendora://"),
            patch("app.services.email_service.send_email") as mock_send,
            patch("app.services.email_service.log_email_log"),
        ):
            email_service._deliver_password_reset_email(
                email="a@b.com", reset_token="tok", expires_at="2026-08-16T10:00:00+00:00"
            )

        link = mock_send.call_args[0][2]
        assert "expendora://reset-password?token=tok" in link


class TestBudgetAlertTemplate:
    def test_renders_values(self):
        html_body = budget_alert_html(80, 50000, 40000)
        assert "80%" in html_body
        assert "50000" in html_body
        assert "40000" in html_body

    def test_escapes_values(self):
        html_body = budget_alert_html("<b>", "50000", "40000")
        assert "<b>" not in html_body

    def test_plain_text(self):
        text = budget_alert_text(80, 50000, 40000)
        assert "80%" in text
        assert "Total Budget: 50000" in text


class TestDeliverBudgetAlert:
    def test_sends_and_logs(self):
        with (
            patch("app.services.email_service.send_email", return_value=True) as mock_send,
            patch("app.services.email_service.log_email_log") as mock_log,
        ):
            email_service._deliver_budget_alert(
                user_id="507f1f77bcf86cd799439011",
                email="samith@example.com",
                budget=50000,
                spent=40000,
                percentage=80,
            )

        mock_send.assert_called_once()
        args, kwargs = mock_send.call_args
        assert args[0] == "samith@example.com"
        assert "80%" in args[1]
        assert "80%" in args[2]
        assert "Budget Alert" in kwargs["plain_text"]

        mock_log.assert_called_once()
        log_args = mock_log.call_args[0]
        assert log_args[0] == "budget-alert"
        assert log_args[1] == "507f1f77bcf86cd799439011"
        assert log_args[2] == "samith@example.com"
        assert mock_log.call_args.kwargs["status"] == "sent"

    def test_logs_failure(self):
        with (
            patch("app.services.email_service.send_email", return_value=False),
            patch("app.services.email_service.log_email_log") as mock_log,
        ):
            email_service._deliver_budget_alert(
                user_id="507f1f77bcf86cd799439011",
                email="a@b.com",
                budget=100,
                spent=90,
                percentage=90,
            )

        assert mock_log.call_args.kwargs["status"] == "failed"


class FakeSmtpServer:
    def __init__(self):
        self.logged_in = None
        self.sent = None
        self.started_tls = False
        self.quitted = False

    def login(self, user, password):
        self.logged_in = (user, password)

    def sendmail(self, from_addr, to_addrs, msg):
        self.sent = (from_addr, to_addrs, msg)

    def starttls(self):
        self.started_tls = True

    def quit(self):
        self.quitted = True


SMTP_CONFIG = {
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": 465,
    "SMTP_USER": "samith@gmail.com",
    "SMTP_PASSWORD": "abcd efgh ijkl mnop",
    "SMTP_FROM": "samith@gmail.com",
}


class TestSendEmailSmtp:
    def test_success_ssl(self):
        fake = FakeSmtpServer()
        with (
            patch("app.services.email_service.Config", **SMTP_CONFIG),
            patch.object(email_service.smtplib, "SMTP_SSL", return_value=fake) as mock_ssl,
        ):
            ok = email_service.send_email(
                "to@x.com", "Test Subject", "<p>Hi</p>", plain_text="plain body"
            )

        assert ok is True
        mock_ssl.assert_called_once_with("smtp.gmail.com", 465, timeout=30)
        assert fake.logged_in == ("samith@gmail.com", "abcd efgh ijkl mnop")
        assert fake.sent[0] == "samith@gmail.com"
        assert fake.sent[1] == ["to@x.com"]
        assert fake.quitted is True

        from email import message_from_string

        msg = message_from_string(fake.sent[2])
        assert msg["Subject"] == "Test Subject"
        parts = {p.get_content_type(): p.get_payload(decode=True).decode() for p in msg.walk() if p.get_payload(decode=True)}
        assert parts["text/plain"] == "plain body"
        assert parts["text/html"] == "<p>Hi</p>"

    def test_success_starttls_port_587(self):
        fake = FakeSmtpServer()
        config = {**SMTP_CONFIG, "SMTP_PORT": 587}
        with (
            patch("app.services.email_service.Config", **config),
            patch.object(email_service.smtplib, "SMTP", return_value=fake) as mock_smtp,
        ):
            ok = email_service.send_email("to@x.com", "Subj", "<p>Hi</p>")

        assert ok is True
        mock_smtp.assert_called_once_with("smtp.gmail.com", 587, timeout=30)
        assert fake.started_tls is True

    def test_with_attachment(self):
        fake = FakeSmtpServer()
        with (
            patch("app.services.email_service.Config", **SMTP_CONFIG),
            patch.object(email_service.smtplib, "SMTP_SSL", return_value=fake),
        ):
            ok = email_service.send_email(
                "to@x.com",
                "Subj",
                "<p>Hi</p>",
                attachments=[("report.pdf", b"%PDF-1.4 fake", "application/pdf")],
            )

        assert ok is True
        assert "report.pdf" in fake.sent[2]
        assert "application/pdf" in fake.sent[2]

    def test_placeholder_password_rejected(self):
        fake = FakeSmtpServer()
        config = {**SMTP_CONFIG, "SMTP_PASSWORD": "your_16_char_gmail_app_password"}
        with (
            patch("app.services.email_service.Config", **config),
            patch.object(email_service.smtplib, "SMTP_SSL", return_value=fake) as mock_ssl,
        ):
            ok = email_service.send_email("to@x.com", "Subj", "<p>Hi</p>")

        assert ok is False
        mock_ssl.assert_not_called()

    def test_missing_credentials_rejected(self):
        fake = FakeSmtpServer()
        config = {**SMTP_CONFIG, "SMTP_PASSWORD": "", "SMTP_USER": ""}
        with (
            patch("app.services.email_service.Config", **config),
            patch.object(email_service.smtplib, "SMTP_SSL", return_value=fake) as mock_ssl,
        ):
            ok = email_service.send_email("to@x.com", "Subj", "<p>Hi</p>")

        assert ok is False
        mock_ssl.assert_not_called()