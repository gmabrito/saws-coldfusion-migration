import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hr_token');
      localStorage.removeItem('hr_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const jobService = {
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  remove: (id) => api.delete(`/jobs/${id}`),
  generateEmail: () => api.post('/jobs/generate-email'),
};

export const employeeService = {
  getInactive: (params) => api.get('/employees/inactive', { params }),
  getInactiveById: (id) => api.get(`/employees/inactive/${id}`),
  getDepartments: () => api.get('/employees/departments'),
};

export default api;
