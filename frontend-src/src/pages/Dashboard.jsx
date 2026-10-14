import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import TopBar from '../components/TopBar.jsx';
import Sheet from '../components/Sheet.jsx';
import Icon from '../components/Icon.jsx';
import Thumb from '../components/Thumb.jsx';
import Spinner from '../components/Spinner.jsx';
import InstallApp from '../components/InstallApp.jsx';
import DateStamp, { stampText } from '../components/DateStamp.jsx';
import { capitalize, fmtDay, fmtWeekday, isToday, parseDbDate } from '../utils.js';

export const TIER_LABEL = {
  none: { text: 'Pa plan', color: 'bg-slate-300/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  limited: { text: 'Limited Access', color: 'bg-slate-300/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200' },
  full: { text: 'Full Access', color: 'bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900' }
};

function LocationCard({ loc }) {
  const last = parseDbDate(loc.last_photo_at);
  const doneToday = isToday(last);
  const photo = loc.latest_photo || loc.cover_photo;
  return (
    <div className="relative">
      <Link to={`/lokacioni/${loc.id}`} className="block print active:scale-[0.98] transition">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-slate-300 dark:bg-slate-900">
          {photo ? (
            <Thumb filename={photo} alt={loc.name} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-500">
              <Icon name="camera" size={30} />
              <span className="text-xs font-semibold">Pa foto ende</span>
            </div>
          )}
          {last && (
            <div className="absolute right-2 bottom-2 pointer-events-none">
              <DateStamp value={stampText(last)} height={13} label={`Fotoja e fundit: ${fmtDay(last)}`} />
            </div>
          )}
        </div>
        <div className="px-1 pt-2 pb-1">
          <p className="font-bold leading-tight truncate">{loc.name}</p>
          <p className={`text-xs mt-0.5 tnum ${doneToday ? 'text-slate-500 dark:text-slate-400' : 'text-stamp-700 dark:text-stamp-400 font-semibold'}`}>
            {doneToday ? `${loc.photo_count} foto · e sotmja u bë` : last ? `${loc.photo_count} foto · pa foto sot` : 'Bëj foton e parë'}
          </p>
        </div>
      </Link>
      {!doneToday && (
        <Link
          to={`/lokacioni/${loc.id}?kamera=1`}
          aria-label={`Bëj foto te ${loc.name}`}
          className="absolute top-3 right-3 h-11 w-11 rounded-full bg-stamp-500 text-slate-950 shadow-glow flex items-center justify-center active:scale-90 transition"
        >
          <Icon name="camera" size={20} strokeWidth={2.1} />
        </Link>
      )}
    </div>
  );
}

// The day's progress, styled like a camera's LCD: today's date on the left,
// one lit segment per location that already has today's photo.
function TodayPanel({ locations }) {
  const done = locations.filter(l => isToday(parseDbDate(l.last_photo_at))).length;
  const all = done === locations.length;
  return (
    <div className="rounded-2xl bg-slate-900 text-slate-100 p-4 dark:bg-slate-900 dark:border dark:border-slate-800">
      <div className="flex items-center justify-between gap-4">
        <DateStamp value={stampText(new Date())} height={24} label={`Sot: ${fmtDay(new Date())}`} />
        <p className="text-sm font-semibold tnum text-slate-300">{done} nga {locations.length}</p>
      </div>
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {locations.map(l => (
          <span key={l.id} className={`h-1.5 flex-1 rounded-full ${isToday(parseDbDate(l.last_photo_at)) ? 'bg-stamp-500 shadow-[0_0_8px_rgba(255,123,28,0.7)]' : 'bg-slate-700'}`} />
        ))}
      </div>
      <p className="mt-3 text-[15px] text-slate-300">
        {all ? 'Të gjitha fotot e sotme janë bërë. Shihemi nesër.' : `${locations.length - done === 1 ? 'Një vend pret' : `${locations.length - done} vende presin`} foton e sotme.`}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { locations } = await api.locations();
      setLocations(locations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createLocation = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { location } = await api.createLocation({ name, description });
      setName(''); setDescription(''); setShowCreate(false);
      toast('Lokacioni u krijua');
      navigate(`/lokacioni/${location.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tierKey = user?.access_tier || 'none';
  const tier = TIER_LABEL[tierKey];
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div>
      <TopBar title="foto360" subtitle={capitalize(fmtWeekday(new Date()))} />

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="flex items-end justify-between gap-3 mb-5">
          <h2 className="font-display font-extrabold text-[40px] leading-[0.95] min-w-0 break-words">Mirë se erdhe{firstName ? `, ${firstName}` : ''}</h2>
        </div>
        <div className="flex items-center justify-between mb-5">
          <span className={`chip ${tier.color}`}>{tier.text}</span>
          {tierKey !== 'full' && (
            <Link to="/planet" className="text-sm font-semibold text-slate-900 dark:text-slate-100 underline underline-offset-4 decoration-slate-400">
              {tierKey === 'none' ? 'Zgjedh një plan' : 'Kalo në Full Access'}
            </Link>
          )}
        </div>

        {tierKey === 'none' && !loading && (
          <Link to="/planet" className="block rounded-2xl bg-slate-900 text-slate-50 p-5 mb-6 active:scale-[0.99] transition">
            <p className="font-display font-extrabold text-3xl leading-none">Aktivizo llogarinë</p>
            <p className="text-sm text-slate-300 mt-2 max-w-[36ch]">Zgjedh një plan për të krijuar lokacionin e parë. Fillon nga €1, paguhet një herë.</p>
            <span className="mt-4 btn h-11 bg-stamp-500 text-slate-950">Shiko planet</span>
          </Link>
        )}

        {!loading && locations.length > 0 && (
          <div className="mb-7"><TodayPanel locations={locations} /></div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton aspect-[4/5] rounded-md" />)}
          </div>
        ) : locations.length === 0 ? (
          tierKey !== 'none' && (
            <button onClick={() => setShowCreate(true)} className="w-full rounded-2xl border-2 border-dashed border-slate-400/70 dark:border-slate-700 p-8 text-center active:scale-[0.99] transition">
              <span className="mx-auto h-14 w-14 rounded-full bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900 flex items-center justify-center"><Icon name="plus" size={26} /></span>
              <p className="font-display font-extrabold text-2xl mt-4">Shto vendin e parë</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-[30ch] mx-auto">Një shtëpi në ndërtim, një kopsht, një dhomë që po rregullohet.</p>
            </button>
          )
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display font-extrabold text-2xl">Lokacionet</h2>
              <span className="text-sm text-slate-500 tnum">{locations.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
              {locations.map(loc => <LocationCard key={loc.id} loc={loc} />)}
            </div>
          </>
        )}

        {/* extra bottom space so the floating button never covers the last card */}
        <div className="mt-8 mb-24">
          <InstallApp />
        </div>
      </div>

      {tierKey !== 'none' && locations.length > 0 && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed right-4 bottom-nav-offset z-30 h-12 pl-3.5 pr-4 rounded-xl bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900 font-semibold shadow-print flex items-center gap-2 active:scale-95 transition"
        >
          <Icon name="plus" size={20} strokeWidth={2.4} /> Lokacion i ri
        </button>
      )}

      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Lokacion i ri">
        <form onSubmit={createLocation} className="flex flex-col gap-3">
          <label className="label" htmlFor="loc-name">Emri</label>
          <input id="loc-name" autoFocus placeholder="p.sh. Shtëpia në Arbëri" value={name} onChange={e => setName(e.target.value)} required className="input" />
          <textarea placeholder="Përshkrim (opsional)" value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="input h-auto py-3 resize-none" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Anulo</button>
            <button disabled={saving} className="btn-primary flex-1">{saving && <Spinner />} Krijo lokacionin</button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
