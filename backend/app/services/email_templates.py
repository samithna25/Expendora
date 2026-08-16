import html


def _escape(value):
    return html.escape(str(value), quote=True)


def password_reset_html(user_name, reset_link):
    name = _escape(user_name or "there")
    url = _escape(reset_link or "")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your Expendora password</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <p style="margin:0;font-size:24px;font-weight:800;letter-spacing:4px;color:#FACC15;">&#10022; EXPENDORA</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1A1A1A;border-radius:16px;border:1px solid #2E2510;padding:40px 36px;">
              <p style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#FFFFFF;">Hi {name},</p>
              <p style="margin:0 0 32px 0;font-size:15px;color:#AAAAAA;line-height:1.7;">We received a request to reset your Expendora password. Click the button below to set a new password for your account.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 24px auto;">
                <tr>
                  <td align="center" bgcolor="#FACC15" style="border-radius:10px;background-color:#FACC15;">
                    <a href="{url}" target="_blank" rel="noopener" style="display:block;padding:16px 48px;border-radius:10px;background-color:#FACC15;color:#0A0A0A;font-size:15px;font-weight:700;line-height:18px;text-align:center;text-decoration:none;">Reset My Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 28px 0;font-size:13px;color:#777777;text-align:center;">This link expires in <strong style="color:#FACC15;">1 hour</strong>.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;"><tr><td style="border-top:1px solid #2A2A2A;font-size:0;line-height:0;">&nbsp;</td></tr></table>
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.6;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#444444;">&copy; 2026 Expendora. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def budget_alert_html(percentage, budget, spent):
    pct = _escape(percentage or "0")
    bgt = _escape(budget or "0")
    spt = _escape(spent or "0")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Budget Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:calc(100% - 32px);background-color:#1A1A1A;border:1px solid #2F2F2F;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 0 28px;">
              <p style="margin:0 0 12px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#FACC15;">Expendora</p>
              <h1 style="margin:0;font-size:28px;line-height:1.2;color:#FFFFFF;">Budget Alert</h1>
              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.7;color:#D1D5DB;">You have used <strong>{pct}%</strong> of your monthly budget.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111;border:1px solid #333333;border-radius:14px;">
                <tr>
                  <td style="padding:18px 20px;font-size:14px;line-height:1.7;color:#E5E7EB;">
                    <p style="margin:0 0 8px 0;"><strong>Total Budget:</strong> {bgt}</p>
                    <p style="margin:0;"><strong>Spent So Far:</strong> {spt}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0 0;font-size:14px;line-height:1.7;color:#A3A3A3;">Review your expenses to stay within your limit this month.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def budget_alert_text(percentage, budget, spent):
    return (
        f"Budget Alert\n"
        f"You have used {percentage}% of your monthly budget.\n"
        f"Total Budget: {budget}\n"
        f"Spent So Far: {spent}\n"
        f"Review your expenses to stay within your limit this month."
    )