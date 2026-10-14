import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Spinner from '../components/Spinner.jsx';

// Step 1: ask for a code by email (or skip if the admin already gave one).
// Step 2: email + 6-digit code + new password → logged in.
export default function ForgotPassword() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendCode = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await api.forgot({ email });
      setInfo(`${r.message} Shiko inbox-in (edhe Spam).`);
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { token, user } = await api.resetPassword({ email, code, password });
      login(token, user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const footer = <>U kujtove? <Link to="/kycu" className="text-brand-600 dark:text-brand-400 font-semibold">Kyçu</Link></>;

  if (step === 'email') {
    return (
      <AuthLayout title="Harrove fjalëkalimin?" subtitle="Të dërgojmë një kod me email për ta ndryshuar." footer={footer}>
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button disabled={loading} className="btn-primary mt-2">
            {loading && <Spinner />} {loading ? 'Duke dërguar...' : 'Dërgo kodin'}
          </button>
          <button type="button" onClick={() => { setInfo(''); setError(''); setStep('code'); }} className="text-sm font-semibold text-brand-600 dark:text-brand-400">
            Kam një kod nga administratori
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Fjalëkalim i ri" subtitle="Shkruaj kodin 6-shifror dhe fjalëkalimin e ri." footer={footer}>
      <form onSubmit={reset} className="flex flex-col gap-4">
        {info && <p className="text-sm rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 p-3">{info}</p>}
        <div>
          <label className="label" htmlFor="email2">Email</label>
          <input id="email2" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="code">Kodi</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required className="input tracking-[0.4em] text-center text-lg font-bold" />
        </div>
        <div>
          <label className="label" htmlFor="password">Fjalëkalimi i ri</label>
          <input id="password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required className="input" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading || code.length !== 6} className="btn-primary mt-2">
          {loading && <Spinner />} {loading ? 'Duke ruajtur...' : 'Ruaj dhe kyçu'}
        </button>
        <button type="button" onClick={() => { setError(''); setStep('email'); }} className="text-sm font-semibold text-slate-500">
          Dërgo kod të ri me email
        </button>
      </form>
    </AuthLayout>
  );
}
