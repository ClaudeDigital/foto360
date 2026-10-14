import React from 'react';

// The foto360 mark: a lens inside a 360° orbit arrow, on graphite, with the
// date-imprint orange at its centre. Same artwork as public/logo.svg.
export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect x="6" y="6" width="500" height="500" rx="112" fill="#1b201e" stroke="#4d5551" strokeWidth="12" />
      <path d="M 332.1 113.0 A 162 162 0 1 1 170.2 118.6" fill="none" stroke="#f7f8f5" strokeWidth="30" strokeLinecap="round" />
      <path d="M 152.1 89.8 L 207.5 95.3 L 188.2 147.4 Z" fill="#f7f8f5" stroke="#f7f8f5" strokeWidth="10" strokeLinejoin="round" />
      <circle cx="256" cy="256" r="92" fill="#f7f8f5" />
      <circle cx="256" cy="256" r="62" fill="#ff7b1c" />
      <circle cx="256" cy="256" r="26" fill="#1b201e" />
      <circle cx="232" cy="230" r="13" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export default function Logo({ size = 32, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display font-extrabold text-[22px] leading-none tracking-tight">foto360</span>
    </span>
  );
}
