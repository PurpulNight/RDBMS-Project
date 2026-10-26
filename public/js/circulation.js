/**
 * Circulation Desk Module
 * Handles Issue, Return, Loan Tracking, and Fine Calculations
 */
const Circulation = {
  loansList: [],
  membersList: [],
  availableBooks: [],

  async init() {
    this.bindEvents();
    await this.loadLoans();
  },

  bindEvents() {
    // Loans search
    let debounceTimer;
    const searchInput = document.getElementById('loans-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.loadLoans(), 300);
      });
    }

    // Loans status filter
    const statusFilter = document.getElementById('loans-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.loadLoans());
    }

    // Issue modal open buttons
    const btnOpenIssue = document.getElementById('btn-open-issue-modal');
    const btnQuickIssue = document.getElementById('btn-quick-issue');
    const openIssueHandler = () => this.openIssueModal();
    if (btnOpenIssue) btnOpenIssue.addEventListener('click', openIssueHandler);
    if (btnQuickIssue) btnQuickIssue.addEventListener('click', openIssueHandler);

    // Quick Return button in dashboard
    const btnQuickReturn = document.getElementById('btn-quick-return');
    if (btnQuickReturn) {
      btnQuickReturn.addEventListener('click', () => {
        App.switchTab('tab-circulation');
        document.getElementById('loans-status-filter').value = 'active';
        this.loadLoans();
      });
    }

    // Issue form submit
    const formIssue = document.getElementById('form-issue-book');
    if (formIssue) {
      formIssue.addEventListener('submit', (e) => this.handleIssueSubmit(e));
    }
  },

  async loadLoans() {
    try {
      const search = document.getElementById('loans-search-input')?.value.trim().toLowerCase() || '';
      const status = document.getElementById('loans-status-filter')?.value || 'active';

      const res = await API.getLoans({ status });
      if (res.success) {
        this.loansList = res.loans;
        if (search) {
          this.loansList = this.loansList.filter(l => 
            (l.book_title && l.book_title.toLowerCase().includes(search)) ||
            (l.member_name && l.member_name.toLowerCase().includes(search)) ||
            (l.card_number && l.card_number.toLowerCase().includes(search)) ||
            (l.isbn && l.isbn.toLowerCase().includes(search))
          );
        }
        this.renderLoans();
      }
    } catch (err) {
      UI.showToast(`Failed to load circulation records: ${err.message}`, 'error');
    }
  },

  renderLoans() {
    const tbody = document.getElementById('tbody-loans-list');
    const dashboardTbody = document.getElementById('tbody-dashboard-loans');
    if (!tbody) return;

    if (this.loansList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No loan records found under current filter.</td></tr>`;
      if (dashboardTbody) {
        dashboardTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No active circulation transactions.</td></tr>`;
      }
      return;
    }

    // Render Circulation Desk Table
    tbody.innerHTML = this.loansList.map(loan => {
      const isOverdue = loan.days_overdue > 0 && !loan.return_date;
      const isReturned = !!loan.return_date;

      let statusBadge = '';
      if (isReturned) {
        statusBadge = `<span class="badge badge-returned">Returned (${loan.return_date})</span>`;
      } else if (isOverdue) {
        statusBadge = `<span class="badge badge-overdue">Overdue by ${loan.days_overdue} days</span>`;
      } else {
        statusBadge = `<span class="badge badge-active">Active</span>`;
      }

      const fineEstimate = isOverdue ? `$${(loan.days_overdue * 10).toFixed(2)}` : (loan.fine_amount > 0 ? `$${parseFloat(loan.fine_amount).toFixed(2)}` : '$0.00');

      return `
        <tr>
          <td><strong style="font-family: var(--font-mono); color: var(--accent-cyan);">#LOAN-${loan.loan_id}</strong></td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${UI.escapeHTML(loan.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80')}" style="width: 32px; height: 44px; object-fit: cover; border-radius: 4px;">
              <div>
                <strong>${UI.escapeHTML(loan.book_title || 'Unknown Title')}</strong>
                <span style="display: block; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${UI.escapeHTML(loan.isbn || '')}</span>
              </div>
            </div>
          </td>
          <td>
            <div>
              <strong>${UI.escapeHTML(loan.member_name || 'Member')}</strong>
              <span style="display: block; font-size: 0.75rem; color: var(--primary); font-family: var(--font-mono);">${UI.escapeHTML(loan.card_number || '')}</span>
            </div>
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem;">${loan.issue_date}</td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; color: ${isOverdue ? 'var(--accent-rose)' : 'inherit'};">${loan.due_date}</td>
          <td>${statusBadge}</td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: ${loan.days_overdue > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'};">${fineEstimate}</td>
          <td>
            ${!isReturned ? `
              <button class="btn btn-success btn-sm" onclick="Circulation.handleReturnBook(${loan.loan_id}, '${UI.escapeHTML(loan.book_title || '').replace(/'/g, "\\'")}', ${loan.days_overdue || 0})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Return Book</span>
              </button>
            ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Completed</span>'}
          </td>
        </tr>
      `;
    }).join('');

    // Also populate recent circulation on the Dashboard
    if (dashboardTbody) {
      dashboardTbody.innerHTML = this.loansList.slice(0, 5).map(loan => {
        const isOverdue = loan.days_overdue > 0 && !loan.return_date;
        const isReturned = !!loan.return_date;

        return `
          <tr>
            <td>
              <strong>${UI.escapeHTML(loan.book_title || 'Title')}</strong>
              <span style="display:block; font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">${loan.rack_location || ''}</span>
            </td>
            <td>
              <span>${UI.escapeHTML(loan.member_name || '')}</span>
              <span style="display:block; font-size:0.75rem; color:var(--primary); font-family:var(--font-mono);">${loan.card_number || ''}</span>
            </td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem;">${loan.issue_date}</td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem; color: ${isOverdue ? 'var(--accent-rose)' : 'inherit'}; font-weight: 600;">${loan.due_date}</td>
            <td>
              <span class="badge ${isReturned ? 'badge-returned' : (isOverdue ? 'badge-overdue' : 'badge-active')}">
                ${isReturned ? 'Returned' : (isOverdue ? 'Overdue' : 'Active')}
              </span>
            </td>
            <td>
              ${!isReturned ? `
                <button class="btn btn-secondary btn-sm" onclick="Circulation.handleReturnBook(${loan.loan_id}, '${UI.escapeHTML(loan.book_title || '').replace(/'/g, "\\'")}', ${loan.days_overdue || 0})">Return</button>
              ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Done</span>'}
            </td>
          </tr>
        `;
      }).join('');
    }
  },

  async openIssueModal() {
    try {
      // 1. Fetch available books
      const booksRes = await API.getBooks({ availability: 'available' });
      // 2. Fetch members
      const membersRes = await API.getMembers();

      const selectBook = document.getElementById('issue-select-book');
      const selectMember = document.getElementById('issue-select-member');

      if (booksRes.success && selectBook) {
        this.availableBooks = booksRes.books;
        selectBook.innerHTML = '<option value="">-- Choose Book (Shows Available Copies) --</option>' +
          booksRes.books.map(b => `<option value="${b.book_id}">${UI.escapeHTML(b.title)} (${b.available_copies} available / Rack: ${b.rack_location})</option>`).join('');
      }

      if (membersRes.success && selectMember) {
        this.membersList = membersRes.members;
        selectMember.innerHTML = '<option value="">-- Choose Member (Shows Card ID) --</option>' +
          membersRes.members
            .filter(m => m.status === 'Active')
            .map(m => `<option value="${m.member_id}">${UI.escapeHTML(m.full_name)} [${m.card_number}] - Tier: ${m.membership_type} (Active: ${m.active_loans_count}/${m.max_books_allowed})</option>`).join('');
      }

      UI.openModal('modal-issue');
    } catch (err) {
      UI.showToast(`Error preparing issue form: ${err.message}`, 'error');
    }
  },

  async openIssueForBook(bookId) {
    await this.openIssueModal();
    const selectBook = document.getElementById('issue-select-book');
    if (selectBook) {
      selectBook.value = bookId;
    }
  },

  async handleIssueSubmit(e) {
    e.preventDefault();
    const book_id = document.getElementById('issue-select-book').value;
    const member_id = document.getElementById('issue-select-member').value;
    const due_days = document.getElementById('issue-loan-duration').value;

    if (!book_id || !member_id) {
      UI.showToast('Please select both a book and a member', 'error');
      return;
    }

    try {
      const res = await API.issueBook({ book_id, member_id, due_days });
      UI.showToast(res.message || 'Book issued successfully!', 'success');
      UI.closeModal('modal-issue');
      await this.loadLoans();
      await Books.loadBooks();
      App.refreshStats();
    } catch (err) {
      UI.showToast(`Failed to issue book: ${err.message}`, 'error');
    }
  },

  async handleReturnBook(loanId, title, daysOverdue) {
    let confirmMsg = `Confirm return for "${title}"?`;
    let finePaid = false;

    if (daysOverdue > 0) {
      const fine = daysOverdue * 10;
      confirmMsg += `\n⚠️ This book is OVERDUE by ${daysOverdue} days!\nCalculated Fine: $${fine.toFixed(2)}.\n\nMark fine as collected immediately?`;
      finePaid = confirm(confirmMsg);
    } else {
      if (!confirm(confirmMsg)) return;
    }

    try {
      const res = await API.returnBook(loanId, { finePaid });
      UI.showToast(res.message || 'Book successfully returned!', 'success');
      await this.loadLoans();
      await Books.loadBooks();
      App.refreshStats();
      if (typeof Fines !== 'undefined') Fines.loadFines();
    } catch (err) {
      UI.showToast(`Error returning book: ${err.message}`, 'error');
    }
  }
};
