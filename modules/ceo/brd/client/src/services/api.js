import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Auth interceptor: attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ceo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ceo_token');
      localStorage.removeItem('ceo_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }).then(r => r.data)
};

// Agenda service - BRD 7.1 & 7.2
export const agendaService = {
  list: (params = {}) =>
    api.get('/agendas', { params }).then(r => r.data),

  getById: (id) =>
    api.get(`/agendas/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/agendas', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/agendas/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/agendas/${id}`).then(r => r.data),

  addDocument: (agendaId, docData) =>
    api.post(`/agendas/${agendaId}/documents`, docData).then(r => r.data)
};

// Subscriber service - BRD 7.2
export const subscriberService = {
  list: () =>
    api.get('/subscribers').then(r => r.data),

  subscribe: (data) =>
    api.post('/subscribers', data).then(r => r.data),

  unsubscribe: (id) =>
    api.delete(`/subscribers/${id}`).then(r => r.data)
};

export default api;
