import React, { useEffect, useRef, useState } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setReady(false);
      setError('');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
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
        setError('Nuk mund të hapet kamera. Kontrollo lejet e browser-it.');
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
    if (!video) return;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    canvas.toBlob(blob => {
      if (blob) onCapture(blob);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center px-8 text-center text-white/90">
            <p>{error}</p>
          </div>
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
        {flash && <div className="absolute inset-0 bg-white animate-pulse" />}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button onClick={onClose} className="h-11 w-11 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <button
            onClick={() => setFacing(f => (f === 'environment' ? 'user' : 'environment'))}
            className="h-11 w-11 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.65 4.36A9 9 0 0 0 20.5 15"/></svg>
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="bg-black safe-bottom flex items-center justify-center py-6">
        <button
          disabled={!ready}
          onClick={capture}
          className="h-18 w-18 rounded-full border-4 border-white/80 p-1 disabled:opacity-40 active:scale-95 transition"
          style={{ height: 72, width: 72 }}
        >
          <span className="block h-full w-full rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}
