import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TopBar from '../components/TopBar.jsx';

export default function Login() {
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
      const { token, user } = await api.login({ email, password });
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TopBar title="Kyçu" back />
      <div className="max-w-lg mx-auto px-5 pt-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="mt-1 w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-sm font-medium">Fjalëkalimi</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="mt-1 w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 outline-none focus:border-brand-500" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button disabled={loading} className="h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60">
            {loading ? 'Duke u kyçur...' : 'Kyçu'}
          </button>
        </form>
        <p className="text-sm text-center mt-5 text-slate-600 dark:text-slate-400">
          S’ke llogari? <Link to="/regjistrohu" className="text-brand-600 dark:text-brand-400 font-semibold">Regjistrohu</Link>
        </p>
      </div>
    </div>
  );
}
