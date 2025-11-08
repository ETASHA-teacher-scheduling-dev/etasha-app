import api from './api';

const API_URL = '/trainers/'; // CORRECT: Use a relative URL

const trainerService = {
  // Use 'api' for all calls, not 'axios'
  getAllTrainers: (params) => api.get(API_URL, { params }),
  getTrainerById: (id) => api.get(API_URL + id),
  createTrainer: (trainerData) => api.post(API_URL, trainerData),
  updateTrainer: (id, trainerData) => api.put(API_URL + id, trainerData),
  deleteTrainer: (id) => api.delete(API_URL + id),
};

export default trainerService;