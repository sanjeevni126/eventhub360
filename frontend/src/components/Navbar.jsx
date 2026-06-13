import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Simple navigate to clear react state easily for beginner code
    navigate('/login', { replace: true });
  };

  return (
    <div className="navbar">
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/employees">Employee List</Link>
      <Link to="/add-employee">Add Employee</Link>
      <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Logout</a>
    </div>
  );
}

export default Navbar;
