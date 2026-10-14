import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import TopBar from '../components/TopBar.jsx';
import Icon from '../components/Icon.jsx';
import InstallApp from '../components/InstallApp.jsx';
import ReminderToggle from '../components/ReminderToggle.jsx';
import ChangePasswordSheet from '../components/ChangePasswordSheet.jsx';
import { TIER_LABEL } from './Dashboard.jsx';
import { fmtShort, parseDbDate } from '../utils.js';

const STATUS = {
  pending: ['Në pritje', 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'],
  confirmed: ['Konfirmuar', 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'],
  rejected: ['Refuzuar', 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300']
};

export default function Account() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => { api.myOrders().then(r => setOrders(r.orders)).catch(() => {}); }, []);

  const tier = TIER_LABEL[user?.access_tier || 'none'];
  const initials = (user?.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      <TopBar title="Llogaria" theme={false} />
      <div className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-5">
        <div className="card p-5 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900 font-display text-2xl font-extrabold flex items-center justify-center">{initials}</div>
          <div className="min-w-0">
            <p className="font-bold text-lg truncate">{user?.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            <span className={`chip mt-2 ${tier.color}`}>{tier.text}</span>
          </div>
        </div>

        <InstallApp />

        <ReminderToggle />

        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          <button onClick={toggle} className="w-full flex items-center gap-3 p-4 text-left">
            <Icon name={dark ? 'moon' : 'sun'} className="text-slate-500" />
            <span className="flex-1 font-medium">Tema e errët</span>
            <span className={`h-7 w-12 rounded-full p-0.5 transition ${dark ? 'bg-brand-500' : 'bg-slate-300'}`}>
              <span className={`block h-6 w-6 rounded-full bg-white shadow transition ${dark ? 'translate-x-5' : ''}`} />
            </span>
          </button>
          <button onClick={() => setPwOpen(true)} className="w-full flex items-center gap-3 p-4 text-left">
            <Icon name="shield" className="text-slate-500" />
            <span className="flex-1 font-medium">Ndrysho fjalëkalimin</span>
            <Icon name="chevron" className="text-slate-400" />
          </button>
          <button onClick={() => navigate('/planet')} className="w-full flex items-center gap-3 p-4 text-left">
            <Icon name="sparkle" className="text-slate-500" />
            <span className="flex-1 font-medium">Plani & pagesa</span>
            <Icon name="chevron" className="text-slate-400" />
          </button>
        </div>

        {orders.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Porositë e mia</h3>
            <div className="card divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map(o => (
                <div key={o.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{o.plan === 'full' ? 'Full Access' : 'Limited Access'} · €{o.amount}</p>
                    <p className="text-xs text-slate-500">{fmtShort(parseDbDate(o.created_at))} · {o.payment_method === 'cash' ? 'Cash' : 'Kartë'}</p>
                  </div>
                  <span className={`chip ${STATUS[o.status]?.[1] || ''}`}>{STATUS[o.status]?.[0] || o.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => { logout(); navigate('/', { replace: true }); }} className="btn w-full text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40">
          <Icon name="logout" size={20} /> Dil nga llogaria
        </button>
        <ChangePasswordSheet open={pwOpen} onClose={() => setPwOpen(false)} save={api.changePassword} />
        <p className="text-center text-xs text-slate-400 pb-2">foto360 v1.3</p>
      </div>
    </div>
  );
}
