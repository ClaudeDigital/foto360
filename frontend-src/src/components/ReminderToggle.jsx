import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { currentSubscription, disablePush, enablePush, pushSupport } from '../push.js';

export default function ReminderToggle() {
  const toast = useToast();
  const support = pushSupport();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [time, setTime] = useState('11:59');

  useEffect(() => {
    api.pushKey().then(r => r.time && setTime(r.time)).catch(() => {});
    if (support !== 'ok') return;
    currentSubscription().then(sub => {
      setOn(!!sub && Notification.permission === 'granted');
      // Re-send so the server knows this device even if it was subscribed under another login.
      if (sub && Notification.permission === 'granted') api.pushSubscribe(sub.toJSON()).catch(() => {});
    }).catch(() => {});
  }, [support]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (on) { await disablePush(); setOn(false); toast('Rikujtimi u çaktivizua'); }
      else { await enablePush(); setOn(true); toast(`Do të marrësh rikujtim çdo ditë në ${time}`); }
    } catch (e) {
      toast(e.message || 'Nuk u aktivizua', 'error');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    try { await api.pushTest(); toast('Njoftimi provë u dërgua'); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="card divide-y divide-slate-100 dark:divide-slate-800">
      <button onClick={toggle} disabled={support !== 'ok' || busy} className="w-full flex items-center gap-3 p-4 text-left disabled:opacity-100">
        <Icon name="bell" className="text-slate-500" />
        <span className="flex-1">
          <span className="block font-medium">Rikujtim ditor për foto</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {support === 'ios-install'
              ? 'Në iPhone, instalo fillimisht aplikacionin (më lart) dhe hape nga ekrani kryesor.'
              : support === 'unsupported'
                ? 'Ky shfletues nuk i mbështet njoftimet.'
                : `Çdo ditë në ${time}, nëse s'ke bërë foto sot.`}
          </span>
        </span>
        {support === 'ok' && (
          <span className={`h-7 w-12 shrink-0 rounded-full p-0.5 transition ${on ? 'bg-brand-500' : 'bg-slate-300'} ${busy ? 'opacity-60' : ''}`}>
            <span className={`block h-6 w-6 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : ''}`} />
          </span>
        )}
      </button>
      {on && (
        <button onClick={test} className="w-full flex items-center gap-3 p-4 text-left text-sm text-slate-900 dark:text-slate-50 underline underline-offset-4 decoration-slate-400 dark:decoration-slate-500 font-medium">
          <Icon name="sparkle" size={18} /> Dërgo një njoftim provë
        </button>
      )}
    </div>
  );
}
