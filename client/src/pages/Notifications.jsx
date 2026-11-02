import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI, announcementAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALERTS'); // 'ALERTS' or 'ANNOUNCEMENTS'
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'UNREAD', 'URGENT'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const [notifRes, annRes] = await Promise.allSettled([
        notificationAPI.getNotifications(),
        announcementAPI.getPublished()
      ]);

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.notifications || []);
        setUnreadCount(notifRes.value.unreadCount || 0);
      }
      if (annRes.status === 'fulfilled') {
        setAnnouncements(annRes.value.announcements || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('notifications:refresh', handleRefresh);
    return () => window.removeEventListener('notifications:refresh', handleRefresh);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      console.error(err);
    }
  };

  const getReminderBadge = (type) => {
    switch (type) {
      case '30_DAYS':
        return <span className="badge bg-primary bg-opacity-10 text-primary">30-Day Reminder</span>;
      case '15_DAYS':
        return <span className="badge bg-warning bg-opacity-25 text-warning-emphasis">15-Day Reminder</span>;
      case '7_DAYS':
        return <span className="badge bg-danger bg-opacity-10 text-danger fw-semibold">7-Day Reminder</span>;
      case 'URGENT_EXPIRY':
        return <span className="badge bg-danger text-white fw-semibold">Urgent Expiry</span>;
      case 'EXPIRES_TODAY':
        return <span className="badge bg-danger text-white fw-bold">Expires Today</span>;
      case 'EXPIRED_ALERT':
        return <span className="badge bg-dark text-white">Expired</span>;
      case 'RENEWAL_CONFIRMATION':
        return <span className="badge bg-success bg-opacity-10 text-success">Renewed</span>;
      default:
        return <span className="badge bg-secondary">Notice</span>;
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'URGENT') {
      return (
        n.reminderType === '7_DAYS' ||
        n.reminderType === 'URGENT_EXPIRY' ||
        n.reminderType === 'EXPIRES_TODAY' ||
        n.reminderType === 'EXPIRED_ALERT'
      );
    }
    return true;
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
              Notifications
            </h3>
            <p className="text-muted small mb-0">
              Certificate expiry reminders and alerts.
            </p>
          </div>

          <div className="d-flex gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-medium"
                onClick={handleMarkAllRead}
              >
                <i className="bi bi-check2-all me-1"></i> Mark all read
              </button>
            )}
            <Link to="/documents" className="btn btn-sm btn-navy">
              <i className="bi bi-folder me-1"></i> Document Tracker
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="card custom-card mb-4 border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-0">
            <ul className="nav nav-tabs border-0 px-3 pt-2">
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold border-0 py-3 ${
                    activeTab === 'ALERTS'
                      ? 'active text-primary border-bottom border-primary border-3'
                      : 'text-muted'
                  }`}
                  onClick={() => setActiveTab('ALERTS')}
                >
                  <i className="bi bi-bell me-2"></i> Document Alerts ({notifications.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold border-0 py-3 ${
                    activeTab === 'ANNOUNCEMENTS'
                      ? 'active text-primary border-bottom border-primary border-3'
                      : 'text-muted'
                  }`}
                  onClick={() => setActiveTab('ANNOUNCEMENTS')}
                >
                  <i className="bi bi-megaphone me-2"></i> Official Announcements ({announcements.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {activeTab === 'ANNOUNCEMENTS' ? (
          loading ? (
            <LoadingSpinner message="Loading official announcements..." />
          ) : announcements.length === 0 ? (
            <div className="card custom-card p-5 text-center text-muted border-0 shadow-sm">
              <i className="bi bi-megaphone fs-1 text-secondary mb-3"></i>
              <h5 className="fw-bold text-dark mb-1">No announcements available.</h5>
              <p className="text-muted small mb-0">Check back later for official scholarship advisories and portal notices.</p>
            </div>
          ) : (
            <div className="row g-3">
              {announcements.map((ann) => (
                <div key={ann._id} className="col-md-6">
                  <div
                    className="card h-100 shadow-sm border p-4 rounded-3"
                    style={{ borderLeft: '4px solid var(--primary-blue, #2563eb)' }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 small">
                        {ann.category || 'General'}
                      </span>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-calendar3 me-1"></i>
                        {ann.publishedAt
                          ? new Date(ann.publishedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : ann.createdAt
                          ? new Date(ann.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Recent'}
                      </span>
                    </div>
                    <h5 className="fw-bold text-navy mb-2" style={{ color: 'var(--primary-navy)' }}>
                      {ann.title}
                    </h5>
                    <p className="text-secondary small mb-0" style={{ lineHeight: '1.6' }}>
                      {ann.message || ann.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="d-flex gap-2 mb-4">
              <button
                className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary-blue' : 'btn-light border'} fw-medium`}
                onClick={() => setFilter('ALL')}
              >
                All ({notifications.length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'UNREAD' ? 'btn-primary-blue' : 'btn-light border'} fw-medium`}
                onClick={() => setFilter('UNREAD')}
              >
                Unread ({unreadCount})
              </button>
              <button
                className={`btn btn-sm ${filter === 'URGENT' ? 'btn-primary-blue' : 'btn-light border'} fw-medium`}
                onClick={() => setFilter('URGENT')}
              >
                Urgent (&le; 7 Days)
              </button>
            </div>

        {/* Notifications List */}
        {loading ? (
          <LoadingSpinner message="Loading notifications..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="bi-bell-slash"
            title="No Notifications Found"
            description="No active document expiry alerts in this category."
          />
        ) : (
          <div className="card custom-card shadow-sm border-0">
            <div className="list-group list-group-flush">
              {filtered.map((item) => (
                <div
                  key={item._id}
                  className={`list-group-item p-3 p-md-4 border-bottom ${
                    !item.isRead ? 'bg-light' : 'bg-white'
                  }`}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className={`rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 mt-1 ${
                        item.reminderType === '7_DAYS' || item.reminderType === 'EXPIRED_ALERT'
                          ? 'bg-danger bg-opacity-10 text-danger'
                          : 'bg-primary bg-opacity-10 text-primary'
                      }`}
                      style={{ width: '42px', height: '42px' }}
                    >
                      <i
                        className={`bi ${
                          item.reminderType === '7_DAYS' || item.reminderType === 'EXPIRED_ALERT'
                            ? 'bi-exclamation-triangle-fill'
                            : item.reminderType === 'RENEWAL_CONFIRMATION'
                            ? 'bi-check2-circle'
                            : 'bi-bell-fill'
                        } fs-5`}
                      ></i>
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-1">
                        <div>
                          <span className="me-2">{getReminderBadge(item.reminderType)}</span>
                          <span className="fw-bold text-dark">{item.title}</span>
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <p className="text-secondary small mb-2">{item.message}</p>

                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-light">
                        <div className="small text-muted">
                          {item.expiryDate && (
                            <span>
                              Expires:{' '}
                              <strong className="text-dark">
                                {new Date(item.expiryDate).toLocaleDateString('en-IN')}
                              </strong>
                            </span>
                          )}
                        </div>

                        <div className="d-flex gap-2">
                          <Link to="/documents" className="btn btn-sm btn-outline-primary py-0 px-2 small">
                            View Document
                          </Link>
                          {!item.isRead && (
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-decoration-none py-0 px-2 small text-muted"
                              onClick={() => handleMarkAsRead(item._id)}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </>
      )}
      </main>
    </div>
  );
};

export default Notifications;
