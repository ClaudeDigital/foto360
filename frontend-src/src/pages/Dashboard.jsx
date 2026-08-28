import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TopBar from '../components/TopBar.jsx';

const TIER_LABEL = {
  none: { text: 'Pa plan', color: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  limited: { text: 'Limited Access', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  full: { text: 'Full Access', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' }
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { locations } = await api.locations();
    setLocations(locations);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createLocation = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createLocation({ name, description });
      setName(''); setDescription(''); setShowCreate(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const tier = TIER_LABEL[user?.access_tier || 'none'];

  return (
    <div>
      <TopBar
        title={`Përshëndetje, ${user?.name?.split(' ')[0] || ''}`}
        right={
          <button onClick={() => { logout(); navigate('/'); }} className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
            Dil
          </button>
        }
      />
      <div className="max-w-lg mx-auto px-5 pt-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tier.color}`}>{tier.text}</span>
          {user?.access_tier !== 'full' && (
            <Link to="/planet" className="text-sm font-semibold text-brand-600 dark:text-brand-400">
              {user?.access_tier === 'none' ? 'Zgjedh Plan →' : 'Kalo në Full →'}
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        ) : locations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center mt-6">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Ende s'ke asnjë lokacion. Krijo të parin për të filluar dokumentimin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {locations.map(loc => (
              <Link key={loc.id} to={`/lokacioni/${loc.id}`} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="aspect-square bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  {loc.cover_photo ? (
                    <img src={`/uploads/photos/${loc.cover_photo}`} className="h-full w-full object-cover" alt={loc.name} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl">📷</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{loc.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{loc.photo_count} foto</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-2xl font-bold shadow-lg shadow-brand-600/30 flex items-center justify-center active:scale-95 transition"
        aria-label="Lokacion i ri"
      >
        +
      </button>

      {showCreate && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-6 safe-bottom">
            <h3 className="font-bold text-lg mb-4">Lokacion i ri</h3>
            <form onSubmit={createLocation} className="flex flex-col gap-3">
              <input placeholder="Emri (p.sh. Ndërtesa Qendër)" value={name} onChange={e => setName(e.target.value)} required
                className="h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 outline-none focus:border-brand-500" />
              <textarea placeholder="Përshkrim (opsional)" value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 outline-none focus:border-brand-500 resize-none" />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 h-12 rounded-xl border border-slate-300 dark:border-slate-700 font-medium">
                  Anulo
                </button>
                <button className="flex-1 h-12 rounded-xl bg-brand-600 text-white font-semibold">Krijo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
