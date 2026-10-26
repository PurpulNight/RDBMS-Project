-- ==========================================================
-- LIBRARY MANAGEMENT SYSTEM - RELATIONAL DATABASE SCHEMA (MySQL)
-- Normalized to 3rd Normal Form (3NF)
-- Supports ACID transactions, Cascades, Views, and Triggers
-- ==========================================================

CREATE DATABASE IF NOT EXISTS library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

-- 1. Table: Categories
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'book',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table: Authors
CREATE TABLE IF NOT EXISTS authors (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    biography TEXT,
    nationality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Table: Books
CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    author_id INT NOT NULL,
    category_id INT NOT NULL,
    publisher VARCHAR(150),
    publication_year INT,
    rack_location VARCHAR(50) DEFAULT 'Section A-1',
    total_copies INT NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INT NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    cover_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_books_author FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. Table: Members
CREATE TABLE IF NOT EXISTS members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    card_number VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30),
    membership_type ENUM('Student', 'Faculty', 'Premium', 'Standard') DEFAULT 'Standard',
    max_books_allowed INT DEFAULT 5,
    status ENUM('Active', 'Suspended', 'Expired') DEFAULT 'Active',
    avatar_url VARCHAR(500),
    join_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Table: Book Loans (Circulation Transactions)
CREATE TABLE IF NOT EXISTS book_loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    status ENUM('Issued', 'Returned', 'Overdue') DEFAULT 'Issued',
    renewal_count INT DEFAULT 0,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loans_book FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_loans_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. Table: Fines & Payments
CREATE TABLE IF NOT EXISTS fines (
    fine_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    member_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) DEFAULT 'Late return fine',
    status ENUM('Unpaid', 'Paid', 'Waived') DEFAULT 'Unpaid',
    paid_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fines_loan FOREIGN KEY (loan_id) REFERENCES book_loans(loan_id) ON DELETE CASCADE,
    CONSTRAINT fk_fines_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Table: Book Reservations
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Notified', 'Completed', 'Cancelled') DEFAULT 'Pending',
    CONSTRAINT fk_reservations_book FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    CONSTRAINT fk_reservations_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================================
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_loans_status ON book_loans(status);
CREATE INDEX idx_loans_due_date ON book_loans(due_date);
CREATE INDEX idx_members_card ON members(card_number);

-- ==========================================================
-- RELATIONAL VIEWS (RDBMS Showcase)
-- ==========================================================

-- View 1: Active and Overdue Loans with Computed Days Remaining / Late Days
CREATE OR REPLACE VIEW vw_active_loans AS
SELECT 
    l.loan_id,
    l.issue_date,
    l.due_date,
    l.return_date,
    l.status,
    l.renewal_count,
    l.fine_amount,
    b.book_id,
    b.title AS book_title,
    b.isbn,
    b.cover_url,
    m.member_id,
    m.card_number,
    m.full_name AS member_name,
    m.email AS member_email,
    DATEDIFF(CURRENT_DATE, l.due_date) AS days_overdue
FROM book_loans l
JOIN books b ON l.book_id = b.book_id
JOIN members m ON l.member_id = m.member_id
WHERE l.return_date IS NULL;

-- View 2: Complete Book Inventory with Author and Category Joins
CREATE OR REPLACE VIEW vw_book_inventory AS
SELECT 
    b.book_id,
    b.isbn,
    b.title,
    b.publisher,
    b.publication_year,
    b.rack_location,
    b.total_copies,
    b.available_copies,
    b.cover_url,
    b.description,
    a.author_id,
    a.name AS author_name,
    c.category_id,
    c.category_name,
    CASE 
        WHEN b.available_copies > 0 THEN 'Available'
        ELSE 'Out of Stock'
    END AS stock_status
FROM books b
JOIN authors a ON b.author_id = a.author_id
JOIN categories c ON b.category_id = c.category_id;

-- View 3: Category Analytics
CREATE OR REPLACE VIEW vw_category_analytics AS
SELECT 
    c.category_id,
    c.category_name,
    c.icon,
    COUNT(b.book_id) AS total_titles,
    COALESCE(SUM(b.total_copies), 0) AS total_inventory_copies,
    COALESCE(SUM(b.available_copies), 0) AS available_inventory_copies
FROM categories c
LEFT JOIN books b ON c.category_id = b.category_id
GROUP BY c.category_id, c.category_name, c.icon;

-- ==========================================================
-- TRIGGERS (Automated Business Logic)
-- ==========================================================

DELIMITER $$

-- Trigger 1: Auto-decrement available copies when a book is loaned
DROP TRIGGER IF EXISTS trg_after_loan_insert $$
CREATE TRIGGER trg_after_loan_insert
AFTER INSERT ON book_loans
FOR EACH ROW
BEGIN
    UPDATE books 
    SET available_copies = GREATEST(0, available_copies - 1)
    WHERE book_id = NEW.book_id;
END $$

-- Trigger 2: Auto-increment available copies when a book is returned
DROP TRIGGER IF EXISTS trg_after_loan_update $$
CREATE TRIGGER trg_after_loan_update
AFTER UPDATE ON book_loans
FOR EACH ROW
BEGIN
    -- If book was just marked returned (return_date filled or status became 'Returned')
    IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
        UPDATE books 
        SET available_copies = LEAST(total_copies, available_copies + 1)
        WHERE book_id = NEW.book_id;
    END IF;
END $$

DELIMITER ;
