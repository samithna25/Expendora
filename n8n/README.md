# Expendora — n8n Workflows

This folder contains **importable n8n workflow JSON files** and **step-by-step setup guides** for Expendora automation.

Flask handles business logic (auth, OCR, budgets). n8n handles **background tasks** triggered by HTTP webhooks: emails, logging, and scheduled reports.

---

## Folder structure

| Folder | Workflow | Trigger |
|--------|----------|---------|
| `01-welcome-email/` | Welcome email on registration | Webhook `POST /webhook/welcome-email` |
| `02-forgot-password/` | Password reset email | Webhook `POST /webhook/password-reset` |
| `03-monthly-report/` | Monthly summary email | Schedule (cron) |
| `04-budget-alert/` | Budget 80% / 100% alerts | Webhook |

Each folder contains:

- `*.json` — n8n workflow export (import into n8n)
- `request.json` — sample payload Flask sends to the webhook
- `response.json` — sample response n8n returns to Flask
- `README.md` — beginner-friendly setup steps

---

## Standard workflow pattern

Most Expendora email workflows follow this structure:

```text
[Webhook Trigger] → [Set / Prepare Data] → [AI Agent] → [Email Node] → (optional) [DB/Log Node] → [Respond to Webhook]
```

| Node | Purpose |
|------|---------|
| **Webhook** | Receives JSON from Flask when an event happens |
| **Set** | Builds fields like reset link, subject line |
| **AI Agent** | Drafts friendly, personalized email body (optional but recommended) |
| **Email (SMTP)** | Sends the email via Gmail / SMTP |
| **MongoDB / HTTP Request** | Optional audit log |
| **Respond to Webhook** | Returns `{ success: true }` to Flask |

---

## Quick start (first time in n8n)

1. **Run n8n** — Cloud account at [n8n.io](https://n8n.io) or Docker:
   ```bash
   docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
   ```
   Open `http://localhost:5678`.

2. **Add credentials** (once):
   - **SMTP** — Gmail App Password (see deployment guide)
   - **OpenAI** — for AI Agent nodes (API key from platform.openai.com)
   - **MongoDB** — optional, for logging

3. **Import a workflow** — n8n menu → **Workflows** → **Import from File** → pick e.g. `02-forgot-password/forgot-password.json`.

4. **Connect credentials** — open each red node and select your SMTP / OpenAI / MongoDB credential.

5. **Activate** — toggle **Active** (top right). Copy the **Production Webhook URL**.

6. **Add URL to Flask `.env`**:
   ```env
   N8N_WEBHOOK_PASSWORD_RESET=https://your-n8n-host/webhook/password-reset
   FRONTEND_URL=expendora://
   ```

---

## Recommended order

1. **Start here:** `02-forgot-password/` — simplest webhook + email flow
2. `01-welcome-email/` — same pattern, different payload
3. `04-budget-alert/` — webhook with extra IF logic
4. `03-monthly-report/` — schedule + HTTP Request loop

---

## Backend env variables

| Variable | Workflow |
|----------|----------|
| `N8N_WEBHOOK_WELCOME` | Welcome email |
| `N8N_WEBHOOK_PASSWORD_RESET` | Forgot password |
| `N8N_WEBHOOK_BUDGET_ALERT` | Budget 80% warning |
| `N8N_WEBHOOK_BUDGET_EXCEEDED` | Budget exceeded |
| `FRONTEND_URL` | Deep link base for reset emails (`expendora://`) |

See `docs/12.deployment-guide.md` for full deployment steps.

---

## Testing without Flask

Use the sample `request.json` in each folder:

```bash
curl -X POST "http://localhost:5678/webhook-test/password-reset" \
  -H "Content-Type: application/json" \
  -d @n8n/02-forgot-password/request.json
```

Use **Test URL** while developing; switch to **Production URL** when the workflow is Active.
