import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TopBar from '../components/TopBar.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';

const PLANS = [
  { id: 'full', title: 'Full Access', price: '€10', sub: 'një herë', desc: 'Lokacione dhe projekte të pakufizuara.', perks: ['Lokacione pa limit', 'Timelapse pa limit', 'Pagesë një herë'] },
  { id: 'limited', title: 'Limited Access', price: '€1', sub: '/ 1 lokacion', desc: 'Ideale për të provuar me një projekt të vetëm.', perks: ['1 lokacion', 'Timelapse pa limit'] }
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

const selected = (on) => on
  ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 ring-4 ring-brand-500/15'
  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';

export default function Pricing() {
  const { user, refresh } = useAuth();
  const [plan, setPlan] = useState('full');
  const [method, setMethod] = useState('cash');
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvv: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
    api.myOrders().then(({ orders }) => setPending(orders.filter(o => o.status === 'pending'))).catch(() => {});
  }, [refresh]);

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
        <div className="max-w-sm mx-auto px-5 pt-14 text-center animate-pop-in">
          <div className="h-20 w-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center">
            <Icon name="clock" size={38} />
          </div>
          <h2 className="text-2xl font-extrabold mt-5">Kërkesa jote u dërgua</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {method === 'cash'
              ? 'Pagesa cash konfirmohet manualisht nga administratori. Sapo të konfirmohet, do të kesh qasje.'
              : 'Pagesa jote është duke u verifikuar nga administratori. Sapo të konfirmohet, do të kesh qasje.'}
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full mt-8">Shko te Lokacionet</button>
        </div>
      </div>
    );
  }

  if (user?.access_tier === 'full') {
    return (
      <div>
        <TopBar title="Planet" />
        <div className="max-w-sm mx-auto px-5 pt-14 text-center animate-pop-in">
          <div className="h-20 w-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
            <Icon name="shield" size={38} />
          </div>
          <h2 className="text-2xl font-extrabold mt-5">Ke Full Access</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Lokacione dhe timelapse pa limit. Faleminderit! 💜</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full mt-8">Shko te Lokacionet</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Zgjedh Planin" />
      <form onSubmit={submit} className="max-w-lg mx-auto px-4 pt-4 pb-6 flex flex-col gap-6">
        {pending.length > 0 && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-4 text-sm text-amber-800 dark:text-amber-200 flex gap-3">
            <Icon name="clock" size={20} className="shrink-0" />
            <span>Ke {pending.length} kërkesë në pritje të konfirmimit. Qasja aktivizohet sapo administratori ta konfirmojë.</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {PLANS.filter(p => !(user?.access_tier === 'limited' && p.id === 'limited')).map(p => (
            <button type="button" key={p.id} onClick={() => setPlan(p.id)} className={`text-left rounded-3xl border-2 p-5 transition ${selected(plan === p.id)}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {p.title}
                    {p.id === 'full' && <span className="chip bg-brand-gradient text-white text-[10px] py-0.5">MË E ZGJEDHUR</span>}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{p.desc}</p>
                </div>
                <span className={`h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center ${plan === p.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                  {plan === p.id && <Icon name="check" size={14} strokeWidth={3} />}
                </span>
              </div>
              <p className="text-3xl font-extrabold mt-3">{p.price} <span className="text-sm font-medium text-slate-500">{p.sub}</span></p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {p.perks.map(k => (
                  <li key={k} className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><Icon name="check" size={15} className="text-emerald-500" strokeWidth={2.6} />{k}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div>
          <h3 className="font-bold mb-3">Metoda e pagesës</h3>
          <div className="grid grid-cols-2 gap-3">
            {[['cash', 'cash', 'Cash'], ['card', 'card', 'Kartë Bankare']].map(([id, icon, label]) => (
              <button type="button" key={id} onClick={() => setMethod(id)} className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition ${selected(method === id)}`}>
                <Icon name={icon} size={26} className={method === id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'} />
                <span className="font-semibold text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {method === 'cash' && (
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-4 text-sm text-slate-700 dark:text-slate-300">
            Pas dërgimit të kërkesës, na kontakto për ta kryer pagesën cash. Llogaria jote aktivizohet menjëherë pas konfirmimit.
          </div>
        )}

        {method === 'card' && (
          <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-violet-700 to-slate-900 text-white p-5 shadow-glow">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold tracking-[0.25em] text-white/80">FOTO360</span>
              <Icon name="card" size={26} />
            </div>
            <input
              placeholder="0000 0000 0000 0000"
              value={card.number}
              onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
              inputMode="numeric" autoComplete="cc-number"
              className="mt-7 w-full bg-transparent border-b border-white/30 pb-2 text-lg tracking-widest outline-none placeholder-white/40"
            />
            <input
              placeholder="EMRI MBIEMRI"
              value={card.name} autoComplete="cc-name"
              onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))}
              className="mt-4 w-full bg-transparent border-b border-white/30 pb-2 tracking-wide outline-none placeholder-white/40"
            />
            <div className="mt-4 flex gap-4">
              <input
                placeholder="MM/VV" inputMode="numeric" autoComplete="cc-exp"
                value={card.exp}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                  setCard(c => ({ ...c, exp: v }));
                }}
                className="w-24 bg-transparent border-b border-white/30 pb-2 outline-none placeholder-white/40"
              />
              <input
                placeholder="CVV" inputMode="numeric" autoComplete="cc-csc"
                value={card.cvv}
                onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-20 bg-transparent border-b border-white/30 pb-2 outline-none placeholder-white/40"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button disabled={loading} className="btn-primary h-14 text-base">
          {loading && <Spinner />}
          {loading ? 'Duke dërguar...' : `Dërgo kërkesën — ${PLANS.find(p => p.id === plan).price}`}
        </button>
      </form>
    </div>
  );
}
