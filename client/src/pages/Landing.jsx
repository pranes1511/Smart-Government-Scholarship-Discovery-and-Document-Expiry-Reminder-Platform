import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schemeAPI } from '../services/api';
import SchemeCard from '../components/SchemeCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Landing = () => {
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await schemeAPI.getSchemes({ limit: 3 });
        setFeaturedSchemes(res.schemes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        className="py-5 text-white"
        style={{
          background: 'linear-gradient(135deg, #0f2b5c 0%, #1e3a8a 100%)',
          borderBottom: '4px solid #2563eb'
        }}
      >
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="badge bg-primary bg-opacity-25 text-white border border-primary px-3 py-2 rounded-pill mb-3">
                <i className="bi bi-mortarboard-fill me-1"></i> For College Students in India
              </span>
              <h1 className="display-4 fw-bold mb-3" style={{ lineHeight: '1.2' }}>
                Never Miss a Scholarship or Expired Document
              </h1>
              <p className="lead text-light text-opacity-75 mb-4" style={{ fontSize: '1.15rem' }}>
                Discover schemes matching your profile and get automated certificate expiry alerts before deadlines.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/schemes" className="btn btn-lg btn-primary-blue px-4 py-2">
                  <i className="bi bi-compass me-2"></i> Explore Scholarships
                </Link>
                <Link to="/register" className="btn btn-lg btn-outline-light px-4 py-2">
                  <i className="bi bi-person-plus me-2"></i> Get Started
                </Link>
              </div>

              {/* Zero PII Notice */}
              <div className="mt-4 pt-3 border-top border-white border-opacity-10 d-flex align-items-center gap-2 small text-light text-opacity-75">
                <i className="bi bi-shield-check text-success fs-5"></i>
                <span>Zero-Storage Policy: No documents or files are ever stored.</span>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card shadow-lg border-0 rounded-4 overflow-hidden" style={{ background: '#ffffff', color: '#1e293b' }}>
                <div className="card-header bg-navy text-white p-3 border-0" style={{ backgroundColor: 'var(--primary-navy)' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-bold small">
                      <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Student Portal
                    </span>
                    <span className="badge bg-success small">Active</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex align-items-start gap-3 mb-3 pb-3 border-bottom">
                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-2">
                      <i className="bi bi-cpu-fill fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-navy small">Rule-Based Matching</div>
                      <div className="text-muted small">Evaluates state, income, course, and category.</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3 mb-3 pb-3 border-bottom">
                    <div className="rounded-circle bg-warning bg-opacity-10 text-warning p-2">
                      <i className="bi bi-bell-fill fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-navy small">Expiry Reminders</div>
                      <div className="text-muted small">Alerts at 30, 15, and 7 days before expiry.</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3">
                    <div className="rounded-circle bg-success bg-opacity-10 text-success p-2">
                      <i className="bi bi-check2-circle fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-navy small">Document Readiness</div>
                      <div className="text-muted small">Checklist of valid, missing, and expired certificates.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Core Modules Section */}
      <section className="py-5 bg-white">
        <div className="container py-3">
          <div className="text-center mb-5">
            <span className="text-primary fw-bold text-uppercase small" style={{ letterSpacing: '0.05em' }}>
              Built for Higher Education
            </span>
            <h2 className="fw-bold text-navy mt-1" style={{ color: 'var(--primary-navy)' }}>
              Platform Modules
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '620px' }}>
              Everything you need to discover, evaluate, and track student schemes.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-3 custom-card">
                <div className="text-primary fs-3 mb-2">
                  <i className="bi bi-compass"></i>
                </div>
                <h5 className="fw-bold text-navy">1. Scheme Discovery</h5>
                <p className="text-muted small">
                  Curated catalogue of Central and State scholarships.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-3 custom-card">
                <div className="text-primary fs-3 mb-2">
                  <i className="bi bi-cpu"></i>
                </div>
                <h5 className="fw-bold text-navy">2. Rule-Based Engine</h5>
                <p className="text-muted small">
                  Deterministic eligibility matching based on your profile.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-3 custom-card">
                <div className="text-primary fs-3 mb-2">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <h5 className="fw-bold text-navy">3. Gap Analysis</h5>
                <p className="text-muted small">
                  Clear breakdown of satisfied and missing criteria.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-3 custom-card">
                <div className="text-primary fs-3 mb-2">
                  <i className="bi bi-calendar-check"></i>
                </div>
                <h5 className="fw-bold text-navy">4. Document Tracker</h5>
                <p className="text-muted small">
                  Track certificate validity dates without uploading files.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-3 custom-card">
                <div className="text-primary fs-3 mb-2">
                  <i className="bi bi-bell"></i>
                </div>
                <h5 className="fw-bold text-navy">5. Expiry Reminders</h5>
                <p className="text-muted small">
                  Automated alerts at 30, 15, and 7 days before expiry.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-3 custom-card">
                <div className="text-primary fs-3 mb-2">
                  <i className="bi bi-clipboard2-check"></i>
                </div>
                <h5 className="fw-bold text-navy">6. Readiness Checker</h5>
                <p className="text-muted small">
                  Verify required certificates before applying.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-3 custom-card">
                <div className="text-primary fs-3 mb-2">
                  <i className="bi bi-columns-gap"></i>
                </div>
                <h5 className="fw-bold text-navy">7. Scheme Comparison</h5>
                <p className="text-muted small">
                  Compare up to 3 scholarships side-by-side.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-3 custom-card">
                <div className="text-primary fs-3 mb-2">
                  <i className="bi bi-box-arrow-up-right"></i>
                </div>
                <h5 className="fw-bold text-navy">8. Official Portal Links</h5>
                <p className="text-muted small">
                  Direct navigation to verified central &amp; state portals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Scholarships Section */}
      <section className="py-5" style={{ backgroundColor: 'var(--light-bg)' }}>
        <div className="container py-3">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <span className="text-primary fw-bold text-uppercase small">Verified Opportunities</span>
              <h2 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                Featured Schemes
              </h2>
            </div>
            <Link to="/schemes" className="btn btn-outline-primary fw-semibold btn-sm">
              View All &rarr;
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching schemes..." />
          ) : (
            <div className="row g-4">
              {featuredSchemes.map((scheme) => (
                <div key={scheme._id} className="col-lg-4 col-md-6">
                  <SchemeCard scheme={scheme} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-5 bg-white border-top">
        <div className="container py-3">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-navy" style={{ color: 'var(--primary-navy)' }}>
              How It Works
            </h2>
            <p className="text-muted">A 3-step workflow to find and track schemes.</p>
          </div>
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                <span className="fs-3 fw-bold">1</span>
              </div>
              <h5 className="fw-bold text-navy">Set Up Profile</h5>
              <p className="text-muted small px-3">
                Enter your academic and personal details once.
              </p>
            </div>
            <div className="col-md-4">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                <span className="fs-3 fw-bold">2</span>
              </div>
              <h5 className="fw-bold text-navy">Track Certificates</h5>
              <p className="text-muted small px-3">
                Log certificate expiry dates and get automated reminders.
              </p>
            </div>
            <div className="col-md-4">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                <span className="fs-3 fw-bold">3</span>
              </div>
              <h5 className="fw-bold text-navy">Match &amp; Apply</h5>
              <p className="text-muted small px-3">
                Review satisfied criteria and apply on official portals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 text-white text-center" style={{ backgroundColor: 'var(--primary-navy)' }}>
        <div className="container py-4">
          <h2 className="fw-bold mb-3">Ready to Find Your Schemes?</h2>
          <p className="lead text-light text-opacity-75 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
            Create an account to discover scholarships and track document expiry.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/register" className="btn btn-lg btn-primary-blue px-4 py-2">
              Register Now
            </Link>
            <Link to="/schemes" className="btn btn-lg btn-outline-light px-4 py-2">
              Explore Schemes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
