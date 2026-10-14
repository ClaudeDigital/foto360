import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, type = 'success') => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none pt-[max(0.75rem,env(safe-area-inset-top))]">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-2 max-w-sm w-full rounded-2xl px-4 py-3 text-sm font-medium shadow-lg animate-pop-in ${
            t.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          }`}>
            <Icon name={t.type === 'error' ? 'close' : 'check'} size={18} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
