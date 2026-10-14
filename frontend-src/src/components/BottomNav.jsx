import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';

const ITEMS = [
  { to: '/dashboard', icon: 'home', label: 'Lokacionet' },
  { to: '/planet', icon: 'sparkle', label: 'Planet' },
  { to: '/llogaria', icon: 'user', label: 'Llogaria' }
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 safe-bottom backdrop-blur-xl bg-white/85 dark:bg-ink-950/85 border-t border-slate-200/70 dark:border-slate-800/70">
      <div className="max-w-2xl mx-auto grid grid-cols-3 h-16">
        {ITEMS.map(it => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`
          }>
            {({ isActive }) => (
              <>
                <span className={`flex items-center justify-center h-8 w-14 rounded-full transition ${isActive ? 'bg-brand-100 dark:bg-brand-900/50' : ''}`}>
                  <Icon name={it.icon} size={21} strokeWidth={isActive ? 2.2 : 1.9} />
                </span>
                {it.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
