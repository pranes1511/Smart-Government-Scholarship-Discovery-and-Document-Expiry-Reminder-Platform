import React from 'react';

const LoadingSpinner = ({ message = 'Loading scholarship data...' }) => {
  return (
    <div className="loading-container text-center py-5">
      <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted small">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
