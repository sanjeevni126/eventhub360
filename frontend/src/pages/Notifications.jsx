import React, { useState, useEffect } from 'react';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(await response.json());
      }
    } catch (err) {}
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Employee': return '👤';
      case 'Auth': return '🔐';
      case 'Leave': return '📅';
      case 'Asset': return '💻';
      case 'Department': return '🏢';
      default: return '🔔';
    }
  };

  return (
    <div>
      <h3 style={{marginBottom: '20px'}}>Notifications</h3>
      <div className="table-container" style={{ padding: '24px' }}>
        {notifications.length === 0 ? (
          <p>No notifications found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(notif => (
              <div key={notif.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '15px 0', 
                borderBottom: '1px solid #eee' 
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  marginRight: '20px', 
                  backgroundColor: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(notif.type)}
                </div>
                <div>
                  <div style={{ fontSize: '15px', color: '#333' }}>
                    {notif.title}: {notif.message}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
