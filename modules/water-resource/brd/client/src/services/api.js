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

// Stats service - BRD 7.1: Aquifer & Water Stats
export const statsService = {
  // Get 30-day aquifer stats summary
  getSummary: () =>
    api.get('/stats'),

  // Get daily readings with date range filter
  getDailyReadings: (startDate, endDate) =>
    api.get('/stats/daily', { params: { startDate, endDate } }),

  // Get water levels by county
  getCountyLevels: () =>
    api.get('/stats/counties'),

  // Add daily reading (manual data entry)
  addDailyReading: (data) =>
    api.post('/stats/daily', data),

  // Update daily reading
  updateDailyReading: (id, data) =>
    api.put(`/stats/daily/${id}`, data),
};

export default api;
