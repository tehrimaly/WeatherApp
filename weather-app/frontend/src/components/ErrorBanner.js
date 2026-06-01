import React from 'react';

const ErrorBanner = ({ message, onDismiss }) => (
  <div className="error-banner" role="alert">
    <p>⚠️ {message}</p>
    <button className="error-dismiss" onClick={onDismiss} aria-label="Dismiss error">×</button>
  </div>
);

export default ErrorBanner;
