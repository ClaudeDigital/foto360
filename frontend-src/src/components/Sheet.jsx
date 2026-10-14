import React, { useEffect } from 'react';

// Bottom sheet on phones, centered dialog on larger screens.
export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-[28px] shadow-2xl animate-slide-up sm:animate-pop-in">
        <div className="sm:hidden flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="px-6 pt-4 pb-6 safe-bottom">
          {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
          {children}
        </div>
      </div>
    </div>
  );
}
