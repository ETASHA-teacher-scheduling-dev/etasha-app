import React, { useState, useEffect } from 'react';
import trainerService from '../api/trainerService';
import centerService from '../api/centerService';
import authService from '../api/authService';
import './ManagementPages.css'; // Your existing styles for this page
import '../components/Modal.css'; // Re-use the modal styles

const UserManagement = () => {
  const [trainers, setTrainers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const initialFormState = {
    name: '', email: '', phone: '', role: 'trainer', 
    specialization: '', experience_years: '', centerId: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Permissions ---
  const currentUser = authService.getCurrentUser();
  const isScheduler = currentUser && currentUser.role === 'scheduler';

  // --- Data Fetching ---
  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      trainerService.getAllTrainers(),
      centerService.getAllCenters()
    ]).then(([trainersRes, centersRes]) => {
      if (trainersRes.status === 'fulfilled') setTrainers(trainersRes.value.data);
      if (centersRes.status === 'fulfilled') setCenters(centersRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  // --- Modal and Form Handlers ---
  const handleOpenAddModal = () => {
    setShowModal(true);
  };

  const handleEdit = (trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      role: trainer.role || 'trainer',
      specialization: trainer.specialization || '',
      experience_years: trainer.experience_years || '',
      centerId: trainer.centerId || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = editingTrainer
      ? trainerService.updateTrainer(editingTrainer.id, formData)
      : trainerService.createTrainer(formData);
    
    action.then(() => {
      trainerService.getAllTrainers().then(res => setTrainers(res.data));
      setEditingTrainer(null);
      setFormData(initialFormState);
      setShowModal(false);
      alert(editingTrainer ? 'Trainer updated successfully!' : 'Trainer created successfully!');
    }).catch(err => alert(`Error: ${err.response?.data?.message || 'Could not save trainer.'}`));
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this trainer?')) {
      trainerService.deleteTrainer(id).then(() => {
        trainerService.getAllTrainers().then(res => setTrainers(res.data));
        alert('Trainer deleted successfully!');
      }).catch(err => {
        alert(`Error deleting trainer: ${err.response?.data?.message || err.message}`);
      });
    }
  };

  const filteredTrainers = trainers.filter(trainer => 
    (trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     trainer.email.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (filterRole === '' || trainer.role === filterRole)
  );

  const renderDashboardStats = () => {
    const totalTrainers = trainers.length;
    const activeTrainers = trainers.filter(t => t.role === 'trainer').length;
    const avgExperience = trainers.length > 0 
      ? Math.round(trainers.reduce((sum, t) => sum + (parseInt(t.experience_years) || 0), 0) / trainers.length)
      : 0;
    const centerCount = new Set(trainers.map(t => t.centerId)).size;
    
    return (
      <div className="dashboard-stats fade-in">
        <div className="stat-card primary">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Total Trainers</h3>
            <div className="stat-card-icon">👩‍🏫</div>
          </div>
          <div className="stat-card-value">{totalTrainers}</div>
          <p className="stat-card-subtitle">All team members</p>
        </div>
        
        <div className="stat-card success">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Active Trainers</h3>
            <div className="stat-card-icon">🟢</div>
          </div>
          <div className="stat-card-value">{activeTrainers}</div>
          <p className="stat-card-subtitle">Teaching staff</p>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Avg Experience</h3>
            <div className="stat-card-icon">🎖️</div>
          </div>
          <div className="stat-card-value">{avgExperience}y</div>
          <p className="stat-card-subtitle">Years of experience</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Centers</h3>
            <div className="stat-card-icon">🏢</div>
          </div>
          <div className="stat-card-value">{centerCount}</div>
          <p className="stat-card-subtitle">With trainers</p>
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
            onClick={() => setShowModal(true)}
          >
            <span className="icon">➕</span>
            <span>Add New Trainer</span>
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
        <h1 className="page-title">👩‍🏫 Teacher Management</h1>
        <p className="page-subtitle">
          Manage trainers and teaching staff
        </p>
      </div>

      {/* Dashboard Statistics */}
      {!loading && renderDashboardStats()}
      
      {/* Quick Actions Panel */}
      {!loading && renderQuickActions()}
      
      {/* Search and Filter Controls */}
      <div className="filter-bar fade-in">
        <div className="search-field">
          <input 
            type="text" 
            placeholder="🔍 Search trainers..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="filter-field">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="trainer">Trainer</option>
            <option value="scheduler">Scheduler</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {isScheduler && (
          <button 
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            ➕ Add Trainer
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner fade-in">
          <div className="spinner"></div>
          <span>Loading trainer data...</span>
        </div>
      ) : (
        <table className="management-table fade-in">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Center</th>
              {isScheduler && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredTrainers.map(trainer => (
              <tr key={trainer.id}>
                <td>
                  <strong>{trainer.name}</strong>
                </td>
                <td>{trainer.email}</td>
                <td>{trainer.phone}</td>
                <td>
                  <span className={`role-badge ${trainer.role}`}>{trainer.role}</span>
                </td>
                <td>{trainer.specialization || 'N/A'}</td>
                <td>
                  <span className="experience-badge">{trainer.experience_years}y</span>
                </td>
                <td>{trainer.center?.name || 'N/A'}</td>
                {isScheduler && (
                  <td className="actions-cell">
                    <button 
                      onClick={() => handleEdit(trainer)} 
                      className="action-button edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(trainer.id)} 
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

      {/* Enhanced Modal for Add/Edit Trainer */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content enhanced" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTrainer ? '✏️ Edit Trainer' : '➕ Add New Trainer'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✖
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field">
                  <label>👤 Full Name</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Enter full name" 
                    required 
                  />
                </div>
                
                <div className="form-field">
                  <label>📧 Email</label>
                  <input 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="Enter email address" 
                    required 
                  />
                </div>
                
                <div className="form-field">
                  <label>📞 Phone</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    placeholder="Enter phone number" 
                    required 
                  />
                </div>
                
                <div className="form-field">
                  <label>💼 Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} required>
                    <option value="trainer">Trainer</option>
                    <option value="scheduler">Scheduler</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label>🎖️ Specialization</label>
                  <input 
                    name="specialization" 
                    value={formData.specialization} 
                    onChange={handleInputChange} 
                    placeholder="Area of expertise" 
                  />
                </div>
                
                <div className="form-field">
                  <label>⏰ Experience (Years)</label>
                  <input 
                    name="experience_years" 
                    type="number" 
                    value={formData.experience_years} 
                    onChange={handleInputChange} 
                    placeholder="Years of experience" 
                  />
                </div>
                
                <div className="form-field full-width">
                  <label>🏢 Center</label>
                  <select name="centerId" value={formData.centerId} onChange={handleInputChange}>
                    <option value="">-- Select Center --</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  ❌ Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingTrainer ? '💾 Update Trainer' : '➕ Create Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;