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
