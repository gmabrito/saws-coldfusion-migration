import axios from 'axios';

export const searchService = {
  publicSearch: (query, top = 10) =>
    axios.post('/api/public/search', { query, top }).then((r) => r.data),

  internalSearch: (query, filters = {}, top = 20) =>
    axios.post('/api/internal/search', { query, filters, top }).then((r) => r.data),

  chat: (messages) =>
    axios.post('/api/internal/chat', { messages }).then((r) => r.data),
};
