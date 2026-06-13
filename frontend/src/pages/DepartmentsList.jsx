import React, { useState, useEffect } from 'react';

function DepartmentsList() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { role: 'employee' };
  const canEdit = user.role === 'hr' || user.role === 'admin';

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('https://employee-management-api-lf6s.onrender.com/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (err) {}
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) return alert('Name is required');
    try {
      const response = await fetch('https://employee-management-api-lf6s.onrender.com/api/departments', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ department_name: newDepartmentName })
      });
      if (response.ok) {
        setShowModal(false);
        setNewDepartmentName('');
        fetchDepartments();
      } else {
        alert('Failed to add department. It might already exist.');
      }
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? Employees assigned to it will have their department cleared.')) return;
    try {
      const response = await fetch(`https://employee-management-api-lf6s.onrender.com/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchDepartments();
    } catch (err) {}
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Departments</h3>
        <div className="table-actions">
          {canEdit && (
            <button className="btn-add" onClick={() => setShowModal(true)}>+ Add Department</button>
          )}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Department Name</th>
            <th>Employees</th>
            {canEdit && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {departments.map((dept, index) => (
            <tr key={dept.id}>
              <td>{index + 1}</td>
              <td><strong>{dept.department_name}</strong></td>
              <td>{dept.employee_count}</td>
              {canEdit && (
                <td className="action-links">
                  <button className="btn-action btn-delete" onClick={() => handleDelete(dept.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
          {departments.length === 0 && (
            <tr><td colSpan={canEdit ? "4" : "3"}>No departments found.</td></tr>
          )}
        </tbody>
      </table>

      {/* Add Department Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px'}}>
            <div className="modal-header">
              <h2>Add Department</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <div className="form-group">
              <label>Department Name *</label>
              <input 
                type="text" 
                value={newDepartmentName} 
                onChange={e => setNewDepartmentName(e.target.value)} 
                placeholder="e.g. Graphic Design"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-save" onClick={handleAddDepartment}>Save</button>
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentsList;
