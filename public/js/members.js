/**
 * Members Directory & Fines Module
 */
const Members = {
  membersList: [],

  async init() {
    this.bindEvents();
    await this.loadMembers();
  },

  bindEvents() {
    // Search member input
    let debounceTimer;
    const searchInput = document.getElementById('members-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.loadMembers(), 300);
      });
    }

    // Open add member modal buttons
    const btnOpenAdd = document.getElementById('btn-open-add-member');
    const btnQuickAdd = document.getElementById('btn-quick-add-member');
    const openAddHandler = () => this.openAddModal();
    if (btnOpenAdd) btnOpenAdd.addEventListener('click', openAddHandler);
    if (btnQuickAdd) btnQuickAdd.addEventListener('click', openAddHandler);

    // Form member submit
    const formMember = document.getElementById('form-member');
    if (formMember) {
      formMember.addEventListener('submit', (e) => this.handleRegisterMember(e));
    }
  },

  async loadMembers() {
    try {
      const search = document.getElementById('members-search-input')?.value.trim() || '';
      const res = await API.getMembers(search);
      if (res.success) {
        this.membersList = res.members;
        this.renderMembers();
      }
    } catch (err) {
      UI.showToast(`Failed to load members: ${err.message}`, 'error');
    }
  },

  renderMembers() {
    const tbody = document.getElementById('tbody-members-list');
    if (!tbody) return;

    if (this.membersList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No members found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.membersList.map(m => {
      const avatarUrl = m.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
      const unpaidFines = parseFloat(m.unpaid_fines_total || 0);

      return `
        <tr>
          <td>
            <div class="user-cell">
              <img src="${UI.escapeHTML(avatarUrl)}" class="user-avatar" alt="${UI.escapeHTML(m.full_name)}">
              <div class="user-details">
                <strong>${UI.escapeHTML(m.full_name)}</strong>
                <span>${UI.escapeHTML(m.email)}</span>
              </div>
            </div>
          </td>
          <td><strong style="font-family: var(--font-mono); color: var(--accent-cyan);">${UI.escapeHTML(m.card_number)}</strong></td>
          <td>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${UI.escapeHTML(m.phone || 'N/A')}</span>
          </td>
          <td>
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary);">
              ${UI.escapeHTML(m.membership_type || 'Standard')}
            </span>
          </td>
          <td>
            <strong>${m.active_loans_count || 0}</strong> <span style="color: var(--text-muted);">/ ${m.max_books_allowed || 5}</span>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 700; color: ${unpaidFines > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'};">
              $${unpaidFines.toFixed(2)}
            </span>
          </td>
          <td>
            <span class="badge ${m.status === 'Active' ? 'badge-active' : 'badge-overdue'}">
              ${UI.escapeHTML(m.status)}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddModal() {
    document.getElementById('form-member').reset();
    document.getElementById('member-form-max').value = '5';
    UI.openModal('modal-member');
  },

  async handleRegisterMember(e) {
    e.preventDefault();
    const full_name = document.getElementById('member-form-name').value.trim();
    const email = document.getElementById('member-form-email').value.trim();
    const phone = document.getElementById('member-form-phone').value.trim();
    const membership_type = document.getElementById('member-form-type').value;
    const max_books_allowed = parseInt(document.getElementById('member-form-max').value, 10);

    try {
      const res = await API.createMember({
        full_name,
        email,
        phone,
        membership_type,
        max_books_allowed
      });
      UI.showToast(`Registered member ${full_name} (${res.member.card_number})`, 'success');
      UI.closeModal('modal-member');
      await this.loadMembers();
      App.refreshStats();
    } catch (err) {
      UI.showToast(`Error registering member: ${err.message}`, 'error');
    }
  }
};

/**
 * Fines & Cashier Module
 */
const Fines = {
  finesList: [],

  async init() {
    await this.loadFines();
  },

  async loadFines() {
    try {
      const res = await API.getFines();
      if (res.success) {
        this.finesList = res.fines;
        this.renderFines();
      }
    } catch (err) {
      console.error('Failed to load fines', err);
    }
  },

  renderFines() {
    const tbody = document.getElementById('tbody-fines-list');
    if (!tbody) return;

    if (this.finesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No fines or penalty records on file.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.finesList.map(f => {
      const isUnpaid = f.status === 'Unpaid';
      return `
        <tr>
          <td><strong style="font-family: var(--font-mono); color: var(--accent-amber);">#FINE-${f.fine_id}</strong></td>
          <td><strong>${UI.escapeHTML(f.member_name || 'Member')}</strong></td>
          <td><code style="color: var(--primary);">${UI.escapeHTML(f.card_number || '')}</code></td>
          <td>${UI.escapeHTML(f.book_title || '-')}</td>
          <td><strong style="font-family: var(--font-mono); font-size: 1rem; color: ${isUnpaid ? 'var(--accent-rose)' : 'var(--accent-emerald)'};">$${parseFloat(f.amount).toFixed(2)}</strong></td>
          <td style="color: var(--text-secondary); font-size: 0.85rem;">${UI.escapeHTML(f.reason || 'Overdue loan fine')}</td>
          <td>
            <span class="badge ${isUnpaid ? 'badge-unpaid' : 'badge-paid'}">
              ${f.status}
            </span>
          </td>
          <td>
            ${isUnpaid ? `
              <button class="btn btn-success btn-sm" onclick="Fines.handlePayFine(${f.fine_id}, ${f.amount})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Settle Payment</span>
              </button>
            ` : `<span style="color: var(--text-muted); font-size: 0.8rem;">Paid on ${f.paid_date ? f.paid_date.split('T')[0] : 'record'}</span>`}
          </td>
        </tr>
      `;
    }).join('');
  },

  async handlePayFine(fineId, amount) {
    if (!confirm(`Confirm collection of payment: $${parseFloat(amount).toFixed(2)}?`)) return;

    try {
      await API.payFine(fineId);
      UI.showToast(`Fine #${fineId} ($${parseFloat(amount).toFixed(2)}) marked as Paid!`, 'success');
      await this.loadFines();
      await Members.loadMembers();
      App.refreshStats();
    } catch (err) {
      UI.showToast(`Payment error: ${err.message}`, 'error');
    }
  }
};
