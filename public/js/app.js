/**
 * Main Application Orchestrator
 */
const App = {
  currentTab: 'tab-dashboard',
  stats: {},

  async init() {
    UI.initTheme();
    UI.initModalEvents();

    this.bindNavigation();
    this.bindDBConfigEvents();

    // Check DB Status
    await this.checkDBStatus();

    // Initialize Submodules
    await Books.init();
    await Circulation.init();
    await Members.init();
    await Fines.init();
    SQLConsole.init();

    // Load initial stats & overview
    await this.refreshStats();

    // Handle initial hash routing
    this.handleHashRouting();
  },

  bindNavigation() {
    // Brand home click
    document.getElementById('btn-brand-home')?.addEventListener('click', () => {
      this.switchTab('tab-dashboard');
    });

    // Navigation tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // "See All Loans" from dashboard
    document.getElementById('btn-see-all-loans')?.addEventListener('click', () => {
      this.switchTab('tab-circulation');
    });

    // "View Overdue" from urgent banner
    document.getElementById('btn-view-overdue')?.addEventListener('click', () => {
      this.switchTab('tab-circulation');
      const filter = document.getElementById('loans-status-filter');
      if (filter) {
        filter.value = 'overdue';
        Circulation.loadLoans();
      }
    });

    // Window hashchange listener
    window.addEventListener('hashchange', () => this.handleHashRouting());
  },

  handleHashRouting() {
    const hash = window.location.hash.replace('#', '');
    const tabMap = {
      'dashboard': 'tab-dashboard',
      'books': 'tab-books',
      'circulation': 'tab-circulation',
      'members': 'tab-members',
      'fines': 'tab-fines',
      'rdbms': 'tab-rdbms'
    };
    if (tabMap[hash]) {
      this.switchTab(tabMap[hash], false);
    }
  },

  switchTab(tabId, updateHash = true) {
    this.currentTab = tabId;

    // Update tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    // Optional URL hash update
    if (updateHash) {
      const slug = tabId.replace('tab-', '');
      window.location.hash = slug;
    }

    // Refresh context if needed
    if (tabId === 'tab-dashboard') {
      this.refreshStats();
    } else if (tabId === 'tab-circulation') {
      Circulation.loadLoans();
    } else if (tabId === 'tab-fines') {
      Fines.loadFines();
    }
  },

  async checkDBStatus() {
    const statusBtn = document.getElementById('db-status-btn');
    const statusText = document.getElementById('db-status-text');
    const modalTitle = document.getElementById('modal-db-status-title');
    const modalMsg = document.getElementById('modal-db-status-msg');

    try {
      const res = await API.getStatus();
      if (res.connected && res.db_mode === 'mysql') {
        if (statusBtn) {
          statusBtn.className = 'db-status-badge connected';
        }
        if (statusText) statusText.textContent = `MySQL Server Active (${res.config.database})`;
        if (modalTitle) modalTitle.textContent = `🟢 Connected to MySQL Server (${res.config.database})`;
        if (modalMsg) modalMsg.textContent = `Connected at ${res.config.host}:${res.config.port} as user '${res.config.user}'. Real SQL storage enabled.`;
      } else {
        if (statusBtn) {
          statusBtn.className = 'db-status-badge fallback';
        }
        if (statusText) statusText.textContent = 'Local Mode (Click to connect MySQL)';
        if (modalTitle) modalTitle.textContent = `🟡 Local Demo Mode (MySQL Offline)`;
        if (modalMsg) modalMsg.textContent = res.error 
          ? `Could not reach MySQL: ${res.error}. The app is fully operating in High-Performance Local Mode.` 
          : `Running in local mode. Start MySQL and click "Test & Connect MySQL" to persist to MySQL.`;
      }

      // Fill modal fields
      if (res.config) {
        if (document.getElementById('db-host')) document.getElementById('db-host').value = res.config.host || 'localhost';
        if (document.getElementById('db-port')) document.getElementById('db-port').value = res.config.port || 3306;
        if (document.getElementById('db-user')) document.getElementById('db-user').value = res.config.user || 'root';
        if (document.getElementById('db-name')) document.getElementById('db-name').value = res.config.database || 'library_db';
      }
    } catch (err) {
      if (statusBtn) statusBtn.className = 'db-status-badge fallback';
      if (statusText) statusText.textContent = 'Server Offline';
    }
  },

  bindDBConfigEvents() {
    // Open DB config modal
    const openBtn = document.getElementById('btn-open-db-config');
    const statusBtn = document.getElementById('db-status-btn');
    const openHandler = () => UI.openModal('modal-db-config');
    if (openBtn) openBtn.addEventListener('click', openHandler);
    if (statusBtn) statusBtn.addEventListener('click', openHandler);

    // Form DB Connect Submit
    const formDB = document.getElementById('form-db-config');
    if (formDB) {
      formDB.addEventListener('submit', async (e) => {
        e.preventDefault();
        const host = document.getElementById('db-host').value.trim();
        const port = document.getElementById('db-port').value.trim();
        const user = document.getElementById('db-user').value.trim();
        const password = document.getElementById('db-password').value;
        const database = document.getElementById('db-name').value.trim();

        const btnSubmit = document.getElementById('btn-test-db-connect');
        const origText = btnSubmit.textContent;
        btnSubmit.textContent = 'Testing Connection...';
        btnSubmit.disabled = true;

        try {
          const res = await API.connectDB({ host, port, user, password, database });
          if (res.success) {
            UI.showToast(res.message, 'success');
            await this.checkDBStatus();
            await Books.loadCategories();
            await Books.loadBooks();
            await Circulation.loadLoans();
            await this.refreshStats();
            UI.closeModal('modal-db-config');
          } else {
            UI.showToast(res.message, 'error');
            await this.checkDBStatus();
          }
        } catch (err) {
          UI.showToast(`Connection failed: ${err.message}`, 'error');
        } finally {
          btnSubmit.textContent = origText;
          btnSubmit.disabled = false;
        }
      });
    }

    // Reseed DB Button
    const reseedBtn = document.getElementById('btn-reseed-db');
    if (reseedBtn) {
      reseedBtn.addEventListener('click', async () => {
        const origText = reseedBtn.textContent;
        reseedBtn.textContent = 'Applying seed.sql...';
        reseedBtn.disabled = true;
        try {
          const res = await API.reseedDB();
          if (res.success) {
            UI.showToast(res.message, 'success');
            await Books.loadCategories();
            await Books.loadBooks();
            await Circulation.loadLoans();
            await this.refreshStats();
          } else {
            UI.showToast(res.error || 'Failed to re-seed', 'error');
          }
        } catch (err) {
          UI.showToast(`Error: ${err.message}`, 'error');
        } finally {
          reseedBtn.textContent = origText;
          reseedBtn.disabled = false;
        }
      });
    }
  },

  async refreshStats() {
    try {
      const res = await API.getStats();
      if (res.success) {
        this.stats = res.stats;
        this.renderStats();
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  },

  renderStats() {
    const s = this.stats;
    UI.animateValue('stat-total-titles', 0, s.total_titles || 0);
    UI.animateValue('stat-available-copies', 0, s.available_copies || 0);
    UI.animateValue('stat-active-loans', 0, s.active_loans || 0);
    UI.animateValue('stat-overdue-loans', 0, s.overdue_loans || 0);
    UI.animateValue('stat-total-members', 0, s.total_members || 0);

    const statUnpaid = document.getElementById('stat-unpaid-fines');
    if (statUnpaid) statUnpaid.textContent = `$${(s.unpaid_fines || 0).toFixed(2)}`;

    const statCollected = document.getElementById('stat-collected-fines-sub');
    if (statCollected) statCollected.textContent = `$${(s.collected_fines || 0).toFixed(2)} collected`;

    const statTotalCopiesSub = document.getElementById('stat-total-copies-sub');
    if (statTotalCopiesSub) statTotalCopiesSub.textContent = `${s.total_copies || 0} total physical copies`;

    // Urgent Overdue Alert Banner check
    const urgentBanner = document.getElementById('urgent-overdue-alert');
    const urgentDesc = document.getElementById('urgent-overdue-desc');
    if (urgentBanner) {
      if (s.overdue_loans > 0) {
        urgentBanner.style.display = 'flex';
        if (urgentDesc) urgentDesc.textContent = `There are ${s.overdue_loans} book loans currently overdue requiring immediate return & fee collection.`;
      } else {
        urgentBanner.style.display = 'none';
      }
    }

    // Render category inventory breakdown on dashboard
    this.renderCategoryBreakdown();
  },

  async renderCategoryBreakdown() {
    const container = document.getElementById('category-breakdown-list');
    if (!container) return;

    try {
      const res = await API.getCategories();
      if (res.success && res.categories) {
        container.innerHTML = res.categories.map(cat => {
          return `
            <div style="background: var(--bg-surface); padding: 0.85rem 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border-subtle); transition: var(--transition-fast);">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0.5-0.05"/></svg>
                </div>
                <div>
                  <strong style="font-size: 0.9rem; color: var(--text-primary);">${UI.escapeHTML(cat.category_name)}</strong>
                  <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">${cat.book_count || 0} Titles</span>
                </div>
              </div>
              <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); font-family: var(--font-mono); font-weight: 700;">
                ${cat.total_copies || 0} copies
              </span>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error(err);
    }
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
