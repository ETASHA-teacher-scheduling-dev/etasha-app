const db = require("../models");
const { Op } = require("sequelize");
const Session = db.session;
const Trainer = db.trainer;
const Batch = db.batch;
const Center = db.center;
const Module = db.module;
const Program = db.program;

// Get sessions covered by trainer (module-wise)
exports.getSessionsByTrainerModule = async (req, res) => {
  try {
    const { month, year, batchId } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const whereClause = {
      session_date: {
        [Op.between]: [startDate, endDate]
      },
      status: ['Draft', 'Published', 'Completed']
    };

    // Add batch filter if provided
    if (batchId) {
      whereClause.batchId = batchId;
    }

    const sessions = await Session.findAll({
      where: whereClause,
      include: [
        {
          model: Trainer,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Module,
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    const reportData = {};
    sessions.forEach(session => {
      const trainerId = session.trainer?.id || 'unknown';
      const trainerName = session.trainer?.name || 'Unknown Trainer';
      const moduleId = session.module?.id || 'unknown';
      const moduleName = session.module?.name || 'Unknown Module';

      if (!reportData[trainerId]) {
        reportData[trainerId] = {
          trainerName,
          modules: {}
        };
      }

      if (!reportData[trainerId].modules[moduleId]) {
        reportData[trainerId].modules[moduleId] = {
          moduleName,
          sessionCount: 0
        };
      }

      reportData[trainerId].modules[moduleId].sessionCount++;
    });

    res.json(reportData);
  } catch (error) {
    console.error('Sessions by trainer module error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get trainer sessions by location
exports.getTrainerSessionsByLocation = async (req, res) => {
  try {
    const { month, year, batchId } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const whereClause = {
      session_date: {
        [Op.between]: [startDate, endDate]
      },
      status: ['Draft', 'Published', 'Completed']
    };

    if (batchId) {
      whereClause.batchId = batchId;
    }

    const sessions = await Session.findAll({
      where: whereClause,
      include: [
        {
          model: Trainer,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Batch,
          required: false,
          include: [{
            model: Center,
            attributes: ['id', 'name'],
            required: false
          }]
        }
      ]
    });

    const reportData = {};
    sessions.forEach(session => {
      const trainerId = session.trainer?.id || 'unknown';
      const trainerName = session.trainer?.name || 'Unknown Trainer';
      const centerId = session.batch?.center?.id || 'unknown';
      const centerName = session.batch?.center?.name || 'Unknown Center';
      const location = session.batch?.center?.name || 'Unknown Location';

      if (!reportData[trainerId]) {
        reportData[trainerId] = {
          trainerName,
          locations: {}
        };
      }

      if (!reportData[trainerId].locations[centerId]) {
        reportData[trainerId].locations[centerId] = {
          centerName,
          location,
          sessionCount: 0
        };
      }

      reportData[trainerId].locations[centerId].sessionCount++;
    });

    res.json(reportData);
  } catch (error) {
    console.error('Trainer sessions by location error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get reassigned or cancelled sessions report
exports.getReassignedCancelledSessions = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const cancelledSessions = await Session.findAll({
      where: {
        session_date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'Cancelled'
      },
      include: [
        {
          model: Trainer,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Batch,
          attributes: ['id', 'batch_name'],
          required: false
        }
      ]
    });

    const reportData = {
      totalCancelled: cancelledSessions.length,
      sessions: cancelledSessions.map(session => ({
        id: session.id,
        date: session.session_date,
        trainer: session.trainer?.name || 'Unknown',
        batch: session.batch?.batch_name || 'Unknown',
        notes: session.notes
      }))
    };

    res.json(reportData);
  } catch (error) {
    console.error('Cancelled sessions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get mock interview sessions per batch
exports.getMockInterviewSessions = async (req, res) => {
  try {
    const { month, year, batchId } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const whereClause = {
      session_date: {
        [Op.between]: [startDate, endDate]
      },
      status: ['Draft', 'Published', 'Completed'],
      [Op.or]: [
        { title: { [Op.iLike]: '%mock%' } },
        { title: { [Op.iLike]: '%interview%' } }
      ]
    };

    if (batchId) {
      whereClause.batchId = batchId;
    }

    const sessions = await Session.findAll({
      where: whereClause,
      include: [
        {
          model: Batch,
          attributes: ['id', 'batch_name'],
          required: false
        },
        {
          model: Module,
          attributes: ['name'],
          required: false
        }
      ]
    });

    const reportData = {};
    sessions.forEach(session => {
      const batchId = session.batch?.id || 'unknown';
      const batchName = session.batch?.batch_name || 'Unknown Batch';

      if (!reportData[batchId]) {
        reportData[batchId] = {
          batchName,
          mockInterviewCount: 0
        };
      }

      reportData[batchId].mockInterviewCount++;
    });

    res.json(reportData);
  } catch (error) {
    console.error('Mock interview sessions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get missed lessons report
exports.getMissedLessons = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const missedSessions = await Session.findAll({
      where: {
        session_date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'Missed'
      },
      include: [
        {
          model: Trainer,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Batch,
          attributes: ['id', 'batch_name'],
          required: false
        },
        {
          model: Module,
          attributes: ['name'],
          required: false
        }
      ]
    });

    const reportData = {
      totalMissed: missedSessions.length,
      sessions: missedSessions.map(session => ({
        id: session.id,
        date: session.session_date,
        trainer: session.trainer?.name || 'Unknown',
        batch: session.batch?.batch_name || 'Unknown',
        module: session.module?.name || 'Unknown',
        notes: session.notes
      }))
    };

    res.json(reportData);
  } catch (error) {
    console.error('Missed lessons error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get session timing adherence
exports.getSessionTimingAdherence = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const sessions = await Session.findAll({
      where: {
        session_date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'Completed'
      },
      include: [
        {
          model: Batch,
          attributes: ['id', 'batch_name'],
          required: false
        }
      ]
    });

    // This would need additional fields in the session model to track actual vs scheduled times
    // For now, we'll return basic session completion data
    const reportData = {
      totalSessions: sessions.length,
      completedOnTime: sessions.length, // Placeholder - would need actual timing data
      sessions: sessions.map(session => ({
        id: session.id,
        date: session.session_date,
        batch: session.batch?.batch_name || 'Unknown',
        status: session.status,
        notes: session.notes
      }))
    };

    res.json(reportData);
  } catch (error) {
    console.error('Session timing adherence error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get batch duration report
exports.getBatchDurationReport = async (req, res) => {
  try {
    const batches = await Batch.findAll({
      include: [
        {
          model: Session,
          attributes: ['session_date', 'status'],
          required: false
        },
        {
          model: Program,
          attributes: ['program_name'],
          required: false
        },
      ]
    });

    const reportData = batches.map(batch => {
      const sessions = batch.sessions || [];
      const completedSessions = sessions.filter(s => s.status === 'Completed');
      const startDate = sessions.length > 0 ? Math.min(...sessions.map(s => new Date(s.session_date))) : null;
      const endDate = sessions.length > 0 ? Math.max(...sessions.map(s => new Date(s.session_date))) : null;
      const duration = startDate && endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 0;

      return {
        batchId: batch.id,
        batchName: batch.batch_name,
        program: batch.program?.name || 'Unknown',
        module: batch.module?.name || 'Unknown',
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
        durationDays: duration
      };
    });

    res.json(reportData);
  } catch (error) {
    console.error('Batch duration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get dashboard summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const { month, year, batchId } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    console.log('=== DASHBOARD SUMMARY DEBUG ===');
    console.log('Query params:', { month, year, batchId });
    console.log('Date range:', { startDate, endDate });
    
    // Debug: Show all available batches
    const allBatches = await Batch.findAll({
      attributes: ['id', 'batch_name']
    });
    console.log('Available batches:');
    allBatches.forEach(batch => {
      console.log(`Batch ID: ${batch.id}, Name: ${batch.batch_name}`);
    });

    const baseWhere = {
      session_date: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Add batch filter if provided
    if (batchId) {
      baseWhere.batchId = batchId;
      console.log('Filtering by batchId:', batchId);
    }

    console.log('Final where clause:', baseWhere);

    // First, let's see what sessions exist
    const allSessions = await Session.findAll({
      where: baseWhere,
      attributes: ['id', 'session_date', 'status', 'batchId', 'title'],
      include: [{
        model: Batch,
        attributes: ['id', 'batch_name']
      }]
    });
    
    console.log('Found sessions:', allSessions.length);
    allSessions.forEach(session => {
      console.log(`Session: ${session.id}, Date: ${session.session_date}, Status: ${session.status}, BatchId: ${session.batchId}, Batch: ${session.batch?.batch_name}, Title: ${session.title}`);
    });

    const [totalSessions, completedSessions, missedSessions, cancelledSessions, draftSessions] = await Promise.all([
      Session.count({
        where: baseWhere
      }),
      Session.count({
        where: {
          ...baseWhere,
          status: 'Completed'
        }
      }),
      Session.count({
        where: {
          ...baseWhere,
          status: 'Missed'
        }
      }),
      Session.count({
        where: {
          ...baseWhere,
          status: 'Cancelled'
        }
      }),
      Session.count({
        where: {
          ...baseWhere,
          status: 'Draft'
        }
      })
    ]);

    res.json({
      totalSessions: totalSessions || 0,
      completedSessions: completedSessions || 0,
      missedSessions: missedSessions || 0,
      cancelledSessions: cancelledSessions || 0,
      draftSessions: draftSessions || 0,
      completionRate: totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : '0'
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: error.message });
  }
};
