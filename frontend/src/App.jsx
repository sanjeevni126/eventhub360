import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import DepartmentsList from './pages/DepartmentsList';
import LeaveManagement from './pages/LeaveManagement';
import AssetManagement from './pages/AssetManagement';
import SidebarLayout from './components/SidebarLayout';
import Notifications from './pages/Notifications';
import AuditLog from './pages/AuditLog';
import Reports from './pages/Reports';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';

const PrivateRoute = ({ children, title }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Wrap all protected routes in the new SidebarLayout
  return <SidebarLayout title={title}>{children}</SidebarLayout>;
};

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Layout Routes */}
        <Route path="/dashboard" element={<PrivateRoute title="Dashboard"><Dashboard /></PrivateRoute>} />
        <Route path="/employees" element={<PrivateRoute title="Employees"><EmployeeList /></PrivateRoute>} />
        <Route path="/add-employee" element={<PrivateRoute title="Add Employee"><EmployeeForm /></PrivateRoute>} />
        <Route path="/edit-employee/:id" element={<PrivateRoute title="Edit Employee"><EmployeeForm /></PrivateRoute>} />
        <Route path="/departments" element={<PrivateRoute title="Departments"><DepartmentsList /></PrivateRoute>} />
        <Route path="/leaves" element={<PrivateRoute title="Leave Management"><LeaveManagement /></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute title="Attendance"><Attendance /></PrivateRoute>} />
        
        {/* Advanced ERP Routes */}
        <Route path="/assets" element={<PrivateRoute title="Assets"><AssetManagement /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute title="Notifications"><Notifications /></PrivateRoute>} />
        <Route path="/audit" element={<PrivateRoute title="Audit Trail Log"><AuditLog /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute title="Reports"><Reports /></PrivateRoute>} />
        <Route path="/payroll" element={<PrivateRoute title="Payroll Summary"><Payroll /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
