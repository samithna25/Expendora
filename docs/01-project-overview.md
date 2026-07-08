# 01 - Project Overview

# Expendora
## Smart Expense Tracker with OCR-Based Receipt Processing and Cloud Automation

---

# Project Description

Expendora is a cloud-based mobile expense tracking application that helps users manage their daily expenses by automatically extracting information from receipt images. Instead of manually entering expense details, users simply upload a receipt, and the system uses Optical Character Recognition (OCR) to identify important information such as the merchant name, transaction date, and total amount.

The extracted information is automatically categorized and securely stored in a cloud database. The application provides users with expense analytics, spending insights, monthly reports, and automated email summaries through workflow automation.

This project demonstrates the integration of mobile application development, cloud computing, OCR technology, workflow automation, and modern backend development into a single real-world solution.

---

# Key Highlights

- 📱 Cross-platform mobile application built using React Native.
- 📄 Automatic receipt scanning using Tesseract OCR.
- ☁️ Secure cloud image storage with Cloudinary.
- 🗄️ Cloud-based NoSQL database using MongoDB Atlas.
- ⚙️ Workflow automation using n8n.
- 📊 Expense analytics and spending reports.
- 📧 Automated monthly email summaries.
- 🔐 Secure user authentication and authorization.
- 🚀 Cloud deployment using Render.

---

# Problem Statement

Managing personal expenses is often a tedious and time-consuming process. Most people receive printed receipts after purchases but rarely record them in budgeting applications because manual data entry requires additional effort.

Existing expense tracking applications often depend on users manually entering transaction details, making them inconvenient for daily use. As a result, many users fail to maintain accurate spending records, making it difficult to monitor budgets and financial habits.

Expendora addresses this problem by automating receipt processing, minimizing manual effort, and organizing expenses in a secure cloud environment.

---

# Project Objectives

The primary objectives of this project are:

- Develop a cloud-based mobile expense tracking application.
- Automate receipt data extraction using Optical Character Recognition (OCR).
- Automatically categorize expenses into predefined categories.
- Store expense records securely in a cloud database.
- Provide expense analytics and spending insights.
- Generate automated monthly expense reports.
- Send automated email summaries and notifications.
- Demonstrate cloud automation using workflow orchestration.
- Build a scalable system following modern software engineering practices.

---

# Target Users

This application is designed for:

- Students
- Working professionals
- Families
- Small business owners
- Individuals who want to monitor personal spending
- Anyone interested in budgeting and financial management

---

# Core Features

## User Management

- User Registration
- Secure Login
- JWT-based Authentication
- User Profile Management

## Receipt Processing

- Upload receipt images
- Automatic OCR text extraction
- Merchant detection
- Amount extraction
- Date extraction
- Receipt image storage

## Expense Management

- Automatic expense categorization
- Manual expense entry
- Expense history
- Expense editing and deletion
- Search and filtering

## Dashboard & Analytics

- Daily expense summary
- Weekly expense summary
- Monthly expense summary
- Category-wise spending
- Spending trends
- Budget monitoring

## Automation

- Automated OCR processing
- Automatic expense recording
- Monthly report generation
- Email summaries
- Workflow automation using n8n

---

# Technology Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile application development |
| **Python** | Backend programming language |
| **Flask** | REST API development and business logic |
| **Tesseract OCR** | Receipt text extraction |
| **pytesseract** | Python OCR integration |
| **Cloudinary** | Cloud receipt image storage |
| **MongoDB Atlas** | Cloud database |
| **n8n** | Workflow automation |
| **SMTP** | Email notification service |
| **Render** | Backend deployment platform |

---

# System Components

| Component | Responsibility |
|-----------|----------------|
| **React Native App** | User interface, authentication, receipt upload, dashboard |
| **Flask Backend** | API development, business logic, OCR processing, validation |
| **Cloudinary** | Secure cloud storage for receipt images |
| **Tesseract OCR** | Extract text from uploaded receipts |
| **MongoDB Atlas** | Store users, expenses, reports, and receipt metadata |
| **n8n** | Workflow automation, scheduled jobs, and email notifications |

---

# High-Level System Workflow

```text
User
   │
   ▼
React Native Mobile Application
   │
   ▼
Flask REST API
   │
   ▼
Cloudinary
(Store Receipt Image)
   │
   ▼
OCR Processing
(Tesseract OCR)
   │
   ▼
Data Extraction
(Merchant, Amount, Date)
   │
   ▼
Expense Categorization
   │
   ▼
n8n Workflow Automation
   │
   ▼
MongoDB Atlas
(Store Expense Data)
   │
   ▼
Dashboard Update
   │
   ▼
Monthly Reports & Email Notifications
```

---

# High-Level System Architecture

```text
                    React Native
                          │
                          ▼
                  Flask Backend API
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
     Cloudinary      Tesseract OCR        n8n
   (Image Storage)  (Text Extraction) (Automation)
                                              │
                                              ▼
                                       MongoDB Atlas
                                              │
                                              ▼
                                 Reports & Email Services
```

---

# Project Goals

## Primary Goal

Develop a cloud-native expense tracking application that minimizes manual data entry by combining OCR technology, workflow automation, and cloud services.

## Learning Goals

This project also serves as a hands-on learning experience in:

- Mobile application development using React Native
- Backend API development using Flask
- Optical Character Recognition (OCR)
- Cloud image storage using Cloudinary
- MongoDB Atlas database management
- Workflow automation using n8n
- Cloud deployment using Render
- REST API design and integration
- Modern software engineering practices

---

# Expected Outcome

Upon completion, Expendora will enable users to manage their personal expenses with minimal manual effort. Users will be able to upload receipt images, automatically extract expense information, organize transactions into categories, monitor spending habits, and receive automated monthly reports and email summaries.

From a technical perspective, the project will demonstrate the successful integration of mobile development, cloud services, OCR technology, backend APIs, database management, and workflow automation into a scalable real-world application.

---

# Project Scope

The first version of Expendora focuses on personal expense tracking using receipt-based automation. Advanced features such as AI-powered financial recommendations, bank account integration, and intelligent spending predictions are considered future enhancements and are outside the scope of the current implementation.

---

# Note

This project is being developed as an educational cloud computing and automation project. Its primary purpose is to demonstrate modern software engineering principles through the integration of React Native, Flask, MongoDB Atlas, Cloudinary, OCR technology, and n8n workflow automation while solving a practical real-world problem.