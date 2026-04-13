import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('printshop_final_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('printshop_final_token');
      localStorage.removeItem('printshop_final_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const jobService = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  approve: (id, data) => api.put(`/jobs/${id}/approve`, data),
  cancel: (id) => api.delete(`/jobs/${id}`),
  getDashboard: () => api.get('/jobs/dashboard'),
};

export default api;
