import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import TopBar from '../components/TopBar.jsx';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.adminLogin({ username, password });
      localStorage.setItem('foto360_admin_token', token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TopBar title="Admin" />
      <div className="max-w-lg mx-auto px-5 pt-10">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required
            className="h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 outline-none focus:border-brand-500" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
            className="h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 outline-none focus:border-brand-500" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button disabled={loading} className="h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60">
            {loading ? 'Duke u kyçur...' : 'Kyçu'}
          </button>
        </form>
      </div>
    </div>
  );
}
