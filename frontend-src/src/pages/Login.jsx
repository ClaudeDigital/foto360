import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Spinner from '../components/Spinner.jsx';

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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Mirë se u ktheve"
      subtitle="Kyçu për të vazhduar dokumentimin."
      footer={<>S’ke llogari? <Link to="/regjistrohu" className="text-brand-600 dark:text-brand-400 font-semibold">Regjistrohu</Link></>}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Fjalëkalimi</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="input" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary mt-2">
          {loading && <Spinner />} {loading ? 'Duke u kyçur...' : 'Kyçu'}
        </button>
      </form>
    </AuthLayout>
  );
}
