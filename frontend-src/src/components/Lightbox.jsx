import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { photoUrl } from '../api.js';
import { photoDate } from '../utils.js';

// Full-screen photo viewer with swipe / arrow-key navigation.
export default function Lightbox({ photos, index, onIndex, onClose, onDelete }) {
  const touch = useRef(null);
  const [confirm, setConfirm] = useState(false);
  const photo = photos[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      if (e.key === 'ArrowRight' && index < photos.length - 1) onIndex(index + 1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [index, photos.length, onClose, onIndex]);

  useEffect(() => setConfirm(false), [index]);

  if (!photo) return null;
  const d = photoDate(photo);

  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (dx > 50 && index > 0) onIndex(index - 1);
    if (dx < -50 && index < photos.length - 1) onIndex(index + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <button onClick={onClose} aria-label="Mbyll" className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center active:scale-95"><Icon name="close" /></button>
        <div className="text-center">
          <p className="text-sm font-semibold">{d.toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="text-xs text-white/60">{d.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })} · {index + 1}/{photos.length}</p>
        </div>
        <a href={photoUrl(photo.filename)} download aria-label="Shkarko" className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center active:scale-95"><Icon name="download" /></a>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <img key={photo.id} src={photoUrl(photo.filename)} alt="" className="max-h-full max-w-full object-contain animate-fade-in select-none" draggable={false} />
        {index > 0 && (
          <button onClick={() => onIndex(index - 1)} aria-label="E mëparshmja" className="hidden sm:flex absolute left-3 h-11 w-11 rounded-full bg-white/10 text-white items-center justify-center"><Icon name="back" /></button>
        )}
        {index < photos.length - 1 && (
          <button onClick={() => onIndex(index + 1)} aria-label="Tjetra" className="hidden sm:flex absolute right-3 h-11 w-11 rounded-full bg-white/10 text-white items-center justify-center"><Icon name="chevron" /></button>
        )}
      </div>

      <div className="p-4 safe-bottom flex justify-center">
        {confirm ? (
          <div className="flex gap-3 w-full max-w-sm">
            <button onClick={() => setConfirm(false)} className="btn flex-1 bg-white/10 text-white">Anulo</button>
            <button onClick={() => onDelete(photo)} className="btn-danger flex-1"><Icon name="trash" size={18} /> Fshi</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="btn bg-white/10 text-white"><Icon name="trash" size={18} /> Fshi foton</button>
        )}
      </div>
    </div>
  );
}
