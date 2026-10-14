import React from 'react';

// The foto360 mark: a lens inside a 360° orbit arrow. Same artwork as public/logo.svg.
export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="f360-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.55" stopColor="#6d4af6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="f360-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#f360-bg)" />
      <path d="M 332.1 113.0 A 162 162 0 1 1 170.2 118.6" fill="none" stroke="#fff" strokeWidth="30" strokeLinecap="round" />
      <path d="M 152.1 89.8 L 207.5 95.3 L 188.2 147.4 Z" fill="#fff" stroke="#fff" strokeWidth="10" strokeLinejoin="round" />
      <circle cx="256" cy="256" r="92" fill="#fff" />
      <circle cx="256" cy="256" r="62" fill="url(#f360-lens)" />
      <circle cx="256" cy="256" r="26" fill="#0b1220" />
      <circle cx="232" cy="230" r="13" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export default function Logo({ size = 32, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`}>
      <LogoMark size={size} className="drop-shadow-sm" />
      <span className="text-lg">
        foto<span className="bg-brand-gradient bg-clip-text text-transparent">360</span>
      </span>
    </span>
  );
}
