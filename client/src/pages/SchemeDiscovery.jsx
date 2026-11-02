import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { schemeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SchemeCard from '../components/SchemeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const SchemeDiscovery = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [educationLevel, setEducationLevel] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');

  // Compare tray state (stored in session storage so it persists during navigation)
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = sessionStorage.getItem('compare_schemes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const categories = [
    'All',
    'Merit-based',
    'Income-based',
    'Community-based',
    'Minority Welfare',
    'Technical Education',
    'Higher Education Assistance',
    'Disability Support',
    'State Government Welfare',
    'Girls & Women Education'
  ];

  const states = [
    'All',
    'All India',
    'Tamil Nadu',
    'Andhra Pradesh',
    'Karnataka',
    'Kerala',
    'Maharashtra',
    'Assam'
  ];

  const levels = ['All', 'Undergraduate', 'Postgraduate', 'Diploma', 'Doctorate'];

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search,
        category,
        state: stateFilter,
        educationLevel,
        verificationStatus: verificationFilter,
        eligibility: eligibilityFilter,
        sort: sortBy
      };
      const res = await schemeAPI.getSchemes(params);
      setSchemes(res.schemes || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch schemes catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [category, stateFilter, educationLevel, eligibilityFilter, verificationFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSchemes();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setStateFilter('All');
    setEducationLevel('All');
    setEligibilityFilter('All');
    setVerificationFilter('All');
    setSortBy('name_asc');
  };

  const handleToggleCompare = (scheme) => {
    setCompareList((prev) => {
      const exists = prev.some((s) => (s._id || s.slug) === (scheme._id || scheme.slug));
      let updated;
      if (exists) {
        updated = prev.filter((s) => (s._id || s.slug) !== (scheme._id || scheme.slug));
      } else {
        if (prev.length >= 3) {
          alert('You can compare a maximum of 3 scholarships at a time.');
          return prev;
        }
        updated = [...prev, scheme];
      }
      sessionStorage.setItem('compare_schemes', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="py-4" style={{ backgroundColor: 'var(--light-bg)', minHeight: '90vh' }}>
      <div className="container-fluid px-3 px-lg-4">
        {/* Page Title */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
          <div>
            <h2 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
              Discover Schemes
            </h2>
            <p className="text-muted small mb-0">
              Find scholarships that match your profile.
            </p>
          </div>
          {compareList.length > 0 && (
            <button
              className="btn btn-navy d-flex align-items-center gap-2 shadow-sm"
              onClick={() => navigate('/compare')}
            >
              <i className="bi bi-columns-gap"></i>
              <span>Compare ({compareList.length})</span>
            </button>
          )}
        </div>

        {/* Filter Controls Card */}
        <div className="card custom-card shadow-sm mb-4">
          <div className="card-body p-3 p-lg-4">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search scholarships, keywords, or ministry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-navy px-4">
                  Search
                </button>
              </div>
            </form>

            {/* Filter Dropdowns Grid */}
            <div className="row g-2 align-items-center">
              <div className="col-lg-3 col-md-6">
                <label className="form-label small fw-semibold text-muted mb-1">Category</label>
                <select
                  className="form-select form-select-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'All' ? 'All' : c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-2 col-md-6">
                <label className="form-label small fw-semibold text-muted mb-1">State</label>
                <select
                  className="form-select form-select-sm"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s === 'All' ? 'All' : s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-2 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Degree Level</label>
                <select
                  className="form-select form-select-sm"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                >
                  {levels.map((l) => (
                    <option key={l} value={l}>
                      {l === 'All' ? 'All' : l}
                    </option>
                  ))}
                </select>
              </div>

              {isAuthenticated && (
                <div className="col-lg-2 col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Eligibility</label>
                  <select
                    className="form-select form-select-sm"
                    value={eligibilityFilter}
                    onChange={(e) => setEligibilityFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Potentially Eligible">Eligible</option>
                    <option value="Partially Eligible">Partial</option>
                    <option value="Not Eligible">Not Eligible</option>
                  </select>
                </div>
              )}

              <div className="col-lg-2 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Verification</label>
                <select
                  className="form-select form-select-sm"
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                >
                  <option value="All">All Verification</option>
                  <option value="Verified">Verified</option>
                  <option value="Needs Verification">Needs Verification</option>
                  <option value="Outdated">Outdated</option>
                </select>
              </div>

              <div className="col-lg-2 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Sort By</label>
                <select
                  className="form-select form-select-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="deadline_asc">Earliest Deadline</option>
                </select>
              </div>
            </div>

            {/* Active Filter Tags & Reset */}
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">
                  <strong>{schemes.length}</strong> schemes found
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none p-0 text-muted"
                  onClick={fetchSchemes}
                  title="Refresh latest scheme verification and catalogue"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
              {(category !== 'All' || stateFilter !== 'All' || educationLevel !== 'All' || eligibilityFilter !== 'All' || verificationFilter !== 'All' || search) && (
                <button
                  className="btn btn-link btn-sm text-danger text-decoration-none p-0 small"
                  onClick={handleClearFilters}
                >
                  <i className="bi bi-x-circle me-1"></i> Reset filters
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Schemes Grid */}
        {loading ? (
          <LoadingSpinner message="Filtering and evaluating scholarship database..." />
        ) : schemes.length === 0 ? (
          <EmptyState
            icon="bi-search"
            title="No Matching Schemes Found"
            description="Try adjusting your search terms or relaxing category and state filters."
            actionLabel="Reset Filters"
            onAction={handleClearFilters}
          />
        ) : (
          <div className="row g-4">
            {schemes.map((scheme) => (
              <div key={scheme._id || scheme.slug} className="col-xl-4 col-md-6">
                <SchemeCard
                  scheme={scheme}
                  onAddToCompare={handleToggleCompare}
                  isComparing={compareList.some(
                    (s) => (s._id || s.slug) === (scheme._id || scheme.slug)
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Compare Tray if items selected */}
      {compareList.length > 0 && (
        <div
          className="position-fixed bottom-0 start-50 translate-middle-x bg-white shadow-lg border rounded-top-4 p-3 d-flex align-items-center gap-3"
          style={{ zIndex: 1040, maxWidth: '90%', width: '680px' }}
        >
          <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
            <span className="fw-bold small text-navy text-nowrap">Compare ({compareList.length}):</span>
            <div className="d-flex gap-2 overflow-auto py-1">
              {compareList.map((c) => (
                <span
                  key={c._id || c.slug}
                  className="badge bg-light text-dark border d-flex align-items-center gap-1 small text-nowrap"
                >
                  <span className="text-truncate" style={{ maxWidth: '140px' }}>
                    {c.name}
                  </span>
                  <button
                    type="button"
                    className="btn-close ms-1"
                    style={{ fontSize: '0.55rem' }}
                    onClick={() => handleToggleCompare(c)}
                  ></button>
                </span>
              ))}
            </div>
          </div>
          <button className="btn btn-sm btn-navy text-nowrap" onClick={() => navigate('/compare')}>
            Compare &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

export default SchemeDiscovery;
