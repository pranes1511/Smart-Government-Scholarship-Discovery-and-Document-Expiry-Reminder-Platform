import React from 'react';

const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No Data Found',
  description = 'There are no records to display at this time.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <h5 className="fw-bold text-navy mb-2" style={{ color: 'var(--primary-navy)' }}>
        {title}
      </h5>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '420px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-sm btn-primary-blue" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
