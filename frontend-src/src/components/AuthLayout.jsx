import React from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from './Logo.jsx';
import TopBar from './TopBar.jsx';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen">
      <TopBar title="" back="/" />
      <div className="max-w-sm mx-auto px-5 pt-4 pb-10 animate-pop-in">
        <Link to="/" className="inline-block" aria-label="foto360"><LogoMark size={48} /></Link>
        <h1 className="font-display font-extrabold text-[44px] leading-[0.95] mt-6">{title}</h1>
        {subtitle && <p className="text-slate-600 dark:text-slate-400 mt-2">{subtitle}</p>}
        <div className="mt-7">{children}</div>
        {footer && <p className="text-sm text-center mt-6 text-slate-600 dark:text-slate-400">{footer}</p>}
      </div>
    </div>
  );
}
