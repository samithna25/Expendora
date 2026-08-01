# WF-02 — Forgot Password (Password Reset Email)

Sends a password reset email when a user taps **Forgot Password** in the Expendora app.

**Flow:**

```text
[Webhook Trigger] → [Prepare Data] → [AI Agent] → [Email Node] → (optional) [MongoDB Log] → [Respond to Webhook]
```

---

## What happens end-to-end

```text
Mobile App                    Flask Backend                    n8n
    │                              │                            │
    │  POST /auth/forgot-password  │                            │
    │  { "email": "..." }          │                            │
    ├─────────────────────────────►│                            │
    │                              │  Find user, create token   │
    │                              │  Save to reset_tokens      │
    │                              │                            │
    │                              │  POST webhook (JSON)       │
    │                              ├───────────────────────────►│
    │                              │                            │ AI writes email
    │                              │                            │ SMTP sends email
    │                              │◄───────────────────────────┤ { success: true }
    │◄─────────────────────────────┤ 200 OK (vague message)     │
    │  "If registered, email sent" │                            │
```

Flask never sends email directly — n8n does.

---

## Files in this folder

| File | Purpose |
|------|---------|
| `forgot-password.json` | Import this into n8n |
| `request.json` | Sample payload Flask sends |
| `response.json` | Sample response n8n returns |
| `README.md` | This guide |

---

## Prerequisites

Before building the workflow, set up:

1. **n8n running** — [n8n Cloud](https://n8n.io) or local Docker on port `5678`
2. **SMTP credential** — Gmail App Password recommended
3. **OpenAI credential** — for the AI Agent node (or swap AI Agent for a fixed HTML template — see Step 6 alternative)
4. **MongoDB credential** — optional, only if you enable the log node

---

## Step-by-step: build the workflow in n8n

Follow these steps in order. You can **import** `forgot-password.json` instead of building manually — then jump to **Step 8** to connect credentials.

### Step 1 — Create a new workflow

1. Open n8n → **Workflows** → **Add workflow**
2. Rename it to `Expendora - Forgot Password`
3. Save (Ctrl+S)

### Step 2 — Add Webhook Trigger node

1. Click **+** on the canvas → search **Webhook**
2. Configure:

   | Setting | Value |
   |---------|-------|
   | HTTP Method | `POST` |
   | Path | `password-reset` |
   | Authentication | None |
   | Respond | Using 'Respond to Webhook' Node |

3. Leave the node selected and note two URLs in the panel:
   - **Test URL** — use while building (`/webhook-test/password-reset`)
   - **Production URL** — use when Active (`/webhook/password-reset`)

4. Click **Listen for test event**, then send a test request:

   ```bash
   curl -X POST "http://localhost:5678/webhook-test/password-reset" \
     -H "Content-Type: application/json" \
     -d @request.json
   ```

   You should see the JSON appear in the Webhook node output.

**Expected input** (from Flask — see `request.json`):

```json
{
  "email": "samith@example.com",
  "reset_token": "abc123resettoken_example_only",
  "expires_at": "2026-07-31T15:30:00.000Z",
  "user_name": "Samith"
}
```

### Step 3 — Add Set node (Prepare Data)

1. Add node → search **Set** (or **Edit Fields**)
2. Connect: **Webhook** → **Prepare Data**
3. Mode: **Manual Mapping**
4. Add these fields:

   | Field name | Value (expression) |
   |------------|-------------------|
   | `email` | `{{ $json.body.email }}` |
   | `reset_token` | `{{ $json.body.reset_token }}` |
   | `expires_at` | `{{ $json.body.expires_at }}` |
   | `user_name` | `{{ $json.body.user_name \|\| 'there' }}` |
   | `reset_link` | `expendora://reset-password?token={{ $json.body.reset_token }}` |
   | `email_subject` | `Reset your Expendora password` |

   > Change `expendora://` to match your `FRONTEND_URL` env variable.

5. Execute the node to verify output.

### Step 4 — Add AI Agent node

1. Add node → search **AI Agent**
2. Connect: **Prepare Data** → **AI Agent**
3. **Prompt (User Message)** — paste this (switch to Expression mode):

   ```
   You are writing a password reset email for Expendora, a personal expense tracking app.

   User name: {{ $json.user_name }}
   Reset link: {{ $json.reset_link }}
   Link expires at: {{ $json.expires_at }}

   Write a short, friendly plain-text email (3–5 sentences):
   - Greet the user by name
   - Explain they requested a password reset
   - Include the reset link on its own line
   - Mention the link expires in 1 hour
   - Say to ignore the email if they didn't request it
   - Sign off as "The Expendora Team"

   Output ONLY the email body text, no subject line.
   ```

4. **Add sub-node: Chat Model**
   - Click **+** on the AI Agent → **Chat Model** → **OpenAI Chat Model**
   - Select your OpenAI credential
   - Model: `gpt-4o-mini` (cheap and fast)

5. Execute **AI Agent** — you should see generated email text in the output.

### Step 5 — Add Email (SMTP) node

1. Add node → search **Send Email** (SMTP)
2. Connect: **AI Agent** → **Send Email**
3. Configure:

   | Setting | Value |
   |---------|-------|
   | Credential | Your SMTP (Gmail) credential |
   | From Email | `expendora@gmail.com` (your sender) |
   | To Email | `{{ $('Prepare Data').item.json.email }}` |
   | Subject | `{{ $('Prepare Data').item.json.email_subject }}` |
   | Email Format | Text |
   | Text | `{{ $json.output }}` |

   > If AI Agent output field is named differently, click the field picker and choose the text output from AI Agent.

4. Execute — check the inbox for the test email.

### Step 6 — (Optional) MongoDB Log node

Skip this node if you don't need audit logs yet.

1. Add node → **MongoDB** → **Insert**
2. Connect: **Send Email** → **Log Email Sent**
3. Configure:

   | Setting | Value |
   |---------|-------|
   | Credential | MongoDB Atlas |
   | Operation | Insert |
   | Collection | `email_logs` |
   | Fields | |

   ```json
   {
     "type": "password_reset",
     "email": "={{ $('Prepare Data').item.json.email }}",
     "sent_at": "={{ $now.toISO() }}",
     "status": "sent"
   }
   ```

**Alternative without AI Agent:** Replace Steps 4–5 with a single **Send Email** node using fixed HTML:

- **Subject:** `Reset your Expendora password`
- **HTML body:** Include `{{ $('Prepare Data').item.json.reset_link }}` in a button or link

This avoids needing OpenAI but loses personalized copy.

### Step 7 — Add Respond to Webhook node

1. Add node → **Respond to Webhook**
2. Connect from the last node (**Log Email Sent** or **Send Email**)
3. Configure:

   | Setting | Value |
   |---------|-------|
   | Respond With | JSON |
   | Response Body | See below |

   ```json
   {
     "success": true,
     "message": "Password reset email sent",
     "email": "={{ $('Prepare Data').item.json.email }}",
     "sent_at": "={{ $now.toISO() }}"
   }
   ```

### Step 8 — Connect credentials on imported workflow

If you imported `forgot-password.json`:

1. Open each node with a ⚠️ warning
2. **OpenAI Chat Model** → select OpenAI credential
3. **Send Email** → select SMTP credential
4. **Log Email Sent** → select MongoDB credential (or delete this node)
5. Save workflow

### Step 9 — Activate and copy webhook URL

1. Toggle **Active** (top-right) → **ON**
2. Open **Webhook** node → copy **Production URL**
3. Add to Flask `.env`:

   ```env
   N8N_WEBHOOK_PASSWORD_RESET=https://your-n8n-host/webhook/password-reset
   FRONTEND_URL=expendora://
   ```

### Step 10 — Test full flow

**Test n8n only:**

```bash
curl -X POST "https://your-n8n-host/webhook/password-reset" \
  -H "Content-Type: application/json" \
  -d @request.json
```

Expected response (see `response.json`):

```json
{
  "success": true,
  "message": "Password reset email sent",
  "email": "samith@example.com",
  "sent_at": "2026-07-31T15:00:00.000Z"
}
```

**Test from mobile app** (once Flask endpoint is ready):

1. Open app → Login → **Forgot Password**
2. Enter registered email
3. Check inbox for reset email
4. Tap link → should open app reset screen with token

---

## Node summary

| # | Node | Type | Required |
|---|------|------|----------|
| 1 | Webhook | Trigger | Yes |
| 2 | Prepare Data | Set | Yes |
| 3 | AI Agent | LangChain Agent | Yes (or use fixed template) |
| 4 | OpenAI Chat Model | Sub-node of AI Agent | Yes if using AI |
| 5 | Send Email | SMTP | Yes |
| 6 | Log Email Sent | MongoDB Insert | Optional |
| 7 | Respond to Webhook | Response | Yes |

---

## Flask integration (when backend is ready)

Flask `POST /auth/forgot-password` should:

1. Validate email format
2. Look up user (don't reveal if not found)
3. Generate secure `reset_token`, hash and store in `reset_tokens` collection
4. POST to `N8N_WEBHOOK_PASSWORD_RESET`:

   ```python
   import os, requests
   from datetime import datetime, timezone, timedelta

   webhook_url = os.environ["N8N_WEBHOOK_PASSWORD_RESET"]
   payload = {
       "email": user["email"],
       "reset_token": plain_token,      # send plain token once, in email only
       "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
       "user_name": user.get("name", ""),
   }
   requests.post(webhook_url, json=payload, timeout=10)
   ```

5. Return vague 200 message (prevents email enumeration)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Webhook returns 404 | Workflow not **Active**, or wrong URL (test vs production) |
| No email received | Check SMTP credential, spam folder, Gmail App Password |
| AI Agent error | Add OpenAI credential; check API quota |
| `{{ $json.body.email }}` is empty | Flask may send flat JSON — use `{{ $json.email }}` instead |
| MongoDB fails | Disable log node for now; fix Atlas IP whitelist |
| Reset link doesn't open app | Verify `FRONTEND_URL` and deep link config in React Native |

---

## Security notes

- Reset tokens expire in **1 hour** (set in Flask, not n8n)
- n8n webhook has **no auth** in v1 — use n8n Cloud HTTPS or add Header Auth later
- Never log the full `reset_token` in MongoDB if you enable logging — log `email` and `sent_at` only
- Same response whether email exists or not (handled by Flask)

---

## Next workflow

After this works, set up `01-welcome-email/` — same pattern, simpler payload (`name`, `email` only).
