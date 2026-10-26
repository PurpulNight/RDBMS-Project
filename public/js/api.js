/**
 * API Client Module
 * Communicates with the Express REST API
 */
const API = {
  // Use current origin if on backend port 3000, otherwise point explicitly to backend server
  baseUrl: (typeof window !== 'undefined' && window.location.port === '3000')
    ? '/api'
    : 'http://localhost:3000/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Backend server is starting up. Please refresh in a moment.');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  // Database Connection
  getStatus: () => API.request('/status'),
  connectDB: (credentials) => API.request('/db/connect', { method: 'POST', body: JSON.stringify(credentials) }),
  reseedDB: () => API.request('/db/seed', { method: 'POST' }),
  runRawSQL: (query) => API.request('/db/query', { method: 'POST', body: JSON.stringify({ query }) }),

  // Stats
  getStats: () => API.request('/stats'),

  // Books
  getBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return API.request(`/books${query ? '?' + query : ''}`);
  },
  getBookById: (id) => API.request(`/books/${id}`),
  createBook: (bookData) => API.request('/books', { method: 'POST', body: JSON.stringify(bookData) }),
  updateBook: (id, bookData) => API.request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(bookData) }),
  deleteBook: (id) => API.request(`/books/${id}`, { method: 'DELETE' }),

  // Categories & Authors
  getCategories: () => API.request('/categories'),
  getAuthors: () => API.request('/authors'),

  // Members
  getMembers: (search = '') => API.request(`/members${search ? '?search=' + encodeURIComponent(search) : ''}`),
  createMember: (memberData) => API.request('/members', { method: 'POST', body: JSON.stringify(memberData) }),

  // Circulation Loans
  getLoans: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return API.request(`/loans${query ? '?' + query : ''}`);
  },
  issueBook: (issueData) => API.request('/loans/issue', { method: 'POST', body: JSON.stringify(issueData) }),
  returnBook: (loanId, payload = {}) => API.request(`/loans/${loanId}/return`, { method: 'POST', body: JSON.stringify(payload) }),

  // Fines
  getFines: () => API.request('/fines'),
  payFine: (fineId) => API.request(`/fines/${fineId}/pay`, { method: 'POST' })
};
