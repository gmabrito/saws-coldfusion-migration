import axios from 'axios';

export const requestService = {
  // Public — no auth required
  submitRequest: (data) =>
    axios.post('/api/public/requests', data).then((r) => r.data),

  getPublicStatus: (confirmationNo) =>
    axios.get(`/api/public/requests/${confirmationNo}`).then((r) => r.data),

  // Internal — auth required
  getQueue: (filters = {}) =>
    axios.get('/api/internal/requests', { params: filters }).then((r) => r.data),

  getRequest: (id) =>
    axios.get(`/api/internal/requests/${id}`).then((r) => r.data),

  updateStatus: (id, status, note) =>
    axios.put(`/api/internal/requests/${id}/status`, { status, note }).then((r) => r.data),

  addNote: (id, note) =>
    axios.post(`/api/internal/requests/${id}/notes`, { note }).then((r) => r.data),

  assign: (id, staffEmail) =>
    axios.put(`/api/internal/requests/${id}/assign`, { staffEmail }).then((r) => r.data),

  getStats: () =>
    axios.get('/api/internal/stats').then((r) => r.data),

  // Admin
  getReports: () =>
    axios.get('/api/internal/admin/reports').then((r) => r.data),

  getExemptions: () =>
    axios.get('/api/internal/admin/exemptions').then((r) => r.data),

  upsertExemption: (data) =>
    axios.post('/api/internal/admin/exemptions', data).then((r) => r.data),

  // AquaDocs Intelligence Layer — document search and AI chat
  // These proxy through the AquaRecords server to the AquaDocs API.
  // Use on the RequestDetailPage to find responsive documents and draft responses.
  searchDocuments: (query, filters = {}, top = 10) =>
    axios
      .post('/api/internal/intelligence/search', { query, filters, top })
      .then((r) => r.data),

  chatWithDocuments: (messages) =>
    axios
      .post('/api/internal/intelligence/chat', { messages })
      .then((r) => r.data),

  getIntelligenceHealth: () =>
    axios.get('/api/internal/intelligence/health').then((r) => r.data),
};
