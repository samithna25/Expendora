# 🤖 Expendora – n8n Automation Workflows

This directory contains all **n8n workflow definitions** for the Expendora expense management platform. Each workflow follows the standard automation pipeline:

```
[Webhook Trigger] → [AI Agent Node] → [Email Node] → [DB/Log Node]
```

---

## 📁 Folder Structure

```
n8n/
├── README.md                   ← You are here
├── 01-welcome-email/           ← New user welcome flow
│   ├── welcome-email.json      ← n8n workflow definition
│   ├── request.json            ← Sample webhook payload
│   ├── response.json           ← Sample API response
│   └── README.md               ← Workflow documentation
│
├── 02-forgot-password/         ← Password reset flow
│   ├── forgot-password.json    ← n8n workflow definition
│   ├── request.json            ← Sample webhook payload
│   ├── response.json           ← Sample API response
│   └── README.md               ← Workflow documentation
│
├── 03-monthly-report/          ← AI-generated monthly spending report
│   ├── monthly-report.json     ← n8n workflow definition
│   ├── request.json            ← Sample webhook payload
│   ├── response.json           ← Sample API response
│   └── README.md               ← Workflow documentation
│
└── 04-budget-alert/            ← Budget threshold alert flow
    ├── budget-alert.json       ← n8n workflow definition
    ├── request.json            ← Sample webhook payload
    ├── response.json           ← Sample API response
    └── README.md               ← Workflow documentation
```

---

## 🔄 Workflow Overview

| # | Workflow | Trigger | AI Agent | Email | DB/Log |
|---|----------|---------|----------|-------|--------|
| 01 | Welcome Email | `POST /auth/register` → Webhook | Personalise greeting | Welcome HTML email | Log to MongoDB |
| 02 | Forgot Password | `POST /auth/forgot-password` → Webhook | None (deterministic) | Reset link email | Log to MongoDB |
| 03 | Monthly Report | Cron (1st of month) + Webhook | Analyse spending data | Report email | Log to MongoDB |
| 04 | Budget Alert | `POST /expenses` overage → Webhook | Generate advice | Alert email | Log to MongoDB |

---

## ⚙️ Prerequisites

| Requirement | Details |
|-------------|---------|
| n8n version | ≥ 1.40.0 |
| SMTP / Email | Gmail OAuth2 or SMTP credentials |
| OpenRouter / OpenAI | API key for AI Agent nodes |
| MongoDB | Atlas connection string (see `backend/.env`) |
| Flask Backend | Running on `http://localhost:5000` |

---

## 🚀 How to Import a Workflow

1. Open your n8n instance (`http://localhost:5678`)
2. Click **"+"** → **"Import from file"**
3. Select the desired `.json` file from one of the workflow folders
4. Configure the required **credentials** (SMTP, OpenRouter, MongoDB)
5. **Activate** the workflow

---

## 🔐 Environment Variables

All workflows reference these variables (set in n8n **Settings → Variables**):

```
EXPENDORA_API_BASE     = http://localhost:5000
OPENROUTER_API_KEY     = sk-or-v1-...
OPENROUTER_MODEL       = openai/gpt-4o-mini
MONGO_URI              = mongodb+srv://...
SMTP_FROM_EMAIL        = noreply@expendora.app
```

---

## 🧩 Node Types Used

| Node | Purpose |
|------|---------|
| `n8n-nodes-base.webhook` | Receives HTTP POST from Flask backend |
| `@n8n/n8n-nodes-langchain.agent` | AI reasoning & content generation |
| `@n8n/n8n-nodes-langchain.lmOpenAi` | Chat model via OpenRouter |
| `n8n-nodes-base.emailSend` | Sends HTML emails via SMTP |
| `n8n-nodes-base.mongoDb` | Logs events to MongoDB |
| `n8n-nodes-base.set` | Prepares/transforms data |
| `n8n-nodes-base.if` | Conditional branching |
| `n8n-nodes-base.scheduleTrigger` | Cron-based triggers |

---

> 💡 Each workflow folder contains its own `README.md` with detailed node-by-node documentation, sample payloads, and testing instructions.
