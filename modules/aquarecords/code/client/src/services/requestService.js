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
};
