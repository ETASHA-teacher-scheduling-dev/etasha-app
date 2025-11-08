import React, { useState, useEffect, useCallback } from 'react';
import programService from '../api/programService'; // <-- THIS IS THE MISSING IMPORT
import authService from '../api/authService';
import './UserManagement.css'; // Reusing these styles for a consistent look
import '../components/Modal.css'; // Reusing the modal styles

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal and Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState = {
    id: null,
    program_name: '',
    description: '',
    duration_months: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Permissions
  const currentUser = authService.getCurrentUser();
  const isScheduler = currentUser && currentUser.role === 'scheduler';

  // --- Data Fetching ---
  const fetchPrograms = useCallback(() => {
    setLoading(true);
    programService.getAllPrograms({ search: searchTerm })
      .then(response => {
        setPrograms(response.data);
      })
      .catch(error => console.error("Error fetching programs:", error))
      .finally(() => setLoading(false));
  }, [searchTerm]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // --- Modal and Form Handlers ---
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (program) => {
    setIsEditing(true);
    setFormData({
      ...program,
      duration_months: program.duration_months || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = isEditing
      ? programService.updateProgram(formData.id, formData)
      : programService.createProgram(formData);
    
    action.then(() => {
      fetchPrograms();
      handleCloseModal();
    }).catch(err => {
      console.error("Failed to save program:", err.response);
      alert(`Error: ${err.response?.data?.message || 'Could not save program.'}`);
    });
  };

  const handleDeleteClick = (programId) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      programService.deleteProgram(programId).then(() => {
        fetchPrograms();
      });
    }
  };

  return (
    <div className="user-management-container">
      <div className="toolbar">
        <h2>Program Management</h2>
        {isScheduler && 
          <button className="add-user-btn" onClick={handleOpenAddModal}>
            Add Program
          </button>
        }
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by Program Name..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Program Name</th>
              <th>Description</th>
              <th>Duration (Months)</th>
              {isScheduler && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isScheduler ? 4 : 3}>Loading...</td></tr>
            ) : (
              programs.map(program => (
                <tr key={program.id}>
                  <td>{program.program_name}</td>
                  <td>{program.description}</td>
                  <td>{program.duration_months}</td>
                  {isScheduler && (
                    <td className="actions-cell">
                      <button className="action-btn edit" onClick={() => handleOpenEditModal(program)}>Edit</button>
                      <button className="action-btn delete" onClick={() => handleDeleteClick(program.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{isEditing ? 'Edit Program' : 'Add New Program'}</h2>
            <form onSubmit={handleSubmit}>
              <label>Program Name:</label>
              <input type="text" name="program_name" value={formData.program_name} onChange={handleInputChange} required />
              
              <label>Description:</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4"></textarea>

              <label>Duration (Months):</label>
              <input type="number" name="duration_months" value={formData.duration_months} onChange={handleInputChange} />
              
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal}>Cancel</button>
                <button type="submit">{isEditing ? 'Save Changes' : 'Add Program'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;