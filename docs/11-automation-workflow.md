# 11 - Automation Workflow

# Expendora

## Automation Workflow

---

# Introduction

Automation is one of the core components of the Expendora system. It eliminates repetitive manual tasks by automatically processing expense data after receipt scanning. The automation workflow is powered by **n8n**, which communicates with the Flask backend through HTTP Webhooks.

The backend is responsible for OCR processing and business logic, while n8n handles background automation tasks such as database updates, report generation, and email notifications.

---

# Purpose of Automation

The automation workflow is designed to:

* Automatically store extracted expense data
* Reduce manual data entry
* Separate business logic from background tasks
* Generate monthly reports
* Send automated email summaries
* Provide a scalable workflow for future enhancements

---

# Technologies Used

| Technology    | Purpose               |
| ------------- | --------------------- |
| Flask         | Backend API           |
| n8n           | Workflow Automation   |
| MongoDB Atlas | Cloud Database        |
| Cloudinary    | Receipt Image Storage |
| Tesseract OCR | Text Extraction       |
| SMTP          | Email Delivery        |

---

# Automation Architecture

```text
React Native App
        │
        ▼
Flask Backend
        │
        ▼
OCR Processing
        │
        ▼
Business Logic
        │
        ▼
Trigger n8n Webhook
        │
        ▼
Receive Expense JSON
        │
        ▼
MongoDB Atlas
        │
        ├────────────► Budget Update
        │
        ├────────────► Monthly Report
        │
        └────────────► Email Notification
```

---

# Complete Automation Workflow

```text
User Uploads Receipt
        │
        ▼
React Native
        │
        ▼
Flask API
        │
        ▼
Authenticate User
        │
        ▼
Upload Image to Cloudinary
        │
        ▼
Tesseract OCR
        │
        ▼
Extract Receipt Text
        │
        ▼
Regex Parsing
        │
        ▼
Category Detection
        │
        ▼
Generate Expense JSON
        │
        ▼
Trigger n8n Webhook
        │
        ▼
Receive Expense Data
        │
        ▼
Store in MongoDB Atlas
        │
        ├────────────► Update Budget
        │
        ├────────────► Generate Monthly Report
        │
        └────────────► Send Email Summary
        │
        ▼
Return Success Response
        │
        ▼
Dashboard Updated
```

---

# Step-by-Step Workflow

## Step 1 – Receipt Upload

The user uploads a receipt using the React Native mobile application.

The receipt image is sent to the Flask backend through a secure HTTPS request.

---

## Step 2 – Authentication

Flask verifies:

* JWT token
* User identity
* Uploaded image format

Invalid requests are rejected before processing.

---

## Step 3 – Cloudinary Upload

The receipt image is uploaded to Cloudinary.

Cloudinary returns a secure image URL that is stored for future reference.

---

## Step 4 – OCR Processing

Flask uses:

* Tesseract OCR
* pytesseract

to extract all readable text from the uploaded receipt.

Example extracted text:

```text
Keells Super
2026-07-05
Rs. 2,450.00
```

---

## Step 5 – Data Extraction

The backend processes the OCR output using parsing logic and regular expressions.

Extracted information includes:

* Merchant Name
* Amount
* Transaction Date

---

## Step 6 – Expense Categorization

Business rules automatically determine the expense category.

Examples:

| Merchant  | Category  |
| --------- | --------- |
| Keells    | Groceries |
| Pizza Hut | Food      |
| Uber      | Transport |
| PickMe    | Transport |

If no category can be determined, the expense is marked as **Other**.

---

## Step 7 – Create Expense JSON

Flask converts the validated expense into a structured JSON object.

Example:

```json
{
    "userId": "...",
    "merchant": "Keells",
    "amount": 2450,
    "category": "Groceries",
    "date": "2026-07-05",
    "receiptUrl": "Cloudinary URL"
}
```

---

## Step 8 – Trigger n8n

Flask sends the Expense JSON to an n8n Webhook using an HTTP POST request.

This starts the automation workflow.

---

## Step 9 – MongoDB Storage

n8n receives the Expense JSON.

It connects to MongoDB Atlas and inserts the new expense document into the **Expenses** collection.

---

## Step 10 – Budget Update

After storing the expense,

n8n can automatically:

* Calculate total spending
* Compare spending with the user's monthly budget
* Update budget information

---

## Step 11 – Monthly Report Generation

A scheduled n8n workflow runs at the end of every month.

The workflow:

* Retrieves all expenses
* Calculates totals
* Groups expenses by category
* Creates a monthly summary

---

## Step 12 – Email Notification

The generated report is automatically emailed to the user using SMTP.

The email may include:

* Monthly spending
* Category breakdown
* Number of transactions
* Budget usage

---

# Automation Responsibilities

| Component    | Responsibility        |
| ------------ | --------------------- |
| React Native | Upload receipt        |
| Flask        | Authentication        |
| Flask        | OCR Processing        |
| Flask        | Data Extraction       |
| Flask        | Category Detection    |
| Flask        | Generate Expense JSON |
| Flask        | Trigger n8n           |
| n8n          | Store Expense         |
| n8n          | Update Budget         |
| n8n          | Generate Reports      |
| n8n          | Send Email            |

---

# n8n Workflow Nodes

The automation workflow may consist of the following nodes:

```text
Webhook
    │
    ▼
Set Data
    │
    ▼
MongoDB
    │
    ├────────────► IF (Budget Exceeded)
    │                    │
    │                    ▼
    │             Send Email
    │
    └────────────► Schedule Trigger
                         │
                         ▼
                  Monthly Report
                         │
                         ▼
                    Send Email
```

---

# Error Handling

The automation workflow includes error handling to ensure reliability.

Possible scenarios include:

| Error                     | Solution                       |
| ------------------------- | ------------------------------ |
| Invalid receipt           | Reject request                 |
| OCR failure               | Return processing error        |
| MongoDB unavailable       | Retry or log error             |
| Cloudinary upload failure | Stop workflow                  |
| Email failure             | Retry sending later            |
| Webhook timeout           | Log failure and notify backend |

---

# Future Automation Enhancements

The workflow can be extended with:

* AI-based expense categorization
* OCR confidence scoring
* Push notifications
* Weekly spending summaries
* Budget alerts
* Google Calendar reminders
* Export reports as PDF
* Bank transaction synchronization
* AI-powered financial insights

---

# Benefits of Automation

The automation workflow provides several advantages:

* Reduces manual work
* Faster expense processing
* Consistent data storage
* Improved scalability
* Easier maintenance
* Background processing
* Automatic reporting
* Better user experience
* Flexible workflow customization

---

# Conclusion

The Expendora automation workflow combines Flask and n8n to create a reliable, scalable, and maintainable automation pipeline. Flask performs OCR processing and business logic, while n8n handles background tasks such as database updates, report generation, and email notifications. This separation of responsibilities keeps the application modular and makes it easier to extend with additional automation features in the future.
