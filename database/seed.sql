-- ==========================================================
-- LIBRARY MANAGEMENT SYSTEM - SAMPLE SEED DATA
-- Prepopulates realistic books, authors, members, and transactions
-- ==========================================================

USE library_db;

-- 1. Insert Categories
INSERT INTO categories (category_id, category_name, description, icon) VALUES
(1, 'Computer Science', 'Programming, Algorithms, Software Engineering & Systems', 'code'),
(2, 'Database Systems', 'RDBMS, SQL, Distributed Databases & Cloud Data Architecture', 'database'),
(3, 'Artificial Intelligence', 'Machine Learning, Deep Learning, Neural Networks & Robotics', 'cpu'),
(4, 'Science & Physics', 'Astrophysics, Quantum Mechanics, Biology & Natural Sciences', 'atom'),
(5, 'Fiction & Literature', 'Classic Novels, Dystopian, Mystery & Literary Fiction', 'book-open'),
(6, 'Mathematics', 'Linear Algebra, Discrete Mathematics, Statistics & Calculus', 'hash')
ON DUPLICATE KEY UPDATE category_name=VALUES(category_name);

-- 2. Insert Authors
INSERT INTO authors (author_id, name, biography, nationality) VALUES
(1, 'Abraham Silberschatz', 'Professor of Computer Science at Yale University, renowned author of Database Systems and OS textbooks.', 'American'),
(2, 'Robert C. Martin', 'Renowned software engineer known as Uncle Bob, co-author of Agile Manifesto and author of Clean Code.', 'American'),
(3, 'Martin Kleppmann', 'Researcher in distributed systems at University of Cambridge, author of Designing Data-Intensive Applications.', 'British'),
(4, 'Donald E. Knuth', 'Legendary computer scientist, mathematician, Professor Emeritus at Stanford, creator of TeX.', 'American'),
(5, 'George Orwell', 'English novelist, essayist, and critic famous for Animal Farm and Nineteen Eighty-Four.', 'British'),
(6, 'Carl Sagan', 'American astronomer, planetary scientist, and science communicator author of Cosmos.', 'American'),
(7, 'Thomas H. Cormen', 'Co-author of Introduction to Algorithms (CLRS), Professor Emeritus at Dartmouth College.', 'American'),
(8, 'C.J. Date', 'Independent author, lecturer, and researcher specializing in relational database theory.', 'British')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Insert Books
INSERT INTO books (book_id, isbn, title, author_id, category_id, publisher, publication_year, rack_location, total_copies, available_copies, cover_url, description) VALUES
(1, '978-0078022159', 'Database System Concepts (7th Ed)', 1, 2, 'McGraw-Hill', 2019, 'Rack B-04', 5, 3, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 'The foundational textbook on relational database design, query processing, concurrency control, and SQL.'),
(2, '978-0132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', 2, 1, 'Prentice Hall', 2008, 'Rack A-01', 6, 4, 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80', 'A handbook of agile craftsmanship detailing clean code principles, refactoring, code smells, and testing.'),
(3, '978-1449373320', 'Designing Data-Intensive Applications', 3, 2, 'O\'Reilly Media', 2017, 'Rack B-02', 4, 2, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80', 'The definitive guide to the storage engines, replication, partitioning, consistency models, and stream processing.'),
(4, '978-0262033848', 'Introduction to Algorithms (CLRS 3rd Ed)', 7, 1, 'MIT Press', 2009, 'Rack A-05', 5, 2, 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80', 'Comprehensive textbook on fundamental algorithms, data structures, graph theory, dynamic programming, and complexity.'),
(5, '978-0451524935', '1984', 5, 5, 'Signet Classic', 1949, 'Rack F-02', 8, 7, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80', 'A dystopian masterpiece depicting totalitarian surveillance, thoughtcrime, and the loss of individual autonomy.'),
(7, '978-0201896831', 'The Art of Computer Programming, Vol 1', 4, 1, 'Addison-Wesley', 1997, 'Rack A-09', 3, 3, 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80', 'Fundamental algorithms and information structures by the legendary Donald Knuth.'),
(8, '978-0321197849', 'An Introduction to Database Systems (8th Ed)', 8, 2, 'Pearson', 2003, 'Rack B-01', 3, 2, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', 'In-depth rigorous theoretical foundation of relational calculus, relational algebra, and integrity constraints.')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 4. Insert Members
INSERT INTO members (member_id, card_number, full_name, email, phone, membership_type, max_books_allowed, status, avatar_url, join_date) VALUES
(1, 'LIB-2026-001', 'Yash Sahai Bhatnagar', 'yash.bhatnagar@university.edu', '+91 98765 43210', 'Faculty', 10, 'Active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', '2026-01-15'),
(2, 'LIB-2026-002', 'Aarav Sharma', 'aarav.sharma@campus.edu', '+91 98111 22334', 'Student', 5, 'Active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80', '2026-02-01'),
(3, 'LIB-2026-003', 'Ananya Patel', 'ananya.p@campus.edu', '+91 98222 33445', 'Student', 5, 'Active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', '2026-02-10'),
(4, 'LIB-2026-004', 'Rohan Mukherjee', 'rohan.m@techresearch.org', '+91 98333 44556', 'Premium', 8, 'Active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', '2026-03-01'),
(5, 'LIB-2026-005', 'Sneha Verma', 'sneha.verma@campus.edu', '+91 98444 55667', 'Student', 5, 'Suspended', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', '2026-01-20')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 5. Insert Book Loans
-- Note: Some loans are active, one is returned, one is overdue
INSERT INTO book_loans (loan_id, book_id, member_id, issue_date, due_date, return_date, status, renewal_count, fine_amount) VALUES
(1, 1, 2, '2026-04-01', '2026-04-15', NULL, 'Overdue', 0, 110.00),
(2, 3, 1, '2026-04-10', '2026-05-10', NULL, 'Issued', 1, 0.00),
(3, 4, 3, '2026-04-12', '2026-04-26', NULL, 'Issued', 0, 0.00),
(4, 2, 4, '2026-03-01', '2026-03-15', '2026-03-14', 'Returned', 0, 0.00),
(5, 8, 2, '2026-04-14', '2026-04-28', NULL, 'Issued', 0, 0.00)
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 6. Insert Fines
INSERT INTO fines (fine_id, loan_id, member_id, amount, reason, status, paid_date) VALUES
(1, 1, 2, 110.00, 'Overdue by 11 days (Rate: 10/day)', 'Unpaid', NULL),
(2, 4, 4, 20.00, 'Minor spine damage processing fee', 'Paid', '2026-03-14 11:30:00')
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- 7. Insert Reservations
INSERT INTO reservations (reservation_id, book_id, member_id, reservation_date, status) VALUES
(1, 1, 3, '2026-04-18 09:20:00', 'Pending'),
(2, 3, 5, '2026-04-19 14:45:00', 'Pending')
ON DUPLICATE KEY UPDATE status=VALUES(status);
