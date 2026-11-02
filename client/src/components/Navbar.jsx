import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  // Helper to check active tab for admin links with query params
  const isAdminTabActive = (tab) => {
    if (!isAdmin || location.pathname !== '/admin') return false;
    const params = new URLSearchParams(location.search);
    const currentTab = params.get('tab') || 'DASHBOARD';
    return currentTab === tab;
  };

  return (
    <nav className="navbar navbar-expand-lg app-navbar navbar-dark sticky-top">
      <div className="container-fluid px-3 px-lg-4">
        {/* Brand */}
        <Link
          to={isAdmin ? '/admin' : '/'}
          className="navbar-brand d-flex align-items-center gap-2 text-decoration-none"
        >
          <div
            className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
          >
            <i
              className={`bi ${isAdmin ? 'bi-shield-lock-fill text-danger' : 'bi-mortarboard-fill text-primary'} fs-5`}
            ></i>
          </div>
          <div>
            <span className="navbar-brand-text">SchemeSathi</span>
            <span className="navbar-brand-sub">
              {isAdmin ? 'Platform Administration Portal' : 'Student Discovery & Document Expiry'}
            </span>
          </div>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#appNavbarNav"
          aria-controls="appNavbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="appNavbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            {/* 1. ADMIN NAVIGATION */}
            {isAuthenticated && isAdmin && (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/admin?tab=DASHBOARD"
                    className={`nav-link nav-link-custom ${isAdminTabActive('DASHBOARD') ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-speedometer2 me-1"></i> Admin Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/admin?tab=SCHEMES"
                    className={`nav-link nav-link-custom ${isAdminTabActive('SCHEMES') ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-award me-1"></i> Manage Schemes
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/admin?tab=RULES"
                    className={`nav-link nav-link-custom ${isAdminTabActive('RULES') ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-sliders me-1"></i> Eligibility Rules
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/admin?tab=STUDENTS"
                    className={`nav-link nav-link-custom ${isAdminTabActive('STUDENTS') ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-people me-1"></i> Manage Students
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/admin?tab=VERIFICATION"
                    className={`nav-link nav-link-custom ${isAdminTabActive('VERIFICATION') ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-shield-check me-1"></i> Scheme Verification
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/admin?tab=ANNOUNCEMENTS"
                    className={`nav-link nav-link-custom ${isAdminTabActive('ANNOUNCEMENTS') ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-megaphone me-1"></i> Announcements
                  </NavLink>
                </li>
              </>
            )}

            {/* 2. STUDENT NAVIGATION */}
            {isAuthenticated && isStudent && (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/schemes"
                    className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-search me-1"></i> Schemes
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/compare"
                    className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-columns-gap me-1"></i> Compare
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-grid me-1"></i> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/documents"
                    className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-file-earmark-lock me-1"></i> Documents
                  </NavLink>
                </li>
              </>
            )}

            {/* 3. PUBLIC GUEST NAVIGATION */}
            {!isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/schemes"
                    className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-compass me-1"></i> Schemes
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/compare"
                    className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active text-white fw-bold' : ''}`}
                  >
                    <i className="bi bi-columns-gap me-1"></i> Compare
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          {/* Right Action Items */}
          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell ONLY for Students (Personal Expiry Alerts) */}
                {isStudent && <NotificationBell />}

                {/* User Dropdown */}
                <div className="dropdown">
                  <button
                    className="btn btn-sm btn-outline-light d-flex align-items-center gap-2 dropdown-toggle py-1 px-3 rounded-pill"
                    type="button"
                    id="userDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className={`bi ${isAdmin ? 'bi-shield-shaded text-warning' : 'bi-person-circle'}`}></i>
                    <span className="fw-medium text-truncate" style={{ maxWidth: '140px' }}>
                      {user?.name || (isAdmin ? 'Admin' : 'Student')}
                    </span>
                    {isAdmin && <span className="badge bg-danger ms-1 small">Admin</span>}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="userDropdown">
                    <li className="px-3 py-2 border-bottom">
                      <div className="fw-bold small text-navy">{user?.name}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
                        {user?.email}
                      </div>
                      <div className={`badge ${isAdmin ? 'bg-danger text-white' : 'bg-light text-secondary border'} mt-1`}>
                        {isAdmin ? 'System Administrator' : user?.course || 'Student'}
                      </div>
                    </li>

                    {/* Student Dropdown Options */}
                    {isStudent && (
                      <>
                        <li>
                          <Link to="/profile" className="dropdown-item py-2">
                            <i className="bi bi-person me-2 text-primary"></i> Student Profile
                          </Link>
                        </li>
                        <li>
                          <Link to="/dashboard" className="dropdown-item py-2">
                            <i className="bi bi-grid me-2 text-primary"></i> Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link to="/documents" className="dropdown-item py-2">
                            <i className="bi bi-file-earmark-lock me-2 text-primary"></i> Documents
                          </Link>
                        </li>
                        <li>
                          <Link to="/notifications" className="dropdown-item py-2">
                            <i className="bi bi-bell me-2 text-primary"></i> Expiry Alerts
                          </Link>
                        </li>
                      </>
                    )}

                    {/* Admin Dropdown Options */}
                    {isAdmin && (
                      <>
                        <li>
                          <Link to="/admin?tab=DASHBOARD" className="dropdown-item py-2">
                            <i className="bi bi-speedometer2 me-2 text-primary"></i> Admin Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link to="/admin?tab=PROFILE" className="dropdown-item py-2">
                            <i className="bi bi-shield-person me-2 text-primary"></i> Admin Profile
                          </Link>
                        </li>
                      </>
                    )}

                    <li>
                      <hr className="dropdown-divider my-1" />
                    </li>
                    <li>
                      <button className="dropdown-item text-danger py-2" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-sm btn-outline-light px-3 py-1 fw-medium">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-sm btn-primary-blue px-3 py-1 fw-medium">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
