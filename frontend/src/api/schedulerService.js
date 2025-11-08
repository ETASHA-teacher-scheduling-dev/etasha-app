import api from './api';

const API_URL = '/scheduler/';

const schedulerService = {
  // Corresponds to POST /api/scheduler/generate-draft
  generateDraft: () => {
    return api.post(API_URL + 'generate-draft');
  },
  
  // Corresponds to POST /api/scheduler/publish-week
  publishWeek: () => {
    return api.post(API_URL + 'publish-week');
  },
};

export default schedulerService;