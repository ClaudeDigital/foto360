import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import TopBar from '../components/TopBar.jsx';

const TIER_LABEL = { none: 'Pa plan', limited: 'Limited', full: 'Full' };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('porosite');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [orderFilter, setOrderFilter] = useState('pending');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await api.adminMe();
        setReady(true);
      } catch {
        navigate('/admin');
      }
    })();
  }, [navigate]);

  const loadStats = async () => setStats(await api.adminStats().then(r => r));
  const loadOrders = async (status) => setOrders((await api.adminOrders(status === 'all' ? '' : status)).orders);
  const loadUsers = async () => setUsers((await api.adminUsers()).users);

  useEffect(() => {
    if (!ready) return;
    loadStats();
    loadOrders(orderFilter);
    loadUsers();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ready) loadOrders(orderFilter);
  }, [orderFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const decide = async (id, decision) => {
    setBusyId(id);
    try {
      await api.adminDecide(id, decision);
      await Promise.all([loadOrders(orderFilter), loadStats(), loadUsers()]);
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Admin — foto360"
        right={
          <button onClick={() => { localStorage.removeItem('foto360_admin_token'); navigate('/admin'); }} className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
            Dil
          </button>
        }
      />
      <div className="max-w-2xl mx-auto px-5 pt-4 pb-16">
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              ['Përdorues', stats.users],
              ['Full', stats.fullUsers],
              ['Limited', stats.limitedUsers],
              ['Pending', stats.pendingOrders],
              ['Lokacione', stats.locations],
              ['Foto', stats.photos]
            ].map(([label, val]) => (
              <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
                <p className="text-xl font-extrabold">{val}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
            <div className="col-span-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">€{stats.revenue}</p>
              <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">Të ardhura (konfirmuar)</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
          <button onClick={() => setTab('porosite')} className={`flex-1 h-9 rounded-lg text-sm font-semibold transition ${tab === 'porosite' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-500'}`}>
            Porositë
          </button>
          <button onClick={() => setTab('perdorues')} className={`flex-1 h-9 rounded-lg text-sm font-semibold transition ${tab === 'perdorues' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-500'}`}>
            Përdoruesit
          </button>
        </div>

        {tab === 'porosite' && (
          <div>
            <div className="flex gap-2 mb-3">
              {['pending', 'confirmed', 'rejected', 'all'].map(s => (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${orderFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {s === 'pending' ? 'Pritje' : s === 'confirmed' ? 'Konfirmuar' : s === 'rejected' ? 'Refuzuar' : 'Të gjitha'}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {orders.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Asnjë porosi.</p>}
              {orders.map(o => (
                <div key={o.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-sm">{o.user_name}</p>
                      <p className="text-xs text-slate-500">{o.user_email}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {o.plan === 'full' ? 'Full Access' : 'Limited Access'} · €{o.amount} · {o.payment_method === 'cash' ? 'Cash' : 'Kartë'}
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                      o.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                      o.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                      'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                    }`}>
                      {o.status === 'pending' ? 'Në pritje' : o.status === 'confirmed' ? 'Konfirmuar' : 'Refuzuar'}
                    </span>
                  </div>
                  {o.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button disabled={busyId === o.id} onClick={() => decide(o.id, 'approve')}
                        className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60">
                        ✅ Konfirmo
                      </button>
                      <button disabled={busyId === o.id} onClick={() => decide(o.id, 'reject')}
                        className="flex-1 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60">
                        ❌ Refuzo
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'perdorues' && (
          <div className="flex flex-col gap-2">
            {users.map(u => (
              <div key={u.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{u.location_count} lokacione</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                  {TIER_LABEL[u.access_tier]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
