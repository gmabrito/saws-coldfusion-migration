import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};

// Transmittal service
export const transmittalService = {
  list: (params = {}) =>
    api.get('/transmittals', { params }),

  getById: (id) =>
    api.get(`/transmittals/${id}`),

  create: (data) =>
    api.post('/transmittals', data),

  update: (id, data) =>
    api.put(`/transmittals/${id}`, data),

  delete: (id) =>
    api.delete(`/transmittals/${id}`),

  search: (keyword) =>
    api.get('/transmittals/search', { params: { keyword } }),
};

// Retention codes service
export const retentionCodeService = {
  list: () =>
    api.get('/retention-codes'),
};

export default api;
