import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('utilitymaps_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('utilitymaps_token');
      localStorage.removeItem('utilitymaps_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const mapService = {
  getAll: (params) => api.get('/maps', { params }),
  getById: (id) => api.get(`/maps/${id}`),
  create: (data) => api.post('/maps', data),
  update: (id, data) => api.put(`/maps/${id}`, data),
  remove: (id) => api.delete(`/maps/${id}`),
  getCategories: () => api.get('/maps/categories'),
};

export default api;
