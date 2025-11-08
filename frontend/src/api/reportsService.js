import api from './api';

const API_URL = '/reports/';

class ReportsService {
  getDashboardSummary(month, year, batchId = null) {
    const params = { month, year };
    if (batchId) params.batchId = batchId;
    return api.get(API_URL + 'dashboard-summary', { params });
  }

  getSessionsByTrainerModule(month, year, batchId = null) {
    const params = { month, year };
    if (batchId) params.batchId = batchId;
    return api.get(API_URL + 'sessions-by-trainer-module', { params });
  }

  getTrainerSessionsByLocation(month, year, batchId = null) {
    const params = { month, year };
    if (batchId) params.batchId = batchId;
    return api.get(API_URL + 'trainer-sessions-by-location', { params });
  }

  getReassignedCancelledSessions(month, year, batchId = null) {
    const params = { month, year };
    if (batchId) params.batchId = batchId;
    return api.get(API_URL + 'reassigned-cancelled-sessions', { params });
  }

  getMockInterviewSessions(month, year, batchId = null) {
    const params = { month, year };
    if (batchId) params.batchId = batchId;
    return api.get(API_URL + 'mock-interview-sessions', { params });
  }

  getMissedLessons(month, year, batchId = null) {
    const params = { month, year };
    if (batchId) params.batchId = batchId;
    return api.get(API_URL + 'missed-lessons', { params });
  }

  getSessionTimingAdherence(month, year, batchId = null) {
    const params = { month, year };
    if (batchId) params.batchId = batchId;
    return api.get(API_URL + 'session-timing-adherence', { params });
  }

  getBatchDurationReport(batchId = null) {
    const params = {};
    if (batchId) params.batchId = batchId;
    return api.get(API_URL + 'batch-duration', { params });
  }
}

const reportsService = new ReportsService();
export default reportsService;
