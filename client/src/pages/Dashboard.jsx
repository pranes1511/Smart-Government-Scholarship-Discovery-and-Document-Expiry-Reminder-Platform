import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import SchemeCard from '../components/SchemeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardAPI.getDashboardData();
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = data?.metrics || {
    totalSchemes: 0,
    potentiallyEligibleCount: 0,
    partiallyEligibleCount: 0,
    totalSavedDocuments: 0,
    expiringSoonCount: 0,
    expiredDocumentsCount: 0,
    unreadNotificationsCount: 0
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Welcome Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
              Welcome back, {user?.name || 'Student'}! 👋
            </h3>
            <p className="text-muted small mb-0">
              {user?.collegeName || 'Higher Education Student'} &bull; {user?.course || 'Undergraduate'} &bull; Year {user?.studyYear || 1}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/schemes" className="btn btn-sm btn-primary-blue d-flex align-items-center gap-1">
              <i className="bi bi-search"></i> Discover Schemes
            </Link>
            <Link to="/documents" className="btn btn-sm btn-navy d-flex align-items-center gap-1">
              <i className="bi bi-plus-circle"></i> Add Document
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Profile Completion Callout */}
        {!data?.hasCompletedProfile && !loading && (
          <div className="alert alert-warning border-warning border-opacity-50 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 p-3 rounded-3 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-info-circle-fill text-warning fs-3"></i>
              <div>
                <strong className="text-dark">Complete profile for accurate matching</strong>
                <div className="text-muted small">
                  Add your income, category, and marks to evaluate eligibility.
                </div>
              </div>
            </div>
            <Link to="/profile" className="btn btn-sm btn-warning text-dark fw-bold text-nowrap">
              Complete Profile &rarr;
            </Link>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Calculating personalized eligibility and fetching live metrics..." />
        ) : (
          <>
            {/* Key Summary Stat Cards - Balanced 6-Card Grid */}
            <div className="row g-3 mb-4">
              {/* 1. Matching Schemes */}
              <div className="col-lg-4 col-md-6">
                <div className="stat-card">
                  <div>
                    <div className="stat-label">Matching Schemes</div>
                    <div className="stat-number">
                      {metrics.potentiallyEligibleCount + metrics.partiallyEligibleCount}
                    </div>
                  </div>
                  <div className="stat-icon-wrapper stat-icon-blue">
                    <i className="bi bi-grid-fill"></i>
                  </div>
                </div>
              </div>

              {/* 2. Potentially Eligible */}
              <div className="col-lg-4 col-md-6">
                <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div>
                    <div className="stat-label">Potentially Eligible</div>
                    <div className="stat-number text-success">{metrics.potentiallyEligibleCount}</div>
                  </div>
                  <div className="stat-icon-wrapper stat-icon-green">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                </div>
              </div>

              {/* 3. Saved Documents */}
              <div className="col-lg-4 col-md-6">
                <div className="stat-card">
                  <div>
                    <div className="stat-label">Saved Documents</div>
                    <div className="stat-number">{metrics.totalSavedDocuments}</div>
                  </div>
                  <div className="stat-icon-wrapper stat-icon-purple">
                    <i className="bi bi-file-earmark-check-fill"></i>
                  </div>
                </div>
              </div>

              {/* 4. Expiring Documents */}
              <div className="col-lg-4 col-md-6">
                <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div>
                    <div className="stat-label">Expiring Documents</div>
                    <div className={`stat-number ${metrics.expiringSoonCount > 0 ? 'text-warning' : ''}`}>
                      {metrics.expiringSoonCount}
                    </div>
                  </div>
                  <div className="stat-icon-wrapper stat-icon-amber">
                    <i className="bi bi-clock-history"></i>
                  </div>
                </div>
              </div>

              {/* 5. Expired Documents */}
              <div className="col-lg-4 col-md-6">
                <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                  <div>
                    <div className="stat-label">Expired Documents</div>
                    <div className={`stat-number ${metrics.expiredDocumentsCount > 0 ? 'text-danger' : ''}`}>
                      {metrics.expiredDocumentsCount}
                    </div>
                  </div>
                  <div className="stat-icon-wrapper stat-icon-red">
                    <i className="bi bi-exclamation-octagon-fill"></i>
                  </div>
                </div>
              </div>

              {/* 6. Unread Alerts */}
              <div className="col-lg-4 col-md-6">
                <div className="stat-card">
                  <div>
                    <div className="stat-label">Unread Alerts</div>
                    <div className={`stat-number ${metrics.unreadNotificationsCount > 0 ? 'text-danger' : ''}`}>
                      {metrics.unreadNotificationsCount}
                    </div>
                  </div>
                  <div className="stat-icon-wrapper stat-icon-amber">
                    <i className="bi bi-bell-fill"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: Upcoming Expirations & Recent Activity */}
            <div className="row g-4 mb-4">
              {/* Upcoming Expirations */}
              <div className="col-lg-6">
                <div className="card custom-card h-100 shadow-sm">
                  <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                      <i className="bi bi-calendar-event me-2 text-warning"></i> Upcoming Expirations
                    </h6>
                    <Link to="/documents" className="btn btn-sm btn-link text-decoration-none small">
                      View All &rarr;
                    </Link>
                  </div>
                  <div className="card-body p-3">
                    {data.upcomingExpirations && data.upcomingExpirations.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {data.upcomingExpirations.map((item) => (
                          <div
                            key={item._id}
                            className="list-group-item d-flex justify-content-between align-items-center px-2 py-3 border-bottom"
                          >
                            <div>
                              <div className="fw-bold text-dark">{item.documentName}</div>
                              <div className="text-muted small">
                                Expires: {new Date(item.expiryDate).toLocaleDateString('en-IN')}
                              </div>
                            </div>
                            <div className="text-end">
                              <span className={`badge bg-${item.statusBadge} rounded-pill px-3 py-1 mb-1`}>
                                Expires in {item.daysRemaining} days
                              </span>
                              <div>
                                <Link to="/documents" className="small text-primary text-decoration-none fw-semibold">
                                  Renew &rarr;
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon="bi-shield-check"
                        title="All Documents Valid"
                        description="No documents expiring within 30 days."
                        actionLabel="View Documents"
                        onAction={() => window.location.assign('/documents')}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="col-lg-6">
                <div className="card custom-card h-100 shadow-sm">
                  <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                      <i className="bi bi-bell-fill me-2 text-primary"></i> Recent Activity
                    </h6>
                    <Link to="/notifications" className="btn btn-sm btn-link text-decoration-none small">
                      View All &rarr;
                    </Link>
                  </div>
                  <div className="card-body p-3">
                    {data.recentNotifications && data.recentNotifications.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {data.recentNotifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`list-group-item px-2 py-3 border-bottom ${!notif.isRead ? 'bg-light rounded' : ''}`}
                          >
                            <div className="d-flex align-items-start gap-2">
                              <i
                                className={`bi ${
                                  notif.reminderType === '7_DAYS' || notif.reminderType === 'EXPIRED_ALERT'
                                    ? 'bi-exclamation-triangle-fill text-danger'
                                    : 'bi-bell-fill text-warning'
                                } mt-1`}
                              ></i>
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-dark small">{notif.title}</div>
                                <div className="text-secondary small">{notif.message}</div>
                                <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                                  {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                              {!notif.isRead && (
                                <span className="badge bg-primary rounded-pill small">New</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon="bi-bell-slash"
                        title="No Recent Activity"
                        description="No active notifications."
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Portal Announcements */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white"
                    style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary-navy, #1e3a8a)' }}
                  >
                    <i className="bi bi-megaphone-fill small"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                      Official Portal Announcements
                    </h5>
                    <p className="text-muted small mb-0">
                      Scholarship alerts, portal updates, and official gazette notifications
                    </p>
                  </div>
                </div>
                <Link to="/notifications" className="btn btn-sm btn-outline-primary fw-medium">
                  View All &rarr;
                </Link>
              </div>

              {data?.announcements && data.announcements.length > 0 ? (
                <div className="row g-3">
                  {data.announcements.map((ann) => (
                    <div key={ann._id} className="col-lg-4 col-md-6">
                      <div
                        className="card h-100 shadow-sm border p-3 rounded-3"
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
                        <h6 className="fw-bold text-navy mb-2" style={{ color: 'var(--primary-navy)' }}>
                          {ann.title}
                        </h6>
                        <p className="text-secondary small mb-0" style={{ lineHeight: '1.5' }}>
                          {ann.message || ann.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card custom-card p-4 text-center text-muted">
                  <div className="d-flex justify-content-center mb-2">
                    <i className="bi bi-megaphone text-secondary fs-3"></i>
                  </div>
                  <div className="fw-medium text-dark">No announcements available.</div>
                  <div className="small text-muted">Check back later for official scholarship advisories and deadline extensions.</div>
                </div>
              )}
            </div>

            {/* Recommended Schemes Section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                    Recommended Schemes
                  </h5>
                  <p className="text-muted small mb-0">
                    Matched to your academic and income profile.
                  </p>
                </div>
                <Link to="/schemes" className="btn btn-sm btn-outline-primary fw-medium">
                  View All &rarr;
                </Link>
              </div>

              {data.recommendedSchemes && data.recommendedSchemes.length > 0 ? (
                <div className="row g-3">
                  {data.recommendedSchemes.map((scheme) => (
                    <div key={scheme._id} className="col-lg-4 col-md-6">
                      <SchemeCard scheme={scheme} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="bi-search"
                  title="No Recommendations Yet"
                  description="Complete your student profile to view personalized matches."
                  actionLabel="Complete Profile"
                  onAction={() => window.location.assign('/profile')}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
