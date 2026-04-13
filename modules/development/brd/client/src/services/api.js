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

// --- BRD 7.1: CIAC Meeting Service ---
export const meetingService = {
  list: () => api.get('/meetings'),
  get: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  addDocument: (id, data) => api.post(`/meetings/${id}/documents`, data),
  updateMinutes: (id, minutes) => api.put(`/meetings/${id}/minutes`, { minutes }),
};

// --- BRD 7.2: Contractor/Plumber Registry Service ---
export const contractorService = {
  list: (params) => api.get('/contractors', { params }),
  get: (id) => api.get(`/contractors/${id}`),
  create: (data) => api.post('/contractors', data),
  update: (id, data) => api.put(`/contractors/${id}`, data),
  delete: (id) => api.delete(`/contractors/${id}`),
};

export default api;
