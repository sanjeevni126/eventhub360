import React, { useState, useEffect } from 'react';

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/audit', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setLogs(await response.json());
      }
    } catch (err) {}
  };

  const getModuleBadge = (moduleName) => {
    return <span className="badge badge-manager" style={{ textTransform: 'capitalize' }}>{moduleName}</span>;
  };

  const formatDetails = (log) => {
    if (!log.details) return '-';
    try {
      const data = typeof log.details === 'object' ? log.details : JSON.parse(log.details);
      
      // If we explicitly stored a message, use it
      if (data.message) return data.message;

      const moduleName = (log.module || '').toLowerCase();
      const actionName = (log.action || '').toUpperCase();

      // Format asset allocations
      if (moduleName === 'asset_allocations') {
        if (actionName === 'CREATE') {
          return `Allocated Asset (ID: ${data.asset_id}) to Employee (ID: ${data.employee_id})`;
        }
        if (actionName === 'UPDATE') {
          return `Returned Asset (ID: ${data.asset_id}) from Employee (ID: ${data.employee_id})`;
        }
      }

      // Format assets registration
      if (moduleName === 'assets') {
        if (actionName === 'CREATE') {
          return `Registered Asset: ${data.asset_name} (${data.asset_code})`;
        }
      }

      // Fallback formatting based on our previous basic JSON payloads
      if (moduleName === 'employee') {
        if (actionName === 'CREATE') return `Added Employee: ${data.name || 'Employee'}`;
        if (actionName === 'UPDATE') return `Updated Employee: ${data.name || 'Employee'}`;
        if (actionName === 'DELETE') return `Deleted Employee (ID: ${log.record_id})`;
      }
      
      if (moduleName === 'leave') {
        if (actionName === 'APPROVED LEAVE' || actionName === 'APPROVED') {
          return `Approved leave (Remarks: ${data.remarks || 'None'})`;
        }
        if (actionName === 'REJECTED LEAVE' || actionName === 'REJECTED') {
          return `Rejected leave (Remarks: ${data.remarks || 'None'})`;
        }
        if (actionName === 'APPLIED LEAVE' || actionName === 'CREATE') {
          return `Applied for leave (${data.total_days || ''} days, Reason: ${data.reason || 'None'})`;
        }
      }

      if (moduleName === 'asset') {
        if (actionName === 'ALLOCATE') {
          return `${data.asset_name || 'Asset'} → ${data.employee_name || 'Employee'}`;
        }
      }

      if (moduleName === 'department') {
        if (actionName === 'CREATE') {
          return `Added Department: ${data.department_name || 'Department'}`;
        }
      }
      
      // Check for common human-readable fields
      if (data.name) return `${log.action} ${data.name}`;
      if (data.asset_name) return `${log.action} ${data.asset_name}`;

      return JSON.stringify(data);
    } catch (e) {
      return String(log.details);
    }
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Audit Trail Log</h3>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Module</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={log.id}>
              <td>{index + 1}</td>
              <td style={{ color: '#888', fontSize: '13px' }}>
                {new Date(log.time).toLocaleString()}
              </td>
              <td>{log.user || 'System'}</td>
              <td><strong>{log.action}</strong></td>
              <td>{getModuleBadge(log.module)}</td>
              <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatDetails(log)}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan="6">No audit logs found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AuditLog;
