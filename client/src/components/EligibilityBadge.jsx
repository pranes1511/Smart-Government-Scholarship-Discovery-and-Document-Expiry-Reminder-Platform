import React from 'react';

const EligibilityBadge = ({ status }) => {
  if (!status) return null;

  switch (status) {
    case 'Potentially Eligible':
      return (
        <span className="badge-eligible d-inline-flex align-items-center gap-1">
          <i className="bi bi-check-circle-fill"></i> Eligible
        </span>
      );
    case 'Partially Eligible':
      return (
        <span className="badge-partially d-inline-flex align-items-center gap-1">
          <i className="bi bi-exclamation-circle-fill"></i> Partial
        </span>
      );
    case 'Not Eligible':
      return (
        <span className="badge-ineligible d-inline-flex align-items-center gap-1">
          <i className="bi bi-x-circle-fill"></i> Not Eligible
        </span>
      );
    case 'Needs Verification':
    default:
      return (
        <span
          className="badge-verification d-inline-flex align-items-center gap-1"
          title="Student profile criteria pending assessment"
        >
          <i className="bi bi-question-circle-fill"></i> Criteria Pending
        </span>
      );
  }
};

export default EligibilityBadge;
