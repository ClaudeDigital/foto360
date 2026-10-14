import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Spinner from './Spinner.jsx';
import DateStamp, { stampText } from './DateStamp.jsx';

// Full-screen camera. `ghostSrc` (the previous photo) can be overlaid semi-transparently
// so each day's shot lines up with the last one — that's what makes a timelapse smooth.
export default function CameraCapture({ onCapture, onClose, ghostSrc }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ghost, setGhost] = useState(!!ghostSrc);
  const [grid, setGrid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setReady(false);
      setError('');
      streamRef.current?.getTracks().forEach(t => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (e) {
        setError('Nuk mund të hapet kamera. Kontrollo lejet e kamerës në cilësimet e telefonit/browser-it.');
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [facing]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || busy) return;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    setFlash(true);
    setTimeout(() => setFlash(false), 160);
    navigator.vibrate?.(20);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setBusy(true);
      try { await onCapture(blob); } finally { setBusy(false); }
    }, 'image/jpeg', 0.92);
  };

  const pill = (active) => `h-11 px-3.5 rounded-full backdrop-blur-md flex items-center gap-1.5 text-sm font-semibold transition active:scale-95 ${active ? 'bg-white text-slate-900' : 'bg-black/45 text-white'}`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center text-white/90">
            <Icon name="camera" size={40} />
            <p>{error}</p>
          </div>
        ) : (
          <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`} />
        )}
        {ghost && ghostSrc && !error && (
          <img src={ghostSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 pointer-events-none" />
        )}
        {grid && !error && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/25" />)}
          </div>
        )}
        {flash && <div className="absolute inset-0 bg-white" />}

        <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button onClick={onClose} aria-label="Mbyll" className="h-11 w-11 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-md active:scale-95">
            <Icon name="close" />
          </button>
          <div className="flex gap-2">
            {ghostSrc && (
              <button onClick={() => setGhost(g => !g)} className={pill(ghost)} aria-pressed={ghost}>
                <Icon name="ghost" size={18} /> Udhëzues
              </button>
            )}
            <button onClick={() => setGrid(g => !g)} className={pill(grid)} aria-pressed={grid} aria-label="Rrjeta">
              <Icon name="grid" size={18} />
            </button>
          </div>
        </div>
        {ghost && ghostSrc && ready && (
          <p className="absolute bottom-4 left-4 right-28 text-xs text-white/85">
            Rreshto kadrin me foton e djeshme.
          </p>
        )}
        {ready && !error && (
          <div className="absolute bottom-4 right-4 pointer-events-none">
            <DateStamp value={stampText(new Date())} height={18} label="Data që do të ruhet me foton" />
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="bg-black safe-bottom">
        <div className="h-28 flex items-center justify-between px-10">
          <span className="w-12" />
          <button
            disabled={!ready || busy}
            onClick={capture}
            aria-label="Bëj foto"
            className="h-[78px] w-[78px] rounded-full border-[3px] border-white p-[5px] disabled:opacity-50 active:scale-90 transition"
          >
            <span className="h-full w-full rounded-full bg-stamp-500 flex items-center justify-center text-slate-950">
              {busy && <Spinner className="h-6 w-6" />}
            </span>
          </button>
          <button
            onClick={() => setFacing(f => (f === 'environment' ? 'user' : 'environment'))}
            aria-label="Ndrysho kamerën"
            className="h-12 w-12 rounded-full bg-white/15 text-white flex items-center justify-center active:scale-90 transition"
          >
            <Icon name="flip" />
          </button>
        </div>
      </div>
    </div>
  );
}
