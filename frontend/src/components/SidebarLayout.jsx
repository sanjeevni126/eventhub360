import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const SidebarLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'User', role: 'guest' };
  const token = localStorage.getItem('token');

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toasts, setToasts] = useState([]);
  const dropdownRef = useRef(null);
  const isInitialFetch = useRef(true);

  // Helper to determine notification icon
  const getIcon = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('leave')) return '📅';
    if (t.includes('employee')) return '👤';
    if (t.includes('asset')) return '💻';
    if (t.includes('auth') || t.includes('password')) return '🔐';
    if (t.includes('department')) return '🏢';
    return '🔔';
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch('https://employee-management-api-lf6s.onrender.com/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Setup read status tracking for local storage on global notifications
        const readGlobalIds = JSON.parse(localStorage.getItem('read_global_notifications') || '[]');

        if (isInitialFetch.current) {
          setNotifications(data);
          isInitialFetch.current = false;
        } else {
          // Compare and find brand new unread notifications to trigger toasts
          const newNotifications = data.filter(notif => {
            const isBrandNew = !notifications.some(existing => existing.id === notif.id);
            const isUnread = notif.user_id !== null ? !notif.is_read : !readGlobalIds.includes(notif.id);
            return isBrandNew && isUnread;
          });

          if (newNotifications.length > 0) {
            newNotifications.forEach(notif => {
              addToast(notif);
            });
          }
          setNotifications(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Add a toast popup
  const addToast = (notif) => {
    const id = notif.id || Date.now() + Math.random();
    const newToast = {
      id,
      title: notif.title,
      message: notif.message,
      icon: getIcon(notif.title)
    };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5s
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Read status helpers
  const getReadGlobalIds = () => {
    return JSON.parse(localStorage.getItem('read_global_notifications') || '[]');
  };

  const isNotifUnread = (notif) => {
    if (notif.user_id !== null) {
      return !notif.is_read;
    } else {
      const readGlobalIds = getReadGlobalIds();
      return !readGlobalIds.includes(notif.id);
    }
  };

  const markAsRead = async (notif) => {
    if (notif.user_id !== null) {
      // User specific notification
      try {
        const response = await fetch(`https://employee-management-api-lf6s.onrender.com/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setNotifications(prev => 
            prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
          );
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    } else {
      // Global notification - track in local storage
      const readGlobalIds = getReadGlobalIds();
      if (!readGlobalIds.includes(notif.id)) {
        const updated = [...readGlobalIds, notif.id];
        localStorage.setItem('read_global_notifications', JSON.stringify(updated));
        // Force refresh notifications state
        setNotifications(prev => [...prev]);
      }
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(isNotifUnread);
    if (unreadNotifs.length === 0) return;

    // Separate user-specific and global
    const userSpecificUnread = unreadNotifs.filter(n => n.user_id !== null);
    const globalUnread = unreadNotifs.filter(n => n.user_id === null);

    // Mark user-specific read on backend
    for (const notif of userSpecificUnread) {
      try {
        await fetch(`https://employee-management-api-lf6s.onrender.com/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Mark global read in local storage
    if (globalUnread.length > 0) {
      const readGlobalIds = getReadGlobalIds();
      const newReadGlobalIds = [...new Set([...readGlobalIds, ...globalUnread.map(n => n.id)])];
      localStorage.setItem('read_global_notifications', JSON.stringify(newReadGlobalIds));
    }

    // Refresh notifications list
    fetchNotifications();
  };

  const isNotificationEnabled = user.role === 'admin' || user.role === 'hr' || user.role === 'manager';

  // Poll notifications
  useEffect(() => {
    if (isNotificationEnabled) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [isNotificationEnabled]);

  // Handle clicking outside notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const unreadCount = notifications.filter(isNotifUnread).length;

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Employee Central</h2>
          <span>Portal</span>
        </div>
        <div className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            📊 Dashboard
          </NavLink>
          {(user.role === 'admin' || user.role === 'hr' || user.role === 'manager') && (
            <>
              <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>
                👥 Employees
              </NavLink>
              <NavLink to="/departments" className={({ isActive }) => isActive ? 'active' : ''}>
                🏢 Departments
              </NavLink>
            </>
          )}
          <NavLink to="/leaves" className={({ isActive }) => isActive ? 'active' : ''}>
            📅 Leave Management
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>
            ⏰ Attendance
          </NavLink>
          {(user.role === 'admin' || user.role === 'hr' || user.role === 'manager') && (
            <>
              <NavLink to="/payroll" className={({ isActive }) => isActive ? 'active' : ''}>
                💵 Payroll
              </NavLink>
              <NavLink to="/assets" className={({ isActive }) => isActive ? 'active' : ''}>
                💻 Assets
              </NavLink>
            </>
          )}
          {(user.role === 'admin' || user.role === 'hr') && (
            <>
              <NavLink to="/audit" className={({ isActive }) => isActive ? 'active' : ''}>
                📋 Audit Log
              </NavLink>
              <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                📈 Reports
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <div className="top-header">
          <h3>{title || 'Dashboard'}</h3>
          <div className="header-user-info" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notification Bell Widget */}
            {isNotificationEnabled && (
              <div className="notification-bell-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`} 
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', position: 'relative', padding: '5px', display: 'flex', alignItems: 'center', color: 'var(--primary-color)' }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <button type="button" className="mark-all-read-btn" onClick={markAllAsRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="notification-dropdown-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">No notifications</div>
                      ) : (
                        notifications.map(notif => {
                          const unread = isNotifUnread(notif);
                          return (
                            <div 
                              key={notif.id} 
                              className={`notification-dropdown-item ${unread ? 'unread' : ''}`}
                              onClick={() => markAsRead(notif)}
                            >
                              <span className="notification-item-icon">
                                {getIcon(notif.title)}
                              </span>
                              <div className="notification-item-content">
                                <p className="notification-item-title">
                                  <strong>{notif.title}</strong>
                                </p>
                                <p className="notification-item-msg">{notif.message}</p>
                                <span className="notification-item-time">
                                  {new Date(notif.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              {unread && <span className="unread-dot"></span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <span>Welcome, <strong>{user.name}</strong> | <span style={{textTransform:'capitalize'}}>{user.role}</span></span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Scrollable Page Content */}
        <div className="page-content">
          {children}
        </div>
      </div>

      {/* Toast Notifications Container */}
      {isNotificationEnabled && (
        <div className="toast-notifications-container">
          {toasts.map(toast => (
            <div key={toast.id} className="toast-notification-item">
              <span className="toast-icon">{toast.icon}</span>
              <div className="toast-body">
                <h5 className="toast-title">{toast.title}</h5>
                <p className="toast-message">{toast.message}</p>
              </div>
              <button type="button" className="toast-close-btn" onClick={() => removeToast(toast.id)}>
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarLayout;
