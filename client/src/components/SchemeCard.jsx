import React from 'react';
import { Link } from 'react-router-dom';
import EligibilityBadge from './EligibilityBadge';
import SchemeVerificationBadge from './SchemeVerificationBadge';

const SchemeCard = ({ scheme, onAddToCompare, isComparing = false }) => {
  const eligibilityStatus = scheme.eligibilityResult?.status;

  return (
    <div className="card scheme-card shadow-sm">
      <div className="card-body d-flex flex-column p-4">
        {/* Category & Status */}
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <span className="scheme-category-tag">{scheme.category}</span>
          <div className="d-flex flex-wrap gap-1 align-items-center justify-content-end">
            <SchemeVerificationBadge status={scheme.verificationStatus} />
            {eligibilityStatus && <EligibilityBadge status={eligibilityStatus} />}
          </div>
        </div>

        {/* Scheme Name */}
        <h5 className="scheme-title">
          <Link
            to={`/schemes/${scheme._id || scheme.slug}`}
            className="text-decoration-none"
            style={{ color: 'var(--primary-navy)' }}
          >
            {scheme.name}
          </Link>
        </h5>

        {/* Ministry / Department */}
        <div className="text-muted small mb-2 d-flex align-items-center gap-1">
          <i className="bi bi-bank2"></i>
          <span className="text-truncate">{scheme.ministry || 'Government Department'}</span>
        </div>

        {/* Short Description */}
        <p
          className="card-text text-secondary small flex-grow-1 mb-3"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.45'
          }}
        >
          {scheme.description}
        </p>

        {/* Key Benefit Highlight */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="scheme-benefits-box mb-3 py-2 px-3">
            <div className="small fw-semibold text-dark text-truncate" title={scheme.benefits[0]}>
              <i className="bi bi-award-fill text-primary me-1"></i> {scheme.benefits[0]}
            </div>
          </div>
        )}

        {/* State & Level Tags */}
        <div className="d-flex flex-wrap gap-1 mb-3">
          <span className="badge bg-light text-dark border small">
            <i className="bi bi-geo-alt me-1"></i>
            {scheme.applicableStates?.[0] || 'All India'}
          </span>
          <span className="badge bg-light text-dark border small">
            <i className="bi bi-book me-1"></i>
            {scheme.educationLevels?.[0] || 'Undergraduate'}
          </span>
          {scheme.applicationDeadline && (
            <span className="badge bg-light text-secondary border small">
              <i className="bi bi-calendar3 me-1"></i> {scheme.applicationDeadline}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 pt-2 border-top mt-auto">
          <Link
            to={`/schemes/${scheme._id || scheme.slug}`}
            className="btn btn-sm btn-navy flex-grow-1"
          >
            <i className="bi bi-eye me-1"></i> View Details
          </Link>
          {onAddToCompare && (
            <button
              type="button"
              className={`btn btn-sm ${isComparing ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => onAddToCompare(scheme)}
              title={isComparing ? 'Added to compare' : 'Compare with other schemes'}
            >
              <i className={`bi ${isComparing ? 'bi-check2' : 'bi-columns-gap'}`}></i>{' '}
              {isComparing ? 'Added' : 'Compare'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemeCard;
