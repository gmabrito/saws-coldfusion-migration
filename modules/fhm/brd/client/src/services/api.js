import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finance_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('finance_token');
      localStorage.removeItem('finance_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const contractService = {
  getAll: (params) => api.get('/contracts', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  apply: (data) => api.post('/contracts', data),
  review: (id, data) => api.put(`/contracts/${id}/review`, data),
};

export const readingService = {
  getAll: (params) => api.get('/readings', { params }),
  submit: (data) => api.post('/readings', data),
  getReport: (params) => api.get('/readings/report', { params }),
};

export default api;
