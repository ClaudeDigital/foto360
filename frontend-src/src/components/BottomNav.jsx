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
    <nav className="fixed bottom-0 inset-x-0 z-30 safe-bottom backdrop-blur-xl bg-[#e7e9e4]/90 dark:bg-[#121614]/90 border-t border-slate-300/70 dark:border-slate-800">
      <div className="max-w-2xl mx-auto grid grid-cols-3 h-16">
        {ITEMS.map(it => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${isActive ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'}`
          }>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-[3px] w-10 rounded-b bg-slate-900 dark:bg-slate-50" />}
                <Icon name={it.icon} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {it.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
