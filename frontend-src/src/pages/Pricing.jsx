import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import TopBar from '../components/TopBar.jsx';

const PLANS = [
  { id: 'full', title: 'Full Access', price: '€10', sub: 'një herë', desc: 'Lokacione dhe projekte të pakufizuara.' },
  { id: 'limited', title: 'Limited Access', price: '€1', sub: '/ 1 lokacion', desc: 'Ideale për të provuar me një projekt të vetëm.' }
];

function luhnValid(num) {
  const digits = num.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

export default function Pricing() {
  const [plan, setPlan] = useState('full');
  const [method, setMethod] = useState('cash');
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvv: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (method === 'card') {
      if (!luhnValid(card.number)) return setError('Numri i kartës nuk është i vlefshëm');
      if (!/^\d{2}\/\d{2}$/.test(card.exp)) return setError('Data e skadimit duhet të jetë MM/VV');
      if (!/^\d{3,4}$/.test(card.cvv)) return setError('CVV i pavlefshëm');
      if (!card.name.trim()) return setError('Shkruaj emrin si në kartë');
    }
    setLoading(true);
    try {
      await api.createOrder({ plan, payment_method: method });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div>
        <TopBar title="Kërkesa u dërgua" />
        <div className="max-w-lg mx-auto px-5 pt-14 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold">Kërkesa jote u dërgua</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {method === 'cash'
              ? 'Pagesa cash konfirmohet manualisht nga administratori. Sapo të konfirmohet, do të kesh qasje.'
              : 'Pagesa jote është duke u verifikuar nga administratori. Sapo të konfirmohet, do të kesh qasje.'}
          </p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 h-12 px-6 rounded-xl bg-brand-600 text-white font-semibold">
            Shko te Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Zgjedh Planin" back />
      <form onSubmit={submit} className="max-w-lg mx-auto px-5 pt-4 pb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {PLANS.map(p => (
            <button type="button" key={p.id} onClick={() => setPlan(p.id)}
              className={`text-left rounded-2xl border-2 p-4 transition ${plan === p.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{p.title}</h3>
                <p className="font-extrabold">{p.price} <span className="text-xs font-medium text-slate-500">{p.sub}</span></p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Metoda e pagesës</h3>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setMethod('cash')}
              className={`rounded-xl border-2 p-4 flex flex-col items-center gap-1 ${method === 'cash' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
              <span className="text-2xl">💵</span>
              <span className="font-medium text-sm">Cash</span>
            </button>
            <button type="button" onClick={() => setMethod('card')}
              className={`rounded-xl border-2 p-4 flex flex-col items-center gap-1 ${method === 'card' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
              <span className="text-2xl">💳</span>
              <span className="font-medium text-sm">Kartë Bankare</span>
            </button>
          </div>
        </div>

        {method === 'cash' && (
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-4 text-sm text-slate-700 dark:text-slate-300">
            Pas dërgimit të kërkesës, na kontakto për ta kryer pagesën cash. Llogaria jote aktivizohet menjëherë pas konfirmimit.
          </div>
        )}

        {method === 'card' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-800 to-slate-950 text-white p-5">
            <div className="flex justify-between items-center">
              <span className="text-xs tracking-widest text-slate-300">FOTO360</span>
              <span className="text-2xl">💳</span>
            </div>
            <input
              placeholder="0000 0000 0000 0000"
              value={card.number}
              onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
              inputMode="numeric"
              className="mt-6 w-full bg-transparent border-b border-white/30 pb-2 text-lg tracking-widest outline-none placeholder-white/40"
            />
            <input
              placeholder="EMRI MBIEMRI"
              value={card.name}
              onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))}
              className="mt-4 w-full bg-transparent border-b border-white/30 pb-2 text-sm tracking-wide outline-none placeholder-white/40"
            />
            <div className="mt-4 flex gap-4">
              <input
                placeholder="MM/VV"
                value={card.exp}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                  setCard(c => ({ ...c, exp: v }));
                }}
                className="w-24 bg-transparent border-b border-white/30 pb-2 text-sm outline-none placeholder-white/40"
              />
              <input
                placeholder="CVV"
                value={card.cvv}
                onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                inputMode="numeric"
                className="w-20 bg-transparent border-b border-white/30 pb-2 text-sm outline-none placeholder-white/40"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button disabled={loading} className="h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60">
          {loading ? 'Duke dërguar...' : `Dërgo kërkesën — ${PLANS.find(p => p.id === plan).price}`}
        </button>
      </form>
    </div>
  );
}
