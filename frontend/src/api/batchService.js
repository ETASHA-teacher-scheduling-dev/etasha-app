import api from './api';

const API_URL = '/batches/';

const batchService = {
  // --- THIS IS THE FIX ---
  // The function must be named 'getAllBatches' to match what the component is calling.
  getAllBatches: () => api.get(API_URL),

  // We will need these later, so let's define them now.
  createBatch: (data) => api.post(API_URL, data),
  updateBatch: (id, data) => api.put(API_URL + id, data),
  deleteBatch: (id) => api.delete(API_URL + id),
};

export default batchService;