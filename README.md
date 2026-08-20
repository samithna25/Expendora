# Expendora

> **Smart Expense Tracker** — OCR-based receipt scanning, cloud automation, and spending analytics for iOS & Android.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [n8n Automation Setup](#n8n-automation-setup)
- [Documentation](#documentation)

---

## Overview

Expendora is a cloud-native mobile expense tracking application that eliminates manual data entry by automatically extracting information from receipt photos using OCR. Users snap a photo of a receipt, and the system identifies the merchant name, transaction date, and total amount — categorising and storing the expense instantly.

Built with **React Native (Expo)** on the frontend and **Flask (Python)** on the backend, Expendora integrates Tesseract OCR, Cloudinary, MongoDB Atlas, and n8n workflow automation into a single cohesive system.

---

## Features

| Feature | Description |
|---|---|
| 📸 **Receipt Scanning** | Upload receipt photos — OCR extracts merchant, amount, and date automatically |
| 🏷️ **Auto-Categorisation** | Expenses are automatically sorted into categories (Food, Transport, Shopping, etc.) |
| 📊 **Dashboard & Analytics** | Daily, weekly, and monthly spending summaries with category breakdowns |
| 💰 **Budget Planner** | Set per-category budgets and receive alerts at 80% and 100% thresholds |
| 📅 **Monthly Reports** | Detailed reports exportable as CSV or PDF |
| 📧 **Automated Emails** | Welcome emails, password reset, budget alerts, and monthly summaries via n8n |
| 🔐 **Secure Auth** | JWT-based authentication with access + refresh token rotation |
| ☁️ **Cloud Storage** | Receipt images stored on Cloudinary CDN |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Mobile App** | React Native (Expo SDK 54) | Cross-platform iOS & Android UI |
| **Backend API** | Flask 2+ (Python 3) | REST API, OCR processing, business logic |
| **Database** | MongoDB Atlas | Cloud NoSQL document store |
| **Image Storage** | Cloudinary | Receipt image upload, storage, and CDN delivery |
| **OCR Engine** | Tesseract OCR + pytesseract | Text extraction from receipt images |
| **Automation** | n8n | Email workflows, budget alerts, monthly cron jobs |
| **Authentication** | JWT (PyJWT / Flask-JWT-Extended) | Stateless token-based auth |
| **Deployment** | Render / Railway | Backend API hosting |

---

## Architecture

```
React Native App (Expo)
        │
        │  HTTPS REST API
        ▼
Flask Backend API
        │
   ┌────┴──────────────────────────┐
   ▼               ▼               ▼
Cloudinary   Tesseract OCR        n8n
(Images)    (Text Extraction)  (Automation)
                                   │
                                   ▼
                           MongoDB Atlas
                                   │
                                   ▼
                       Reports & Email Notifications
```

**Receipt Processing Flow:**

1. User uploads a receipt photo from the mobile app
2. Flask validates the JWT token and file
3. Image is uploaded to Cloudinary → permanent URL returned
4. Tesseract OCR extracts raw text from the image
5. Regex parsing identifies merchant, amount, and date
6. Business logic assigns a category and validates the data
7. Flask triggers an n8n webhook with the structured expense
8. n8n stores the record in MongoDB Atlas and fires any automation
9. The mobile dashboard updates with the new expense

---

## Project Structure

```
Expendora/
├── backend/                    # Flask REST API
│   ├── app/
│   │   ├── config/             # Environment config
│   │   ├── controllers/        # Route handler logic
│   │   ├── database/           # PyMongo connection
│   │   ├── middleware/         # JWT auth decorators
│   │   ├── models/             # Data models
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic services
│   │   └── utils/              # Helpers and utilities
│   ├── requirements.txt
│   └── run.py                  # App entry point
│
├── frontend-mobile/            # React Native (Expo) App
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth & Theme providers
│   │   ├── navigation/         # Stack & tab navigators
│   │   ├── screens/            # App screens
│   │   ├── services/           # API client & service modules
│   │   ├── theme/              # Colours, typography, spacing
│   │   └── utils/              # Constants, formatters, validators
│   ├── App.js
│   └── package.json
│
├── n8n/                        # n8n workflow automation
│   ├── 01-welcome-email/
│   ├── 02-forgot-password/
│   ├── 03-monthly-report/
│   ├── 04-budget-alert/
│   └── monthly_report_workflow.json
│
└── docs/                       # Full project documentation (15 files)
```

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend tooling |
| Tesseract OCR | 5.x | Must be installed as a system binary |
| Expo CLI | Latest | `npm install -g expo-cli` |
| MongoDB Atlas | — | Free M0 cluster |
| Cloudinary | — | Free account |
| n8n | Latest | Cloud or self-hosted |

**Install Tesseract on Windows:**
```
winget install UB-Mannheim.TesseractOCR
```

**Install Tesseract on Ubuntu/Debian (for Render/Railway):**
```bash
apt-get install -y tesseract-ocr tesseract-ocr-eng tesseract-ocr-msa
```

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your environment file
copy .env.example .env
# Fill in all values — see Environment Variables section below

# 5. Run the development server
python run.py
```

The API will be available at `http://localhost:5000`.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend-mobile

# 2. Install dependencies
npm install

# 3. Configure environment
copy .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend URL

# 4. Start the Expo development server
npx expo start
```

Scan the QR code with the **Expo Go** app on your device (iOS App Store or Google Play).

> During local development, use your machine's **local IP address** (e.g. `http://192.168.x.x:5000/api`) — not `localhost` — since the phone communicates over Wi-Fi.

---

### n8n Automation Setup

Expendora uses n8n for all email automation workflows. See [`n8n/README.md`](./n8n/README.md) for full setup instructions.

**Quick start with Docker:**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Access n8n at `http://localhost:5678` and import the workflow JSON files from the `n8n/` directory.

**Required n8n webhooks:**

| Webhook | Trigger |
|---|---|
| `/webhook/welcome-email` | New user registration |
| `/webhook/password-reset` | Forgot password request |
| `/webhook/budget-alert` | Category spending reaches 80% |
| `/webhook/budget-exceeded` | Category spending exceeds 100% |

---

## Documentation

Full technical documentation is in the [`docs/`](./docs/) directory:

| # | Document | Description |
|---|---|---|
| 01 | [Project Overview](./docs/01-project-overview.md) | Goals, features, target users, and system overview |
| 02 | [Functional Requirements](./docs/02.functional-requirements.md) | Full feature and endpoint requirements |
| 03 | [Non-Functional Requirements](./docs/03-non-functional-requirements.md) | Performance, security, and scalability specs |
| 04 | [Project Scope](./docs/04.Project-scope.md) | What is and isn't included in v1.0 |
| 05 | [System Architecture](./docs/05-system-architecture.md) | Layer-by-layer architecture with flow diagrams |
| 06 | [Technology Stack](./docs/06.Technology-stack.md) | Technology choices with rationale |
| 07 | [Database Schema](./docs/07-database-schema.md) | MongoDB collections and document structures |
| 08 | [API Documentation](./docs/08.api-documentation.md) | All endpoints, payloads, and response shapes |
| 09 | [Implementation Plan](./docs/09-implementation-plan.md) | Phased development roadmap |
| 10 | [Backend Workflow](./docs/10.backend-workflow.md) | Step-by-step backend logic for each feature |
| 11 | [Automation Workflow](./docs/11-automation-workflow.md) | n8n email and cron workflow details |
| 12 | [Deployment Guide](./docs/12.deployment-guide.md) | Complete step-by-step deployment walkthrough |
| 13 | [Testing Plan](./docs/13-testing-plan.md) | Unit, integration, OCR, and device test plans |
| 14 | [Progress Tracker](./docs/14.progress-tracker.md) | Live task checklist for the whole project |
| 15 | [Future Enhancements](./docs/15-future-enhancements.md) | Planned features for v2.0 and beyond |

---

> This project is developed as an educational cloud computing and automation project, demonstrating the integration of mobile development, OCR, cloud services, and workflow automation in a practical real-world application.
