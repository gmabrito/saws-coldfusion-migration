import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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

// --- Solicitation Service ---
export const solicitationService = {
  list: (params) => api.get('/solicitations', { params }),
  get: (id) => api.get(`/solicitations/${id}`),
  create: (data) => api.post('/solicitations', data),
  update: (id, data) => api.put(`/solicitations/${id}`, data),
  delete: (id) => api.delete(`/solicitations/${id}`),
  addDocument: (id, data) => api.post(`/solicitations/${id}/documents`, data),
  sendNotification: (id, data) => api.post(`/solicitations/${id}/notify`, data),
};

export default api;
