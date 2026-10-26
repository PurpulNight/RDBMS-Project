/**
 * RDBMS SQL Console & Relational Schema Visualizer Module
 */
const SQLConsole = {
  // Normalized 3NF Relational Schema Definition
  schemaTables: [
    {
      name: 'categories',
      desc: 'Normalized classification taxonomy',
      columns: [
        { name: 'category_id', type: 'INT', key: 'PK', isNull: false },
        { name: 'category_name', type: 'VARCHAR(100)', key: 'UQ', isNull: false },
        { name: 'description', type: 'TEXT', key: '', isNull: true },
        { name: 'icon', type: 'VARCHAR(50)', key: '', isNull: true }
      ]
    },
    {
      name: 'authors',
      desc: 'Book authors & creators',
      columns: [
        { name: 'author_id', type: 'INT', key: 'PK', isNull: false },
        { name: 'name', type: 'VARCHAR(150)', key: '', isNull: false },
        { name: 'biography', type: 'TEXT', key: '', isNull: true },
        { name: 'nationality', type: 'VARCHAR(100)', key: '', isNull: true }
      ]
    },
    {
      name: 'books',
      desc: 'Central inventory catalog entity',
      columns: [
        { name: 'book_id', type: 'INT', key: 'PK', isNull: false },
        { name: 'isbn', type: 'VARCHAR(20)', key: 'UQ', isNull: false },
        { name: 'title', type: 'VARCHAR(255)', key: '', isNull: false },
        { name: 'author_id', type: 'INT', key: 'FK -> authors', isNull: false },
        { name: 'category_id', type: 'INT', key: 'FK -> categories', isNull: false },
        { name: 'rack_location', type: 'VARCHAR(50)', key: '', isNull: true },
        { name: 'total_copies', type: 'INT', key: 'CHECK >= 0', isNull: false },
        { name: 'available_copies', type: 'INT', key: 'CHECK >= 0', isNull: false }
      ]
    },
    {
      name: 'members',
      desc: 'Registered library patrons',
      columns: [
        { name: 'member_id', type: 'INT', key: 'PK', isNull: false },
        { name: 'card_number', type: 'VARCHAR(30)', key: 'UQ', isNull: false },
        { name: 'full_name', type: 'VARCHAR(150)', key: '', isNull: false },
        { name: 'email', type: 'VARCHAR(150)', key: 'UQ', isNull: false },
        { name: 'membership_type', type: 'ENUM', key: '', isNull: false },
        { name: 'max_books_allowed', type: 'INT', key: '', isNull: false },
        { name: 'status', type: 'ENUM', key: '', isNull: false }
      ]
    },
    {
      name: 'book_loans',
      desc: 'Circulation transactions with temporal tracking',
      columns: [
        { name: 'loan_id', type: 'INT', key: 'PK', isNull: false },
        { name: 'book_id', type: 'INT', key: 'FK -> books', isNull: false },
        { name: 'member_id', type: 'INT', key: 'FK -> members', isNull: false },
        { name: 'issue_date', type: 'DATE', key: '', isNull: false },
        { name: 'due_date', type: 'DATE', key: '', isNull: false },
        { name: 'return_date', type: 'DATE', key: '', isNull: true },
        { name: 'status', type: 'ENUM', key: '', isNull: false },
        { name: 'fine_amount', type: 'DECIMAL(10,2)', key: '', isNull: false }
      ]
    },
    {
      name: 'fines',
      desc: 'Penalty ledger for late returns & damages',
      columns: [
        { name: 'fine_id', type: 'INT', key: 'PK', isNull: false },
        { name: 'loan_id', type: 'INT', key: 'FK -> book_loans', isNull: false },
        { name: 'member_id', type: 'INT', key: 'FK -> members', isNull: false },
        { name: 'amount', type: 'DECIMAL(10,2)', key: '', isNull: false },
        { name: 'reason', type: 'VARCHAR(255)', key: '', isNull: true },
        { name: 'status', type: 'ENUM', key: '', isNull: false }
      ]
    }
  ],

  init() {
    this.renderSchemaCards();
    this.bindEvents();
  },

  renderSchemaCards() {
    const container = document.getElementById('schema-grid-container');
    if (!container) return;

    container.innerHTML = this.schemaTables.map(t => {
      return `
        <div class="schema-table-card">
          <div class="schema-table-header">
            <span>TABLE: ${t.name}</span>
            <small style="font-size: 0.65rem; color: var(--text-muted); font-weight: normal;">${t.columns.length} cols</small>
          </div>
          <ul class="schema-cols-list">
            ${t.columns.map(col => {
              let keyBadge = '';
              if (col.key.includes('PK')) keyBadge = '<span class="col-key col-pk">PK</span>';
              else if (col.key.includes('FK')) keyBadge = '<span class="col-key col-fk">FK</span>';
              else if (col.key.includes('UQ')) keyBadge = '<span class="col-key" style="background: rgba(6, 182, 212, 0.2); color: var(--accent-cyan);">UQ</span>';

              return `
                <li class="schema-col-item">
                  <div class="schema-col-name">
                    ${keyBadge}
                    <strong>${col.name}</strong>
                  </div>
                  <span class="schema-col-type">${col.type}</span>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    // Run SQL Button
    const btnRun = document.getElementById('btn-run-sql');
    if (btnRun) {
      btnRun.addEventListener('click', () => this.executeCurrentQuery());
    }

    // Sample Query Pills
    document.querySelectorAll('.sample-query-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const query = pill.getAttribute('data-query');
        const sqlInput = document.getElementById('sql-input');
        if (sqlInput) {
          sqlInput.value = query;
          this.executeCurrentQuery();
        }
      });
    });
  },

  async executeCurrentQuery() {
    const sqlInput = document.getElementById('sql-input');
    const resultBox = document.getElementById('sql-result-box');
    const metaTime = document.getElementById('query-meta-time');
    if (!sqlInput || !resultBox) return;

    const query = sqlInput.value.trim();
    if (!query) {
      UI.showToast('Please type a SQL query to execute', 'error');
      return;
    }

    resultBox.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
        <div class="db-pulse" style="margin: 0 auto 0.75rem auto;"></div>
        <p>Executing SQL query against database engine...</p>
      </div>
    `;

    try {
      const res = await API.runRawSQL(query);
      if (res.success) {
        metaTime.textContent = `Executed in ${res.durationMs}ms (${res.mode.toUpperCase()} engine)`;
        this.renderQueryResult(res);
        UI.showToast(`Query executed in ${res.durationMs}ms`, 'success');
      }
    } catch (err) {
      metaTime.textContent = 'Error';
      resultBox.innerHTML = `
        <div style="background: var(--accent-rose-light); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: var(--radius-md); padding: 1.25rem; color: var(--accent-rose);">
          <strong style="display: block; margin-bottom: 0.35rem;">SQL Syntax / Execution Error</strong>
          <code style="font-family: var(--font-mono); font-size: 0.85rem;">${UI.escapeHTML(err.message)}</code>
        </div>
      `;
      UI.showToast(`SQL Error: ${err.message}`, 'error');
    }
  },

  renderQueryResult(res) {
    const resultBox = document.getElementById('sql-result-box');
    if (!resultBox) return;

    const rows = res.rows || [];
    if (rows.length === 0) {
      resultBox.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
          <p>Query returned 0 rows (Empty set).</p>
        </div>
      `;
      return;
    }

    // Extract headers
    let headers = res.fields || [];
    if (!headers.length && rows.length > 0 && typeof rows[0] === 'object') {
      headers = Object.keys(rows[0]);
    }

    let tableHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Results: ${rows.length} rows</span>
        <span class="badge" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); font-family: var(--font-mono);">${res.mode.toUpperCase()}</span>
      </div>
      <div class="table-responsive" style="max-height: 420px; overflow-y: auto;">
        <table class="data-table">
          <thead>
            <tr>
              ${headers.map(h => `<th>${UI.escapeHTML(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => {
              return `
                <tr>
                  ${headers.map(h => {
                    let val = row[h];
                    if (val === null || val === undefined) val = '<span style="color: var(--text-muted); font-style: italic;">NULL</span>';
                    else if (typeof val === 'object') val = JSON.stringify(val);
                    else val = UI.escapeHTML(String(val));
                    return `<td style="font-family: var(--font-mono); font-size: 0.825rem;">${val}</td>`;
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    resultBox.innerHTML = tableHtml;
  }
};
