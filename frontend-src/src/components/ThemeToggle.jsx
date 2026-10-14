import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import Icon from './Icon.jsx';

export default function ThemeToggle({ className = '' }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Ndrysho temën"
      className={`h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-300/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-90 transition ${className}`}
    >
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
