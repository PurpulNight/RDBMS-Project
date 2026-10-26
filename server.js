const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// API Routes
// ==========================================

// 1. Database Connection Status & Reconfigure
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    db_mode: db.dbState.mode,
    connected: db.dbState.connected,
    error: db.dbState.error,
    config: {
      host: db.dbState.config.host,
      port: db.dbState.config.port,
      user: db.dbState.config.user,
      database: db.dbState.config.database
    },
    last_tested: db.dbState.lastTested
  });
});

app.post('/api/db/connect', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body;
    const success = await db.initDatabase({
      host: host || db.dbState.config.host,
      port: port ? parseInt(port, 10) : db.dbState.config.port,
      user: user || db.dbState.config.user,
      password: password !== undefined ? password : db.dbState.config.password,
      database: database || db.dbState.config.database
    });

    res.json({
      success,
      mode: db.dbState.mode,
      connected: db.dbState.connected,
      error: db.dbState.error,
      message: success 
        ? `Successfully connected to MySQL database '${db.dbState.config.database}'!` 
        : `Connection to MySQL failed: ${db.dbState.error}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Re-apply database/seed.sql
app.post('/api/db/seed', async (req, res) => {
  try {
    const result = await db.reseedDatabase();
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. Interactive SQL Console Runner
app.post('/api/db/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query string cannot be empty' });
    }
    const result = await db.executeRawQuery(query);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Dashboard Statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Books Endpoints
app.get('/api/books', async (req, res) => {
  try {
    const { category, search, availability } = req.query;
    const books = await db.getBooks({ category, search, availability });
    res.json({ success: true, count: books.length, books });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await db.getBookById(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
    res.json({ success: true, book });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, isbn, author_name, category_id, total_copies, rack_location, publisher, publication_year, cover_url, description } = req.body;
    if (!title || !isbn) {
      return res.status(400).json({ success: false, error: 'Title and ISBN are required fields' });
    }
    const newBook = await db.createBook({
      title,
      isbn,
      author_name: author_name || 'Anonymous',
      category_id: parseInt(category_id || 1, 10),
      total_copies: parseInt(total_copies || 1, 10),
      rack_location: rack_location || 'General Section',
      publisher,
      publication_year: parseInt(publication_year || new Date().getFullYear(), 10),
      cover_url,
      description
    });
    res.status(201).json({ success: true, book: newBook, message: 'Book created successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const updated = await db.updateBook(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Book not found' });
    res.json({ success: true, book: updated, message: 'Book updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await db.deleteBook(req.params.id);
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Categories & Authors
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/authors', async (req, res) => {
  try {
    const authors = await db.getAuthors();
    res.json({ success: true, authors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Members Endpoints
app.get('/api/members', async (req, res) => {
  try {
    const { search } = req.query;
    const members = await db.getMembers(search);
    res.json({ success: true, count: members.length, members });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const { full_name, email, phone, membership_type, max_books_allowed, avatar_url } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ success: false, error: 'Full name and email are required' });
    }
    const newMember = await db.createMember({
      full_name,
      email,
      phone,
      membership_type: membership_type || 'Standard',
      max_books_allowed: parseInt(max_books_allowed || 5, 10),
      avatar_url
    });
    res.status(201).json({ success: true, member: newMember, message: 'Member registered successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Circulation: Loans, Issue & Return
app.get('/api/loans', async (req, res) => {
  try {
    const { status, memberId } = req.query;
    const loans = await db.getLoans({ status, memberId });
    res.json({ success: true, count: loans.length, loans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/loans/issue', async (req, res) => {
  try {
    const { book_id, member_id, due_days } = req.body;
    if (!book_id || !member_id) {
      return res.status(400).json({ success: false, error: 'Both book and member must be selected' });
    }
    const loan = await db.issueBook({ book_id, member_id, due_days });
    res.status(201).json({ success: true, loan, message: 'Book successfully issued!' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/loans/:id/return', async (req, res) => {
  try {
    const { finePaid } = req.body;
    const result = await db.returnBook(req.params.id, { finePaid: !!finePaid });
    res.json({ 
      success: true, 
      result, 
      message: result.fine > 0 
        ? `Book returned with an overdue fine of $${result.fine.toFixed(2)}.` 
        : 'Book returned on time without any fine!' 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Fines Endpoints
app.get('/api/fines', async (req, res) => {
  try {
    const fines = await db.getFines();
    res.json({ success: true, fines });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/fines/:id/pay', async (req, res) => {
  try {
    await db.payFine(req.params.id);
    res.json({ success: true, message: 'Fine payment recorded successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 404 handler for API endpoints - ALWAYS return JSON, never HTML
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Fallback for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Database & Start Server
(async () => {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting Library Management System Backend Server...');
  await db.initDatabase();
  app.listen(PORT, () => {
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📊 Mode: ${db.dbState.mode.toUpperCase()} (Connected: ${db.dbState.connected})`);
    console.log('----------------------------------------------------');
  });
})();
