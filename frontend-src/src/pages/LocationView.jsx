import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api, photoUrl } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import TopBar from '../components/TopBar.jsx';
import CameraCapture from '../components/CameraCapture.jsx';
import Lightbox from '../components/Lightbox.jsx';
import Sheet from '../components/Sheet.jsx';
import Icon from '../components/Icon.jsx';
import Thumb from '../components/Thumb.jsx';
import Spinner, { FullPageSpinner } from '../components/Spinner.jsx';
import { formatRange, isToday, photoDate, toInputDate } from '../utils.js';

function groupByDay(photos) {
  const groups = [];
  const byKey = {};
  // newest day first in the gallery
  [...photos].reverse().forEach(p => {
    const d = photoDate(p);
    const key = d.toLocaleDateString('sq-AL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    if (!byKey[key]) { byKey[key] = []; groups.push([key, byKey[key]]); }
    byKey[key].push(p);
  });
  return groups;
}

const PRESETS = [
  { label: '7 ditë', days: 7 },
  { label: '30 ditë', days: 30 },
  { label: '3 muaj', days: 90 },
  { label: '1 vit', days: 365 },
  { label: 'Të gjitha', days: null }
];

export default function LocationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(null); // { done, total }
  const [tab, setTab] = useState('foto');
  const [timelapses, setTimelapses] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [genError, setGenError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [pendingFiles, setPendingFiles] = useState(null);
  const [batchDate, setBatchDate] = useState('');
  const [viewer, setViewer] = useState(null); // index into `photos`
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const loadAll = useCallback(async () => {
    try {
      const [{ location }, { photos }] = await Promise.all([api.getLocation(id), api.photos(id)]);
      setLocation(location);
      setPhotos(photos);
    } catch {
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadTimelapses = useCallback(async () => {
    const { timelapses } = await api.timelapses(id);
    setTimelapses(timelapses);
    return timelapses;
  }, [id]);

  useEffect(() => { loadAll(); loadTimelapses(); }, [loadAll, loadTimelapses]);

  // Opened from the daily reminder notification: go straight to the camera.
  useEffect(() => {
    if (location && searchParams.get('kamera') === '1') {
      setShowCamera(true);
      setSearchParams({}, { replace: true });
    }
  }, [location, searchParams, setSearchParams]);

  const startPolling = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const list = await loadTimelapses().catch(() => []);
      if (!list.some(t => t.status === 'processing')) clearInterval(pollRef.current);
    }, 1200);
  }, [loadTimelapses]);

  useEffect(() => { startPolling(); return () => clearInterval(pollRef.current); }, [startPolling]);

  // Default the timelapse range to the full span of photos.
  useEffect(() => {
    if (photos.length && !dateFrom && !dateTo) {
      setDateFrom(toInputDate(photoDate(photos[0])));
      setDateTo(toInputDate(photoDate(photos[photos.length - 1])));
    }
  }, [photos, dateFrom, dateTo]);

  const uploadOne = async (file, source, capturedAt) => {
    const fd = new FormData();
    fd.append('photo', file, file.name || 'photo.jpg');
    fd.append('source', source);
    if (capturedAt) fd.append('captured_at', capturedAt);
    await api.uploadPhoto(id, fd);
  };

  const onCapture = async (blob) => {
    try {
      await uploadOne(blob, 'capture');
      await loadAll();
      setShowCamera(false);
      toast('Foto u ruajt 📸');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setPendingFiles(files);
    e.target.value = '';
  };

  const confirmUploadBatch = async () => {
    if (!pendingFiles) return;
    const files = pendingFiles;
    setPendingFiles(null);
    setUploading({ done: 0, total: files.length });
    let failed = 0;
    // Upload a few at a time — mobile connections choke on dozens of parallel requests.
    const queue = [...files];
    const worker = async () => {
      while (queue.length) {
        const file = queue.shift();
        try { await uploadOne(file, 'upload', batchDate || null); } catch { failed += 1; }
        setUploading(u => ({ ...u, done: u.done + 1 }));
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker));
    setBatchDate('');
    await loadAll();
    setUploading(null);
    if (failed) toast(`${failed} foto nuk u ngarkuan`, 'error');
    else toast(`${files.length} foto u ngarkuan`);
  };

  const deletePhoto = async (photo) => {
    try {
      await api.deletePhoto(photo.id);
      const next = photos.filter(x => x.id !== photo.id);
      setPhotos(next);
      setViewer(v => (next.length === 0 ? null : Math.min(v, next.length - 1)));
      toast('Foto u fshi');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const deleteLocation = async () => {
    try {
      await api.deleteLocation(id);
      toast('Lokacioni u fshi');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const applyPreset = (days) => {
    if (!photos.length) return;
    const last = photoDate(photos[photos.length - 1]);
    const first = photoDate(photos[0]);
    const from = days ? new Date(last.getTime() - (days - 1) * 86400000) : first;
    setDateFrom(toInputDate(from < first ? first : from));
    setDateTo(toInputDate(last));
  };

  const generate = async (e) => {
    e.preventDefault();
    setGenError('');
    setGenerating(true);
    try {
      await api.createTimelapse(id, { date_from: dateFrom, date_to: dateTo });
      await loadTimelapses();
      startPolling();
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const share = async (t) => {
    const url = `${window.location.origin}/uploads/videos/${t.video_path}`;
    try {
      if (navigator.share) await navigator.share({ title: `${location.name} — timelapse`, url });
      else { await navigator.clipboard.writeText(url); toast('Linku u kopjua'); }
    } catch { /* user cancelled */ }
  };

  const groups = useMemo(() => groupByDay(photos), [photos]);
  const indexById = useMemo(() => Object.fromEntries(photos.map((p, i) => [p.id, i])), [photos]);
  const inRange = useMemo(() => photos.filter(p => {
    const k = toInputDate(photoDate(p));
    return (!dateFrom || k >= dateFrom) && (!dateTo || k <= dateTo);
  }).length, [photos, dateFrom, dateTo]);

  if (loading || !location) return <FullPageSpinner />;

  const last = photos[photos.length - 1];
  const doneToday = last && isToday(photoDate(last));

  return (
    <div className="pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      <TopBar
        title={location.name}
        subtitle={location.description || `${photos.length} foto`}
        back="/dashboard"
        right={
          <button onClick={() => setMenu(true)} aria-label="Më shumë" className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          </button>
        }
      />

      <div className="max-w-2xl mx-auto px-4 pt-3">
        <div className="segmented mb-4" role="tablist">
          <button role="tab" aria-selected={tab === 'foto'} onClick={() => setTab('foto')}>Fotot · {photos.length}</button>
          <button role="tab" aria-selected={tab === 'video'} onClick={() => setTab('video')}>Timelapse{timelapses.length ? ` · ${timelapses.length}` : ''}</button>
        </div>

        {tab === 'foto' && (
          <>
            {uploading && (
              <div className="card p-4 mb-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-brand-600 dark:text-brand-400"><Spinner className="h-4 w-4" /> Duke ngarkuar...</span>
                  <span className="tabular-nums text-slate-500">{uploading.done}/{uploading.total}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-brand-gradient transition-all duration-300" style={{ width: `${(uploading.done / uploading.total) * 100}%` }} />
                </div>
              </div>
            )}

            {photos.length > 0 && !doneToday && (
              <button onClick={() => setShowCamera(true)} className="w-full card p-4 mb-5 flex items-center gap-3 text-left active:scale-[0.99] transition">
                <span className="h-11 w-11 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0"><Icon name="clock" /></span>
                <span className="flex-1">
                  <span className="block font-semibold">Fotoja e sotme mungon</span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">Bëje tani që timelapse të mos ketë boshllëk.</span>
                </span>
                <Icon name="chevron" className="text-slate-400" />
              </button>
            )}

            {photos.length === 0 ? (
              <div className="card border-dashed p-8 text-center mt-2">
                <div className="h-16 w-16 mx-auto rounded-3xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center">
                  <Icon name="image" size={30} />
                </div>
                <p className="font-bold mt-4">Ende s'ka foto këtu</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Bëj foton e parë ose ngarko nga galeria.</p>
              </div>
            ) : (
              groups.map(([day, items]) => (
                <section key={day} className="mb-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 capitalize">{day}</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {items.map(p => (
                      <button key={p.id} onClick={() => setViewer(indexById[p.id])}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 active:scale-95 transition">
                        <Thumb filename={p.filename} />
                        {p.source === 'capture' && (
                          <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center"><Icon name="camera" size={12} /></span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}

        {tab === 'video' && (
          <div>
            <form onSubmit={generate} className="card p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-9 w-9 rounded-xl bg-brand-gradient text-white flex items-center justify-center"><Icon name="film" size={18} /></span>
                <h3 className="font-bold">Krijo Timelapse</h3>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1 mb-3">
                {PRESETS.map(p => (
                  <button type="button" key={p.label} onClick={() => applyPreset(p.days)}
                    className="chip shrink-0 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95">
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Nga</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} required className="input px-3" />
                </div>
                <div>
                  <label className="label text-xs">Deri</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} required className="input px-3" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{inRange} foto në këtë periudhë{inRange >= 2 ? ` · ~${Math.max(1, Math.round(inRange / 1.25))} sek video` : ''}</p>
              {genError && <p className="text-sm text-red-500 mt-2">{genError}</p>}
              <button disabled={generating || inRange < 2} className="btn-primary w-full mt-4">
                {generating ? <><Spinner /> Duke filluar...</> : <><Icon name="sparkle" size={18} /> Gjenero Video</>}
              </button>
            </form>

            <div className="flex flex-col gap-3">
              {timelapses.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">Ende s'ke gjeneruar asnjë timelapse.</p>
              )}
              {timelapses.map(t => (
                <div key={t.id} className="card overflow-hidden">
                  {t.status === 'done' && (
                    <video src={`/uploads/videos/${t.video_path}`} controls playsInline preload="metadata" className="w-full aspect-video bg-black" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{formatRange(t.date_from, t.date_to)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t.status === 'processing' && `Duke u gjeneruar... ${t.progress || 0}%`}
                          {t.status === 'done' && `${t.photo_count} foto`}
                          {t.status === 'failed' && <span className="text-red-500">Dështoi gjenerimi</span>}
                        </p>
                      </div>
                      {t.status === 'processing' && (
                        <span className="text-sm font-bold text-brand-600 dark:text-brand-400 tabular-nums">{t.progress || 0}%</span>
                      )}
                      {t.status === 'done' && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => share(t)} aria-label="Ndaj" className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90"><Icon name="share" size={18} /></button>
                          <a href={`/uploads/videos/${t.video_path}`} download className="h-10 px-4 rounded-full bg-brand-gradient text-white text-sm font-semibold flex items-center gap-1.5 active:scale-95">
                            <Icon name="download" size={16} /> Shkarko
                          </a>
                        </div>
                      )}
                    </div>
                    {t.status === 'processing' && (
                      <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-brand-gradient transition-all duration-500 ease-out" style={{ width: `${Math.max(4, t.progress || 0)}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thumb-reach action bar */}
      {tab === 'foto' && (
        <div className="fixed bottom-0 inset-x-0 z-30 safe-bottom bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-ink-950 dark:via-ink-950/95">
          <div className="max-w-2xl mx-auto px-4 pt-6 pb-3 grid grid-cols-[1fr_auto] gap-3">
            <button onClick={() => setShowCamera(true)} className="btn-primary h-14 text-base">
              <Icon name="camera" /> Bëj Foto
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={!!uploading} className="btn-secondary h-14 px-5" aria-label="Ngarko nga galeria">
              <Icon name="upload" /> <span className="hidden min-[380px]:inline">Ngarko</span>
            </button>
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} />

      {showCamera && (
        <CameraCapture
          ghostSrc={last ? photoUrl(last.filename) : null}
          onClose={() => setShowCamera(false)}
          onCapture={onCapture}
        />
      )}

      {viewer !== null && photos[viewer] && (
        <Lightbox photos={photos} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} onDelete={deletePhoto} />
      )}

      <Sheet open={!!pendingFiles} onClose={() => setPendingFiles(null)} title={pendingFiles ? `Ngarko ${pendingFiles.length} foto` : ''}>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Data/ora e fotos (opsionale) — nëse s'e vendos, përdoret data e ngarkimit.</p>
        <input type="datetime-local" value={batchDate} onChange={e => setBatchDate(e.target.value)} className="input" />
        <div className="flex gap-3 mt-5">
          <button onClick={() => setPendingFiles(null)} className="btn-secondary flex-1">Anulo</button>
          <button onClick={confirmUploadBatch} className="btn-primary flex-1"><Icon name="upload" size={18} /> Ngarko</button>
        </div>
      </Sheet>

      <Sheet open={menu} onClose={() => { setMenu(false); setConfirmDelete(false); }} title={location.name}>
        {confirmDelete ? (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300">Kjo fshin përgjithmonë lokacionin, <b>{photos.length} foto</b> dhe të gjitha videot. Nuk mund të kthehet.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1">Anulo</button>
              <button onClick={deleteLocation} className="btn-danger flex-1"><Icon name="trash" size={18} /> Fshi</button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <button onClick={() => { setMenu(false); fileInputRef.current?.click(); }} className="btn-secondary justify-start"><Icon name="upload" size={20} /> Ngarko nga galeria</button>
            <button onClick={() => { setMenu(false); setTab('video'); }} className="btn-secondary justify-start"><Icon name="film" size={20} /> Krijo timelapse</button>
            <button onClick={() => setConfirmDelete(true)} className="btn justify-start text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400"><Icon name="trash" size={20} /> Fshi lokacionin</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
