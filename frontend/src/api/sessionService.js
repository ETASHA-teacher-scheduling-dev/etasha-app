import api from './api'; 
const API_URL = '/sessions/'; 
const sessionService = {
  getAllSessions: () => api.get(API_URL),
  createSession: (data) => api.post(API_URL, data),
  updateSession: (id, data) => api.put(API_URL + id, data),
  deleteSession: (id) => api.delete(API_URL + id),
};

export default sessionService;