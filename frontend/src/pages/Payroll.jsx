import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

function Payroll() {
  const [payrollData, setPayrollData] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [workingMode, setWorkingMode] = useState('');

  
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDepartments();
    fetchPayroll();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('https://employee-management-api-lf6s.onrender.com/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setDepartments(await response.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayroll = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (city) queryParams.append('city', city);
      if (department) queryParams.append('department', department);
      if (workingMode) queryParams.append('workingMode', workingMode);


      const response = await fetch(`https://employee-management-api-lf6s.onrender.com/api/payroll?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setPayrollData(await response.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger search on filter changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayroll();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, city, department, workingMode]);

  const handleResetFilters = () => {
    setSearch('');
    setCity('');
    setDepartment('');
    setWorkingMode('');

  };

  const formatCurrency = (val) => {
    return '$' + Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleExport = () => {
    const exportData = payrollData.map(p => ({
      'Employee Name': p.name,
      'Email': p.email,
      'Domain (Dept)': p.department,
      'City': p.city,
      'Working Mode': p.working_mode,
      'Present': `${p.present_days} days`,
      'Absent': `${p.absent_days} days`,
      'Gross Salary': formatCurrency(p.gross_salary),
      'Total Deductions': `-${formatCurrency(p.total_deductions)}`,
      'Net Salary': formatCurrency(p.net_salary)
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll Summary");
    XLSX.writeFile(wb, `payroll_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Print-only stylesheet block to keep component self-contained */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .sidebar, .top-header, .no-print, .filters-card {
            display: none !important;
          }
          .main-content, .page-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .table-container {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #999 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Filters Section */}
      <div className="card filters-card no-print" style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          
          <div className="form-group-item">
            <label style={{ fontWeight: '600', marginBottom: '6px', fontSize: '13px', display: 'block' }}>Search Employee</label>
            <input 
              type="text" 
              placeholder="e.g. Bob Smith"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="custom-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div className="form-group-item">
            <label style={{ fontWeight: '600', marginBottom: '6px', fontSize: '13px', display: 'block' }}>City</label>
            <input 
              type="text" 
              placeholder="e.g. Pune"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="custom-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div className="form-group-item">
            <label style={{ fontWeight: '600', marginBottom: '6px', fontSize: '13px', display: 'block' }}>Domain (Department)</label>
            <select 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              className="custom-input"
              style={{ width: '100%', boxSizing: 'border-box', height: '40px' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.department_name}>{d.department_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group-item">
            <label style={{ fontWeight: '600', marginBottom: '6px', fontSize: '13px', display: 'block' }}>Working Mode</label>
            <select 
              value={workingMode} 
              onChange={(e) => setWorkingMode(e.target.value)}
              className="custom-input"
              style={{ width: '100%', boxSizing: 'border-box', height: '40px' }}
            >
              <option value="">All Modes</option>
              <option value="Onsite">Onsite</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>



        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={handleResetFilters} 
            className="btn-secondary-custom"
            style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reset Filters
          </button>
          <button 
            onClick={handleExport} 
            className="btn-add" 
            style={{ backgroundColor: '#28a745', border: 'none', padding: '8px 16px', fontSize: '14px', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            📥 Export CSV
          </button>
          <button 
            onClick={handlePrint} 
            className="btn-add" 
            style={{ backgroundColor: '#6f42c1', border: 'none', padding: '8px 16px', fontSize: '14px', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            🖨️ PDF Printable
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="table-container">
        <div className="table-header no-print">
          <h3>Payroll Summary Table</h3>
        </div>
        
        <table style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Domain (Dept)</th>
              <th>City</th>
              <th>Working Mode</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Gross Salary</th>
              <th>Total Deductions</th>
              <th>Net Salary</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.name}</strong>
                  <div style={{ fontSize: '11px', color: '#777', fontWeight: 'normal', marginTop: '2px' }}>{row.email}</div>
                </td>
                <td>{row.department}</td>
                <td>{row.city}</td>
                <td>
                  <span className={`status-badge`} style={{ 
                    backgroundColor: row.working_mode === 'Remote' ? '#e8f4fd' : row.working_mode === 'Hybrid' ? '#f3e5f5' : '#e8f5e9', 
                    color: row.working_mode === 'Remote' ? '#1976d2' : row.working_mode === 'Hybrid' ? '#7b1fa2' : '#2e7d32',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {row.working_mode}
                  </span>
                </td>
                <td style={{ fontWeight: '600' }}>{row.present_days} days</td>
                <td style={{ color: '#dc3545' }}>{row.absent_days} days</td>
                <td style={{ fontWeight: '500' }}>{formatCurrency(row.gross_salary)}</td>
                <td style={{ color: '#dc3545', fontWeight: '500' }}>
                  -{formatCurrency(row.total_deductions)}
                </td>
                <td style={{ color: '#28a745', fontWeight: 'bold' }}>
                  {formatCurrency(row.net_salary)}
                </td>
              </tr>
            ))}
            {payrollData.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#777' }}>
                  No payroll records found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Payroll;
