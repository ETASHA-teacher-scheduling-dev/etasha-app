import api from './api'; 
const API_URL = '/modules/'; 
const moduleService = {
  // Use 'api' for all calls, not 'axios'
  getAllModules: () => api.get(API_URL),
  createModule: (data) => api.post(API_URL, data),
  updateModule: (id, data) => api.put(API_URL + id, data),
  deleteModule: (id) => api.delete(API_URL + id),
};

export default moduleService;