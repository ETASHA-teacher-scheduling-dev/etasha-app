const { authJwt } = require("../middleware");
const express = require("express");

module.exports = function(app) {
  const trainerController = require("../controllers/trainerController");
  const moduleController = require("../controllers/moduleController");
  const centerController = require("../controllers/centerController");
  const programController = require("../controllers/programController");
  const sessionController = require("../controllers/sessionController");
  const schedulerController = require("../controllers/schedulerController");
  const batchController = require("../controllers/batchController");
  const batchScheduleController = require("../controllers/batchScheduleController");



  const apiRouter = express.Router();
  
  // All routes in this file will require a valid token to proceed
  apiRouter.use(authJwt.verifyToken);

  // --- TRAINER ROUTES ---
  // Anyone logged in can see the list of trainers
  apiRouter.get('/trainers', trainerController.findAll);
  // Only a scheduler can create, update, or delete trainers
  apiRouter.post('/trainers', [authJwt.isScheduler, trainerController.create]);
  apiRouter.put('/trainers/:id', [authJwt.isScheduler, trainerController.update]);
  apiRouter.delete('/trainers/:id', [authJwt.isScheduler, trainerController.delete]);

  // --- MODULE ROUTES ---
  apiRouter.get('/modules', moduleController.findAll);
  apiRouter.post('/modules', [authJwt.isScheduler, moduleController.create]);
  apiRouter.put('/modules/:id', [authJwt.isScheduler, moduleController.update]);
  apiRouter.delete('/modules/:id', [authJwt.isScheduler, moduleController.delete]);

  // --- CENTER ROUTES ---
  apiRouter.get('/centers', centerController.findAll);
  apiRouter.post('/centers', [authJwt.isScheduler, centerController.create]);
  apiRouter.put('/centers/:id', [authJwt.isScheduler, centerController.update]);
  apiRouter.delete('/centers/:id', [authJwt.isScheduler, centerController.delete]);
    
  // --- BATCH ROUTES ---
  apiRouter.route('/programs')
  .get(programController.findAll)
  .post([authJwt.isScheduler, programController.create]);

  apiRouter.route('/programs/:id')
  .put([authJwt.isScheduler, programController.update])
  .delete([authJwt.isScheduler, programController.delete]);

  apiRouter.route('/batches')
  .get(batchController.findAll)
  .post([authJwt.isScheduler, batchController.create]);

apiRouter.route('/batches/:id')
  .put([authJwt.isScheduler, batchController.update])
  .delete([authJwt.isScheduler, batchController.delete]);

  // --- SESSION ROUTES ---
  apiRouter.get('/sessions', sessionController.findAll);
  apiRouter.post('/sessions', [authJwt.isScheduler, sessionController.create]);
  apiRouter.route('/sessions/:id')
  .put([authJwt.isScheduler, sessionController.update])
  .delete([authJwt.isScheduler, sessionController.delete]);

  // --- BATCH SCHEDULE ROUTES ---
  apiRouter.get('/batch-schedules/test', (req, res) => {
    res.json({ message: 'Batch schedule routes are working!' });
  });
  apiRouter.get('/batch-schedules/batches', batchScheduleController.getAllBatches);
  apiRouter.get('/batch-schedules/:batchId', batchScheduleController.getBatchSchedule);
  apiRouter.get('/batch-schedules/:batchId/monthly/:year/:month', batchScheduleController.getMonthlyView);
  apiRouter.post('/batch-schedules/bulk-upload', [authJwt.isScheduler, batchScheduleController.bulkUploadSchedule]);
  apiRouter.post('/batch-schedules/parse-csv', [authJwt.isScheduler, batchScheduleController.parseCsvSchedule]);
  apiRouter.put('/batch-schedules/entry/:id', [authJwt.isScheduler, batchScheduleController.updateScheduleEntry]);

  app.use('/api', apiRouter);

  apiRouter.post('/scheduler/generate-draft', [authJwt.isScheduler, schedulerController.generateDraft]);
  apiRouter.post('/scheduler/publish-week', [authJwt.isScheduler, schedulerController.publishWeek]);
};