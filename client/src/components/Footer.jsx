import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container-fluid px-4">
        <div className="row g-4">
          <div className="col-lg-5 col-md-6">
            <h5 className="text-white fw-bold mb-2">SchemeSathi</h5>
            <p className="small text-secondary mb-3">
              Scholarship discovery and document expiry reminder platform for college students across India.
            </p>
            <div className="d-flex align-items-center gap-2 text-warning small">
              <i className="bi bi-info-circle-fill"></i>
              <span>Official portal links for all active schemes.</span>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/schemes" className="footer-link">Schemes</Link></li>
              <li className="mb-2"><Link to="/documents" className="footer-link">Document Tracker</Link></li>
              <li className="mb-2"><Link to="/readiness" className="footer-link">Document Readiness</Link></li>
              <li className="mb-2"><Link to="/compare" className="footer-link">Compare Schemes</Link></li>
            </ul>
          </div>
          <div className="col-lg-4 col-md-12">
            <h6 className="text-white fw-bold mb-3">Privacy Guarantee</h6>
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 small text-secondary">
              <p className="mb-1 text-light fw-medium">
                <i className="bi bi-lock-fill text-success me-1"></i> Zero-Storage Policy
              </p>
              Tracks expiry dates only. Never stores Aadhaar numbers, certificate serials, or original files.
            </div>
          </div>
        </div>
        <hr className="my-4 border-secondary border-opacity-25" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center small text-secondary">
          <div>
            &copy; {new Date().getFullYear()} SchemeSathi. All rights reserved.
          </div>
          <div className="mt-2 mt-md-0">
            Rule-Based Eligibility &bull; Automated Expiry Alerts
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
