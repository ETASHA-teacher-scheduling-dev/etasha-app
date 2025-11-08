import React, { useState, useEffect } from 'react';
import centerService from '../api/centerService';
import authService from '../api/authService';
import './ManagementPages.css';

const CenterManagement = () => {
  const [centers, setCenters] = useState([]);
  const [editingCenter, setEditingCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const initialFormState = {
    name: '', address: '', city: '', state: '', pincode: '', 
    contact_person: '', contact_phone: '', contact_email: '', 
    capacity: '', facilities: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Role-based security check
  const currentUser = authService.getCurrentUser();
  const isScheduler = currentUser && currentUser.role === 'scheduler';

  useEffect(() => {
    setLoading(true);
    centerService.getAllCenters()
      .then(res => setCenters(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingCenter(null);
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name || '',
      address: center.address || '',
      city: center.city || '',
      state: center.state || '',
      pincode: center.pincode || '',
      contact_person: center.contact_person || '',
      contact_phone: center.contact_phone || '',
      contact_email: center.contact_email || '',
      capacity: center.capacity || '',
      facilities: center.facilities || ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = editingCenter
      ? centerService.updateCenter(editingCenter.id, formData)
      : centerService.createCenter(formData);
    
    action.then(() => {
      centerService.getAllCenters().then(res => setCenters(res.data));
      setFormData(initialFormState);
      setEditingCenter(null);
      alert(editingCenter ? '✅ Center updated successfully!' : '✅ Center created successfully!');
    }).catch(err => alert(`❌ Error: ${err.response?.data?.message || 'Could not save center.'}`));
  };

  const handleDelete = (id) => {
    if (window.confirm('🗑️ Are you sure you want to delete this center? This action cannot be undone.')) {
      centerService.deleteCenter(id).then(() => {
        centerService.getAllCenters().then(res => setCenters(res.data));
        alert('✅ Center deleted successfully!');
      }).catch(err => {
        alert(`❌ Error deleting center: ${err.response?.data?.message || err.message}`);
      });
    }
  };

  const renderDashboardStats = () => {
    const totalCenters = centers.length;
    const activeCenters = centers.filter(c => c.capacity > 0).length;
    const totalCapacity = centers.reduce((sum, c) => sum + (parseInt(c.capacity) || 0), 0);
    const avgCapacity = totalCenters > 0 ? Math.round(totalCapacity / totalCenters) : 0;
    
    return (
      <div className="dashboard-stats fade-in">
        <div className="stat-card primary">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Total Centers</h3>
            <div className="stat-card-icon">🏢</div>
          </div>
          <div className="stat-card-value">{totalCenters}</div>
          <p className="stat-card-subtitle">Training locations</p>
        </div>
        
        <div className="stat-card success">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Active Centers</h3>
            <div className="stat-card-icon">🟢</div>
          </div>
          <div className="stat-card-value">{activeCenters}</div>
          <p className="stat-card-subtitle">With capacity</p>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Total Capacity</h3>
            <div className="stat-card-icon">👥</div>
          </div>
          <div className="stat-card-value">{totalCapacity}</div>
          <p className="stat-card-subtitle">Students across all centers</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <h3 className="stat-card-title">Avg Capacity</h3>
            <div className="stat-card-icon">📊</div>
          </div>
          <div className="stat-card-value">{avgCapacity}</div>
          <p className="stat-card-subtitle">Per center</p>
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
            <span>Add New Center</span>
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
        <h1 className="page-title">🏢 Center Management</h1>
        <p className="page-subtitle">
          Manage training centers and their facilities
        </p>
      </div>

      {/* Dashboard Statistics */}
      {!loading && renderDashboardStats()}
      
      {/* Quick Actions Panel */}
      {!loading && renderQuickActions()}
      
      {isScheduler && (
        <div className="add-item-form fade-in">
          <h3>{editingCenter ? '✏️ Edit Center' : '➕ Add New Center'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>🏢 Center Name</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="e.g., CDC 1 Hauzkhas" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>📍 Address</label>
                <input 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  placeholder="Street address" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>🏙️ City</label>
                <input 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                  placeholder="City name" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>🗺️ State</label>
                <input 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                  placeholder="State name" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>📮 Pincode</label>
                <input 
                  name="pincode" 
                  value={formData.pincode} 
                  onChange={handleInputChange} 
                  placeholder="6-digit pincode" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>👤 Contact Person</label>
                <input 
                  name="contact_person" 
                  value={formData.contact_person} 
                  onChange={handleInputChange} 
                  placeholder="Contact person name" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>📞 Contact Phone</label>
                <input 
                  name="contact_phone" 
                  value={formData.contact_phone} 
                  onChange={handleInputChange} 
                  placeholder="Phone number" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>📧 Contact Email</label>
                <input 
                  name="contact_email" 
                  type="email" 
                  value={formData.contact_email} 
                  onChange={handleInputChange} 
                  placeholder="Email address" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>👥 Capacity</label>
                <input 
                  name="capacity" 
                  type="number" 
                  value={formData.capacity} 
                  onChange={handleInputChange} 
                  placeholder="Maximum students" 
                  required 
                />
              </div>
              
              <div className="form-field full-width">
                <label>🏗️ Facilities</label>
                <textarea 
                  name="facilities" 
                  value={formData.facilities} 
                  onChange={handleInputChange} 
                  placeholder="Available facilities (optional)" 
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-actions">
                {editingCenter && <button type="button" className="cancel-btn" onClick={resetForm}>❌ Cancel</button>}
                <button type="submit" className="submit-btn">
                  {editingCenter ? '💾 Save Changes' : '➕ Create Center'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="loading-spinner fade-in">
          <div className="spinner"></div>
          <span>Loading center data...</span>
        </div>
      ) : (
        <table className="management-table fade-in">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>City</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Capacity</th>
              {isScheduler && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {centers.map(center => (
              <tr key={center.id}>
                <td>
                  <strong>{center.name}</strong>
                </td>
                <td>{center.address}</td>
                <td>{center.city}</td>
                <td>{center.contact_person}</td>
                <td>{center.contact_phone}</td>
                <td>{center.contact_email}</td>
                <td>
                  <span className="capacity-badge">{center.capacity}</span>
                </td>
                {isScheduler && (
                  <td className="actions-cell">
                    <button 
                      onClick={() => handleEdit(center)} 
                      className="action-button edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(center.id)} 
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

export default CenterManagement;