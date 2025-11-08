import api from './api'; // <-- CORRECT: Import our central API instance

const API_URL = '/centers/'; // CORRECT: Use a relative URL

const centerService = {
  // Use 'api' for all calls, not 'axios'
  getAllCenters: () => api.get(API_URL),
  createCenter: (data) => api.post(API_URL, data),
  updateCenter: (id, data) => api.put(API_URL + id, data),
  deleteCenter: (id) => api.delete(API_URL + id),
};

export default centerService;