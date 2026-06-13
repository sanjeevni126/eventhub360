import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

function LeaveManagement() {
  const [activeTab, setActiveTab] = useState('Apply Leave');
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  // Pagination & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchLeaves();
    fetchLeaveTypes();
    fetchBalances();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaves(data);
      }
    } catch (err) {}
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves/types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data);
        if (data.length > 0) setLeaveTypeId(data[0].id);
      }
    } catch (err) {}
  };

  const fetchBalances = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves/balances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setBalances(await response.json());
      }
    } catch (err) {}
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveTypeId || !fromDate || !toDate) return alert('Please fill dates and leave type');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leave_type_id: leaveTypeId, from_date: fromDate, to_date: toDate, reason })
      });
      if (response.ok) {
        alert('Leave Applied Successfully');
        setFromDate(''); setToDate(''); setReason('');
        fetchLeaves();
        setActiveTab('All Requests');
      } else {
        alert('Failed to apply leave');
      }
    } catch (err) {}
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchLeaves();
      }
    } catch (err) {}
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(leaves);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaves");
    XLSX.writeFile(wb, "leaves_export.xlsx");
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    return <span className={`badge badge-${s}`}>{status}</span>;
  };

  const userRole = (user.role || '').toLowerCase();
  const canApprove = userRole === 'hr' || userRole === 'admin' || userRole === 'manager';

  const filteredLeaves = leaves.filter(leave => 
    (leave.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (leave.leave_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (leave.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);

  return (
    <div>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'Apply Leave' ? 'active' : ''}`} onClick={() => setActiveTab('Apply Leave')}>Apply Leave</button>
        <button className={`tab-btn ${activeTab === 'All Requests' ? 'active' : ''}`} onClick={() => setActiveTab('All Requests')}>All Requests</button>
        <button className={`tab-btn ${activeTab === 'Leave Balance' ? 'active' : ''}`} onClick={() => setActiveTab('Leave Balance')}>Leave Balance</button>
      </div>

      <div className="table-container">
        {activeTab === 'Apply Leave' && (
          <div>
            <h3 style={{marginBottom: '20px'}}>Apply for Leave</h3>
            <form onSubmit={handleApplyLeave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Employee</label>
                  <input type="text" value={user.name || ''} disabled />
                </div>
                <div className="form-group">
                  <label>Leave Type</label>
                  <select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)}>
                    {leaveTypes.map(lt => (
                      <option key={lt.id} value={lt.id}>{lt.leave_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>From Date</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>To Date</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea placeholder="Enter reason..." value={reason} onChange={e => setReason(e.target.value)}></textarea>
              </div>
              <button type="submit" className="submit-btn">Submit Application</button>
            </form>
          </div>
        )}

        {activeTab === 'All Requests' && (
          <div>
            <div className="table-header">
              <h3>Leave Requests</h3>
              <div className="table-actions">
                <input 
                  type="text" 
                  placeholder="Search leaves..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
                <button className="btn-add" style={{backgroundColor: 'var(--success-color)'}} onClick={handleExport}>Export to Excel</button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {canApprove && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.employee_name}</td>
                    <td>{leave.leave_type}</td>
                    <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                    <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                    <td>{leave.reason}</td>
                    <td>{getStatusBadge(leave.status)}</td>
                    {canApprove && (
                      <td>
                        {leave.status === 'Pending' && (
                          <div className="action-links">
                            <button className="btn-action btn-approve" onClick={() => handleUpdateStatus(leave.id, 'Approved')}>Approve</button>
                            <button className="btn-action btn-reject" onClick={() => handleUpdateStatus(leave.id, 'Rejected')}>Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr><td colSpan={canApprove ? "7" : "6"}>No leave requests found.</td></tr>
                )}
              </tbody>
            </table>

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
          </div>
        )}

        {activeTab === 'Leave Balance' && (
          <div>
            <h3 style={{marginBottom: '20px'}}>Leave Balance</h3>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Casual</th>
                  <th>Sick</th>
                  <th>Earned</th>
                  <th>Maternity</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.id}>
                    <td>{b.employee}</td>
                    <td>{b.Casual}</td>
                    <td>{b.Sick}</td>
                    <td>{b.Earned}</td>
                    <td>{b.Maternity}</td>
                  </tr>
                ))}
                {balances.length === 0 && (
                  <tr><td colSpan="5">No leave balances found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaveManagement;
