import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

function Reports() {
  const [activeTab, setActiveTab] = useState('Employee Report');
  const [data, setData] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  const fetchReportData = async (tab) => {
    let endpoint = '';
    if (tab === 'Employee Report') endpoint = 'employees';
    if (tab === 'Leave Report') endpoint = 'leaves';
    if (tab === 'Asset Report') endpoint = 'assets';

    try {
      const response = await fetch(`https://employee-management-api-lf6s.onrender.com/api/reports/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setData(await response.json());
      }
    } catch (err) {}
  };

  const getModeDisplay = (mode) => {
    if (!mode) return '-';
    const m = mode.toLowerCase();
    if (m === 'remote') return 'Online';
    if (m === 'onsite') return 'Offline';
    if (m === 'hybrid') return 'Hybrid';
    return mode;
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '-';
    }
  };

  const handleExport = () => {
    let exportData = data;
    if (activeTab === 'Employee Report') {
      exportData = data.map(row => ({
        'Name': row.name,
        'Email': row.email,
        'Department': row.department || '-',
        'Designation': row.designation || '-',
        'Salary': formatCurrency(row.salary),
        'Mode': getModeDisplay(row.working_mode),
        'Role': row.role
      }));
    } else if (activeTab === 'Leave Report') {
      exportData = data.map(row => ({
        'Employee': row.employee,
        'Type': row.type,
        'From': formatDate(row.from_date),
        'To': formatDate(row.to_date),
        'Days': row.days,
        'Status': row.status
      }));
    } else if (activeTab === 'Asset Report') {
      exportData = data.map(row => ({
        'Asset': row.asset,
        'Type': row.type,
        'Status': row.status,
        'Assigned To': row.assigned_to || '-'
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `${activeTab.toLowerCase().replace(' ', '_')}.xlsx`);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const s = status.toLowerCase();
    let badgeClass = `badge badge-${s}`;
    if (s === 'available') badgeClass = 'badge badge-approved'; // green
    if (s === 'assigned' || s === 'allocated') badgeClass = 'badge badge-manager'; // blue
    return <span className={badgeClass}>{status}</span>;
  };

  const getRoleBadge = (role) => {
    if (!role) return null;
    const r = role.toLowerCase();
    return <span className={`badge badge-${r}`}>{role}</span>;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '';
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  return (
    <div>
      <div className="tabs">
        {['Employee Report', 'Leave Report', 'Asset Report'].map(tab => (
          <button 
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>{activeTab}</h3>
          <div className="table-actions">
            <button className="btn-add" style={{backgroundColor: 'var(--success-color)'}} onClick={handleExport}>Export CSV</button>
          </div>
        </div>

        <table>
          {activeTab === 'Employee Report' && (
            <>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Mode</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.department || '-'}</td>
                    <td>{row.designation || '-'}</td>
                    <td>{formatCurrency(row.salary)}</td>
                    <td>
                      <span className="status-badge" style={{ 
                        backgroundColor: row.working_mode === 'Remote' ? '#e8f4fd' : row.working_mode === 'Hybrid' ? '#f3e5f5' : '#e8f5e9', 
                        color: row.working_mode === 'Remote' ? '#1976d2' : row.working_mode === 'Hybrid' ? '#7b1fa2' : '#2e7d32',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {getModeDisplay(row.working_mode)}
                      </span>
                    </td>
                    <td>{getRoleBadge(row.role)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {activeTab === 'Leave Report' && (
            <>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{row.employee}</td>
                    <td>{row.type}</td>
                    <td>{formatDate(row.from_date)}</td>
                    <td>{formatDate(row.to_date)}</td>
                    <td>{row.days}</td>
                    <td>{getStatusBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {activeTab === 'Asset Report' && (
            <>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{row.asset}</td>
                    <td>{row.type}</td>
                    <td>{getStatusBadge(row.status)}</td>
                    <td>{row.assigned_to || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
          
          {data.length === 0 && (
            <tbody>
              <tr><td colSpan="6">No records found.</td></tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

export default Reports;
