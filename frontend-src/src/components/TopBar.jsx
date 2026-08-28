import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

export default function TopBar({ title, back, right }) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {back && (
            <button onClick={() => navigate(-1)} className="h-9 w-9 -ml-1 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 active:scale-95 shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          <h1 className="font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
