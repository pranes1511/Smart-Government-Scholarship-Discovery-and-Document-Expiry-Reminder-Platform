import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { to: '/profile', label: 'Profile', icon: 'bi-person-badge' },
    { to: '/schemes', label: 'Schemes', icon: 'bi-search' },
    { to: '/documents', label: 'Documents', icon: 'bi-file-earmark-lock' },
    { to: '/readiness', label: 'Readiness', icon: 'bi-check2-all' },
    { to: '/compare', label: 'Compare', icon: 'bi-columns-gap' },
    { to: '/notifications', label: 'Notifications', icon: 'bi-bell' }
  ];

  return (
    <aside className="dashboard-sidebar">
      <div className="p-3 border-bottom d-none d-lg-block">
        <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.05em' }}>
          Student Portal
        </div>
      </div>
      <ul className="sidebar-nav">
        {menuItems.map((item) => (
          <li key={item.to} className="sidebar-nav-item">
            <NavLink
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon} fs-5`}></i>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-auto p-3 border-top bg-light">
        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.78rem' }}>
          <i className="bi bi-shield-check text-success fs-5"></i>
          <div>
            <div className="fw-semibold text-dark">Zero-Storage</div>
            <div>No documents stored</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
