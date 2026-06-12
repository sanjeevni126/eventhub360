import React, { useState, useEffect } from 'react';
import '../App.css';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { role: 'employee' };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/attendance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/attendance/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTodayStatus(data.status);
      }
    } catch (err) {
      console.error('Error fetching today status:', err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchTodayStatus();
  }, [token]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert(data.message);
      fetchTodayStatus();
      fetchAttendance();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert(data.message);
      fetchTodayStatus();
      fetchAttendance();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString();
  };

  const isAdminOrHr = user.role === 'admin' || user.role === 'hr';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{isAdminOrHr ? 'Employee Attendance Log' : 'My Attendance'}</h2>
        {!isAdminOrHr && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            {!todayStatus ? (
              <button className="btn btn-primary" style={{width: 'auto'}} onClick={handleCheckIn} disabled={loading}>
                {loading ? 'Processing...' : 'Check In'}
              </button>
            ) : !todayStatus.check_out_time ? (
              <button className="btn btn-danger" style={{width: 'auto'}} onClick={handleCheckOut} disabled={loading}>
                {loading ? 'Processing...' : 'Check Out'}
              </button>
            ) : (
              <span style={{ padding: '0.5rem 1rem', background: 'var(--success-color)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>
                Completed for Today
              </span>
            )}
          </div>
        )}
      </div>

      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: isAdminOrHr ? '900px' : '600px' }}>
          <thead>
            <tr>
              {isAdminOrHr && <th>Employee Name</th>}
              {isAdminOrHr && <th>Department</th>}
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours Worked</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length > 0 ? (
              attendance.map((record) => {
                let hoursWorked = '-';
                if (record.check_in_time && record.check_out_time) {
                  const checkIn = new Date(record.check_in_time);
                  const checkOut = new Date(record.check_out_time);
                  const diffMs = checkOut - checkIn;
                  const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
                  hoursWorked = `${diffHrs} hrs`;
                }
                
                return (
                  <tr key={record.id}>
                    {isAdminOrHr && <td><strong>{record.employee_name || 'System User'}</strong></td>}
                    {isAdminOrHr && <td>{record.department_name || 'Unspecified'}</td>}
                    <td>{formatDate(record.date)}</td>
                    <td>{formatTime(record.check_in_time)}</td>
                    <td>{formatTime(record.check_out_time)}</td>
                    <td>{hoursWorked}</td>
                    <td>
                      <span className={`status-badge ${record.status === 'Present' ? 'status-active' : 'status-default'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={isAdminOrHr ? 7 : 5} style={{ textAlign: 'center' }}>No attendance records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
