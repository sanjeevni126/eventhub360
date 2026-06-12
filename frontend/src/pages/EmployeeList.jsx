import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

function EmployeeList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const canEdit = user.role === 'admin' || user.role === 'hr';

  useEffect(() => {
    fetchEmployees();
    if (canEdit) {
      fetchDepartments();
      fetchSkills();
    }
  }, [canEdit]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/employees', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setEmployees(await response.json());
    } catch (err) {}
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/departments', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setDepartments(await response.json());
    } catch (err) {}
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/skills', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setAllSkills(await response.json());
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      const response = await fetch(`http://localhost:5001/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchEmployees();
    } catch (err) {}
  };

  const openEditModal = async (empId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/employees/${empId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setEditData(data);
        setShowModal(true);
      }
    } catch (err) {}
  };

  const handleModalSave = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/employees/${editData.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setShowModal(false);
        fetchEmployees();
      } else {
        alert('Failed to update employee');
      }
    } catch (err) {
      alert('Error updating employee');
    }
  };

  const toggleSkill = (skillId) => {
    setEditData(prev => {
      const skills = prev.skills || [];
      if (skills.includes(skillId)) {
        return { ...prev, skills: skills.filter(id => id !== skillId) };
      } else {
        return { ...prev, skills: [...skills, skillId] };
      }
    });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(employees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employees_export.xlsx");
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    return <span className={`badge badge-${r}`}>{r}</span>;
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.designation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Employee List</h3>
        <div className="table-actions">
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <button className="btn-add" style={{backgroundColor: '#28a745'}} onClick={handleExport}>Export to Excel</button>
          {canEdit && <button className="btn-add" onClick={() => navigate('/add-employee')}>+ Add Employee</button>}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Designation</th>
            <th>Department</th>
            <th>Phone</th>
            <th>Role</th>
            {canEdit && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {currentItems.map((emp, index) => (
            <tr key={emp.id}>
              <td>{indexOfFirstItem + index + 1}</td>
              <td><strong>{emp.name}</strong></td>
              <td>{emp.email}</td>
              <td>{emp.designation || '-'}</td>
              <td>{emp.department || '-'}</td>
              <td>{emp.phone || '-'}</td>
              <td>{getRoleBadge(emp.role)}</td>
              {canEdit && (
                <td className="action-links">
                  <button className="btn-action btn-edit" onClick={() => openEditModal(emp.id)}>Edit</button>
                  <button className="btn-action btn-delete" onClick={() => handleDelete(emp.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
          {currentItems.length === 0 && (
            <tr><td colSpan={canEdit ? "8" : "7"}>No employees found.</td></tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', gap: '10px' }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)}
            style={{ padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Prev
          </button>
          <span style={{ padding: '5px 10px' }}>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => prev + 1)}
            style={{ padding: '5px 10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showModal && editData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Employee</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={editData.department_id || ''} onChange={e => setEditData({...editData, department_id: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Designation</label>
                <input type="text" value={editData.designation || ''} onChange={e => setEditData({...editData, designation: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Salary</label>
                <input type="number" value={editData.salary || ''} onChange={e => setEditData({...editData, salary: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Role</label>
              <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Address (City)</label>
                <input type="text" value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Working Mode</label>
                <select value={editData.working_mode || 'Onsite'} onChange={e => setEditData({...editData, working_mode: e.target.value})}>
                  <option value="Onsite">Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Skills</label>
              <div className="skills-container">
                {allSkills.map(skill => {
                  const isActive = (editData.skills || []).includes(skill.id);
                  return (
                    <span 
                      key={skill.id} 
                      className={`skill-pill ${isActive ? 'active' : ''}`}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {skill.skill_name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-save" onClick={handleModalSave}>Save</button>
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeList;
