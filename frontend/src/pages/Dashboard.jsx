import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({ 
    totalEmployees: 0, 
    totalDepartments: 0, 
    totalSkills: 0,
    pendingLeaves: 0, 
    approvedLeaves: 0,
    rejectedLeaves: 0,
    totalSalaryExpense: 0,
    departmentDistribution: [],
    workingModeDistribution: []
  });
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const token = localStorage.getItem('token');

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'User', role: 'guest' };
  const isEmployee = user.role === 'employee';

  useEffect(() => {
    if (!isEmployee) {
      fetchStats();
      fetchEmployees();
    }
    fetchLeaves();
  }, [isEmployee]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employees`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.slice(0, 5));
      }
    } catch (e) {}
  };

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAllLeaves(data);
        setLeaves(data.slice(0, 5));
      }
    } catch (e) {}
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    return <span className={`badge badge-${r}`}>{r}</span>;
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  // Chart Data
  const COLORS = ['#475569', '#10b981', '#f59e0b', '#ef4444'];
  
  const personalPending = allLeaves.filter(l => l.status === 'Pending').length;
  const personalApproved = allLeaves.filter(l => l.status === 'Approved').length;
  const personalRejected = allLeaves.filter(l => l.status === 'Rejected').length;

  const leaveData = (isEmployee 
    ? [
        { name: 'Pending', value: personalPending },
        { name: 'Approved', value: personalApproved },
        { name: 'Rejected', value: personalRejected },
      ]
    : [
        { name: 'Pending', value: stats.pendingLeaves || 0 },
        { name: 'Approved', value: stats.approvedLeaves || 0 },
        { name: 'Rejected', value: stats.rejectedLeaves || 0 },
      ]
  ).filter(item => item.value > 0);

  const salaryData = [
    { month: 'Jan', expense: Math.round((stats.totalSalaryExpense || 1137000) * 0.75) },
    { month: 'Feb', expense: Math.round((stats.totalSalaryExpense || 1137000) * 0.80) },
    { month: 'Mar', expense: Math.round((stats.totalSalaryExpense || 1137000) * 0.85) },
    { month: 'Apr', expense: Math.round((stats.totalSalaryExpense || 1137000) * 0.90) },
    { month: 'May', expense: Math.round((stats.totalSalaryExpense || 1137000) * 0.95) },
    { month: 'Jun', expense: stats.totalSalaryExpense || 1137000 },
  ];

  return (
    <div>
      {/* Welcome Banner for Employees */}
      {isEmployee && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 8px 0', color: 'var(--primary-blue)' }}>Welcome back, {user.name}!</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.5' }}>
            This is your personal Employee Portal. Here you can check your leave statuses, apply for leave, view your attendance history, and see your notifications.
          </p>
        </div>
      )}

      {/* Personal Leave Cards for Employees */}
      {isEmployee && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div className="stat-card orange" style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>My Pending Leaves</h4>
              <h2>{personalPending}</h2>
            </div>
            <div className="stat-card-icon">⏳</div>
          </div>
          <div className="stat-card green" style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>My Approved Leaves</h4>
              <h2>{personalApproved}</h2>
            </div>
            <div className="stat-card-icon">✅</div>
          </div>
          <div className="stat-card red" style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>My Rejected Leaves</h4>
              <h2>{personalRejected}</h2>
            </div>
            <div className="stat-card-icon">❌</div>
          </div>
        </div>
      )}

      {/* Admin/Manager Stats Cards */}
      {!isEmployee && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div className="stat-card blue" style={{ flex: '0 1 250px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>Total Employees</h4>
              <h2>{stats.totalEmployees}</h2>
            </div>
            <div className="stat-card-icon">👥</div>
          </div>
          <div className="stat-card blue" style={{ flex: '0 1 250px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>Total Departments</h4>
              <h2>{stats.totalDepartments}</h2>
            </div>
            <div className="stat-card-icon">🏢</div>
          </div>
          <div className="stat-card blue" style={{ flex: '0 1 250px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>Total Skills</h4>
              <h2>{stats.totalSkills}</h2>
            </div>
            <div className="stat-card-icon">🎯</div>
          </div>
          <div className="stat-card green" style={{ flex: '0 1 250px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>Salary Expense</h4>
              <h2>${stats.totalSalaryExpense.toLocaleString()}</h2>
            </div>
            <div className="stat-card-icon">💰</div>
          </div>
          <div className="stat-card orange" style={{ flex: '0 1 250px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>Pending Leaves</h4>
              <h2>{stats.pendingLeaves}</h2>
            </div>
            <div className="stat-card-icon">⏳</div>
          </div>
          <div className="stat-card green" style={{ flex: '0 1 250px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>Approved Leaves</h4>
              <h2>{stats.approvedLeaves}</h2>
            </div>
            <div className="stat-card-icon">✅</div>
          </div>
          <div className="stat-card red" style={{ flex: '0 1 250px', minWidth: '200px' }}>
            <div className="stat-card-info">
              <h4>Rejected Leaves</h4>
              <h2>{stats.rejectedLeaves}</h2>
            </div>
            <div className="stat-card-icon">❌</div>
          </div>
        </div>
      )}

      {/* Working Mode Overview Row */}
      {!isEmployee && (
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px', marginTop: '0', fontWeight: '600' }}>Working Mode Overview</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div className="stat-card blue" style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <div>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Online (Remote)</span>
                <h2 style={{ margin: '5px 0 0 0', fontSize: '28px', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                  {stats.workingModeDistribution?.find(m => m.name === 'Online')?.value || 0}
                </h2>
              </div>
              <div className="stat-card-icon">💻</div>
            </div>
            <div className="stat-card orange" style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <div>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hybrid</span>
                <h2 style={{ margin: '5px 0 0 0', fontSize: '28px', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                  {stats.workingModeDistribution?.find(m => m.name === 'Hybrid')?.value || 0}
                </h2>
              </div>
              <div className="stat-card-icon">🤝</div>
            </div>
            <div className="stat-card green" style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <div>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Offline (Onsite)</span>
                <h2 style={{ margin: '5px 0 0 0', fontSize: '28px', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                  {stats.workingModeDistribution?.find(m => m.name === 'Offline')?.value || 0}
                </h2>
              </div>
              <div className="stat-card-icon">🏢</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: isEmployee ? '1fr' : 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
        
        {/* Department Distribution Donut Chart */}
        {!isEmployee && (
          <div className="table-container" style={{ marginBottom: '0' }}>
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Department Distribution</h3>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>FTE Allocation</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.departmentDistribution && stats.departmentDistribution.length > 0 ? stats.departmentDistribution : [
                      { name: 'Engineering', value: 15 },
                      { name: 'Finance & Ops', value: 2 },
                      { name: 'Human Resources', value: 2 },
                      { name: 'Product Design', value: 3 },
                      { name: 'Product Management', value: 1 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(stats.departmentDistribution && stats.departmentDistribution.length > 0 ? stats.departmentDistribution : [
                      { name: 'Engineering', value: 15 },
                      { name: 'Finance & Ops', value: 2 },
                      { name: 'Human Resources', value: 2 },
                      { name: 'Product Design', value: 3 },
                      { name: 'Product Management', value: 1 }
                    ]).map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={['#00a884', '#475569', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6366f1'][index % 8]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} Employees`} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend matching the 3rd picture design */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 15px', padding: '10px', width: '100%' }}>
                {(stats.departmentDistribution && stats.departmentDistribution.length > 0 ? stats.departmentDistribution : [
                  { name: 'Engineering', value: 15 },
                  { name: 'Finance & Ops', value: 2 },
                  { name: 'Human Resources', value: 2 },
                  { name: 'Product Design', value: 3 },
                  { name: 'Product Management', value: 1 }
                ]).map((entry, index) => (
                  <span key={entry.name} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '13px', color: '#444', fontWeight: '500' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '9px', 
                      height: '9px', 
                      borderRadius: '50%', 
                      backgroundColor: ['#00a884', '#475569', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6366f1'][index % 8], 
                      marginRight: '6px' 
                    }}></span>
                    {entry.name} <span style={{ color: '#888', marginLeft: '4px', fontSize: '12px' }}>({entry.value})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pie Chart */}
        <div className="table-container" style={{ marginBottom: '0' }}>
          <div className="table-header"><h3>{isEmployee ? 'My Leave Breakdown' : 'Leave Status (Pie Chart)'}</h3></div>
          {leaveData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666', fontSize: '14px' }}>
              No leave records found.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 10, right: 60, left: 60, bottom: 10 }}>
                <Pie
                  data={leaveData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={65}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {leaveData.map((entry) => {
                    let fill = '#475569'; // fallback slate-grey
                    if (entry.name === 'Approved') fill = '#10b981'; // Emerald
                    if (entry.name === 'Pending') fill = '#f59e0b';  // Amber
                    if (entry.name === 'Rejected') fill = '#ef4444';  // Rose
                    return <Cell key={entry.name} fill={fill} />;
                  })}
                </Pie>
                  <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Working Mode Distribution Donut Chart */}
        {!isEmployee && (
          <div className="table-container" style={{ marginBottom: '0' }}>
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Working Mode Distribution</h3>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>FTE Schedule</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.workingModeDistribution && stats.workingModeDistribution.length > 0 ? stats.workingModeDistribution : [
                      { name: 'Online', value: 0 },
                      { name: 'Hybrid', value: 0 },
                      { name: 'Offline', value: 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(stats.workingModeDistribution && stats.workingModeDistribution.length > 0 ? stats.workingModeDistribution : [
                      { name: 'Online', value: 0 },
                      { name: 'Hybrid', value: 0 },
                      { name: 'Offline', value: 0 }
                    ]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Online' ? '#1976d2' : entry.name === 'Hybrid' ? '#7b1fa2' : '#2e7d32'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} Employees`} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 15px', padding: '10px', width: '100%' }}>
                {(stats.workingModeDistribution && stats.workingModeDistribution.length > 0 ? stats.workingModeDistribution : [
                  { name: 'Online', value: 0 },
                  { name: 'Hybrid', value: 0 },
                  { name: 'Offline', value: 0 }
                ]).map((entry) => (
                  <span key={entry.name} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '13px', color: '#444', fontWeight: '500' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '9px', 
                      height: '9px', 
                      borderRadius: '50%', 
                      backgroundColor: entry.name === 'Online' ? '#1976d2' : entry.name === 'Hybrid' ? '#7b1fa2' : '#2e7d32', 
                      marginRight: '6px' 
                    }}></span>
                    {entry.name} <span style={{ color: '#888', marginLeft: '4px', fontSize: '12px' }}>({entry.value})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Salary Expense (Area Chart) */}
        {!isEmployee && (
          <div className="table-container" style={{ marginBottom: '0' }}>
            <div className="table-header"><h3>Salary Expense (Area Chart)</h3></div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(val) => `$${val.toLocaleString()}`} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#fd7e14" fill="#fd7e14" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* Recent Employees Table */}
      {!isEmployee && (
        <div className="table-container">
          <div className="table-header">
            <h3>Recent Employees</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => (
                <tr key={emp.id}>
                  <td>{index + 1}</td>
                  <td>{emp.name}</td>
                  <td>{emp.designation || '-'}</td>
                  <td>{emp.department || '-'}</td>
                  <td>{getRoleBadge(emp.role)}</td>
                </tr>
              ))}
              {employees.length === 0 && <tr><td colSpan="5">No recent employees.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Leave Requests Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>{isEmployee ? 'My Recent Leave Applications' : 'Recent Leave Requests'}</h3>
        </div>
        <table>
          <thead>
            <tr>
              {isEmployee ? null : <th>Employee</th>}
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave.id}>
                {isEmployee ? null : <td>{leave.employee_name}</td>}
                <td>{leave.leave_type}</td>
                <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                <td>{getStatusBadge(leave.status)}</td>
              </tr>
            ))}
            {leaves.length === 0 && <tr><td colSpan={isEmployee ? 4 : 5}>No recent leave requests.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
