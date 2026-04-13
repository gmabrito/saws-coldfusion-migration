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

// On-call service
// BRD 7.1: On-Call Directory with contact info by department
export const oncallService = {
  // Get current on-call staff (public, no auth needed)
  getCurrent: (departmentId = null) => {
    const params = {};
    if (departmentId) params.departmentId = departmentId;
    return api.get('/oncall', { params });
  },

  // Get schedule for date range (auth required)
  getSchedule: (params = {}) =>
    api.get('/oncall/schedule', { params }),

  // Create new assignment (auth required)
  create: (data) =>
    api.post('/oncall', data),

  // Update assignment (auth required)
  update: (id, data) =>
    api.put(`/oncall/${id}`, data),

  // Delete assignment (auth required)
  delete: (id) =>
    api.delete(`/oncall/${id}`),
};

// Department service
export const departmentService = {
  list: () =>
    api.get('/departments'),
};

// Employee service
export const employeeService = {
  list: (departmentId = null) => {
    const params = {};
    if (departmentId) params.departmentId = departmentId;
    return api.get('/employees', { params });
  },
};

export default api;
