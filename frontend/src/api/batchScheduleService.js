import api from './api';
import Papa from 'papaparse';

const batchScheduleService = {
  // Get all batches for dropdown
  getAllBatches: () => {
    return api.get('/batch-schedules/batches');
  },

  // Get schedule for a specific batch
  getBatchSchedule: (batchId) => {
    return api.get(`/batch-schedules/${batchId}`);
  },

  // Get monthly view for a batch
  getMonthlyView: (batchId, year, month) => {
    return api.get(`/batch-schedules/${batchId}/monthly/${year}/${month}`);
  },

  // Bulk upload schedule for a batch
  bulkUploadSchedule: (batchId, scheduleData) => {
    return api.post('/batch-schedules/bulk-upload', {
      batchId,
      scheduleData
    });
  },

  // Parse CSV data
  parseCsvSchedule: (csvData, batchId) => {
    return api.post('/batch-schedules/parse-csv', {
      csvData,
      batchId
    });
  },

  // Update individual schedule entry
  updateScheduleEntry: (entryId, updateData) => {
    return api.put(`/batch-schedules/entry/${entryId}`, updateData);
  },

  // Helper function to convert CSV text to array format using PapaParse
  parseCsvText: (csvText) => {
    console.log('=== PAPAPARSE INPUT ===');
    console.log('Raw CSV text:', JSON.stringify(csvText));
    
    const result = Papa.parse(csvText, {
      skipEmptyLines: true,
      trimHeaders: false, // Don't trim headers to preserve multi-line content
      transform: (value) => value // Don't trim values to preserve newlines
    });
    
    console.log('=== PAPAPARSE OUTPUT ===');
    console.log('Parsed result:', result);
    console.log('Parsed data:', result.data);
    
    if (result.errors.length > 0) {
      console.warn('CSV parsing errors:', result.errors);
    }
    
    return result.data;
  },

  // Convert batch schedule data to calendar events
  formatScheduleForCalendar: (scheduleData, batchStartDate) => {
    if (!Array.isArray(scheduleData)) return [];
    
    return scheduleData.map(entry => {
      const eventDate = entry.session_date || batchScheduleService.calculateSessionDate(
        batchStartDate, 
        entry.week_number, 
        entry.day_number
      );
      
      return {
        id: `schedule-${entry.id}`,
        title: entry.session_content || 'Session',
        start: eventDate,
        className: `event-${entry.status?.toLowerCase() || 'scheduled'}`,
        extendedProps: {
          ...entry,
          type: 'batch-schedule'
        }
      };
    });
  },

  // Calculate actual session date based on batch start date, week, and day
  calculateSessionDate: (batchStartDate, weekNumber, dayNumber) => {
    const startDate = new Date(batchStartDate);
    const daysToAdd = (weekNumber - 1) * 7 + (dayNumber - 1);
    const sessionDate = new Date(startDate);
    sessionDate.setDate(startDate.getDate() + daysToAdd);
    return sessionDate.toISOString().split('T')[0];
  },

  // Convert schedule data to table format for display (transposed: days as rows, weeks as columns)
  formatScheduleForTable: (scheduleData) => {
    if (!Array.isArray(scheduleData)) return {};
    
    console.log('=== FORMAT SCHEDULE FOR TABLE ===');
    console.log('Input schedule data:', scheduleData);
    console.log('Number of entries:', scheduleData.length);
    
    const tableData = {};
    
    // Initialize structure with days as keys
    for (let day = 1; day <= 6; day++) {
      tableData[`Day ${day}`] = {};
    }
    
    scheduleData.forEach((entry, index) => {
      const dayKey = `Day ${entry.day_number}`;
      const weekKey = `Week ${entry.week_number}`;
      
      console.log(`Entry ${index}: ${dayKey}, ${weekKey} - "${entry.session_content}"`);
      
      if (tableData[dayKey]) {
        // Initialize as array if not exists
        if (!tableData[dayKey][weekKey]) {
          tableData[dayKey][weekKey] = [];
        }
        
        // Add session to the array
        tableData[dayKey][weekKey].push({
          content: entry.session_content,
          date: entry.session_date,
          trainer: entry.trainer?.name,
          status: entry.status,
          id: entry.id
        });
        
        console.log(`Added to ${dayKey}[${weekKey}]. Array now has ${tableData[dayKey][weekKey].length} sessions`);
      }
    });
    
    console.log('Final table data structure:', tableData);
    return tableData;
  }
};

export default batchScheduleService;
