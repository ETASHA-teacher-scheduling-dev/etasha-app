import api from './api';

const API_URL = '/programs/';

const programService = {
  // Corresponds to GET /api/programs
  getAllPrograms: (params) => api.get(API_URL, { params }),

  // Corresponds to POST /api/programs
  createProgram: (data) => api.post(API_URL, data),

  // Corresponds to PUT /api/programs/:id
  updateProgram: (id, data) => api.put(API_URL + id, data),

  // Corresponds to DELETE /api/programs/:id
  deleteProgram: (id) => api.delete(API_URL + id),
};

export default programService;