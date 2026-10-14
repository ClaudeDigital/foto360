import React from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from './Logo.jsx';
import TopBar from './TopBar.jsx';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen">
      <TopBar title="" back="/" />
      <div className="max-w-sm mx-auto px-5 pt-4 pb-10 animate-pop-in">
        <Link to="/" className="inline-block"><LogoMark size={56} className="rounded-2xl shadow-glow" /></Link>
        <h1 className="text-[28px] font-extrabold tracking-tight mt-5">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        <div className="mt-7">{children}</div>
        {footer && <p className="text-sm text-center mt-6 text-slate-600 dark:text-slate-400">{footer}</p>}
      </div>
    </div>
  );
}
