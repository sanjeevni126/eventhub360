import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

function EmployeeForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [skills, setSkills] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && location.state && location.state.employee) {
      const emp = location.state.employee;
      setName(emp.name || '');
      setEmail(emp.email || '');
      setPhone(emp.phone || '');
      setDepartment(emp.department || '');
      setSkills(emp.skills || '');
      setProfileImage(emp.profile_image_url || '');
    }
  }, [isEditing, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and Email are required.');
      return;
    }
    setError('');

    const payload = {
      name,
      email,
      phone,
      department,
      skills,
      profile_image_url: profileImage
    };

    const url = isEditing ? `https://employee-management-api-lf6s.onrender.com/api/employees/${id}` : 'https://employee-management-api-lf6s.onrender.com/api/employees';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate('/employees');
      } else {
        const data = await response.json();
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    }
  };

  return (
    <div className="form-page-wrapper">
      <div className="form-card-container">
        <div className="form-card-header">
          <div className="header-icon-badge">👤</div>
          <div>
            <h2>{isEditing ? 'Edit Employee Profile' : 'Add New Employee'}</h2>
            <p className="subtitle">Fill in the employee details below to register or update them.</p>
          </div>
        </div>
        
        {error && <div className="form-error-banner">⚠️ {error}</div>}
        
        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-grid">
            <div className="form-group-item">
              <label>Full Name <span className="required-star">*</span></label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. John Doe"
                className="custom-input"
              />
            </div>
            
            <div className="form-group-item">
              <label>Email Address <span className="required-star">*</span></label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="e.g. john.doe@company.com"
                className="custom-input"
              />
            </div>
            
            <div className="form-group-item">
              <label>Phone Number</label>
              <input 
                type="text" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="e.g. +1 (555) 019-2834"
                className="custom-input"
              />
            </div>
            
            <div className="form-group-item">
              <label>Department</label>
              <input 
                type="text" 
                value={department} 
                onChange={e => setDepartment(e.target.value)} 
                placeholder="e.g. Engineering, Sales, HR"
                className="custom-input"
              />
            </div>
            
            <div className="form-group-item full-width">
              <label>Skills <span className="label-helper">(Comma-separated)</span></label>
              <input 
                type="text" 
                value={skills} 
                onChange={e => setSkills(e.target.value)} 
                placeholder="e.g. React, Node.js, SQL, AWS"
                className="custom-input"
              />
            </div>
            
            <div className="form-group-item full-width">
              <label>Profile Image URL</label>
              <input 
                type="text" 
                value={profileImage} 
                onChange={e => setProfileImage(e.target.value)} 
                placeholder="e.g. https://images.unsplash.com/photo-..."
                className="custom-input"
              />
            </div>
          </div>
          
          <div className="form-actions-row">
            <button type="button" className="btn-secondary-custom" onClick={() => navigate('/employees')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-custom">
              {isEditing ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeForm;
