const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authJwt } = require('../middleware');

// All report routes require authentication
router.use(authJwt.verifyToken);

// Dashboard summary
router.get('/dashboard-summary', reportsController.getDashboardSummary);

// Sessions by trainer and module
router.get('/sessions-by-trainer-module', reportsController.getSessionsByTrainerModule);

// Trainer sessions by location
router.get('/trainer-sessions-by-location', reportsController.getTrainerSessionsByLocation);

// Reassigned/cancelled sessions
router.get('/reassigned-cancelled-sessions', reportsController.getReassignedCancelledSessions);

// Mock interview sessions
router.get('/mock-interview-sessions', reportsController.getMockInterviewSessions);

// Missed lessons
router.get('/missed-lessons', reportsController.getMissedLessons);

// Session timing adherence
router.get('/session-timing-adherence', reportsController.getSessionTimingAdherence);

// Batch duration report
router.get('/batch-duration', reportsController.getBatchDurationReport);

module.exports = router;
