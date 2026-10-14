import React from 'react';

export default function Spinner({ className = '' }) {
  return <span className={`spinner ${className}`} role="status" aria-label="Duke u ngarkuar" />;
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center text-brand-500">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
