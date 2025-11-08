import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import reportsService from '../api/reportsService';
import batchService from '../api/batchService';
import './Reports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(5); // May 2025 where our seeded data is
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedBatch, setSelectedBatch] = useState(''); // New batch filter
  const [batches, setBatches] = useState([]); // Available batches
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    dashboard: null,
    trainerModules: null,
    trainerLocations: null,
    cancelledSessions: null,
    mockInterviews: null,
    missedLessons: null,
    timingAdherence: null,
    batchDuration: null
  });

  useEffect(() => {
    loadReportData();
  }, [selectedMonth, selectedYear, selectedBatch]);

  // Load batches and initial data
  useEffect(() => {
    loadBatches();
    loadReportData();
  }, []);

  const loadBatches = async () => {
    try {
      const response = await batchService.getAllBatches();
      const batchData = response.data || [];
      setBatches(batchData);
    } catch (error) {
      console.error('Error loading batches:', error);
      setBatches([]);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    console.log('Loading report data for:', selectedMonth, selectedYear, selectedBatch); // Debug log
    console.log('Selected batch details:', batches.find(b => b.id == selectedBatch)); // Debug log
    try {
      const batchId = selectedBatch || null;
      console.log('Sending batchId to API:', batchId); // Debug log
      const [
        dashboardRes,
        trainerModulesRes,
        trainerLocationsRes,
        cancelledRes,
        mockInterviewsRes,
        missedLessonsRes,
        timingRes,
        batchDurationRes
      ] = await Promise.all([
        reportsService.getDashboardSummary(selectedMonth, selectedYear, batchId),
        reportsService.getSessionsByTrainerModule(selectedMonth, selectedYear, batchId),
        reportsService.getTrainerSessionsByLocation(selectedMonth, selectedYear, batchId),
        reportsService.getReassignedCancelledSessions(selectedMonth, selectedYear, batchId),
        reportsService.getMockInterviewSessions(selectedMonth, selectedYear, batchId),
        reportsService.getMissedLessons(selectedMonth, selectedYear, batchId),
        reportsService.getSessionTimingAdherence(selectedMonth, selectedYear, batchId),
        reportsService.getBatchDurationReport(batchId)
      ]);

      setData({
        dashboard: dashboardRes.data,
        trainerModules: trainerModulesRes.data,
        trainerLocations: trainerLocationsRes.data,
        cancelledSessions: cancelledRes.data,
        mockInterviews: mockInterviewsRes.data,
        missedLessons: missedLessonsRes.data,
        timingAdherence: timingRes.data,
        batchDuration: batchDurationRes.data
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      // Set empty data to show "no data" states instead of loading forever
      setData({
        dashboard: { totalSessions: 0, completedSessions: 0, missedSessions: 0, cancelledSessions: 0, draftSessions: 0, completionRate: '0' },
        trainerModules: {},
        trainerLocations: {},
        cancelledSessions: { totalCancelled: 0, sessions: [] },
        mockInterviews: {},
        missedLessons: { totalMissed: 0, sessions: [] },
        timingAdherence: { totalSessions: 0, completedOnTime: 0, sessions: [] },
        batchDuration: []
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    if (!data.dashboard) return <div>Loading...</div>;

    const { totalSessions, completedSessions, missedSessions, cancelledSessions, draftSessions, completionRate } = data.dashboard;

    const doughnutData = {
      labels: ['Completed', 'Draft', 'Missed', 'Cancelled'],
      datasets: [
        {
          data: [completedSessions, draftSessions || 0, missedSessions, cancelledSessions],
          backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#F44336'],
          hoverBackgroundColor: ['#45a049', '#1976D2', '#e68900', '#da190b']
        }
      ]
    };

    return (
      <div className="dashboard-overview">
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Sessions</h3>
            <p className="metric">{totalSessions}</p>
          </div>
          <div className="summary-card">
            <h3>Completed</h3>
            <p className="metric completed">{completedSessions}</p>
          </div>
          <div className="summary-card">
            <h3>Draft</h3>
            <p className="metric draft">{draftSessions || 0}</p>
          </div>
          <div className="summary-card">
            <h3>Missed</h3>
            <p className="metric missed">{missedSessions}</p>
          </div>
          <div className="summary-card">
            <h3>Cancelled</h3>
            <p className="metric cancelled">{cancelledSessions}</p>
          </div>
          <div className="summary-card">
            <h3>Completion Rate</h3>
            <p className="metric rate">{completionRate}%</p>
          </div>
        </div>
        <div className="chart-container">
          <h3>Session Status Distribution</h3>
          <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    );
  };

  const renderTrainerModules = () => {
    if (!data.trainerModules) return <div>Loading...</div>;

    const trainers = Object.values(data.trainerModules);
    const labels = trainers.map(t => t.trainerName);
    const datasets = [];

    // Get all unique modules
    const allModules = new Set();
    trainers.forEach(trainer => {
      Object.values(trainer.modules).forEach(module => {
        allModules.add(module.moduleName);
      });
    });

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    let colorIndex = 0;

    Array.from(allModules).forEach(moduleName => {
      const moduleData = labels.map(trainerName => {
        const trainer = trainers.find(t => t.trainerName === trainerName);
        const module = Object.values(trainer.modules).find(m => m.moduleName === moduleName);
        return module ? module.sessionCount : 0;
      });

      datasets.push({
        label: moduleName,
        data: moduleData,
        backgroundColor: colors[colorIndex % colors.length],
        borderColor: colors[colorIndex % colors.length],
        borderWidth: 1
      });
      colorIndex++;
    });

    const chartData = { labels, datasets };

    return (
      <div className="report-section">
        <h3>Sessions Covered by Trainer (Module-wise)</h3>
        <div className="chart-container">
          <Bar data={chartData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Trainer</th>
                <th>Module</th>
                <th>Sessions</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map(trainer => 
                Object.values(trainer.modules).map((module, idx) => (
                  <tr key={`${trainer.trainerName}-${idx}`}>
                    <td>{trainer.trainerName}</td>
                    <td>{module.moduleName}</td>
                    <td>{module.sessionCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTrainerLocations = () => {
    if (!data.trainerLocations) return <div>Loading...</div>;

    return (
      <div className="report-section">
        <h3>Trainer Sessions by Location</h3>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Trainer</th>
                <th>Center</th>
                <th>Location</th>
                <th>Sessions</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(data.trainerLocations).map(trainer => 
                Object.values(trainer.locations).map((location, idx) => (
                  <tr key={`${trainer.trainerName}-${idx}`}>
                    <td>{trainer.trainerName}</td>
                    <td>{location.centerName}</td>
                    <td>{location.location}</td>
                    <td>{location.sessionCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCancelledSessions = () => {
    if (!data.cancelledSessions) return <div>Loading...</div>;

    return (
      <div className="report-section">
        <h3>Reassigned or Cancelled Sessions Report</h3>
        <div className="summary-stat">
          <p><strong>Total Cancelled Sessions: {data.cancelledSessions.totalCancelled}</strong></p>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Trainer</th>
                <th>Batch</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.cancelledSessions.sessions.map(session => (
                <tr key={session.id}>
                  <td>{new Date(session.date).toLocaleDateString()}</td>
                  <td>{session.trainer}</td>
                  <td>{session.batch}</td>
                  <td>{session.notes || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMockInterviews = () => {
    if (!data.mockInterviews) return <div>Loading...</div>;

    const batches = Object.values(data.mockInterviews);
    const labels = batches.map(b => b.batchName);
    const counts = batches.map(b => b.mockInterviewCount);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Mock Interview Sessions',
          data: counts,
          backgroundColor: '#36A2EB',
          borderColor: '#36A2EB',
          borderWidth: 1
        }
      ]
    };

    return (
      <div className="report-section">
        <h3>Mock Interview Sessions per Batch</h3>
        <div className="chart-container">
          <Bar data={chartData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Mock Interview Sessions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, idx) => (
                <tr key={idx}>
                  <td>{batch.batchName}</td>
                  <td>{batch.mockInterviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMissedLessons = () => {
    if (!data.missedLessons) return <div>Loading...</div>;

    return (
      <div className="report-section">
        <h3>Missed Lessons Report</h3>
        <div className="summary-stat">
          <p><strong>Total Missed Sessions: {data.missedLessons.totalMissed}</strong></p>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Trainer</th>
                <th>Batch</th>
                <th>Module</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.missedLessons.sessions.map(session => (
                <tr key={session.id}>
                  <td>{new Date(session.date).toLocaleDateString()}</td>
                  <td>{session.trainer}</td>
                  <td>{session.batch}</td>
                  <td>{session.module}</td>
                  <td>{session.notes || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBatchDuration = () => {
    if (!data.batchDuration) return <div>Loading...</div>;

    return (
      <div className="report-section">
        <h3>Batch Duration Report</h3>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Program</th>
                <th>Module</th>
                <th>Total Sessions</th>
                <th>Completed</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration (Days)</th>
              </tr>
            </thead>
            <tbody>
              {data.batchDuration.map(batch => (
                <tr key={batch.batchId}>
                  <td>{batch.batchName}</td>
                  <td>{batch.program}</td>
                  <td>{batch.module}</td>
                  <td>{batch.totalSessions}</td>
                  <td>{batch.completedSessions}</td>
                  <td>{batch.startDate || 'N/A'}</td>
                  <td>{batch.endDate || 'N/A'}</td>
                  <td>{batch.durationDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'trainer-modules': return renderTrainerModules();
      case 'trainer-locations': return renderTrainerLocations();
      case 'cancelled': return renderCancelledSessions();
      case 'mock-interviews': return renderMockInterviews();
      case 'missed-lessons': return renderMissedLessons();
      case 'batch-duration': return renderBatchDuration();
      default: return renderDashboard();
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="page-title">
              <span className="title-icon">📊</span>
              Reports Dashboard
            </h1>
            <p className="page-subtitle">
              Comprehensive analytics and insights for training sessions (including draft sessions)
              {selectedBatch && (
                <span className="batch-filter-indicator">
                  📊 Filtered by: {batches.find(b => b.id == selectedBatch)?.batch_name || 'Selected Batch'}
                </span>
              )}
            </p>
          </div>
          <div className="date-filters">
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              <option value="">All Batches ({batches.length} available)</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_name} - {batch.center?.name || 'No Center'}
                </option>
              ))}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="reports-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          📈 Dashboard
        </button>
        <button 
          className={activeTab === 'trainer-modules' ? 'active' : ''} 
          onClick={() => setActiveTab('trainer-modules')}
        >
          👩‍🏫 Trainer Sessions
        </button>
        <button 
          className={activeTab === 'trainer-locations' ? 'active' : ''} 
          onClick={() => setActiveTab('trainer-locations')}
        >
          📍 Location Coverage
        </button>
        <button 
          className={activeTab === 'cancelled' ? 'active' : ''} 
          onClick={() => setActiveTab('cancelled')}
        >
          ❌ Cancelled Sessions
        </button>
        <button 
          className={activeTab === 'mock-interviews' ? 'active' : ''} 
          onClick={() => setActiveTab('mock-interviews')}
        >
          🎤 Mock Interviews
        </button>
        <button 
          className={activeTab === 'missed-lessons' ? 'active' : ''} 
          onClick={() => setActiveTab('missed-lessons')}
        >
          ⚠️ Missed Lessons
        </button>
        <button 
          className={activeTab === 'batch-duration' ? 'active' : ''} 
          onClick={() => setActiveTab('batch-duration')}
        >
          ⏱️ Batch Duration
        </button>
      </div>

      <div className="reports-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading reports...</p>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default Reports;
