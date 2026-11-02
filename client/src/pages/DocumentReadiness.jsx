import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { schemeAPI, documentAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const DocumentReadiness = () => {
  const { schemeId: urlSchemeId } = useParams();
  const navigate = useNavigate();

  const [allSchemes, setAllSchemes] = useState([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState(urlSchemeId || '');
  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load schemes list
  useEffect(() => {
    const loadSchemes = async () => {
      try {
        const res = await schemeAPI.getSchemes({ limit: 100 });
        setAllSchemes(res.schemes || []);
        if (!selectedSchemeId && res.schemes?.length > 0) {
          setSelectedSchemeId(res.schemes[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSchemes();
  }, []);

  // Load readiness data when selectedSchemeId changes
  useEffect(() => {
    if (!selectedSchemeId) return;

    const checkReadiness = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await documentAPI.getReadiness(selectedSchemeId);
        setReadinessData(res);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to calculate document readiness.');
      } finally {
        setLoading(false);
      }
    };

    checkReadiness();
  }, [selectedSchemeId]);

  const handleSchemeChange = (e) => {
    const id = e.target.value;
    setSelectedSchemeId(id);
    navigate(`/readiness/${id}`);
  };

  const readiness = readinessData?.readiness;
  const scheme = readinessData?.scheme;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i> Valid</span>;
      case 'EXPIRY_UNVERIFIED':
        return <span className="badge bg-info text-dark"><i className="bi bi-question-circle me-1"></i> Unverified</span>;
      case 'EXPIRED':
        return <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i> Expired</span>;
      case 'MISSING':
      default:
        return <span className="badge bg-secondary"><i className="bi bi-dash-circle me-1"></i> Missing</span>;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Header with Scheme Selector */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
              Document Readiness
            </h3>
            <p className="text-muted small mb-0">
              Check if required certificates are ready before applying.
            </p>
          </div>

          <div style={{ minWidth: '260px' }}>
            <label className="form-label small fw-semibold text-muted mb-1">Scholarship:</label>
            <select
              className="form-select form-select-sm"
              value={selectedSchemeId}
              onChange={handleSchemeChange}
            >
              {allSchemes.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Checking document readiness..." />
        ) : readiness ? (
          <>
            {/* Overview Card with Progress Bar */}
            <div className="card custom-card shadow-sm border-0 p-4 mb-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                  <span className="scheme-category-tag mb-1 d-inline-block">{scheme?.category}</span>
                  <h4 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
                    {scheme?.name}
                  </h4>
                  <div className="text-muted small">Application readiness score</div>
                </div>

                <div className="text-md-end">
                  <div className="display-6 fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                    {readiness.readinessPercentage}%
                  </div>
                  <span
                    className={`badge ${
                      readiness.readinessPercentage === 100
                        ? 'bg-success'
                        : readiness.readinessPercentage >= 50
                        ? 'bg-warning text-dark'
                        : 'bg-danger'
                    } px-3 py-1 rounded-pill`}
                  >
                    {readiness.readinessStatus}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress mb-3" style={{ height: '14px', borderRadius: '7px' }}>
                <div
                  className={`progress-bar progress-bar-striped progress-bar-animated ${
                    readiness.readinessPercentage === 100
                      ? 'bg-success'
                      : readiness.readinessPercentage >= 50
                      ? 'bg-warning'
                      : 'bg-danger'
                  }`}
                  role="progressbar"
                  style={{ width: `${readiness.readinessPercentage}%` }}
                  aria-valuenow={readiness.readinessPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>

              {/* Stat breakdown badges */}
              <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                <span className="badge bg-light text-dark border p-2">
                  Total: <strong>{readiness.totalRequired}</strong>
                </span>
                <span className="badge bg-success bg-opacity-10 text-success p-2">
                  <i className="bi bi-check-circle me-1"></i> Valid:{' '}
                  <strong>{readiness.availableCount}</strong>
                </span>
                <span className="badge bg-info bg-opacity-10 text-info p-2">
                  <i className="bi bi-question-circle me-1"></i> Unverified:{' '}
                  <strong>{readiness.unverifiedCount}</strong>
                </span>
                <span className="badge bg-danger bg-opacity-10 text-danger p-2">
                  <i className="bi bi-x-circle me-1"></i> Expired:{' '}
                  <strong>{readiness.expiredCount}</strong>
                </span>
                <span className="badge bg-secondary bg-opacity-10 text-secondary p-2">
                  <i className="bi bi-dash-circle me-1"></i> Missing:{' '}
                  <strong>{readiness.missingCount}</strong>
                </span>
              </div>

              <div className="text-muted small mt-3" style={{ fontSize: '0.75rem' }}>
                {readiness.disclaimer}
              </div>
            </div>

            {/* Checklist Table */}
            <div className="card custom-card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                  Checklist ({readiness.checklist.length})
                </h5>
                <Link to="/documents" className="btn btn-sm btn-navy">
                  <i className="bi bi-folder me-1"></i> Document Tracker
                </Link>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '32%' }}>Required Document</th>
                      <th style={{ width: '20%' }}>Status</th>
                      <th style={{ width: '33%' }}>Validity / Expiry</th>
                      <th style={{ width: '15%' }} className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readiness.checklist.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="fw-bold text-navy">{item.requiredDocument}</div>
                          {item.savedDocumentName && item.savedDocumentName !== item.requiredDocument && (
                            <div className="text-muted small">
                              Matched: <em>{item.savedDocumentName}</em>
                            </div>
                          )}
                        </td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td className="small text-secondary">{item.message}</td>
                        <td className="text-end">
                          {item.status === 'MISSING' && (
                            <Link
                              to="/documents"
                              className="btn btn-sm btn-outline-primary"
                              title="Add document to tracker"
                            >
                              <i className="bi bi-plus"></i> Add
                            </Link>
                          )}
                          {item.status === 'EXPIRED' && (
                            <Link
                              to="/documents"
                              className="btn btn-sm btn-outline-danger"
                              title="Renew document"
                            >
                              <i className="bi bi-arrow-repeat"></i> Renew
                            </Link>
                          )}
                          {(item.status === 'AVAILABLE' || item.status === 'EXPIRY_UNVERIFIED') && (
                            <span className="text-success small fw-bold">
                              <i className="bi bi-check2"></i> Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default DocumentReadiness;
