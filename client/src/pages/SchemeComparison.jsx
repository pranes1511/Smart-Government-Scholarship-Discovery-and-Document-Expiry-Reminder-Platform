import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schemeAPI } from '../services/api';
import EligibilityBadge from '../components/EligibilityBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const SchemeComparison = () => {
  const [allSchemes, setAllSchemes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => {
    try {
      const stored = sessionStorage.getItem('compare_schemes');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((s) => s._id || s.slug).slice(0, 3);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [comparedSchemes, setComparedSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all schemes list to allow picking schemes to compare
  useEffect(() => {
    const loadList = async () => {
      try {
        const res = await schemeAPI.getSchemes({ limit: 100 });
        setAllSchemes(res.schemes || []);
        // If no schemes selected yet, preselect first 2 for demonstration
        if (selectedIds.length === 0 && res.schemes?.length >= 2) {
          const initial = [res.schemes[0]._id, res.schemes[1]._id];
          setSelectedIds(initial);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadList();
  }, []);

  // Fetch comparison data whenever selectedIds change
  useEffect(() => {
    if (selectedIds.length === 0) {
      setComparedSchemes([]);
      return;
    }

    const fetchComparison = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await schemeAPI.compareSchemes(selectedIds);
        setComparedSchemes(res.schemes || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch comparison details.');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [selectedIds]);

  const handleAddScheme = (id) => {
    if (!id) return;
    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= 3) {
      alert('You can compare a maximum of 3 scholarships simultaneously.');
      return;
    }
    const updated = [...selectedIds, id];
    setSelectedIds(updated);
    sessionStorage.setItem('compare_schemes', JSON.stringify(updated.map((sid) => ({ _id: sid }))));
  };

  const handleRemoveScheme = (id) => {
    const updated = selectedIds.filter((sid) => sid !== id);
    setSelectedIds(updated);
    sessionStorage.setItem('compare_schemes', JSON.stringify(updated.map((sid) => ({ _id: sid }))));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
    setComparedSchemes([]);
    sessionStorage.removeItem('compare_schemes');
  };

  return (
    <div className="py-4" style={{ backgroundColor: 'var(--light-bg)', minHeight: '90vh' }}>
      <div className="container-fluid px-3 px-lg-4">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
              Compare Schemes
            </h2>
            <p className="text-muted small mb-0">
              Side-by-side comparison of scholarships.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {selectedIds.length < 3 && (
              <select
                className="form-select form-select-sm"
                style={{ width: '220px' }}
                onChange={(e) => {
                  handleAddScheme(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  + Add Scheme
                </option>
                {allSchemes
                  .filter((s) => !selectedIds.includes(s._id))
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            )}
            {selectedIds.length > 0 && (
              <button className="btn btn-sm btn-outline-danger" onClick={handleClearAll}>
                Clear
              </button>
            )}
            <Link to="/schemes" className="btn btn-sm btn-navy">
              <i className="bi bi-search me-1"></i> Browse
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading comparison data..." />
        ) : comparedSchemes.length === 0 ? (
          <div className="card custom-card p-5 text-center shadow-sm">
            <div className="text-muted fs-1 mb-3">
              <i className="bi bi-columns-gap"></i>
            </div>
            <h4 className="fw-bold text-navy">No Schemes Selected</h4>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '420px' }}>
              Select up to 3 scholarships to compare rules, financial benefits, and documents.
            </p>
            <div>
              <Link to="/schemes" className="btn btn-navy px-4">
                Explore Schemes
              </Link>
            </div>
          </div>
        ) : (
          <div className="card custom-card shadow-sm border-0 overflow-hidden mb-4">
            <div className="table-responsive">
              <table className="comparison-table table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '20%', minWidth: '160px' }} className="align-middle">
                      Feature
                    </th>
                    {comparedSchemes.map((scheme) => (
                      <th
                        key={scheme._id}
                        style={{
                          width: `${80 / comparedSchemes.length}%`,
                          minWidth: '240px',
                          borderLeft: '1px solid var(--border-color)'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <span className="scheme-category-tag">{scheme.category}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger p-0 px-2"
                            onClick={() => handleRemoveScheme(scheme._id)}
                            title="Remove"
                          >
                            &times;
                          </button>
                        </div>
                        <h6 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
                          {scheme.name}
                        </h6>
                        <div className="text-muted small mb-2">{scheme.ministry}</div>
                        <Link to={`/schemes/${scheme._id}`} className="small text-primary text-decoration-none fw-semibold">
                          View Details &rarr;
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 1. Eligibility Result */}
                  <tr className="table-light">
                    <td className="fw-bold text-navy">Eligibility</td>
                    {comparedSchemes.map((scheme) => (
                      <td key={scheme._id} style={{ borderLeft: '1px solid var(--border-color)' }}>
                        {scheme.eligibility ? (
                          <div>
                            <EligibilityBadge status={scheme.eligibility.overallStatus} />
                            <div className="small text-secondary mt-1">
                              {scheme.eligibility.overallSummary}
                            </div>
                            <Link
                              to={`/eligibility-analysis/${scheme._id}`}
                              className="small text-primary text-decoration-none mt-1 d-inline-block fw-semibold"
                            >
                              View Eligibility &rarr;
                            </Link>
                          </div>
                        ) : (
                          <span className="text-muted small">Sign in to check</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* 2. Financial Benefits */}
                  <tr>
                    <td className="fw-bold text-navy">Benefits</td>
                    {comparedSchemes.map((scheme) => (
                      <td key={scheme._id} style={{ borderLeft: '1px solid var(--border-color)' }}>
                        <ul className="list-unstyled small mb-0">
                          {scheme.benefits?.map((b, i) => (
                            <li key={i} className="mb-1 text-dark d-flex align-items-start gap-1">
                              <i className="bi bi-award text-primary me-1 mt-1"></i>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* 3. Education Level */}
                  <tr>
                    <td className="fw-bold text-navy">Education Level</td>
                    {comparedSchemes.map((scheme) => (
                      <td key={scheme._id} style={{ borderLeft: '1px solid var(--border-color)' }}>
                        <span className="badge bg-light text-dark border">
                          {scheme.educationLevels?.join(', ') || 'Undergraduate'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* 4. Required Documents */}
                  <tr>
                    <td className="fw-bold text-navy">Required Documents</td>
                    {comparedSchemes.map((scheme) => (
                      <td key={scheme._id} style={{ borderLeft: '1px solid var(--border-color)' }}>
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          {scheme.requiredDocuments?.map((doc, i) => (
                            <span key={i} className="badge bg-light text-secondary border small">
                              {doc}
                            </span>
                          ))}
                        </div>
                        <Link
                          to={`/readiness/${scheme._id}`}
                          className="small text-primary text-decoration-none fw-semibold"
                        >
                          Check Readiness &rarr;
                        </Link>
                      </td>
                    ))}
                  </tr>

                  {/* 5. Application Deadline */}
                  <tr>
                    <td className="fw-bold text-navy">Deadline</td>
                    {comparedSchemes.map((scheme) => (
                      <td key={scheme._id} style={{ borderLeft: '1px solid var(--border-color)' }}>
                        <span className="fw-semibold text-dark small">
                          {scheme.applicationDeadline || 'Check Portal'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* 6. Expandable Additional Eligibility Rules */}
                  <tr>
                    <td className="fw-bold text-navy">Eligibility Rules</td>
                    {comparedSchemes.map((scheme) => (
                      <td key={scheme._id} style={{ borderLeft: '1px solid var(--border-color)' }}>
                        {scheme.eligibilityRules && scheme.eligibilityRules.length > 0 ? (
                          <details className="comparison-details small">
                            <summary className="text-primary fw-semibold cursor-pointer">
                              View Rules ({scheme.eligibilityRules.length})
                            </summary>
                            <ul className="list-unstyled mt-2 mb-0 pt-2 border-top">
                              {scheme.eligibilityRules.map((r, i) => (
                                <li key={i} className="mb-1 text-secondary">
                                  <strong>{r.label || r.field}:</strong>{' '}
                                  {Array.isArray(r.value) ? r.value.join(', ') : String(r.value)}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <span className="text-muted small">Standard rules apply</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* 7. Official Website */}
                  <tr className="table-light">
                    <td className="fw-bold text-navy">Official Portal</td>
                    {comparedSchemes.map((scheme) => (
                      <td key={scheme._id} style={{ borderLeft: '1px solid var(--border-color)' }}>
                        <a
                          href={scheme.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-navy text-nowrap"
                        >
                          <i className="bi bi-box-arrow-up-right me-1"></i> Visit Portal
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemeComparison;
