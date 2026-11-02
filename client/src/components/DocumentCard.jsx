import React from 'react';

const DocumentCard = ({ document, onEdit, onRenew, onDelete }) => {
  const { documentName, documentType, expiryDate, status, statusBadge, daysRemaining } = document;

  const renderStatusBadge = () => {
    switch (status) {
      case 'Valid':
        return (
          <span className="badge badge-doc-valid rounded-pill px-3 py-1">
            <i className="bi bi-shield-check me-1"></i> Valid
          </span>
        );
      case 'Expiring Soon':
        if (daysRemaining !== null && daysRemaining <= 7) {
          if (daysRemaining === 0) {
            return (
              <span className="badge bg-danger text-white rounded-pill px-3 py-1 shadow-sm fw-semibold">
                <i className="bi bi-exclamation-octagon-fill me-1"></i> Expires Today
              </span>
            );
          }
          if (daysRemaining === 1) {
            return (
              <span className="badge bg-danger text-white rounded-pill px-3 py-1 shadow-sm fw-semibold">
                <i className="bi bi-exclamation-triangle-fill me-1"></i> Expires Tomorrow
              </span>
            );
          }
          return (
            <span className="badge bg-danger text-white rounded-pill px-3 py-1 shadow-sm fw-semibold">
              <i className="bi bi-exclamation-triangle-fill me-1"></i> Urgent: {daysRemaining} days left
            </span>
          );
        }
        return (
          <span className="badge badge-doc-expiring rounded-pill px-3 py-1">
            <i className="bi bi-clock-history me-1"></i> Expires in {daysRemaining} days
          </span>
        );
      case 'Expired':
        return (
          <span className="badge badge-doc-expired rounded-pill px-3 py-1">
            <i className="bi bi-x-circle me-1"></i> Expired
          </span>
        );
      case 'No Expiry Date':
      default:
        return (
          <span className="badge badge-doc-no-expiry rounded-pill px-3 py-1">
            <i className="bi bi-infinity me-1"></i> No Expiry Date
          </span>
        );
    }
  };

  return (
    <div className="card custom-card shadow-sm h-100">
      <div className="card-body p-4 d-flex flex-column">
        {/* Top: Type & Status */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="badge bg-light text-secondary border small">
            <i className="bi bi-tag me-1"></i>
            {documentType || 'Certificate'}
          </span>
          {renderStatusBadge()}
        </div>

        {/* Title */}
        <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-navy)' }}>
          {documentName}
        </h5>

        {/* Expiry Details */}
        <div className="mb-3 p-3 bg-light rounded border">
          <div className="d-flex align-items-center justify-content-between small text-muted">
            <span>Expiry Date:</span>
            <strong className="text-dark">
              {expiryDate
                ? new Date(expiryDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'No Expiry'}
            </strong>
          </div>
          {expiryDate && (
            <div className="d-flex align-items-center justify-content-between small text-muted mt-2 pt-2 border-top">
              <span>Reminders:</span>
              <span className="text-primary fw-medium">30, 15 &amp; 7 days before</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 pt-2 border-top mt-auto">
          {expiryDate && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary flex-grow-1"
              onClick={() => onRenew(document)}
              title="Renew document expiry date"
            >
              <i className="bi bi-arrow-repeat me-1"></i> Renew
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onEdit(document)}
            title="Edit document"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(document._id)}
            title="Delete document"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
