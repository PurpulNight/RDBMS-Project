/**
 * Books Catalog & Inventory Module
 */
const Books = {
  booksList: [],
  categories: [],
  viewMode: 'grid', // 'grid' or 'table'

  async init() {
    this.bindEvents();
    await this.loadCategories();
    await this.loadBooks();
  },

  bindEvents() {
    // Search input with debounce
    let debounceTimer;
    const searchInput = document.getElementById('books-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.loadBooks(), 300);
      });
    }

    // Category filter
    const catFilter = document.getElementById('books-category-filter');
    if (catFilter) {
      catFilter.addEventListener('change', () => this.loadBooks());
    }

    // Availability filter
    const availFilter = document.getElementById('books-availability-filter');
    if (availFilter) {
      availFilter.addEventListener('change', () => this.loadBooks());
    }

    // View toggle buttons
    const btnGrid = document.getElementById('btn-view-grid');
    const btnTable = document.getElementById('btn-view-table');
    if (btnGrid && btnTable) {
      btnGrid.addEventListener('click', () => this.setViewMode('grid'));
      btnTable.addEventListener('click', () => this.setViewMode('table'));
    }

    // Open Add Book modal button
    const btnOpenAdd = document.getElementById('btn-open-add-book');
    const btnQuickAdd = document.getElementById('btn-quick-add-book');
    const openAddHandler = () => this.openAddModal();
    if (btnOpenAdd) btnOpenAdd.addEventListener('click', openAddHandler);
    if (btnQuickAdd) btnQuickAdd.addEventListener('click', openAddHandler);

    // Book form submission
    const formBook = document.getElementById('form-book');
    if (formBook) {
      formBook.addEventListener('submit', (e) => this.handleSaveBook(e));
    }
  },

  setViewMode(mode) {
    this.viewMode = mode;
    const btnGrid = document.getElementById('btn-view-grid');
    const btnTable = document.getElementById('btn-view-table');
    const gridContainer = document.getElementById('books-grid-container');
    const tableContainer = document.getElementById('books-table-container');

    if (mode === 'grid') {
      btnGrid.classList.add('active');
      btnTable.classList.remove('active');
      gridContainer.style.display = 'grid';
      tableContainer.style.display = 'none';
    } else {
      btnTable.classList.add('active');
      btnGrid.classList.remove('active');
      gridContainer.style.display = 'none';
      tableContainer.style.display = 'block';
    }
  },

  async loadCategories() {
    try {
      const res = await API.getCategories();
      if (res.success) {
        this.categories = res.categories;
        this.populateCategoryDropdowns();
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  },

  populateCategoryDropdowns() {
    const filterSelect = document.getElementById('books-category-filter');
    const formSelect = document.getElementById('book-form-category');

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">All Categories (${this.categories.length})</option>` +
        this.categories.map(c => `<option value="${c.category_id}">${UI.escapeHTML(c.category_name)}</option>`).join('');
    }

    if (formSelect) {
      formSelect.innerHTML = this.categories.map(c => `<option value="${c.category_id}">${UI.escapeHTML(c.category_name)}</option>`).join('');
    }
  },

  async loadBooks() {
    try {
      const search = document.getElementById('books-search-input')?.value.trim() || '';
      const category = document.getElementById('books-category-filter')?.value || '';
      const availability = document.getElementById('books-availability-filter')?.value || '';

      const res = await API.getBooks({ search, category, availability });
      if (res.success) {
        this.booksList = res.books;
        this.renderBooks();
      }
    } catch (err) {
      UI.showToast(`Error fetching books: ${err.message}`, 'error');
    }
  },

  renderBooks() {
    const gridContainer = document.getElementById('books-grid-container');
    const tableBody = document.getElementById('books-table-body');
    if (!gridContainer || !tableBody) return;

    if (this.booksList.length === 0) {
      const emptyHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No Books Found</h3>
          <p>No titles matched your search or filter criteria. Try adjusting your query or add a new title.</p>
        </div>
      `;
      gridContainer.innerHTML = emptyHTML;
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 3rem;">No books found matching criteria.</td></tr>`;
      return;
    }

    // 1. Render Grid View
    gridContainer.innerHTML = this.booksList.map(b => {
      const isAvailable = b.available_copies > 0;
      const coverUrl = b.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
      return `
        <div class="book-card" data-id="${b.book_id}">
          <div class="book-card-cover">
            <img src="${UI.escapeHTML(coverUrl)}" alt="${UI.escapeHTML(b.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'">
            <div class="book-card-cover-overlay">
              <span class="book-category-tag">${UI.escapeHTML(b.category_name || 'General')}</span>
              <span class="book-copies-badge ${isAvailable ? 'available' : 'out-of-stock'}">
                ${isAvailable ? `${b.available_copies}/${b.total_copies} Available` : 'Out of Stock'}
              </span>
            </div>
          </div>
          <div class="book-card-body">
            <h3 class="book-title" title="${UI.escapeHTML(b.title)}">${UI.escapeHTML(b.title)}</h3>
            <div class="book-author">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>${UI.escapeHTML(b.author_name || 'Unknown')}</span>
            </div>

            <div class="book-meta-grid">
              <div class="book-meta-item">
                <strong>ISBN</strong>
                <span>${UI.escapeHTML(b.isbn)}</span>
              </div>
              <div class="book-meta-item">
                <strong>Location</strong>
                <span>${UI.escapeHTML(b.rack_location || 'A-1')}</span>
              </div>
            </div>

            <div class="book-card-actions">
              <button class="btn btn-primary btn-sm" style="flex: 1;" ${!isAvailable ? 'disabled title="No copies available to issue"' : ''} onclick="Circulation.openIssueForBook(${b.book_id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path></svg>
                <span>Issue</span>
              </button>
              <button class="btn btn-secondary btn-sm" title="Edit book details" onclick="Books.openEditModal(${b.book_id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-secondary btn-sm" title="Delete book" onclick="Books.handleDeleteBook(${b.book_id}, '${UI.escapeHTML(b.title).replace(/'/g, "\\'")}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 2. Render Table View
    tableBody.innerHTML = this.booksList.map(b => {
      const isAvailable = b.available_copies > 0;
      return `
        <tr>
          <td>
            <strong>${UI.escapeHTML(b.title)}</strong>
            <span style="display:block; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${UI.escapeHTML(b.isbn)}</span>
          </td>
          <td>${UI.escapeHTML(b.author_name || 'Unknown')}</td>
          <td><span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary);">${UI.escapeHTML(b.category_name || '')}</span></td>
          <td><code>${UI.escapeHTML(b.rack_location || '-')}</code></td>
          <td>${b.total_copies}</td>
          <td><strong>${b.available_copies}</strong></td>
          <td>
            <span class="badge ${isAvailable ? 'badge-active' : 'badge-overdue'}">
              ${isAvailable ? 'Available' : 'Out of Stock'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-primary btn-sm" ${!isAvailable ? 'disabled' : ''} onclick="Circulation.openIssueForBook(${b.book_id})">Issue</button>
              <button class="btn btn-secondary btn-sm" onclick="Books.openEditModal(${b.book_id})">Edit</button>
              <button class="btn btn-secondary btn-sm" onclick="Books.handleDeleteBook(${b.book_id}, '${UI.escapeHTML(b.title).replace(/'/g, "\\'")}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddModal() {
    document.getElementById('modal-book-title').textContent = 'Add New Book Title';
    document.getElementById('form-book').reset();
    document.getElementById('book-form-id').value = '';
    document.getElementById('book-form-copies').value = '3';
    document.getElementById('book-form-year').value = new Date().getFullYear();
    UI.openModal('modal-book');
  },

  async openEditModal(bookId) {
    try {
      const res = await API.getBookById(bookId);
      if (res.success && res.book) {
        const b = res.book;
        document.getElementById('modal-book-title').textContent = 'Edit Book Details';
        document.getElementById('book-form-id').value = b.book_id;
        document.getElementById('book-form-title').value = b.title;
        document.getElementById('book-form-isbn').value = b.isbn;
        document.getElementById('book-form-author').value = b.author_name;
        document.getElementById('book-form-category').value = b.category_id;
        document.getElementById('book-form-copies').value = b.total_copies;
        document.getElementById('book-form-rack').value = b.rack_location || '';
        document.getElementById('book-form-year').value = b.publication_year || '';
        document.getElementById('book-form-cover').value = b.cover_url || '';
        document.getElementById('book-form-desc').value = b.description || '';
        UI.openModal('modal-book');
      }
    } catch (err) {
      UI.showToast(`Failed to load book: ${err.message}`, 'error');
    }
  },

  async handleSaveBook(e) {
    e.preventDefault();
    const id = document.getElementById('book-form-id').value;
    const title = document.getElementById('book-form-title').value.trim();
    const isbn = document.getElementById('book-form-isbn').value.trim();
    const author_name = document.getElementById('book-form-author').value.trim();
    const category_id = parseInt(document.getElementById('book-form-category').value, 10);
    const total_copies = parseInt(document.getElementById('book-form-copies').value, 10);
    const rack_location = document.getElementById('book-form-rack').value.trim();
    const publication_year = parseInt(document.getElementById('book-form-year').value, 10);
    const cover_url = document.getElementById('book-form-cover').value.trim();
    const description = document.getElementById('book-form-desc').value.trim();

    const payload = {
      title,
      isbn,
      author_name,
      category_id,
      total_copies,
      available_copies: total_copies,
      rack_location,
      publication_year,
      cover_url,
      description
    };

    try {
      if (id) {
        await API.updateBook(id, payload);
        UI.showToast(`Updated "${title}" successfully`, 'success');
      } else {
        await API.createBook(payload);
        UI.showToast(`Added "${title}" to library catalog`, 'success');
      }

      UI.closeModal('modal-book');
      await this.loadBooks();
      App.refreshStats();
    } catch (err) {
      UI.showToast(`Error: ${err.message}`, 'error');
    }
  },

  async handleDeleteBook(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await API.deleteBook(id);
      UI.showToast(`Deleted "${title}"`, 'success');
      await this.loadBooks();
      App.refreshStats();
    } catch (err) {
      UI.showToast(`Cannot delete: ${err.message}`, 'error');
    }
  }
};
