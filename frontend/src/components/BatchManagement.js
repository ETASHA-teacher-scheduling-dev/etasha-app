import React, { useState, useEffect } from 'react';
import batchService from '../api/batchService';
import programService from '../api/programService'; // To populate dropdown
import centerService from '../api/centerService';   // To populate dropdown
import authService from '../api/authService';
import './ManagementPages.css';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialFormState = { id: null, batch_name: '', start_date: '', programId: '', centerId: '' };
  const [formData, setFormData] = useState(initialFormState);
  
  const isScheduler = authService.getCurrentUser()?.role === 'scheduler'

  useEffect(() => {
    // Fetch all data needed for the page
    setLoading(true);
    Promise.allSettled([
      batchService.getAllBatches(),
      programService.getAllPrograms(),
      centerService.getAllCenters()
    ]).then(([batchesRes, programsRes, centersRes]) => {
      if (batchesRes.status === 'fulfilled') setBatches(batchesRes.value.data);
      if (programsRes.status === 'fulfilled') setPrograms(programsRes.value.data);
      if (centersRes.status === 'fulfilled') setCenters(centersRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = isEditing
      ? batchService.updateBatch(formData.id, formData)
      : batchService.createBatch(formData);
    
    action.then(() => {
      batchService.getAllBatches().then(res => setBatches(res.data));
      setFormData(initialFormState);
      setIsEditing(false);
      alert(isEditing ? '✅ Batch updated successfully!' : '✅ Batch created successfully!');
    }).catch(err => alert(`❌ Error: ${err.response?.data?.message || 'Could not save batch.'}`));
  };
  
  const handleEdit = (batch) => {
    setFormData({
      id: batch.id,
      batch_name: batch.batch_name,
      start_date: batch.start_date ? batch.start_date.split('T')[0] : '',
      programId: batch.programId || '',
      centerId: batch.centerId || ''
    });
    setIsEditing(true);
  };
  
  const handleDelete = (id) => {
    if (window.confirm('🗑️ Are you sure you want to delete this batch? This action cannot be undone.')) {
      batchService.deleteBatch(id).then(() => {
        batchService.getAllBatches().then(res => setBatches(res.data));
        alert('✅ Batch deleted successfully!');
      }).catch(err => {
        alert(`❌ Error deleting batch: ${err.response?.data?.message || err.message}`);
      });
    }
  };
  
  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };
  
  // Dashboard stats
  const renderDashboardStats = () => {
    const totalBatches = batches.length;
    const activeBatches = batches.filter(b => new Date(b.start_date) <= new Date()).length;
    const upcomingBatches = batches.filter(b => new Date(b.start_date) > new Date()).length;
    const programCount = new Set(batches.map(b => b.programId)).size;
    
    return (
      <div className="dashboard-stats fade-in">
        <div className="stat-card primary">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Total Batches</h3>
            <div className="stat-card-icon">📚</div>
          </div>
          <div className="stat-card-value">{totalBatches}</div>
          <p className="stat-card-subtitle">Across all programs</p>
        </div>
        
        <div className="stat-card success">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Active Batches</h3>
            <div className="stat-card-icon">🟢</div>
          </div>
          <div className="stat-card-value">{activeBatches}</div>
          <p className="stat-card-subtitle">Currently running</p>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Upcoming</h3>
            <div className="stat-card-icon">📅</div>
          </div>
          <div className="stat-card-value">{upcomingBatches}</div>
          <p className="stat-card-subtitle">Starting soon</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Programs</h3>
            <div className="stat-card-icon">🎯</div>
          </div>
          <div className="stat-card-value">{programCount}</div>
          <p className="stat-card-subtitle">Different programs</p>
        </div>
      </div>
    );
  };
  
  const renderQuickActions = () => {
    if (!isScheduler) return null;
    
    return (
      <div className="quick-actions slide-up">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-btn"
            onClick={() => setFormData(initialFormState)}
          >
            <span className="icon">➕</span>
            <span>Add New Batch</span>
          </button>
          
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

  return (
    <div className="management-page">
      {/* Modern Header Section */}
      <div className="page-header">
        <h1 className="page-title">📚 Batch Management</h1>
        <p className="page-subtitle">
          Manage training batches across all programs and centers
        </p>
      </div>

      {/* Dashboard Statistics */}
      {!loading && renderDashboardStats()}
      
      {/* Quick Actions Panel */}
      {!loading && renderQuickActions()}
      
      {isScheduler && (
        <div className="add-item-form fade-in">
          <h3>{isEditing ? '✏️ Edit Batch' : '➕ Add New Batch'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>📖 Batch Name</label>
                <input 
                  name="batch_name" 
                  value={formData.batch_name} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Center City, Aug 2025" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>📅 Start Date</label>
                <input 
                  name="start_date" 
                  type="date" 
                  value={formData.start_date} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>🎯 Program</label>
                <select name="programId" value={formData.programId} onChange={handleInputChange} required>
                  <option value="">-- Select Program --</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
                </select>
              </div>
              
              <div className="form-field">
                <label>🏢 Center</label>
                <select name="centerId" value={formData.centerId} onChange={handleInputChange} required>
                  <option value="">-- Select Center --</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div className="form-actions">
                {isEditing && <button type="button" className="cancel-btn" onClick={resetForm}>❌ Cancel</button>}
                <button type="submit" className="submit-btn">
                  {isEditing ? '💾 Save Changes' : '➕ Create Batch'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="loading-spinner fade-in">
          <div className="spinner"></div>
          <span>Loading batch data...</span>
        </div>
      ) : (
        <table className="management-table fade-in">
          <thead>
            <tr>
              <th>Batch Name</th>
              <th>Program</th>
              <th>Center</th>
              <th>Start Date</th>
              {isScheduler && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {batches.map(batch => (
              <tr key={batch.id}>
                <td>
                  <strong>{batch.batch_name}</strong>
                </td>
                <td>{batch.program?.program_name || 'N/A'}</td>
                <td>{batch.center?.name || 'N/A'}</td>
                <td>{new Date(batch.start_date).toLocaleDateString()}</td>
                {isScheduler && (
                  <td className="actions-cell">
                    <button 
                      onClick={() => handleEdit(batch)} 
                      className="action-button edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(batch.id)} 
                      className="action-button delete"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BatchManagement;