import React, { useState, useEffect } from 'react';
import sessionService from '../api/sessionService';
import batchService from '../api/batchService';
import moment from 'moment'; // We need this for date formatting. If not installed: npm install moment

const ScheduleTable = () => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [weekRange, setWeekRange] = useState('');

  useEffect(() => {
    // Fetch batches for dropdown
    batchService.getAllBatches()
      .then(response => {
        setBatches(response.data);
      })
      .catch(error => {
        console.error("Error fetching batches:", error);
      });

    // Set the title for the week
    const startOfWeek = moment().startOf('isoWeek').format('MMMM D');
    const endOfWeek = moment().endOf('isoWeek').format('MMMM D, YYYY');
    setWeekRange(`Week of ${startOfWeek} - ${endOfWeek}`);
    
    setLoading(false);
  }, []);

  // Load calendar events for selected batch
  useEffect(() => {
    if (selectedBatchId) {
      loadBatchCalendarEvents(selectedBatchId);
    } else {
      setSessions([]);
    }
  }, [selectedBatchId]);

  const loadBatchCalendarEvents = (batchId) => {
    console.log('Loading calendar events for batch:', batchId);
    
    // Get saved calendar data from localStorage
    const batchCalendarData = JSON.parse(localStorage.getItem('batchCalendarData') || '{}');
    const savedData = batchCalendarData[batchId];
    
    if (savedData && savedData.events) {
      console.log('Found saved calendar events:', savedData.events);
      
      // Filter events for current week
      const currentWeekEvents = savedData.events.filter(event => {
        const eventDate = moment(event.start);
        return eventDate.isBetween(moment().startOf('isoWeek'), moment().endOf('isoWeek'), null, '[]');
      });
      
      // Convert calendar events to session format
      const formattedSessions = currentWeekEvents.map(event => ({
        id: event.id,
        session_date: event.start,
        title: event.title,
        program: { program_name: 'CSV Schedule' },
        module: { name: event.title },
        trainer: { name: 'TBD' },
        week: event.extendedProps?.week || 'N/A',
        day: event.extendedProps?.day || 'N/A'
      }));
      
      // Sort by date and time
      formattedSessions.sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
      
      setSessions(formattedSessions);
    } else {
      console.log('No calendar events found for batch:', batchId);
      setSessions([]);
    }
  };

  if (loading) {
    return <div>Loading Schedule...</div>;
  }

  return (
    <div className="management-page">
      <div className="toolbar" style={{ marginBottom: '2rem' }}>
        <h2>Published Weekly Schedule</h2>
        <button>Export</button>
      </div>

      {/* Batch Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="batch-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          📚 Select Batch:
        </label>
        <select
          id="batch-select"
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            minWidth: '300px',
            backgroundColor: 'white'
          }}
        >
          <option value="">-- Select a Batch --</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>
              {batch.batch_name} ({batch.program?.program_name})
            </option>
          ))}
        </select>
      </div>

      <h3>{weekRange}</h3>
      
      <table className="management-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Program</th>
            <th>Course / Module</th>
            <th>Teacher / Trainer</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length > 0 ? (
            sessions.map(session => (
              <tr key={session.id}>
                <td>{moment(session.session_date).format('MMMM D, YYYY')}</td>
                <td>{moment(session.session_date).format('dddd')}</td>
                <td>{session.program?.program_name || 'CSV Schedule'}</td>
                <td>{session.module?.name || session.title}</td>
                <td>{session.trainer?.name || 'TBD'}</td>
              </tr>
            ))
          ) : selectedBatchId ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                No schedule found for this batch this week. 
                <br />
                <small>Make sure you've auto-populated the calendar in the Scheduler page first.</small>
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                Please select a batch to view its weekly schedule.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;