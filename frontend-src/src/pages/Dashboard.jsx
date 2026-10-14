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
import { isToday, parseDbDate, relativeDay } from '../utils.js';

export const TIER_LABEL = {
  none: { text: 'Pa plan', color: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  limited: { text: 'Limited Access', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  full: { text: 'Full Access', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' }
};

function LocationCard({ loc, index }) {
  const last = parseDbDate(loc.last_photo_at);
  const doneToday = isToday(last);
  return (
    <Link
      to={`/lokacioni/${loc.id}`}
      className="group card overflow-hidden active:scale-[0.98] transition animate-pop-in"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="relative aspect-[4/5] bg-slate-200 dark:bg-slate-800 overflow-hidden">
        {loc.cover_photo ? (
          <Thumb filename={loc.cover_photo} alt={loc.name} />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400"><Icon name="camera" size={36} /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <span className={`absolute top-2 left-2 chip backdrop-blur ${doneToday ? 'bg-emerald-500/90 text-white' : 'bg-black/45 text-white'}`}>
          {doneToday ? <><Icon name="check" size={12} strokeWidth={3} /> Sot</> : last ? relativeDay(last) : 'E re'}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="font-bold leading-tight truncate">{loc.name}</p>
          <p className="text-xs text-white/80 mt-0.5">{loc.photo_count} foto</p>
        </div>
      </div>
    </Link>
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
  const todayCount = locations.filter(l => isToday(parseDbDate(l.last_photo_at))).length;

  return (
    <div>
      <TopBar title={`Përshëndetje, ${user?.name?.split(' ')[0] || ''} 👋`} subtitle={new Date().toLocaleDateString('sq-AL', { weekday: 'long', day: 'numeric', month: 'long' })} />

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className={`chip ${tier.color}`}>{tier.text}</span>
          {tierKey !== 'full' && (
            <Link to="/planet" className="text-sm font-semibold text-brand-600 dark:text-brand-400 flex items-center">
              {tierKey === 'none' ? 'Zgjedh plan' : 'Kalo në Full'} <Icon name="chevron" size={16} />
            </Link>
          )}
        </div>

        {tierKey === 'none' && !loading && (
          <Link to="/planet" className="block rounded-3xl bg-brand-gradient text-white p-5 mb-5 shadow-glow active:scale-[0.99] transition">
            <Icon name="sparkle" size={26} />
            <p className="font-bold text-lg mt-2">Aktivizo llogarinë</p>
            <p className="text-sm text-white/85">Zgjedh një plan për të krijuar lokacionin e parë dhe për të filluar fotot.</p>
          </Link>
        )}

        {!loading && locations.length > 0 && (
          <div className="card p-4 mb-5 flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" className="stroke-slate-200 dark:stroke-slate-800" />
                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" strokeLinecap="round"
                  className="stroke-brand-500 transition-all duration-700"
                  strokeDasharray={`${(todayCount / locations.length) * 97.4} 97.4`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{todayCount}/{locations.length}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{todayCount === locations.length ? 'Të gjitha fotot e sotme janë bërë!' : 'Fotot e sotme'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {todayCount === locations.length ? 'Shihemi nesër 📸' : `${locations.length - todayCount} lokacion(e) presin foton e sotme.`}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton aspect-[4/5] rounded-3xl" />)}
          </div>
        ) : locations.length === 0 ? (
          <div className="card border-dashed p-8 text-center mt-2">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center">
              <Icon name="pin" size={30} />
            </div>
            <p className="font-bold mt-4">Ende s'ke asnjë lokacion</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Krijo të parin për të filluar dokumentimin.</p>
            {tierKey !== 'none' && (
              <button onClick={() => setShowCreate(true)} className="btn-primary mt-5"><Icon name="plus" size={20} /> Lokacion i ri</button>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Lokacionet ({locations.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {locations.map((loc, i) => <LocationCard key={loc.id} loc={loc} index={i} />)}
            </div>
          </>
        )}

        {/* extra bottom space so the floating button never covers the last card */}
        <div className="mt-6 mb-20">
          <InstallApp />
        </div>
      </div>

      {tierKey !== 'none' && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed right-5 bottom-nav-offset z-30 h-14 pl-4 pr-5 rounded-full bg-brand-gradient text-white font-semibold shadow-glow flex items-center gap-2 active:scale-95 transition"
          aria-label="Lokacion i ri"
        >
          <Icon name="plus" size={22} strokeWidth={2.4} /> Lokacion
        </button>
      )}

      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Lokacion i ri">
        <form onSubmit={createLocation} className="flex flex-col gap-3">
          <input autoFocus placeholder="Emri (p.sh. Ndërtesa Qendër)" value={name} onChange={e => setName(e.target.value)} required className="input" />
          <textarea placeholder="Përshkrim (opsional)" value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="input h-auto py-3 resize-none" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Anulo</button>
            <button disabled={saving} className="btn-primary flex-1">{saving && <Spinner />} Krijo</button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
