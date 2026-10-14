import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.register({ name, email, password });
      login(token, user);
      navigate('/planet', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Krijo llogari"
      subtitle="Regjistrimi zgjat më pak se një minutë."
      footer={<>Ke llogari? <Link to="/kycu" className="text-slate-900 dark:text-slate-50 underline underline-offset-4 decoration-slate-400 dark:decoration-slate-500 font-semibold">Kyçu</Link></>}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="name">Emri</label>
          <input id="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Fjalëkalimi</label>
          <input id="password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input" />
          <p className="text-xs text-slate-500 mt-1.5">Të paktën 6 karaktere.</p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary mt-2">
          {loading && <Spinner />} {loading ? 'Duke u regjistruar...' : 'Regjistrohu'}
        </button>
      </form>
    </AuthLayout>
  );
}
