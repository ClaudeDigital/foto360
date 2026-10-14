import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Spinner from '../components/Spinner.jsx';

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
    <AuthLayout title="Admin" subtitle="Paneli i administrimit të foto360.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input placeholder="Username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required className="input" />
        <input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="input" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary">
          {loading && <Spinner />} {loading ? 'Duke u kyçur...' : 'Kyçu'}
        </button>
      </form>
    </AuthLayout>
  );
}
