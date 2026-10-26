# 📚 BiblioTech RDBMS - Enterprise Library Management System

A full-stack, enterprise-grade **Library Management System** built with **Semantic HTML5, Vanilla CSS (Glassmorphism & Dark/Light Themes), Modern JavaScript (ES6+)**, and a **MySQL Database Server** backend.

---

## 🌟 Key Features

1. **Dashboard & Analytics**:
   - Real-time animated counters: Total Titles, Physical Copies, Active Loans, Overdue Items, Members, and Unpaid Fines.
   - Urgent Overdue Alert banner triggering fast return & fee collection.
   - Category inventory distribution breakdown.
   - Recent circulation transaction timeline.

2. **Books Catalog & Inventory Management**:
   - Search with instant debounce (title, author, ISBN).
   - Multi-filtering by Category and Stock Availability (Available vs. Out of Stock).
   - Dual View: Grid Cards & Tabular list.
   - Full CRUD: Add New Title, Edit Details, Delete (with active-loan safety checks).
   - Direct 1-Click "Issue" button from catalog cards.

3. **Circulation Desk (Check-Out & Check-In)**:
   - **Issue Workflow**: Real-time dropdown selector validating available physical copy count and member quota limits.
   - **Return Workflow**: Automated date comparison calculating late days and penalty fines ($10/day).
   - Filter loans by Active, Overdue, Returned, or All.

4. **Member Directory**:
   - Member profiles with avatars, library card numbers (`LIB-2026-xxx`), email, and contact info.
   - Membership tiers: Student, Faculty, Premium, Standard with configurable borrowing quotas.
   - Direct registration modal.

5. **Fines & Cashier Module**:
   - Audit trail of late return fines and charges.
   - Real-time "Settle Payment" button updating payment timestamp.

6. **RDBMS Showcase & Interactive SQL Console**:
   - **Relational Schema ER Visualizer**: Displays 3NF normalized tables with Primary Keys (PK), Foreign Keys (FK), Unique constraints (UQ), and data types.
   - **Live SQL Query Runner**: Allows executing raw SQL statements (`SELECT`, `JOIN`, `GROUP BY`, `HAVING`, Views) directly from the browser with execution time in milliseconds and dynamic result table generation!

7. **Intelligent Dual-Mode Database Engine**:
   - **MySQL Mode**: Connects directly to any MySQL / MariaDB server (via `mysql2`), auto-creates `library_db` and executes `database/schema.sql` and `database/seed.sql`.
   - **Zero-Config Local Mode**: If MySQL is offline or not yet configured, the system automatically runs with an in-memory relational engine with sample data, ensuring the app works instantly without crashing!
   - In-app **MySQL Settings Modal** to test credentials and migrate tables with 1 click.

---

## 🗄️ Relational Database Schema (Normalized 3NF)

The database schema is defined in [`database/schema.sql`](file:///c:/Users/Yash%20Sahai%20Bhatnagar/Desktop/RDBMS%20Project/database/schema.sql):

```mermaid
erDiagram
    CATEGORIES ||--o{ BOOKS : classifies
    AUTHORS ||--o{ BOOKS : writes
    BOOKS ||--o{ BOOK_LOANS : borrowed_in
    MEMBERS ||--o{ BOOK_LOANS : borrows
    BOOK_LOANS ||--o| FINES : incurs
    BOOKS ||--o{ RESERVATIONS : holds
    MEMBERS ||--o{ RESERVATIONS : requests

    CATEGORIES {
        int category_id PK
        varchar category_name UQ
        text description
        varchar icon
    }
    AUTHORS {
        int author_id PK
        varchar name
        text biography
        varchar nationality
    }
    BOOKS {
        int book_id PK
        varchar isbn UQ
        varchar title
        int author_id FK
        int category_id FK
        varchar rack_location
        int total_copies
        int available_copies
        varchar cover_url
    }
    MEMBERS {
        int member_id PK
        varchar card_number UQ
        varchar full_name
        varchar email UQ
        enum membership_type
        int max_books_allowed
        enum status
    }
    BOOK_LOANS {
        int loan_id PK
        int book_id FK
        int member_id FK
        date issue_date
        date due_date
        date return_date
        enum status
        decimal fine_amount
    }
    FINES {
        int fine_id PK
        int loan_id FK
        int member_id FK
        decimal amount
        varchar reason
        enum status
    }
```

### Relational Views & Triggers Included:
- `vw_active_loans`: Real-time loan ledger computing `days_overdue` and joining borrower and book details.
- `vw_book_inventory`: Joins books with author biographies and category names.
- `trg_after_loan_insert`: Automatically decrements `available_copies` on book issue.
- `trg_after_loan_update`: Automatically increments `available_copies` on book return.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MySQL Server** (Optional for local testing; e.g. XAMPP, WAMP, MariaDB, or standard MySQL 8.0)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure MySQL (Optional)
Edit the [`.env`](file:///c:/Users/Yash%20Sahai%20Bhatnagar/Desktop/RDBMS%20Project/.env) file:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=library_db
```
*Note: If you are using XAMPP, `DB_USER=root` and `DB_PASSWORD=` (blank) by default.*

### 4. Start the Application
```bash
npm start
```
Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🔌 Connecting to MySQL Server

You have two simple ways to connect MySQL:
1. **Via UI**: Click the **"MySQL Settings"** button in the top navbar, fill in your credentials, and click **"Test & Connect MySQL"**.
2. **Via MySQL Workbench / phpMyAdmin / CLI**:
   - Run [`database/schema.sql`](file:///c:/Users/Yash%20Sahai%20Bhatnagar/Desktop/RDBMS%20Project/database/schema.sql)
   - Run [`database/seed.sql`](file:///c:/Users/Yash%20Sahai%20Bhatnagar/Desktop/RDBMS%20Project/database/seed.sql)

---

## 📂 Project Directory Structure

```
RDBMS Project/
├── package.json              # Project dependencies and startup scripts
├── .env                      # Database connection settings
├── .env.example              # Template environment variables
├── server.js                 # Express REST API & static server
├── database/
│   ├── db.js                 # Unified database abstraction & fallback engine
│   ├── schema.sql            # MySQL 3NF normalized DDL, triggers & views
│   └── seed.sql              # Realistic seed data (books, members, loans)
└── public/
    ├── index.html            # Single-page application HTML5 interface
    ├── css/
    │   ├── style.css         # Design system tokens, glassmorphism, themes
    │   └── components.css    # UI components, modals, tables, SQL console
    └── js/
        ├── api.js            # REST API client
        ├── ui.js             # Modals, toasts, theme toggler, animations
        ├── books.js          # Book catalog & inventory controller
        ├── circulation.js    # Issue, return, and loan tracking
        ├── members.js        # Member directory & fine settlement
        ├── sql-console.js    # SQL query runner & ER schema visualizer
        └── app.js            # Main application coordinator
```
