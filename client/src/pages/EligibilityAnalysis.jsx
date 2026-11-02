import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { schemeAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import EligibilityBadge from '../components/EligibilityBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const EligibilityAnalysis = () => {
  const { schemeId: urlSchemeId } = useParams();
  const navigate = useNavigate();

  const [allSchemes, setAllSchemes] = useState([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState(urlSchemeId || '');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch list of schemes for the dropdown selector
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

  // Fetch eligibility analysis whenever selectedSchemeId changes
  useEffect(() => {
    if (!selectedSchemeId) return;

    const runAnalysis = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await schemeAPI.getEligibilityAnalysis(selectedSchemeId);
        setAnalysisData(res);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to calculate eligibility gap analysis.');
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [selectedSchemeId]);

  const handleSchemeChange = (e) => {
    const id = e.target.value;
    setSelectedSchemeId(id);
    navigate(`/eligibility-analysis/${id}`);
  };

  const analysis = analysisData?.analysis;
  const scheme = analysisData?.scheme;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Header with Scheme Selector */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
              Eligibility Analysis
            </h3>
            <p className="text-muted small mb-0">
              Criteria breakdown and verification status.
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
          <LoadingSpinner message="Evaluating eligibility rules..." />
        ) : analysis ? (
          <>
            {/* Overview Card */}
            <div className="card custom-card shadow-sm p-4 mb-4 border-0">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                  <span className="scheme-category-tag mb-2 d-inline-block">{scheme?.category}</span>
                  <h4 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
                    {scheme?.name}
                  </h4>
                  <div className="text-muted small">{scheme?.ministry}</div>
                </div>
                <div className="text-md-end">
                  <div className="small text-muted mb-1">Status:</div>
                  <EligibilityBadge status={analysis.overallStatus} />
                </div>
              </div>

              <div className="p-3 bg-light rounded border mb-3">
                <div className="small text-secondary fw-medium">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  {analysis.overallSummary}
                </div>
              </div>

              {/* Counts Pills */}
              <div className="row g-2 text-center pt-2 border-top">
                <div className="col-4">
                  <div className="p-2 rounded bg-success bg-opacity-10 text-success">
                    <div className="fw-bold fs-5">{analysis.counts.satisfied}</div>
                    <div className="small fw-semibold">Satisfied</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 rounded bg-danger bg-opacity-10 text-danger">
                    <div className="fw-bold fs-5">{analysis.counts.missing}</div>
                    <div className="small fw-semibold">Missing</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 rounded bg-info bg-opacity-10 text-info">
                    <div className="fw-bold fs-5">{analysis.counts.unverified}</div>
                    <div className="small fw-semibold">Unverified</div>
                  </div>
                </div>
              </div>

              <div className="text-muted small text-center mt-3" style={{ fontSize: '0.75rem' }}>
                {analysis.disclaimer}
              </div>
            </div>

            {/* Requirement Sections */}
            <div className="row g-4 mb-4">
              {/* SECTION A: Satisfied */}
              <div className="col-12">
                <div className="card custom-card shadow-sm border-0">
                  <div className="card-header bg-success bg-opacity-10 py-3 border-bottom d-flex align-items-center justify-content-between">
                    <h5 className="fw-bold text-success mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-check-circle-fill"></i> Satisfied ({analysis.satisfiedRequirements.length})
                    </h5>
                    <span className="badge bg-success small">Satisfied</span>
                  </div>
                  <div className="card-body p-4">
                    {analysis.satisfiedRequirements.length === 0 ? (
                      <p className="text-muted small mb-0">No criteria marked satisfied yet.</p>
                    ) : (
                      <div className="row g-3">
                        {analysis.satisfiedRequirements.map((c, i) => (
                          <div key={i} className="col-md-6">
                            <div className="p-3 border rounded h-100 bg-white" style={{ borderLeft: '4px solid #10b981' }}>
                              <div className="small fw-bold text-success text-uppercase mb-1" style={{ letterSpacing: '0.03em' }}>
                                SATISFIED — {c.explanation}
                              </div>
                              <div className="fw-semibold text-navy small mb-2">{c.conditionName}</div>
                              <div className="d-flex justify-content-between small text-muted">
                                <span>Required: <strong>{c.requiredValue}</strong></span>
                                <span>Profile: <strong className="text-success">{c.studentValue}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION B: Missing */}
              <div className="col-12">
                <div className="card custom-card shadow-sm border-0">
                  <div className="card-header bg-danger bg-opacity-10 py-3 border-bottom d-flex align-items-center justify-content-between">
                    <h5 className="fw-bold text-danger mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-x-circle-fill"></i> Missing ({analysis.missingRequirements.length})
                    </h5>
                    <span className="badge bg-danger small">Action Required</span>
                  </div>
                  <div className="card-body p-4">
                    {analysis.missingRequirements.length === 0 ? (
                      <div className="text-success small fw-semibold">
                        <i className="bi bi-patch-check-fill me-1"></i> No mandatory conditions missing.
                      </div>
                    ) : (
                      <div className="row g-3">
                        {analysis.missingRequirements.map((c, i) => (
                          <div key={i} className="col-md-6">
                            <div className="p-3 border rounded h-100 bg-white" style={{ borderLeft: '4px solid #ef4444' }}>
                              <div className="small fw-bold text-danger text-uppercase mb-1" style={{ letterSpacing: '0.03em' }}>
                                MISSING — {c.explanation}
                              </div>
                              <div className="fw-semibold text-navy small mb-2">{c.conditionName}</div>
                              <div className="d-flex justify-content-between small text-muted mb-2">
                                <span>Required: <strong>{c.requiredValue}</strong></span>
                                <span>Profile: <strong className="text-danger">{c.studentValue}</strong></span>
                              </div>
                              {c.nextStep && (
                                <div className="small text-secondary fw-medium border-top pt-2 mt-2">
                                  <i className="bi bi-arrow-right-short text-primary"></i> Action: {c.nextStep}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION C: Unverified */}
              <div className="col-12">
                <div className="card custom-card shadow-sm border-0">
                  <div className="card-header bg-info bg-opacity-10 py-3 border-bottom d-flex align-items-center justify-content-between">
                    <h5 className="fw-bold text-info mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-question-circle-fill"></i> Unverified ({analysis.unverifiedRequirements.length})
                    </h5>
                    <span className="badge bg-info text-dark small">Profile Data Needed</span>
                  </div>
                  <div className="card-body p-4">
                    {analysis.unverifiedRequirements.length === 0 ? (
                      <div className="text-success small fw-semibold">
                        <i className="bi bi-check-all me-1"></i> All criteria evaluated from profile.
                      </div>
                    ) : (
                      <>
                        <div className="row g-3 mb-3">
                          {analysis.unverifiedRequirements.map((c, i) => (
                            <div key={i} className="col-md-6">
                              <div className="p-3 border rounded h-100 bg-white" style={{ borderLeft: '4px solid #0284c7' }}>
                                <div className="small fw-bold text-info text-uppercase mb-1" style={{ letterSpacing: '0.03em' }}>
                                  UNVERIFIED — {c.explanation}
                                </div>
                                <div className="fw-semibold text-navy small mb-2">{c.conditionName}</div>
                                <div className="d-flex justify-content-between small text-muted mb-2">
                                  <span>Required: <strong>{c.requiredValue}</strong></span>
                                  <span className="badge bg-secondary small">{c.studentValue}</span>
                                </div>
                                <div className="small text-primary fw-medium border-top pt-2 mt-2">
                                  <i className="bi bi-pencil-square me-1"></i> Action: Update in profile
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-end">
                          <Link to="/profile" className="btn btn-sm btn-navy">
                            Update Profile &rarr;
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default EligibilityAnalysis;
