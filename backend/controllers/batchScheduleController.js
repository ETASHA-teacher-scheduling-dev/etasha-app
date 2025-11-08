const db = require('../models');
const BatchSchedule = db.batchSchedule;
const Batch = db.batch;
const Trainer = db.trainer;

// Get schedule for a specific batch
exports.getBatchSchedule = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const schedule = await BatchSchedule.findAll({
      where: { batchId },
      include: [
        {
          model: Batch,
          attributes: ['id', 'batch_name', 'start_date', 'end_date']
        },
        {
          model: Trainer,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['week_number', 'ASC'], ['day_number', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching batch schedule',
      error: error.message
    });
  }
};

// Get all batches for dropdown
exports.getAllBatches = async (req, res) => {
  try {
    console.log('--- getAllBatches called ---');
    const batches = await Batch.findAll({
      attributes: ['id', 'batch_name', 'start_date', 'end_date', 'status'],
      include: [
        {
          model: db.center,
          attributes: ['name', 'address']
        },
        {
          model: db.program,
          attributes: ['program_name', 'duration_months']
        }
      ],
      order: [['start_date', 'DESC']]
    });

    console.log(`--- Found ${batches.length} batches ---`);
    res.status(200).json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('--- Error in getAllBatches:', error.message, '---');
    res.status(500).json({
      success: false,
      message: 'Error fetching batches',
      error: error.message
    });
  }
};

// Bulk upload schedule for a batch
exports.bulkUploadSchedule = async (req, res) => {
  try {
    const { batchId, scheduleData } = req.body;
    
    // Validate batch exists
    const batch = await Batch.findByPk(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Clear existing schedule for this batch
    await BatchSchedule.destroy({ where: { batchId } });

    // Process schedule data
    const scheduleEntries = [];
    
    scheduleData.forEach((weekData) => {
      const weekNumber = weekData.week;
      
      // Process each day's sessions (can be multiple sessions per day)
      weekData.days.forEach((dayContent) => {
        if (dayContent && dayContent.content && dayContent.content.trim()) {
          scheduleEntries.push({
            batchId: parseInt(batchId),
            week_number: weekNumber,
            day_number: dayContent.day,
            session_content: dayContent.content.trim(),
            session_date: dayContent.date || null,
            trainerId: dayContent.trainerId || null,
            status: 'scheduled'
          });
        }
      });
    });

    // Bulk create schedule entries
    const createdSchedule = await BatchSchedule.bulkCreate(scheduleEntries);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${createdSchedule.length} schedule entries`,
      data: createdSchedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading batch schedule',
      error: error.message
    });
  }
};

// Update individual schedule entry
exports.updateScheduleEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const scheduleEntry = await BatchSchedule.findByPk(id);
    if (!scheduleEntry) {
      return res.status(404).json({
        success: false,
        message: 'Schedule entry not found'
      });
    }

    await scheduleEntry.update(updateData);

    const updatedEntry = await BatchSchedule.findByPk(id, {
      include: [
        {
          model: Batch,
          attributes: ['id', 'batch_name']
        },
        {
          model: Trainer,
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Schedule entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating schedule entry',
      error: error.message
    });
  }
};

// Get monthly view for a batch
exports.getMonthlyView = async (req, res) => {
  try {
    const { batchId, year, month } = req.params;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const schedule = await BatchSchedule.findAll({
      where: {
        batchId,
        session_date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Batch,
          attributes: ['id', 'batch_name']
        },
        {
          model: Trainer,
          attributes: ['id', 'name']
        }
      ],
      order: [['session_date', 'ASC'], ['day_number', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly schedule',
      error: error.message
    });
  }
};

// Parse CSV data and convert to schedule format
exports.parseCsvSchedule = async (req, res) => {
  try {
    const { csvData, batchId } = req.body;
    
    console.log('=== parseCsvSchedule called ===');
    console.log('csvData type:', typeof csvData);
    console.log('csvData:', csvData);
    console.log('batchId:', batchId);
    
    // Handle string CSV data by parsing it first
    let parsedData;
    if (typeof csvData === 'string') {
      // Split by lines and then by commas
      const lines = csvData.trim().split('\n');
      parsedData = lines.map(line => line.split(',').map(cell => cell.trim()));
    } else if (Array.isArray(csvData)) {
      parsedData = csvData;
    } else {
      throw new Error('Invalid CSV data format');
    }
    
    console.log('Parsed data:', parsedData);
    
    // Parse CSV data into structured format
    const scheduleData = [];
    
    // First row is headers
    const headers = parsedData[0];
    const dataRows = parsedData.slice(1);
    
    console.log('Headers:', headers);
    console.log('Data rows:', dataRows);
    
    // Extract week columns (skip first column which is day labels)
    const weekColumns = headers.slice(1);
    
    weekColumns.forEach((weekHeader, weekIndex) => {
      const weekData = { week: weekIndex + 1, days: [] };
      
      dataRows.forEach((row, dayIndex) => {
        const content = row[weekIndex + 1]; // +1 to skip day label column
        if (content && content.trim()) {
          weekData.days.push({
            day: dayIndex + 1,
            content: content.trim()
          });
        }
      });
      
      if (weekData.days.length > 0) {
        scheduleData.push(weekData);
      }
    });

    console.log('Final schedule data:', scheduleData);

    res.status(200).json({
      success: true,
      data: scheduleData
    });
  } catch (error) {
    console.error('Error in parseCsvSchedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error parsing CSV schedule',
      error: error.message
    });
  }
};
