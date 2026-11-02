import React from 'react';

/**
 * Standardized Government Scheme Verification Status Badge
 * Displays: Verified | Needs Verification | Outdated
 */
const SchemeVerificationBadge = ({ status }) => {
  const normalized = status ? status.trim() : 'Needs Verification';

  if (normalized === 'Verified' || normalized === 'Verified Active') {
    return (
      <span
        className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small d-inline-flex align-items-center gap-1"
        title="Officially verified active government scheme"
      >
        <i className="bi bi-patch-check-fill text-success"></i> Verified
      </span>
    );
  }

  if (normalized === 'Outdated') {
    return (
      <span
        className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 small d-inline-flex align-items-center gap-1"
        title="Scheme details outdated or undergoing official review"
      >
        <i className="bi bi-shield-x text-danger"></i> Outdated
      </span>
    );
  }

  // 'Needs Verification', 'Needs Official Verification', or unverified
  return (
    <span
      className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 small d-inline-flex align-items-center gap-1"
      title="Awaiting administrator verification"
    >
      <i className="bi bi-shield-exclamation text-warning"></i> Needs Verification
    </span>
  );
};

export default SchemeVerificationBadge;
