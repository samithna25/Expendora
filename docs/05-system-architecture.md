# 05 - System Architecture

# Expendora

## System Architecture

---

# Introduction

The system architecture defines the overall design and organization of the Expendora application. It illustrates how the mobile application, backend services, cloud platforms, automation workflows, and database interact to provide a complete expense tracking solution.

The application follows a **client-server architecture** with a layered design, where each component performs a dedicated responsibility. This modular approach improves maintainability, scalability, and future extensibility while keeping the system organized and easy to manage.

---

# Architecture Overview

The Expendora system is divided into five major layers:

1. Presentation Layer
2. Backend Processing Layer
3. Cloud Services Layer
4. Automation Layer
5. Database Layer

Each layer communicates using secure REST APIs and JSON data, ensuring loose coupling between components.

---

# System Layers

## 1. Presentation Layer

### Technology

- React Native

### Responsibilities

- User Registration
- User Login
- Dashboard
- Upload Receipt
- Expense History
- Reports
- Budget Planner
- User Profile
- Settings

The mobile application only communicates with the Flask backend. It never accesses the database directly.

---

## 2. Backend Processing Layer

### Technology

- Python
- Flask

The backend acts as the central controller of the system.

### Responsibilities

- User Authentication
- JWT Token Validation
- REST API Development
- Business Logic
- OCR Processing
- Receipt Data Extraction
- Expense Categorization
- Trigger n8n Automation

Every request from the mobile application passes through the backend before reaching external services.

---

## 3. Cloud Services Layer

### Cloudinary

**Purpose**

- Store receipt images securely
- Generate permanent image URLs
- Reduce backend storage requirements

### MongoDB Atlas

**Purpose**

- Store user accounts
- Store expense records
- Store receipt metadata
- Store reports
- Store budget information

MongoDB Atlas serves as the application's primary cloud database.

---

## 4. OCR Processing Layer

### Technology

- Tesseract OCR
- pytesseract

### Responsibilities

- Read uploaded receipt images
- Extract receipt text
- Identify merchant name
- Identify transaction amount
- Identify transaction date

The extracted text is converted into structured expense data before storage.

---

## 5. Automation Layer

### Technology

- n8n

### Responsibilities

- Receive processed expense data
- Store expense records in MongoDB Atlas
- Execute workflow automation
- Generate monthly reports
- Send automated email summaries
- Support future automation workflows

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

# Detailed Component Interaction

```text
                                USER
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ React Native App        │
                    │ Login / Dashboard       │
                    │ Upload Receipt          │
                    └─────────────┬───────────┘
                                  │
                         HTTPS API Request
                                  │
                                  ▼
═══════════════════════════════════════════════════════════════
              BACKEND PROCESSING LAYER (Flask)
═══════════════════════════════════════════════════════════════

                    ┌─────────────────────────┐
                    │ Authentication          │
                    │ Validate JWT Token      │
                    │ Validate Uploaded File  │
                    └─────────────┬───────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ Upload Image            │
                    │ Cloudinary API          │
                    └─────────────┬───────────┘
                                  │
                        Receipt Image URL
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ OCR Processing          │
                    │ Tesseract OCR           │
                    └─────────────┬───────────┘
                                  │
                           Raw Extracted Text
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ Data Extraction         │
                    │ Regex Parsing           │
                    └─────────────┬───────────┘
                                  │
                         Structured Expense
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ Business Logic          │
                    │ Category Detection      │
                    │ Data Validation         │
                    └─────────────┬───────────┘
                                  │
                         Final Expense JSON
                                  │
                                  ▼
═══════════════════════════════════════════════════════════════
                CLOUD & AUTOMATION LAYER
═══════════════════════════════════════════════════════════════

                    ┌─────────────────────────┐
                    │ Trigger n8n Webhook     │
                    └─────────────┬───────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌──────────────────┐       ┌────────────────────┐
          │ MongoDB Atlas    │       │ Future Automation  │
          │ Store Expense    │       │ Reports            │
          │ User Data        │       │ Email              │
          │ Budget           │       │ Notifications      │
          └────────┬─────────┘       └────────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Flask Response   │
          │ Success / Error  │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ React Native App │
          │ Dashboard Update │
          └──────────────────┘
```

---

# Processing Flow Explanation

| Step | Description |
|------|-------------|
| **1** | The user logs into the React Native application and uploads a receipt image. |
| **2** | The mobile application sends the receipt image to the Flask backend using a secure HTTPS REST API request. |
| **3** | Flask authenticates the user by validating the JWT token and verifies that the uploaded file is a valid image. |
| **4** | The receipt image is uploaded to Cloudinary, where it is securely stored and assigned a permanent image URL. |
| **5** | Flask performs OCR using Tesseract OCR to extract the raw text from the uploaded receipt image. |
| **6** | The extracted text is parsed using regular expressions to identify the merchant name, transaction date, and total amount. |
| **7** | The backend applies business logic to validate the extracted information and automatically determine the most appropriate expense category. |
| **8** | A structured expense object (JSON) containing all validated expense information is created. |
| **9** | Flask triggers an n8n webhook and sends the structured expense data to the automation workflow. |
| **10** | n8n stores the expense record in MongoDB Atlas and executes automation tasks such as monthly report generation and email notifications. |
| **11** | Flask returns a success response to the React Native application after processing completes. |
| **12** | The mobile dashboard refreshes and displays the newly added expense. |

---

# Communication Between Components

| Source | Destination | Communication Method |
|---------|-------------|----------------------|
| React Native | Flask Backend | HTTPS REST API |
| Flask Backend | Cloudinary | Cloudinary REST API |
| Flask Backend | Tesseract OCR | Python Library |
| Flask Backend | n8n | HTTP Webhook |
| n8n | MongoDB Atlas | MongoDB Connection |
| n8n | SMTP Server | SMTP Protocol |

---

# Security Architecture

The architecture incorporates several security mechanisms to protect user information and ensure secure communication.

## Authentication

- JWT-based user authentication
- Protected API endpoints
- Token validation for every request

## Data Security

- Password hashing
- Environment variables for API keys
- Secure cloud storage
- Input validation

## Network Security

- HTTPS communication
- Secure REST APIs
- Authentication middleware
- Prevention of unauthorized access

---

# Scalability Considerations

The modular architecture allows the system to grow without significant redesign.

Future enhancements may include:

- AI-powered receipt recognition
- Machine learning-based expense categorization
- Bank account integration
- Digital wallet integration
- Push notifications
- Multi-language support
- Docker containerization
- Kubernetes deployment
- Admin dashboard
- Web application support

---

# Architectural Advantages

The selected architecture provides several benefits:

- Modular and maintainable design
- Clear separation of responsibilities
- Cloud-native architecture
- Easy integration with third-party services
- Scalable backend architecture
- Reusable REST APIs
- Independent automation workflows
- Secure cloud storage
- Efficient database management
- Easy future expansion

---

# Conclusion

The Expendora system architecture combines React Native, Flask, Cloudinary, Tesseract OCR, MongoDB Atlas, and n8n into a modular cloud-native architecture. Each layer has a clearly defined responsibility, allowing the application to remain secure, scalable, maintainable, and extensible. The architecture also supports future enhancements while providing an efficient and automated solution for personal expense management.