import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const stored = sessionStorage.getItem('frs_auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* ignore */ }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('frs_auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ===== Account Service =====
export const accountService = {
  getAll: (params) => api.get('/accounts', { params }),
  getById: (accountNum) => api.get(`/accounts/${accountNum}`),
  create: (data) => api.post('/accounts', data),
  update: (accountNum, data) => api.put(`/accounts/${accountNum}`, data),
  search: (query) => api.get('/accounts/search', { params: { q: query } }),
};

// ===== Meter Service =====
export const meterService = {
  getByAccount: (accountNum) => api.get(`/accounts/${accountNum}/meters`),
  add: (accountNum, data) => api.post(`/accounts/${accountNum}/meters`, data),
  deactivate: (accountNum, meterId) =>
    api.patch(`/accounts/${accountNum}/meters/${meterId}/deactivate`),
};

// ===== Reading Service =====
export const readingService = {
  getAll: (params) => api.get('/readings', { params }),
  submit: (data) => api.post('/readings', data),
  edit: (id, data) => api.put(`/readings/${id}`, data),
  recalculate: (id) => api.post(`/readings/${id}/recalculate`),
};

// ===== Assessment Service =====
export const assessmentService = {
  getAll: (params) => api.get('/assessments', { params }),
  getById: (id) => api.get(`/assessments/${id}`),
  create: (data) => api.post('/assessments', data),
  review: (id, data) => api.put(`/assessments/${id}/review`, data),
  override: (id, data) => api.put(`/assessments/${id}/override`, data),
};

// ===== Rate Service =====
export const rateService = {
  getCurrent: () => api.get('/rates/current'),
  getByDate: (date) => api.get('/rates', { params: { effectiveDate: date } }),
  setRate: (data) => api.post('/rates', data),
};

// ===== Report Service =====
export const reportService = {
  getAssessmentReport: (accountNum) => api.get(`/reports/assessment/${accountNum}`),
  getEvents: (params) => api.get('/reports/events', { params }),
  getDashboard: () => api.get('/reports/dashboard'),
};

// ===== Auth Service =====
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export default api;
