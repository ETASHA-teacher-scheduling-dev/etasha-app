import React, { useState, useEffect } from 'react';
import moduleService from '../api/moduleService';
import programService from '../api/programService';
import authService from '../api/authService';
import './ManagementPages.css';

const ModuleManagement = () => {
    const [modules, setModules] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    
    // Define the full structure for the form's state
    const initialFormState = { 
        id: null, 
        module_name: '', 
        module_code: '', 
        description: '', 
        duration_hours: '', 
        prerequisites: '', 
        learning_outcomes: '', 
        programId: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    
    // Role-based security check
    const currentUser = authService.getCurrentUser();
    const isScheduler = currentUser && currentUser.role === 'scheduler';

    // Function to fetch all modules from the API
    useEffect(() => {
        setLoading(true);
        Promise.allSettled([
          moduleService.getAllModules(),
          programService.getAllPrograms()
        ]).then(([modulesRes, programsRes]) => {
          if (modulesRes.status === 'fulfilled') setModules(modulesRes.value.data);
          if (programsRes.status === 'fulfilled') setPrograms(programsRes.value.data);
        }).finally(() => setLoading(false));
    }, []);

    // Handler to update form state as the user types
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handles both creating a new module and updating an existing one
    const handleSubmit = (e) => {
        e.preventDefault();
        const action = editingModule
          ? moduleService.updateModule(editingModule.id, formData)
          : moduleService.createModule(formData);
        
        action.then(() => {
          moduleService.getAllModules().then(res => setModules(res.data));
          setFormData(initialFormState);
          setEditingModule(null);
          alert(editingModule ? '✅ Module updated successfully!' : '✅ Module created successfully!');
        }).catch(err => alert(`❌ Error: ${err.response?.data?.message || 'Could not save module.'}`));
    };

    // Prepares the form for editing an existing module
    const handleEdit = (module) => {
        setEditingModule(module);
        setFormData({
          module_name: module.module_name || '',
          module_code: module.module_code || '',
          description: module.description || '',
          duration_hours: module.duration_hours || '',
          prerequisites: module.prerequisites || '',
          learning_outcomes: module.learning_outcomes || '',
          programId: module.programId || ''
        });
    };

    // Handles the deletion of a module
    const handleDelete = (id) => {
        if (window.confirm('🗑️ Are you sure you want to delete this module? This action cannot be undone.')) {
          moduleService.deleteModule(id).then(() => {
            moduleService.getAllModules().then(res => setModules(res.data));
            alert('✅ Module deleted successfully!');
          }).catch(err => {
            alert(`❌ Error deleting module: ${err.response?.data?.message || err.message}`);
          });
        }
    };
  
    const resetForm = () => {
        setFormData(initialFormState);
        setEditingModule(null);
    };
  
    // Dashboard stats
    const renderDashboardStats = () => {
        const totalModules = modules.length;
        const totalHours = modules.reduce((sum, m) => sum + (parseInt(m.duration_hours) || 0), 0);
        const avgDuration = totalModules > 0 ? Math.round(totalHours / totalModules) : 0;
        const programCount = new Set(modules.map(m => m.programId)).size;
        
        return (
          <div className="dashboard-stats fade-in">
            <div className="stat-card primary">
              <div className="stat-card-header">
                <h3 className="stat-card-title">Total Modules</h3>
                <div className="stat-card-icon">📚</div>
              </div>
              <div className="stat-card-value">{totalModules}</div>
              <p className="stat-card-subtitle">Course modules</p>
            </div>
            
            <div className="stat-card success">
              <div className="stat-card-header">
                <h3 className="stat-card-title">Total Hours</h3>
                <div className="stat-card-icon">⏰</div>
              </div>
              <div className="stat-card-value">{totalHours}</div>
              <p className="stat-card-subtitle">Training duration</p>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-card-header">
                <h3 className="stat-card-title">Avg Duration</h3>
                <div className="stat-card-icon">📊</div>
              </div>
              <div className="stat-card-value">{avgDuration}h</div>
              <p className="stat-card-subtitle">Per module</p>
            </div>
            
            <div className="stat-card">
              <div className="stat-card-header">
                <h3 className="stat-card-title">Programs</h3>
                <div className="stat-card-icon">🎯</div>
              </div>
              <div className="stat-card-value">{programCount}</div>
              <p className="stat-card-subtitle">With modules</p>
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
                <span>Add New Module</span>
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
                <h1 className="page-title">📚 Module Management</h1>
                <p className="page-subtitle">
                    Manage course modules and learning content
                </p>
            </div>

            {/* Dashboard Statistics */}
            {!loading && renderDashboardStats()}
            
            {/* Quick Actions Panel */}
            {!loading && renderQuickActions()}
            
            {isScheduler && (
                <div className="add-item-form fade-in">
                    <h3>{editingModule ? '✏️ Edit Module' : '➕ Add New Module'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>📚 Module Name</label>
                                <input 
                                    name="module_name" 
                                    value={formData.module_name} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g., Digital Marketing Fundamentals" 
                                    required 
                                />
                            </div>
                            
                            <div className="form-field">
                                <label>🔖 Module Code</label>
                                <input 
                                    name="module_code" 
                                    value={formData.module_code} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g., DMF-101" 
                                    required 
                                />
                            </div>
                            
                            <div className="form-field">
                                <label>⏰ Duration (Hours)</label>
                                <input 
                                    name="duration_hours" 
                                    type="number" 
                                    value={formData.duration_hours} 
                                    onChange={handleInputChange} 
                                    placeholder="Training hours" 
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
                            
                            <div className="form-field full-width">
                                <label>📝 Description</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleInputChange} 
                                    placeholder="Module description and overview" 
                                    rows="3"
                                ></textarea>
                            </div>
                            
                            <div className="form-field full-width">
                                <label>📝 Prerequisites</label>
                                <textarea 
                                    name="prerequisites" 
                                    value={formData.prerequisites} 
                                    onChange={handleInputChange} 
                                    placeholder="Prerequisites (optional)" 
                                    rows="2"
                                ></textarea>
                            </div>
                            
                            <div className="form-field full-width">
                                <label>🎯 Learning Outcomes</label>
                                <textarea 
                                    name="learning_outcomes" 
                                    value={formData.learning_outcomes} 
                                    onChange={handleInputChange} 
                                    placeholder="Expected learning outcomes" 
                                    rows="3"
                                ></textarea>
                            </div>
                            
                            <div className="form-actions">
                                {editingModule && <button type="button" className="cancel-btn" onClick={resetForm}>❌ Cancel</button>}
                                <button type="submit" className="submit-btn">
                                    {editingModule ? '💾 Save Changes' : '➕ Create Module'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
            
            {loading ? (
                <div className="loading-spinner fade-in">
                    <div className="spinner"></div>
                    <span>Loading module data...</span>
                </div>
            ) : (
                <table className="management-table fade-in">
                    <thead>
                        <tr>
                            <th>Module Name</th>
                            <th>Code</th>
                            <th>Program</th>
                            <th>Duration (hrs)</th>
                            <th>Description</th>
                            {isScheduler && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {modules.map(module => (
                            <tr key={module.id}>
                                <td>
                                    <strong>{module.module_name}</strong>
                                </td>
                                <td>
                                    <span className="module-code">{module.module_code}</span>
                                </td>
                                <td>{module.program?.program_name || 'N/A'}</td>
                                <td>
                                    <span className="duration-badge">{module.duration_hours}h</span>
                                </td>
                                <td className="description-cell">
                                    {module.description ? module.description.substring(0, 100) + '...' : 'N/A'}
                                </td>
                                {isScheduler && (
                                    <td className="actions-cell">
                                        <button 
                                            onClick={() => handleEdit(module)} 
                                            className="action-button edit"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(module.id)} 
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

export default ModuleManagement;