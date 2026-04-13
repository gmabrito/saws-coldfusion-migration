import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Auth service
// ---------------------------------------------------------------------------
export const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  }
};

// ---------------------------------------------------------------------------
// Vendor service
// ---------------------------------------------------------------------------
export const vendorService = {
  search: async (params = {}) => {
    const res = await api.get('/vendors', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/vendors/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/vendors', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/vendors/${id}`, data);
    return res.data;
  },

  remove: async (id) => {
    const res = await api.delete(`/vendors/${id}`);
    return res.data;
  },

  resetPassword: async (id) => {
    const res = await api.post(`/vendors/${id}/reset-password`);
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get('/vendors/categories');
    return res.data;
  },

  exportCsv: async (params = {}) => {
    const res = await api.get('/vendors/export', {
      params,
      responseType: 'blob'
    });
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vendors_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default api;
