import React, { useState, useEffect } from 'react';

function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const canAssign = user.role === 'admin' || user.role === 'hr';

  useEffect(() => {
    fetchAssets();
    if (canAssign) fetchEmployees();
  }, [canAssign]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('https://employee-management-api-lf6s.onrender.com/api/assets', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setAssets(data.data || data);
      }
    } catch (e) {}
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://employee-management-api-lf6s.onrender.com/api/employees', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        setEmployees(await response.json());
      }
    } catch (e) {}
  };

  const openAllocateModal = (asset) => {
    setSelectedAsset(asset);
    setSelectedEmployee('');
    setShowAllocateModal(true);
  };

  const handleAllocate = async () => {
    if (!selectedEmployee) return alert('Select an employee');
    try {
      const response = await fetch(`https://employee-management-api-lf6s.onrender.com/api/assets/allocate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assetId: selectedAsset.id, employeeId: selectedEmployee })
      });
      if (response.ok) {
        alert('Asset Allocated Successfully');
        setShowAllocateModal(false);
        fetchAssets();
      } else {
        alert('Failed to allocate asset');
      }
    } catch (err) {
      alert('Error allocating asset');
    }
  };

  const handleRevoke = async (asset) => {
    if(!window.confirm('Revoke this asset?')) return;
    try {
      const response = await fetch(`https://employee-management-api-lf6s.onrender.com/api/assets/${asset.id}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchAssets();
    } catch (err) {}
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'available') return <span className="badge badge-approved">{status}</span>;
    if (s === 'allocated') return <span className="badge badge-manager">{status}</span>;
    return <span className="badge badge-pending">{status}</span>;
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>All Assets</h3>
        <div className="table-actions">
          {canAssign && <button className="btn-add">+ Add Asset</button>}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Asset Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Assigned To</th>
            {canAssign && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => (
            <tr key={asset.id}>
              <td>{index + 1}</td>
              <td>{asset.asset_code}</td>
              <td>{asset.asset_name}</td>
              <td>{asset.asset_type}</td>
              <td>{getStatusBadge(asset.status)}</td>
              <td>{asset.assigned_to || '-'}</td>
              {canAssign && (
                <td>
                  {asset.status === 'Available' ? (
                    <button className="btn-action btn-approve" onClick={() => openAllocateModal(asset)}>Allocate</button>
                  ) : (
                    <button className="btn-action btn-reject" onClick={() => handleRevoke(asset)}>Revoke</button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {assets.length === 0 && (
            <tr><td colSpan={canAssign ? 7 : 6}>No assets found.</td></tr>
          )}
        </tbody>
      </table>

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px'}}>
            <div className="modal-header">
              <h2>Allocate Asset</h2>
              <button className="close-btn" onClick={() => setShowAllocateModal(false)}>&times;</button>
            </div>
            
            <p><strong>Asset:</strong> {selectedAsset?.asset_name} ({selectedAsset?.asset_code})</p>

            <div className="form-group" style={{marginTop: '20px'}}>
              <label>Assign To Employee *</label>
              <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} - {emp.department}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-save" onClick={handleAllocate}>Allocate</button>
              <button className="btn-cancel" onClick={() => setShowAllocateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetManagement;
