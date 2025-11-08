import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Papa from 'papaparse';
import './SchedulerPage.css';
import sessionService from '../api/sessionService';
import trainerService from '../api/trainerService';
import moduleService from '../api/moduleService';
import batchService from '../api/batchService';
import schedulerService from '../api/schedulerService';
import batchScheduleService from '../api/batchScheduleService';
import authService from '../api/authService';

// Helper function to format session data for FullCalendar
const formatEvents = (sessions) => {
  if (!Array.isArray(sessions)) return [];
  return sessions.map(session => ({
    id: session.id,
    title: `${session.batch?.program?.program_name || 'N/A'} - ${session.module?.name || 'N/A'}`,
    start: session.session_date,
    className: `event-${session.status?.toLowerCase() || 'draft'}`,
    extendedProps: { ...session }
  }));
};

const SchedulerPage = () => {
  // Component State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const initialFormState = { id: null, batchId: '', moduleId: '', trainerId: '', session_date: '', status: 'Draft' };
  const [formData, setFormData] = useState(initialFormState);
  
  // New state for batch-specific scheduling
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'batch-specific'
  const [batchScheduleData, setBatchScheduleData] = useState([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [parsedCsvForTable, setParsedCsvForTable] = useState(null);
  const [batchCsvData, setBatchCsvData] = useState({});
  const [showTableView, setShowTableView] = useState(false);
  
  // Permissions
  const currentUser = authService.getCurrentUser();
  const isScheduler = currentUser && currentUser.role === 'scheduler';

  // Load batch CSV data from localStorage on component mount
  useEffect(() => {
    const savedBatchData = localStorage.getItem('batchCsvData');
    if (savedBatchData) {
      try {
        const parsed = JSON.parse(savedBatchData);
        setBatchCsvData(parsed);
      } catch (error) {
        console.error('Error loading saved batch data:', error);
      }
    }
  }, []);

  // Save batch CSV data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(batchCsvData).length > 0) {
      localStorage.setItem('batchCsvData', JSON.stringify(batchCsvData));
    }
  }, [batchCsvData]);

  // Update table data when batch selection changes
  useEffect(() => {
    console.log('useEffect - selectedBatchId changed:', selectedBatchId);
    console.log('useEffect - batchCsvData:', batchCsvData);
    console.log('useEffect - data for this batch:', batchCsvData[selectedBatchId]);
    
    if (selectedBatchId && batchCsvData[selectedBatchId]) {
      console.log('Setting parsedCsvForTable with batch data');
      setParsedCsvForTable(batchCsvData[selectedBatchId]);
    } else {
      console.log('Clearing parsedCsvForTable - no data for this batch');
      setParsedCsvForTable(null);
    }
  }, [selectedBatchId, batchCsvData]);

  // --- DATA FETCHING ---
  const fetchAllData = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      sessionService.getAllSessions(),
      batchScheduleService.getAllBatches(),
      trainerService.getAllTrainers(),
    ]).then(([sessionsRes, batchesRes, trainersRes]) => {
      if (sessionsRes.status === 'fulfilled') setEvents(formatEvents(sessionsRes.value.data));
      if (batchesRes.status === 'fulfilled') setBatches(batchesRes.value.data.data || batchesRes.value.data);
      if (trainersRes.status === 'fulfilled') setTrainers(trainersRes.value.data);
    }).catch(err => console.error("A critical error occurred while fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchBatchSchedule = useCallback((batchId) => {
    setLoading(true);
    batchScheduleService.getBatchSchedule(batchId)
      .then(response => {
        console.log('=== FETCH BATCH SCHEDULE ===');
        console.log('Raw batch schedule data:', response.data.data);
        console.log('Number of schedule entries:', response.data.data.length);
        
        // Group by day to see multiple sessions per day
        const groupedByDay = {};
        response.data.data.forEach(entry => {
          const key = `Week ${entry.week_number}, Day ${entry.day_number}`;
          if (!groupedByDay[key]) groupedByDay[key] = [];
          groupedByDay[key].push(entry.session_content);
        });
        console.log('Sessions grouped by day:', groupedByDay);
        
        setBatchScheduleData(response.data.data);
        const selectedBatch = batches.find(b => b.id === parseInt(batchId));
        if (selectedBatch) {
          const scheduleEvents = batchScheduleService.formatScheduleForCalendar(
            response.data.data, 
            selectedBatch.start_date
          );
          console.log('Formatted schedule events:', scheduleEvents);
          setEvents(scheduleEvents);
        }
      })
      .catch(err => console.error("Error fetching batch schedule:", err))
      .finally(() => setLoading(false));
  }, [batches]);

  useEffect(() => {
    fetchAllData();
  }, []); // Empty dependency array - run only once on mount

  useEffect(() => {
    if (viewMode === 'batch-specific' && selectedBatchId) {
      fetchBatchSchedule(selectedBatchId);
    } else if (viewMode === 'all') {
      fetchAllData();
    }
  }, [viewMode, selectedBatchId]); // Remove fetchBatchSchedule and fetchAllData from dependencies

  // Separate useEffect for loading saved calendar events after batch schedule is loaded
  useEffect(() => {
    if (selectedBatchId && events.length >= 0) {
      // Load saved calendar events for this batch
      loadSavedCalendarEvents(selectedBatchId);
    }
  }, [selectedBatchId, batchScheduleData]); // Trigger when batch data changes

  // Load saved calendar events from localStorage
  const loadSavedCalendarEvents = (batchId) => {
    console.log('=== LOADING SAVED CALENDAR EVENTS ===');
    console.log('Batch ID:', batchId);
    
    const batchCalendarData = JSON.parse(localStorage.getItem('batchCalendarData') || '{}');
    console.log('All saved calendar data:', batchCalendarData);
    
    const savedData = batchCalendarData[batchId];
    console.log('Saved data for this batch:', savedData);
    
    if (savedData && savedData.events && savedData.events.length > 0) {
      console.log('Loading', savedData.events.length, 'saved calendar events for batch:', batchId);
      
      // Add a small delay to ensure other events are loaded first
      setTimeout(() => {
        setEvents(prevEvents => {
          console.log('Previous events before loading saved:', prevEvents);
          // Remove existing CSV events
          const filteredEvents = prevEvents.filter(event => 
            !event.extendedProps || event.extendedProps.type !== 'csv-schedule'
          );
          console.log('Filtered events:', filteredEvents);
          console.log('Adding saved events:', savedData.events);
          const newEvents = [...filteredEvents, ...savedData.events];
          console.log('Final events array:', newEvents);
          return newEvents;
        });
      }, 500);
    } else {
      console.log('No saved calendar events found for batch:', batchId);
    }
  };

  // --- BATCH SELECTION HANDLERS ---
  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    setSelectedBatchId(batchId);
    if (batchId) {
      setViewMode('batch-specific');
    } else {
      setViewMode('all');
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'all') {
      setSelectedBatchId('');
      fetchAllData();
    }
  };

  // --- BULK UPLOAD HANDLERS ---
  const handleBulkUpload = () => {
    if (!selectedBatchId) {
      alert('Please select a batch first');
      return;
    }
    setShowBulkUpload(true);
  };

  const handleCsvUpload = async () => {
    if (!csvData.trim() || !selectedBatchId) {
      alert('Please select a batch and enter CSV data');
      return;
    }

    try {
      setLoading(true);
      
      // Check if CSV data is valid before parsing
      if (!csvData || csvData.trim().length === 0) {
        alert('Please paste valid CSV data');
        return;
      }

      // Custom CSV parsing that handles multi-line cells like Gemini
      const processedData = parseExcelCsvWithContinuationRows(csvData.trim());
      
      console.log('CSV Upload - Raw CSV data:', csvData);
      console.log('CSV Upload - Processed data:', processedData);
      console.log('CSV Upload - Processed data length:', processedData?.length);
      
      // Log sample cell content to verify <br> tags
      if (processedData && processedData.length > 0) {
        console.log('Sample processed row:', processedData[0]);
        Object.keys(processedData[0]).forEach(key => {
          if (processedData[0][key] && processedData[0][key].includes('<br>')) {
            console.log(`Cell with <br> tags - ${key}:`, processedData[0][key]);
          }
        });
      }
      
      // Check if parsing was successful
      if (!processedData || processedData.length === 0) {
        alert('Failed to parse CSV data. Please check the format and try again.');
        console.error('CSV parsing failed - no data returned');
        return;
      }
      
      // Store CSV data for this specific batch
      setBatchCsvData(prev => ({
        ...prev,
        [selectedBatchId]: processedData
      }));
      
      // Update current table view
      setParsedCsvForTable(processedData);
      
      alert(`Schedule data loaded successfully for this batch! Switch to Table View to see your schedule.`);
      setCsvData('');
      setShowBulkUpload(false);
      
    } catch (error) {
      console.error('CSV parsing error:', error);
      alert('Failed to parse CSV data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SCHEDULER ENGINE HANDLERS ---
  const handleGenerateDraft = () => {
    if (window.confirm("✨ This will create new draft sessions based on the current week's published schedule. Are you sure?")) {
      setLoading(true);
      schedulerService.generateDraft()
        .then(response => {
          alert(`✅ ${response.data.message}`);
          fetchAllData();
        })
        .catch(err => alert(`❌ Error: ${err.response?.data?.message || 'Could not generate draft.'}`))
        .finally(() => setLoading(false));
    }
  };

  const handlePublishWeek = () => {
    if (window.confirm("🚀 This will publish all draft sessions for the upcoming week. This cannot be undone. Are you sure?")) {
      setLoading(true);
      schedulerService.publishWeek()
        .then(response => {
          alert(`✅ ${response.data.message}`);
          fetchAllData();
        })
        .catch(err => alert(`❌ Error: ${err.response?.data?.message || 'Could not publish schedule.'}`))
        .finally(() => setLoading(false));
    }
  };

  // --- CALENDAR INTERACTION HANDLERS ---
  const handleDateSelect = (selectInfo) => {
    if (!isScheduler) return;
    
    // Check if batch has CSV data uploaded
    const batchCsvData = JSON.parse(localStorage.getItem('batchCsvData') || '{}');
    const hasCsvData = selectedBatchId && batchCsvData[selectedBatchId];
    
    if (hasCsvData) {
      // New feature: Auto-populate calendar from CSV data
      handleAutoPopulateSchedule(selectInfo.startStr);
    } else {
      // Fallback: Show message that CSV data is required
      alert(' Please upload CSV schedule data in Table View first to auto-populate the calendar.');
    }
  };

  // --- SAVE SCHEDULE TO DATABASE ---
  const handleSaveScheduleToDatabase = async () => {
    if (!selectedBatchId) {
      alert(' Please select a batch first');
      return;
    }

    const batchCsvData = JSON.parse(localStorage.getItem('batchCsvData') || '{}');
    const csvData = batchCsvData[selectedBatchId];
    
    if (!csvData || csvData.length === 0) {
      alert(' No CSV data found for this batch. Please upload CSV data first.');
      return;
    }

    if (window.confirm(' This will save your schedule to the database permanently. Continue?')) {
      try {
        setLoading(true);
        
        // Convert CSV data to schedule format for database
        const scheduleData = [];
        const headers = Object.keys(csvData[0]).filter(key => key !== 'Day');
        
        csvData.forEach((row, dayIndex) => {
          headers.forEach((weekHeader, weekIndex) => {
            const content = row[weekHeader];
            if (content && content.trim()) {
              scheduleData.push({
                week: weekIndex + 1,
                days: [{
                  day: dayIndex + 1,
                  content: content.trim(),
                  date: null, // Will be calculated on backend
                  trainerId: null // Can be assigned later
                }]
              });
            }
          });
        });

        // Save to database using existing bulk upload API
        const response = await batchScheduleService.bulkUploadSchedule(selectedBatchId, scheduleData);
        
        if (response.data.success) {
          alert(` Schedule saved to database successfully! ${response.data.message}`);
          // Refresh the calendar to show database data
          fetchBatchSchedule(selectedBatchId);
        } else {
          throw new Error(response.data.message || 'Failed to save schedule');
        }
        
      } catch (error) {
        console.error('Error saving schedule to database:', error);
        alert(` Failed to save schedule: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- HELPER FUNCTIONS FOR WORKING DAYS ---
  
  // Check if a date is the 2nd or 4th Saturday of the month
  const isNonWorkingSaturday = (date) => {
    // Check if it's a Saturday first
    if (date.getDay() !== 6) return false;
    
    // Get the first day of the month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // Find the first Saturday of the month
    const firstSaturday = new Date(firstDay);
    const daysToFirstSaturday = (6 - firstDay.getDay() + 7) % 7;
    firstSaturday.setDate(1 + daysToFirstSaturday);
    
    // Calculate which Saturday this is
    const daysDiff = date.getDate() - firstSaturday.getDate();
    const saturdayNumber = Math.floor(daysDiff / 7) + 1;
    
    // Return true if it's 2nd or 4th Saturday
    return saturdayNumber === 2 || saturdayNumber === 4;
  };
  
  // Get the next working day, skipping 2nd and 4th Saturdays and Sundays
  const getNextWorkingDay = (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    // Skip Sundays and non-working Saturdays
    while (nextDay.getDay() === 0 || isNonWorkingSaturday(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  };
  
  // Calculate the actual working date considering non-working Saturdays
  const calculateWorkingDate = (startDate, totalDaysOffset) => {
    let currentDate = new Date(startDate);
    let remainingDays = totalDaysOffset;
    
    // Add days one by one, skipping non-working days
    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Skip Sundays and non-working Saturdays
      if (currentDate.getDay() !== 0 && !isNonWorkingSaturday(currentDate)) {
        remainingDays--;
      }
    }
    
    return currentDate;
  };

  // --- AUTO-POPULATE CALENDAR FROM CSV DATA ---
  const handleAutoPopulateSchedule = async (startDate) => {
    console.log('Auto-populating calendar from:', startDate);
    
    // Get CSV data for current batch
    const batchCsvData = JSON.parse(localStorage.getItem('batchCsvData') || '{}');
    const csvData = batchCsvData[selectedBatchId];
    
    if (!csvData || csvData.length === 0) {
      alert(' No CSV data found for this batch');
      return;
    }
    
    // Convert CSV data to calendar events
    const calendarEvents = [];
    const startDateObj = new Date(startDate);
    
    // Get headers (weeks) from first row
    const headers = Object.keys(csvData[0]);
    const weekHeaders = headers.slice(1); // Skip first column (day labels)
    
    console.log('Starting auto-populate with working day logic...');
    console.log('Start date:', startDateObj.toDateString());
    
    // Process each day (row)
    csvData.forEach((dayData, dayIndex) => {
      // Process each week (column)
      weekHeaders.forEach((weekHeader, weekIndex) => {
        const sessionContent = dayData[weekHeader];
        if (sessionContent && sessionContent.trim()) {
          // Calculate the total days offset from start date
          // Each week adds 5 working days (Mon-Fri), plus the day within the week
          const totalDaysOffset = (weekIndex * 5) + dayIndex;
          
          // Calculate the actual working date considering non-working Saturdays
          const eventDate = calculateWorkingDate(startDateObj, totalDaysOffset);
          
          console.log(`Week ${weekIndex + 1}, Day ${dayIndex + 1}: ${eventDate.toDateString()} (offset: ${totalDaysOffset})`);
          
          // Check if the calculated date falls on a non-working Saturday
          if (isNonWorkingSaturday(eventDate)) {
            console.log(`⚠️ Date ${eventDate.toDateString()} is a non-working Saturday, moving to next working day`);
            const workingDate = getNextWorkingDay(eventDate);
            eventDate.setTime(workingDate.getTime());
            console.log(`✅ Moved to: ${eventDate.toDateString()}`);
          }
          
          // Split multi-line sessions and create separate events
          const sessions = sessionContent.split('<br>').filter(s => s.trim());
          
          sessions.forEach((session, sessionIndex) => {
            if (session.trim()) {
              const eventTime = new Date(eventDate);
              eventTime.setHours(9 + sessionIndex, 0, 0, 0); // Start at 9 AM, increment by hour
              
              calendarEvents.push({
                id: `csv-${dayIndex}-${weekIndex}-${sessionIndex}`,
                title: session.trim(),
                start: eventTime.toISOString(),
                backgroundColor: '#6366f1',
                borderColor: '#4f46e5',
                extendedProps: {
                  type: 'csv-schedule',
                  week: weekHeader,
                  day: `Day ${dayIndex + 1}`,
                  batchId: selectedBatchId,
                  originalDate: eventDate.toDateString(),
                  isShifted: isNonWorkingSaturday(new Date(startDateObj.getTime() + (weekIndex * 7 + dayIndex) * 24 * 60 * 60 * 1000))
                }
              });
            }
          });
        }
      });
    });
    
    console.log('Generated calendar events:', calendarEvents);
    
    // Update calendar events
    setEvents(prevEvents => {
      // Remove existing CSV events for this batch
      const filteredEvents = prevEvents.filter(event => 
        !event.extendedProps || event.extendedProps.type !== 'csv-schedule'
      );
      const newEvents = [...filteredEvents, ...calendarEvents];
      
      // Save to localStorage for persistence
      const batchCalendarData = JSON.parse(localStorage.getItem('batchCalendarData') || '{}');
      batchCalendarData[selectedBatchId] = {
        events: calendarEvents,
        startDate: startDate,
        generatedAt: new Date().toISOString()
      };
      localStorage.setItem('batchCalendarData', JSON.stringify(batchCalendarData));
      console.log('Saved calendar data to localStorage:', batchCalendarData);
      
      return newEvents;
    });
    
    const shiftedEvents = calendarEvents.filter(event => event.extendedProps.isShifted);
    const message = shiftedEvents.length > 0 
      ? `✅ Successfully populated calendar with ${calendarEvents.length} sessions starting from ${startDate}. ${shiftedEvents.length} sessions were shifted due to non-working Saturdays.`
      : `✅ Successfully populated calendar with ${calendarEvents.length} sessions starting from ${startDate}`;
    
    alert(message);
  };

  const handleEventClick = (clickInfo) => {
    if (!isScheduler) return;
    const d = clickInfo.event.extendedProps;
    
    if (d.type === 'batch-schedule') {
      // Handle batch schedule entry editing
      // You can implement a different modal for batch schedule entries
      alert('Batch schedule entry editing - to be implemented');
      return;
    }
    
    setIsEditing(true);
    setFormData({ id: d.id, batchId: d.batchId, moduleId: d.moduleId, trainerId: d.trainerId, session_date: d.session_date, status: d.status });
    
    const selectedBatch = batches.find(b => b.id === d.batchId);
    setAvailableModules(selectedBatch?.program?.modules || []);
    
    setIsModalOpen(true);
  };

  const handleEventDrop = (dropInfo) => { /* ... implementation ... */ };

  // --- MODAL FORM HANDLERS ---
  const handleCloseModal = () => setIsModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBatchChangeInModal = (e) => {
    const selectedBatchId = e.target.value;
    handleInputChange(e);
    if (selectedBatchId) {
      const selectedBatch = batches.find(b => b.id === parseInt(selectedBatchId));
      setAvailableModules(selectedBatch?.program?.modules || []);
    } else {
      setAvailableModules([]);
    }
    setFormData(prev => ({ ...prev, moduleId: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = isEditing
      ? sessionService.updateSession(formData.id, formData)
      : sessionService.createSession(formData);
    action.then(() => {
      if (viewMode === 'batch-specific' && selectedBatchId) {
        fetchBatchSchedule(selectedBatchId);
      } else {
        fetchAllData();
      }
      handleCloseModal();
    }).catch(err => alert(`Error: ${err.response?.data?.message || 'Could not save session.'}`));
  };

  const handleDelete = () => {
    if (window.confirm('🗑️ Are you sure you want to delete this session? This action cannot be undone.')) {
      sessionService.deleteSession(formData.id).then(() => {
        if (viewMode === 'batch-specific' && selectedBatchId) {
          fetchBatchSchedule(selectedBatchId);
        } else {
          fetchAllData();
        }
        handleCloseModal();
        alert('✅ Session deleted successfully!');
      }).catch(err => {
        alert(`❌ Error deleting session: ${err.response?.data?.message || err.message}`);
      });
    }
  };

  // --- DASHBOARD STATS COMPONENT ---
  const renderDashboardStats = () => {
    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.extendedProps?.status === 'Published').length;
    const completedEvents = events.filter(e => e.extendedProps?.status === 'Completed').length;
    const draftEvents = events.filter(e => e.extendedProps?.status === 'Draft').length;
    const cancelledEvents = events.filter(e => e.extendedProps?.status === 'Cancelled').length;
    
    const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;
    
    const selectedBatch = selectedBatchId ? batches.find(b => b.id === parseInt(selectedBatchId)) : null;
    
    return (
      <div className="dashboard-stats fade-in">
        <div className="stat-card primary">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Total Sessions</h3>
            <div className="stat-card-icon">📊</div>
          </div>
          <div className="stat-card-value">{totalEvents}</div>
          <p className="stat-card-subtitle">
            {selectedBatch ? `For ${selectedBatch.batch_name}` : 'Across all batches'}
          </p>
        </div>
        
        <div className="stat-card success">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Completed</h3>
            <div className="stat-card-icon">✅</div>
          </div>
          <div className="stat-card-value">{completedEvents}</div>
          <p className="stat-card-subtitle">
            {completionRate}% completion rate
          </p>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Published</h3>
            <div className="stat-card-icon">📢</div>
          </div>
          <div className="stat-card-value">{publishedEvents}</div>
          <p className="stat-card-subtitle">
            Ready for delivery
          </p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Draft</h3>
            <div className="stat-card-icon">📝</div>
          </div>
          <div className="stat-card-value">{draftEvents}</div>
          <p className="stat-card-subtitle">
            Pending review
          </p>
        </div>
        
        {cancelledEvents > 0 && (
          <div className="stat-card danger">
            <div className="stat-card-header">
              <h3 className="stat-card-title">Cancelled</h3>
              <div className="stat-card-icon">❌</div>
            </div>
            <div className="stat-card-value">{cancelledEvents}</div>
            <p className="stat-card-subtitle">
              Requires attention
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // --- QUICK ACTIONS COMPONENT ---
  const renderQuickActions = () => {
    if (!isScheduler) return null;
    
    return (
      <div className="quick-actions slide-up">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions-grid">
          <button 
            className="action-button info-btn"
            onClick={() => alert('📊 Upload CSV data in Table View, then click a date in Calendar View to auto-populate your schedule!')}
          >
            <span className="icon">ℹ️</span>
            <span>How to Auto-Populate</span>
          </button>
          
          {selectedBatchId && (
            <button 
              className="quick-action-btn"
              onClick={() => {
                const batchCsvData = JSON.parse(localStorage.getItem('batchCsvData') || '{}');
                const hasCsvData = batchCsvData[selectedBatchId];
                if (hasCsvData) {
                  alert('✅ This batch has CSV data uploaded! Click any date in Calendar View to auto-populate.');
                } else {
                  alert('❌ No CSV data found for this batch. Please upload CSV data in Table View first.');
                }
              }}
            >
              <span className="icon">📊</span>
              <span>Check CSV Data</span>
            </button>
          )}
          
          {selectedBatchId && (
            <button 
              className="quick-action-btn save-to-db-btn"
              onClick={handleSaveScheduleToDatabase}
              disabled={loading}
              style={{backgroundColor: '#28a745', color: 'white'}}
            >
              <span className="icon">💾</span>
              <span>Save to Database</span>
            </button>
          )}
          
          {selectedBatchId && (
            <>
              <button 
                className="quick-action-btn"
                onClick={handleGenerateDraft}
                disabled={loading}
              >
                <span className="icon">✨</span>
                <span>Generate Draft</span>
              </button>
              
              <button 
                className="quick-action-btn"
                onClick={handlePublishWeek}
                disabled={loading}
              >
                <span className="icon">🚀</span>
                <span>Publish Week</span>
              </button>
            </>
          )}
          
          <button 
            className="quick-action-btn"
            onClick={() => window.location.reload()}
          >
            <span className="icon">🔄</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>
    );
  };

  // Custom CSV parser that handles Excel multi-line cells like Gemini
  const parseExcelCsvWithContinuationRows = (csvText) => {
    console.log('=== PARSING CSV WITH GEMINI LOGIC ===');
    
    // Use Papa Parse first to handle CSV structure properly
    const parsed = Papa.parse(csvText, {
      skipEmptyLines: false,
      quoteChar: '"',
      delimiter: ','
    });
    
    console.log('Papa parsed data:', parsed.data);
    
    const processedData = [];
    let currentRow = null;
    let headers = null;
    
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      if (!row || row.length === 0) continue;
      
      console.log(`Processing row ${i}:`, row);
      
      // Skip title rows like "New Framework" - look for Week headers
      const hasWeekHeaders = row.some(cell => 
        cell && cell.toString().toLowerCase().includes('week')
      );
      
      // Find the header row with Week columns
      if (!headers && hasWeekHeaders) {
        headers = row.map(h => (h || '').trim());
        console.log('Headers found:', headers);
        continue;
      }
      
      // Skip rows that don't have headers yet
      if (!headers) {
        console.log('Skipping row - no headers found yet');
        continue;
      }
      
      // Check if this row starts a new day
      const firstCol = (row[0] || '').trim();
      console.log(`First column: "${firstCol}"`);
      
      if (firstCol.match(/^Day\s+\d+/i)) {
        console.log(`NEW ROW DETECTED: ${firstCol}`);
        
        // Save previous row if exists
        if (currentRow) {
          console.log('Saving previous row:', currentRow);
          processedData.push(currentRow);
        }
        
        // Start new row
        currentRow = {};
        headers.forEach((header, index) => {
          currentRow[header] = (row[index] || '').trim();
        });
        console.log('New row started:', currentRow);
        
      } else if (currentRow && row.some(cell => cell && cell.trim())) {
        console.log(`CONTINUATION ROW for current day`);
        
        // This is a continuation row - merge content with <br> tags
        headers.forEach((header, index) => {
          const newContent = (row[index] || '').trim();
          if (newContent) {
            if (currentRow[header] && currentRow[header].trim()) {
              currentRow[header] += '<br>' + newContent;
              console.log(`Merged content for ${header}: "${currentRow[header]}"`);
            } else {
              currentRow[header] = newContent;
              console.log(`Set content for ${header}: "${newContent}"`);
            }
          }
        });
      }
    }
    
    // Don't forget the last row
    if (currentRow) {
      console.log('Saving final row:', currentRow);
      processedData.push(currentRow);
    }
    
    console.log('=== FINAL PROCESSED DATA ===');
    console.log(processedData);
    return processedData;
  };

  // Helper function to parse a CSV line handling quotes
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  // --- NEW CSV-BASED TABLE VIEW COMPONENT ---
  const renderCsvTableView = () => {
    console.log('renderCsvTableView - parsedCsvForTable:', parsedCsvForTable);
    console.log('renderCsvTableView - selectedBatchId:', selectedBatchId);
    console.log('renderCsvTableView - batchCsvData:', batchCsvData);
    
    if (!parsedCsvForTable) {
      return (
        <div className="empty-table-message">
          <p>📊 Upload CSV data to view the schedule table</p>
        </div>
      );
    }

    // Use the stored parsed CSV data
    if (!parsedCsvForTable || parsedCsvForTable.length === 0) {
      return (
        <div className="table-container">
          <div className="empty-table-message">
            <p>❌ No valid CSV data found</p>
          </div>
        </div>
      );
    }

    const headers = Object.keys(parsedCsvForTable[0]);
    const dataRows = parsedCsvForTable;
    
    // Extract week columns (skip first column which is day labels)
    const weekHeaders = headers.slice(1);
    const dayLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <div className="csv-table-container">
          <table className="csv-table">
            <thead>
              <tr>
                <th className="day-label">WEEK</th>
                {weekHeaders.map((week, index) => (
                  <th key={index} className="week-header">{week}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayLabels.map((day, dayIndex) => (
                <tr key={dayIndex}>
                  <td className="day-label">{day}</td>
                  {weekHeaders.map((week, weekIndex) => {
                    // Get content for this day/week combination from parsed CSV
                    const rowData = dataRows[dayIndex];
                    const content = rowData ? rowData[week] : '';
                    
                    if (!content || !content.trim()) {
                      return <td key={weekIndex} className="empty-cell">-</td>;
                    }
                    
                    return (
                      <td key={weekIndex} className="session-cell">
                        <div 
                          className="session-item"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="management-page">
      {/* Modern Header Section */}
      <div className="page-header">
        <h1 className="page-title">
          {selectedBatchId 
            ? `${batches.find(b => b.id === parseInt(selectedBatchId))?.batch_name || 'Batch'} Schedule`
            : 'Master Scheduler'
          }
        </h1>
        <p className="page-subtitle">
          {selectedBatchId 
            ? `Manage training sessions for ${batches.find(b => b.id === parseInt(selectedBatchId))?.center?.name || 'selected center'}`
            : 'Comprehensive training session management across all batches'
          }
        </p>
      </div>

      {/* Enhanced Batch Selection Controls */}
      <div className="batch-controls fade-in">
        <div className="batch-selector">
          <label>📚 Select Batch:</label>
          <select value={selectedBatchId} onChange={handleBatchChange}>
            <option value="">🌐 All Batches</option>
            {batches.map(batch => (
              <option key={batch.id} value={batch.id}>
                📖 {batch.batch_name} ({batch.center?.name})
              </option>
            ))}
          </select>
        </div>
        
        <div className="view-controls">
          {selectedBatchId && (
            <button 
              className={showTableView ? 'active' : ''}
              onClick={() => setShowTableView(!showTableView)}
            >
              {showTableView ? '📅 Calendar View' : '📊 Table View'}
            </button>
          )}
          {isScheduler && (
            <button 
              onClick={handleBulkUpload} 
              className="bulk-upload-btn"
              disabled={!selectedBatchId}
            >
              {selectedBatchId ? '📤 Bulk Upload Schedule' : '⚠️ Select Batch to Upload'}
            </button>
          )}
        </div>
      </div>
      
      {/* Quick Actions Panel */}
      {!loading && renderQuickActions()}

      
      {loading ? ( 
        <div className="loading-spinner fade-in">
          <div className="spinner"></div>
          <span>Loading your schedule data...</span>
        </div> 
      ) : showTableView && selectedBatchId ? (
        <div className="fade-in">{renderCsvTableView()}</div>
      ) : (
        <div className="calendar-container fade-in">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{ 
              left: 'prev,next today', 
              center: 'title', 
              right: 'dayGridMonth,timeGridWeek,timeGridDay' 
            }}
            initialView='dayGridMonth'
            events={events}
            selectable={isScheduler}
            editable={isScheduler}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
          />
        </div>
      )}

      {/* Dashboard Statistics */}
      {!loading && renderDashboardStats()}
      
      {/* Enhanced Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="modal-backdrop">
          <div className="modal-content bulk-upload-modal">
            <h2>Bulk Upload Schedule</h2>
            <div className="upload-instructions">
              <p><strong>📋 Instructions:</strong></p>
              <ol>
                <li>Copy your schedule data from Excel or Google Sheets</li>
                <li>Paste it in the text area below</li>
                <li>Ensure the format matches: Day labels in first column, weeks in subsequent columns</li>
                <li>Click upload to process your schedule</li>
              </ol>
            </div>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="📊 Paste your CSV data here...\n\nExample format:\nDay,Week 1,Week 2,Week 3\nMonday,Session 1,Session 4,Session 7\nTuesday,Session 2,Session 5,Session 8\n..."
              rows={12}
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setShowBulkUpload(false)}>❌ Cancel</button>
              <button 
                type="button" 
                onClick={handleCsvUpload} 
                disabled={loading || !csvData.trim()}
                className={csvData.trim() ? 'ready-to-upload' : ''}
              >
                {loading ? '⏳ Uploading...' : csvData.trim() ? '✅ Upload Schedule' : '📤 Upload Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Session Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{isEditing ? '✏️ Edit Session' : '➕ Add New Session'}</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label>📚 Batch:</label>
                <select name="batchId" value={formData.batchId} onChange={handleBatchChangeInModal} required>
                  <option value="">-- Select Batch --</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                </select>
              </div>

              <div>
                <label>📖 Course/Module:</label>
                <select name="moduleId" value={formData.moduleId} onChange={handleInputChange} required disabled={!formData.batchId}>
                  <option value="">-- Select Course --</option>
                  {availableModules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              
              <div>
                <label>👨‍🏫 Teacher/Trainer:</label>
                <select name="trainerId" value={formData.trainerId} onChange={handleInputChange} required>
                  <option value="">-- Select Teacher --</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label>📅 Date & Time:</label>
                <input type="datetime-local" name="session_date" value={formData.session_date ? formData.session_date.substring(0, 16) : ''} onChange={handleInputChange} required />
              </div>
              
              <div>
                <label>📊 Status:</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Draft">📝 Draft</option>
                  <option value="Published">📢 Published</option>
                  <option value="Completed">✅ Completed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
              
              <div className="modal-actions">
                {isEditing && <button type="button" className="delete" onClick={handleDelete}>🗑️ Delete</button>}
                <button type="button" onClick={handleCloseModal}>❌ Cancel</button>
                <button type="submit">{isEditing ? '💾 Save Changes' : '➕ Create Session'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerPage;