# 07 - Database Schema

# Expendora

## Database Schema

---

# Introduction

The database schema defines how data is organized, stored, and managed within the Expendora application. Since the application uses **MongoDB Atlas**, a NoSQL document database, information is stored as collections of JSON-like documents instead of traditional relational tables.

The database is designed to support user management, expense tracking, receipt storage, budget planning, and report generation while remaining scalable and flexible for future enhancements.

---

# Database Technology

| Technology    | Description                     |
| ------------- | ------------------------------- |
| Database      | MongoDB Atlas                   |
| Database Type | NoSQL Document Database         |
| Data Format   | BSON (Binary JSON)              |
| Access Method | PyMongo (Python MongoDB Driver) |

---

# Database Overview

The Expendora database consists of the following collections:

1. Users
2. Expenses
3. Budgets
4. Reports

Each collection stores a specific type of information required by the application.

---

# Database Relationship Overview

```text
                 USERS
                   │
          user_id (_id)
                   │
     ┌─────────────┴─────────────┐
     ▼                           ▼
 EXPENSES                    BUDGETS
     │
     │
     ▼
 REPORTS
```

A single user can have:

* Multiple expense records
* Multiple budget plans
* Multiple generated reports

---

# Collection 1 – Users

Stores account information for registered users.

### Fields

| Field        | Type     | Description                  |
| ------------ | -------- | ---------------------------- |
| _id          | ObjectId | Unique user identifier       |
| fullName     | String   | User's full name             |
| email        | String   | User email address           |
| password     | String   | Hashed password              |
| profileImage | String   | Profile image URL (optional) |
| createdAt    | Date     | Account creation date        |
| updatedAt    | Date     | Last profile update          |

---

## Example Document

```json
{
  "_id": "ObjectId",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "profileImage": "",
  "createdAt": "2026-07-08",
  "updatedAt": "2026-07-08"
}
```

---

# Collection 2 – Expenses

Stores every expense recorded by a user.

### Fields

| Field           | Type     | Description           |
| --------------- | -------- | --------------------- |
| _id             | ObjectId | Expense ID            |
| userId          | ObjectId | Owner of the expense  |
| merchant        | String   | Merchant or shop name |
| amount          | Double   | Expense amount        |
| category        | String   | Expense category      |
| transactionDate | Date     | Date on receipt       |
| receiptImage    | String   | Cloudinary image URL  |
| paymentMethod   | String   | Cash / Card / Manual  |
| createdAt       | Date     | Record creation date  |

---

## Example Document

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "merchant": "Keells",
  "amount": 2450.00,
  "category": "Groceries",
  "transactionDate": "2026-07-08",
  "receiptImage": "https://res.cloudinary.com/...",
  "paymentMethod": "Cash",
  "createdAt": "2026-07-08"
}
```

---

# Collection 4 – Reports

Stores generated monthly reports.

### Fields

| Field             | Type     | Description            |
| ----------------- | -------- | ---------------------- |
| _id               | ObjectId | Report ID              |
| userId            | ObjectId | User reference         |
| reportMonth       | String   | Report month           |
| totalExpenses     | Double   | Total monthly expenses |
| totalTransactions | Integer  | Number of transactions |
| generatedDate     | Date     | Report generation date |
| emailSent         | Boolean  | Email delivery status  |

---

## Example Document

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "reportMonth": "July",
  "totalExpenses": 45230,
  "totalTransactions": 52,
  "generatedDate": "2026-07-31",
  "emailSent": true
}
```

---

# Collection Relationships

Although MongoDB is a NoSQL database, logical relationships exist between collections.

| Parent Collection | Child Collection | Relationship |
| ----------------- | ---------------- | ------------ |
| Users             | Expenses         | One-to-Many  |
| Users             | Budgets          | One-to-Many  |
| Users             | Reports          | One-to-Many  |

The **userId** field is used to associate records belonging to the same user.

---

# Database Workflow

```text
User Registers
        │
        ▼
Users Collection
        │
        ▼
Upload Receipt
        │
        ▼
OCR Processing
        │
        ▼
Expense JSON
        │
        ▼
Expenses Collection
        │
        ├──────────────► Budget Update
        │
        └──────────────► Monthly Report
                           │
                           ▼
                    Reports Collection
```

---

# Indexing Strategy

To improve database performance, the following indexes are recommended.

| Collection | Indexed Field   | Purpose                             |
| ---------- | --------------- | ----------------------------------- |
| Users      | email           | Fast login and duplicate prevention |
| Expenses   | userId          | Retrieve user expenses efficiently  |
| Expenses   | transactionDate | Date filtering                      |
| Expenses   | category        | Category filtering                  |
| Reports    | userId          | Retrieve user reports               |

---

# Data Validation Rules

The backend validates data before storing it in MongoDB.

### User

* Email must be unique.
* Password must be hashed.
* Required fields cannot be empty.

### Expense

* Amount must be greater than zero.
* Merchant name cannot be empty.
* Category must exist.
* Receipt URL must be valid.

### Budget

* Monthly budget must be greater than zero.

### Report

* Report month must be valid.
* Total expenses cannot be negative.

---

# Database Security

The database follows several security practices.

* MongoDB Atlas cloud security.
* Environment variables for connection strings.
* Password hashing.
* JWT-based user authentication.
* User-specific data access.
* Secure HTTPS communication.
* Input validation before database insertion.

---

# Future Database Enhancements

Future versions of Expendora may include additional collections such as:

* Notifications
* Categories
* Payment Methods
* OCR Processing Logs
* User Preferences
* Audit Logs
* AI Spending Predictions
* Shared Family Budgets

---

# Conclusion

The MongoDB Atlas database schema provides a scalable and flexible foundation for Expendora. By organizing information into dedicated collections for users, expenses, budgets, and reports, the system supports efficient data retrieval, secure storage, and future expansion while maintaining a clean and maintainable architecture.
