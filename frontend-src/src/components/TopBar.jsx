import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import Icon from './Icon.jsx';

export default function TopBar({ title, subtitle, back, right, theme = true }) {
  const navigate = useNavigate();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(typeof back === 'string' ? back : '/'));
  return (
    <header className="sticky top-0 z-30 safe-top backdrop-blur-xl bg-[#e7e9e4]/85 dark:bg-[#121614]/85 border-b border-slate-300/60 dark:border-slate-800">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0">
          {back && (
            <button onClick={goBack} aria-label="Kthehu" className="h-10 w-10 -ml-2 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 active:bg-slate-300/60 dark:active:bg-slate-800 shrink-0">
              <Icon name="back" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-[22px] leading-none truncate">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          {theme && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}
