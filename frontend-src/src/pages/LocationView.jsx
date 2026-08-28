import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import TopBar from '../components/TopBar.jsx';
import CameraCapture from '../components/CameraCapture.jsx';

function groupByDay(photos) {
  const groups = {};
  photos.forEach(p => {
    const d = new Date(p.captured_at || p.created_at);
    const key = d.toLocaleDateString('sq-AL', { day: '2-digit', month: 'long', year: 'numeric' });
    (groups[key] ||= []).push(p);
  });
  return groups;
}

export default function LocationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('foto');
  const [timelapses, setTimelapses] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [genError, setGenError] = useState('');
  const [pendingFiles, setPendingFiles] = useState(null);
  const [batchDate, setBatchDate] = useState('');
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const loadAll = useCallback(async () => {
    const [{ location }, { photos }] = await Promise.all([api.getLocation(id), api.photos(id)]);
    setLocation(location);
    setPhotos(photos);
    setLoading(false);
  }, [id]);

  const loadTimelapses = useCallback(async () => {
    const { timelapses } = await api.timelapses(id);
    setTimelapses(timelapses);
    return timelapses;
  }, [id]);

  useEffect(() => { loadAll(); loadTimelapses(); }, [loadAll, loadTimelapses]);

  useEffect(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const list = await loadTimelapses();
      if (!list.some(t => t.status === 'processing')) clearInterval(pollRef.current);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [loadTimelapses]);

  const uploadOne = async (file, source, capturedAt) => {
    const fd = new FormData();
    fd.append('photo', file, file.name || 'photo.jpg');
    fd.append('source', source);
    if (capturedAt) fd.append('captured_at', capturedAt);
    await api.uploadPhoto(id, fd);
  };

  const onCapture = async (blob) => {
    setUploading(true);
    try {
      await uploadOne(blob, 'capture');
      await loadAll();
    } finally {
      setUploading(false);
    }
  };

  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setPendingFiles(files);
    e.target.value = '';
  };

  const confirmUploadBatch = async () => {
    if (!pendingFiles) return;
    setUploading(true);
    try {
      for (const file of pendingFiles) {
        await uploadOne(file, 'upload', batchDate || null);
      }
      setPendingFiles(null);
      setBatchDate('');
      await loadAll();
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    await api.deletePhoto(photoId);
    setPhotos(p => p.filter(x => x.id !== photoId));
  };

  const generate = async (e) => {
    e.preventDefault();
    setGenError('');
    try {
      await api.createTimelapse(id, { date_from: dateFrom, date_to: dateTo });
      loadTimelapses();
    } catch (err) {
      setGenError(err.message);
    }
  };

  if (loading || !location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const groups = groupByDay(photos);

  return (
    <div>
      <TopBar title={location.name} back />

      <div className="max-w-lg mx-auto px-5 pt-3">
        <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
          <button onClick={() => setTab('foto')} className={`flex-1 h-9 rounded-lg text-sm font-semibold transition ${tab === 'foto' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-500'}`}>
            Fotot ({photos.length})
          </button>
          <button onClick={() => setTab('video')} className={`flex-1 h-9 rounded-lg text-sm font-semibold transition ${tab === 'video' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-500'}`}>
            Timelapse
          </button>
        </div>

        {tab === 'foto' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button onClick={() => setShowCamera(true)} className="h-14 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition">
                📷 Bëj Foto
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="h-14 rounded-xl border-2 border-slate-300 dark:border-slate-700 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition">
                ⬆️ Ngarko
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} />
            </div>

            {uploading && (
              <div className="mb-4 text-sm text-brand-600 dark:text-brand-400 flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /> Duke ngarkuar...
              </div>
            )}

            {photos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center mt-6">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Ende s'ka foto në këtë lokacion.</p>
              </div>
            ) : (
              Object.entries(groups).map(([day, items]) => (
                <div key={day} className="mb-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">{day}</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {items.map(p => (
                      <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                        <img src={`/uploads/photos/${p.filename}`} className="h-full w-full object-cover" loading="lazy" alt="" />
                        <button
                          onClick={() => deletePhoto(p.id)}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'video' && (
          <div className="pb-10">
            <form onSubmit={generate} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-5">
              <h3 className="font-semibold mb-3">Krijo Timelapse</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500">Nga</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} required
                    className="mt-1 w-full h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none focus:border-brand-500" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500">Deri</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} required
                    className="mt-1 w-full h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
              {genError && <p className="text-sm text-red-500 mt-2">{genError}</p>}
              <button className="mt-4 w-full h-11 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">
                Gjenero Video
              </button>
            </form>

            <div className="flex flex-col gap-3">
              {timelapses.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">Ende s'ke gjeneruar asnjë timelapse.</p>
              )}
              {timelapses.map(t => (
                <div key={t.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{t.date_from} → {t.date_to}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.status === 'processing' && 'Duke u gjeneruar...'}
                        {t.status === 'done' && `${t.photo_count} foto`}
                        {t.status === 'failed' && 'Dështoi gjenerimi'}
                      </p>
                    </div>
                    {t.status === 'processing' && <div className="h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />}
                    {t.status === 'done' && (
                      <a href={`/uploads/videos/${t.video_path}`} download className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                        Shkarko ↓
                      </a>
                    )}
                    {t.status === 'failed' && <span className="text-lg">⚠️</span>}
                  </div>
                  {t.status === 'done' && (
                    <video src={`/uploads/videos/${t.video_path}`} controls className="mt-3 w-full rounded-lg bg-black" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCamera && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          onCapture={async (blob) => { await onCapture(blob); setShowCamera(false); }}
        />
      )}

      {pendingFiles && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setPendingFiles(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-6 safe-bottom">
            <h3 className="font-bold text-lg mb-1">Ngarko {pendingFiles.length} foto</h3>
            <p className="text-sm text-slate-500 mb-4">Data/ora e fotos (opsionale) — nëse s'e vendos, do të përdoret data e ngarkimit.</p>
            <input type="datetime-local" value={batchDate} onChange={e => setBatchDate(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 outline-none focus:border-brand-500" />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setPendingFiles(null)} className="flex-1 h-12 rounded-xl border border-slate-300 dark:border-slate-700 font-medium">
                Anulo
              </button>
              <button onClick={confirmUploadBatch} disabled={uploading} className="flex-1 h-12 rounded-xl bg-brand-600 text-white font-semibold disabled:opacity-60">
                {uploading ? 'Duke ngarkuar...' : 'Ngarko'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
