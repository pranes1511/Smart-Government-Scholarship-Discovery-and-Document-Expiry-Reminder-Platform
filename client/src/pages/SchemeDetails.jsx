import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { schemeAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EligibilityBadge from '../components/EligibilityBadge';
import SchemeVerificationBadge from '../components/SchemeVerificationBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const SchemeDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await schemeAPI.getSchemeById(id);
        setScheme(res.scheme);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to retrieve scholarship details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (isAdmin) return; // Admins do not participate in scheme comparisons
    try {
      const saved = sessionStorage.getItem('compare_schemes');
      if (saved && scheme) {
        const list = JSON.parse(saved);
        setIsComparing(list.some((c) => (c._id || c) === scheme._id));
      }
    } catch {
      // ignore parse errors
    }
  }, [scheme, isAdmin]);

  const handleBack = () => {
    if (isAdmin) {
      navigate('/admin?tab=SCHEMES');
      return;
    }
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/schemes');
    }
  };

  const handleToggleCompare = () => {
    if (!scheme || isAdmin) return;
    try {
      const saved = sessionStorage.getItem('compare_schemes');
      let list = saved ? JSON.parse(saved) : [];
      const exists = list.some((c) => (c._id || c) === scheme._id);
      if (exists) {
        list = list.filter((c) => (c._id || c) !== scheme._id);
        setIsComparing(false);
      } else {
        if (list.length >= 3) {
          alert('You can compare a maximum of 3 scholarships simultaneously.');
          return;
        }
        list.push({ _id: scheme._id, name: scheme.name, category: scheme.category });
        setIsComparing(true);
      }
      sessionStorage.setItem('compare_schemes', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminDelete = async () => {
    if (!scheme) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${scheme.name}"?`)) {
      return;
    }
    try {
      await adminAPI.deleteScheme(scheme._id);
      alert('Scheme deleted successfully.');
      navigate('/admin?tab=SCHEMES');
    } catch (err) {
      alert(err.message || 'Failed to delete scheme.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading detailed scholarship scheme information..." />;
  }

  if (error || !scheme) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger mb-4 shadow-sm">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Scholarship scheme not found or unavailable.'}
        </div>
        <button type="button" onClick={handleBack} className="btn btn-navy">
          <i className="bi bi-arrow-left me-2"></i>
          {isAdmin ? 'Back to Scheme Management' : 'Back to Schemes Catalogue'}
        </button>
      </div>
    );
  }

  const eligibility = scheme.eligibilityResult;

  return (
    <div className="py-4" style={{ backgroundColor: 'var(--light-bg)', minHeight: '90vh' }}>
      <div className="container py-3">
        {/* Navigation Breadcrumb & Back Action */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 shadow-sm"
          >
            <i className="bi bi-arrow-left"></i>
            {isAdmin ? 'Back to Scheme Management' : 'Back to Schemes'}
          </button>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-0">
              <li className="breadcrumb-item">
                <Link to={isAdmin ? '/admin' : '/'} className="text-decoration-none">
                  {isAdmin ? 'Admin Portal' : 'Home'}
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={isAdmin ? '/admin?tab=SCHEMES' : '/schemes'} className="text-decoration-none">
                  {isAdmin ? 'Manage Schemes' : 'Schemes'}
                </Link>
              </li>
              <li className="breadcrumb-item active text-truncate" style={{ maxWidth: '240px' }} aria-current="page">
                {scheme.name}
              </li>
            </ol>
          </nav>
        </div>

        {/* Scheme Header Card */}
        <div className="card custom-card shadow-sm border-0 mb-4 p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="scheme-category-tag">{scheme.category}</span>
                <span className="badge bg-light text-secondary border small">
                  <i className="bi bi-geo-alt me-1"></i>
                  {scheme.applicableStates?.join(', ') || 'All India'}
                </span>
                <SchemeVerificationBadge status={scheme.verificationStatus} />
                {scheme.lastVerified && (
                  <span className="badge bg-light text-muted border small">
                    <i className="bi bi-calendar-check me-1"></i> {scheme.lastVerified}
                  </span>
                )}
                {isAdmin && (
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger small">
                    Admin View
                  </span>
                )}
              </div>
              <h2 className="fw-bold text-navy mb-2" style={{ color: 'var(--primary-navy)' }}>
                {scheme.name}
              </h2>
              <div className="text-muted small d-flex align-items-center gap-2">
                <i className="bi bi-bank2"></i>
                <span>{scheme.ministry}</span>
              </div>
            </div>

            {/* Personalized Eligibility Badge ONLY for Students */}
            {!isAdmin && (
              <div className="text-end">
                {eligibility?.overallStatus ? (
                  <div>
                    <div className="small text-muted mb-1">Eligibility:</div>
                    <EligibilityBadge status={eligibility.overallStatus} />
                  </div>
                ) : (
                  isAuthenticated && (
                    <Link
                      to={`/eligibility-analysis/${scheme._id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-calculator me-1"></i> View Eligibility
                    </Link>
                  )
                )}
              </div>
            )}
          </div>

          <p className="lead text-secondary" style={{ fontSize: '1.05rem' }}>
            {scheme.description}
          </p>

          {/* Role-Specific Action Ribbon */}
          {isAdmin ? (
            /* ADMIN MANAGEMENT ACTIONS */
            <div className="d-flex flex-wrap gap-2 pt-3 border-top mt-2">
              <button
                type="button"
                onClick={() => navigate('/admin?tab=SCHEMES')}
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
              >
                <i className="bi bi-arrow-left"></i> Back to Scheme Management
              </button>
              <button
                type="button"
                onClick={() => navigate(`/admin?tab=SCHEMES&edit=${scheme._id}`)}
                className="btn btn-navy d-flex align-items-center gap-2"
              >
                <i className="bi bi-pencil-square"></i> Edit Scheme
              </button>
              <button
                type="button"
                onClick={() => navigate(`/admin?tab=RULES&schemeId=${scheme._id}`)}
                className="btn btn-outline-primary d-flex align-items-center gap-2"
              >
                <i className="bi bi-sliders"></i> Manage Eligibility Rules
              </button>
              <button
                type="button"
                onClick={() => navigate(`/admin?tab=VERIFICATION&schemeId=${scheme._id}`)}
                className="btn btn-outline-warning text-dark d-flex align-items-center gap-2"
              >
                <i className="bi bi-shield-check"></i> Update Verification
              </button>
              <button
                type="button"
                onClick={handleAdminDelete}
                className="btn btn-outline-danger d-flex align-items-center gap-2 ms-auto"
              >
                <i className="bi bi-trash"></i> Delete Scheme
              </button>
            </div>
          ) : (
            /* STUDENT SCHOLARSHIP ACTIONS */
            <div className="d-flex flex-wrap gap-2 pt-3 border-top mt-2">
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
              >
                <i className="bi bi-arrow-left"></i> Back to Schemes
              </button>
              <Link
                to={`/eligibility-analysis/${scheme._id}`}
                className="btn btn-navy d-flex align-items-center gap-2"
              >
                <i className="bi bi-graph-up-arrow"></i> View Eligibility
              </Link>
              <Link
                to={`/readiness/${scheme._id}`}
                className="btn btn-outline-primary d-flex align-items-center gap-2"
              >
                <i className="bi bi-check2-all"></i> Check Document Readiness
              </Link>
              <button
                type="button"
                onClick={handleToggleCompare}
                className={`btn ${isComparing ? 'btn-success' : 'btn-outline-primary'} d-flex align-items-center gap-2`}
              >
                <i className={`bi ${isComparing ? 'bi-check2' : 'bi-columns-gap'}`}></i>{' '}
                {isComparing ? 'Added to Compare' : 'Add to Compare'}
              </button>
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary d-flex align-items-center gap-2 ms-auto"
              >
                <i className="bi bi-box-arrow-up-right"></i> Apply on Official Website
              </a>
            </div>
          )}
        </div>

        {/* Content Details Grid */}
        <div className="row g-4">
          {/* Left Column: Overview & Financial Benefits */}
          <div className="col-lg-8">
            {/* Overview */}
            <div className="card custom-card shadow-sm p-4 mb-4">
              <h5 className="fw-bold text-navy mb-3" style={{ color: 'var(--primary-navy)' }}>
                <i className="bi bi-file-text me-2 text-primary"></i> Overview
              </h5>
              <p className="text-secondary" style={{ lineHeight: '1.7' }}>
                {scheme.detailedDescription || scheme.description}
              </p>

              {scheme.eligibleCourses && scheme.eligibleCourses.length > 0 && (
                <div className="mt-3">
                  <h6 className="fw-bold text-navy small mb-2">Eligible Courses:</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {scheme.eligibleCourses.map((c, i) => (
                      <span key={i} className="badge bg-light text-dark border small">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Financial Benefits */}
            <div className="card custom-card shadow-sm p-4 mb-4">
              <h5 className="fw-bold text-navy mb-3" style={{ color: 'var(--primary-navy)' }}>
                <i className="bi bi-award-fill me-2 text-success"></i> Benefits
              </h5>
              <div className="list-group list-group-flush">
                {scheme.benefits && scheme.benefits.length > 0 ? (
                  scheme.benefits.map((b, i) => (
                    <div key={i} className="list-group-item d-flex align-items-start gap-3 px-0 py-3">
                      <div className="rounded-circle bg-success bg-opacity-10 text-success p-2 mt-1">
                        <i className="bi bi-cash-coin fs-6"></i>
                      </div>
                      <div className="text-dark fw-medium">{b}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted small">No specific financial breakdown provided.</div>
                )}
              </div>
            </div>

            {/* Structured Eligibility Rules */}
            <div className="card custom-card shadow-sm p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                  <i className="bi bi-check-circle-fill me-2 text-primary"></i> Eligibility Criteria Rules
                </h5>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/admin?tab=RULES&schemeId=${scheme._id}`)}
                    className="small text-primary text-decoration-none fw-semibold btn btn-link p-0"
                  >
                    Configure Rules &rarr;
                  </button>
                ) : (
                  <Link
                    to={`/eligibility-analysis/${scheme._id}`}
                    className="small text-primary text-decoration-none fw-semibold"
                  >
                    View Eligibility &rarr;
                  </Link>
                )}
              </div>

              <div className="table-responsive">
                <table className="table table-bordered small">
                  <thead className="table-light">
                    <tr>
                      <th>Condition Rule</th>
                      <th>Requirement Details</th>
                      <th>Mandatory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheme.eligibilityRules && scheme.eligibilityRules.length > 0 ? (
                      scheme.eligibilityRules.map((r, i) => (
                        <tr key={i}>
                          <td className="fw-semibold text-navy">{r.label || r.field}</td>
                          <td>
                            {Array.isArray(r.value)
                              ? r.value.join(', ')
                              : typeof r.value === 'boolean'
                              ? r.value
                                ? 'Yes'
                                : 'No'
                              : r.value}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                r.mandatory ? 'bg-danger bg-opacity-10 text-danger' : 'bg-secondary bg-opacity-10 text-secondary'
                              }`}
                            >
                              {r.mandatory ? 'Mandatory' : 'Optional'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted text-center">
                          Official criteria undergoing verification.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Required Documents & Timeline */}
          <div className="col-lg-4">
            {/* Required Documents Widget */}
            <div className="card custom-card shadow-sm p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                  <i className="bi bi-file-earmark-lock me-2 text-warning"></i> Required Documents
                </h6>
                {!isAdmin && (
                  <Link to={`/readiness/${scheme._id}`} className="small text-primary text-decoration-none fw-semibold">
                    Check &rarr;
                  </Link>
                )}
              </div>

              <ul className="list-group list-group-flush small mb-3">
                {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 ? (
                  scheme.requiredDocuments.map((doc, i) => (
                    <li key={i} className="list-group-item d-flex align-items-center gap-2 px-0 py-2">
                      <i className="bi bi-file-earmark-check text-muted"></i>
                      <span>{doc}</span>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item px-0 py-2 text-muted">No specific documents specified.</li>
                )}
              </ul>

              {isAdmin ? (
                <div className="d-grid">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin?tab=SCHEMES&edit=${scheme._id}`)}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    <i className="bi bi-pencil me-1"></i> Edit Documents List
                  </button>
                </div>
              ) : (
                <div className="d-grid">
                  <Link to={`/readiness/${scheme._id}`} className="btn btn-sm btn-outline-primary">
                    Check Readiness
                  </Link>
                </div>
              )}
            </div>

            {/* Application Information */}
            <div className="card custom-card shadow-sm p-4 mb-4">
              <h6 className="fw-bold text-navy mb-3" style={{ color: 'var(--primary-navy)' }}>
                <i className="bi bi-calendar3 me-2 text-primary"></i> Timeline
              </h6>
              <div className="mb-3">
                <div className="text-muted small">Status</div>
                <div className="fw-bold text-dark">{scheme.applicationStatus}</div>
              </div>
              <div className="mb-3">
                <div className="text-muted small">Deadline</div>
                <div className="fw-bold text-dark">{scheme.applicationDeadline || 'Check official portal'}</div>
              </div>
              <div className="mb-3">
                <div className="text-muted small">Verified</div>
                <div className="text-secondary small">{scheme.lastVerified || 'Recent'}</div>
              </div>

              <div className="d-grid pt-2 border-top">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/admin?tab=VERIFICATION&schemeId=${scheme._id}`)}
                    className="btn btn-navy btn-sm"
                  >
                    <i className="bi bi-shield-check me-1"></i> Update Verification Details
                  </button>
                ) : (
                  <a
                    href={scheme.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-navy btn-sm"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i> Visit Portal
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemeDetails;
