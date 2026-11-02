import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../services/api';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnread = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Ignore background notification fetch errors
    }
  };

  const loadRecent = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.getNotifications();
      setRecentNotifications((res.notifications || []).slice(0, 4));
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const handleRefresh = () => {
      fetchUnread();
      if (dropdownOpen) {
        loadRecent();
      }
    };
    window.addEventListener('notifications:refresh', handleRefresh);
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:refresh', handleRefresh);
    };
  }, [dropdownOpen]);

  const toggleDropdown = () => {
    if (!dropdownOpen) {
      loadRecent();
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="position-relative">
      <button
        type="button"
        className="notification-bell-btn"
        onClick={toggleDropdown}
        title="Document Expiry Notifications"
      >
        <i className="bi bi-bell-fill fs-6"></i>
        {unreadCount > 0 && (
          <span className="notification-badge-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div
          className="dropdown-menu dropdown-menu-end show shadow-lg border-0 p-0"
          style={{
            position: 'absolute',
            top: '48px',
            right: '0',
            width: '320px',
            zIndex: 1050,
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}
        >
          <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-bold small text-navy" style={{ color: 'var(--primary-navy)' }}>
              Notifications ({unreadCount})
            </span>
            {unreadCount > 0 && (
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none small text-primary"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {loading ? (
              <div className="p-3 text-center text-muted small">Loading alerts...</div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-3 text-center text-muted small">No notifications yet.</div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-2 border-bottom ${!n.isRead ? 'bg-white fw-medium' : 'bg-light text-muted'}`}
                >
                  <div className="d-flex align-items-start gap-2">
                    <i
                      className={`bi ${
                        n.reminderType === '7_DAYS'
                          ? 'bi-exclamation-triangle-fill text-danger'
                          : 'bi-calendar-event text-warning'
                      } mt-1`}
                    ></i>
                    <div className="flex-grow-1" style={{ fontSize: '0.82rem' }}>
                      <div className="text-dark fw-semibold">{n.title}</div>
                      <div className="text-secondary small text-truncate" style={{ maxWidth: '240px' }}>
                        {n.message}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(n.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 text-center bg-light border-top">
            <Link
              to="/notifications"
              className="btn btn-sm btn-link text-decoration-none small fw-bold text-navy"
              onClick={() => setDropdownOpen(false)}
            >
              View All &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
