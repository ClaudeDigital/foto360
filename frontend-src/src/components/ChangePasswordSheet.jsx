import React, { useState } from 'react';
import Sheet from './Sheet.jsx';
import Spinner from './Spinner.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Shared by the user account page and the admin dashboard; `save` does the API call.
export default function ChangePasswordSheet({ open, onClose, save, minLength = 6 }) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const close = () => { setCurrent(''); setPassword(''); setConfirm(''); setError(''); onClose(); };

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Fjalëkalimet e reja nuk përputhen');
    setError(''); setLoading(true);
    try {
      await save({ current, password });
      toast('Fjalëkalimi u ndryshua');
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title="Ndrysho fjalëkalimin">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="cp-current">Fjalëkalimi aktual</label>
          <input id="cp-current" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cp-new">Fjalëkalimi i ri</label>
          <input id="cp-new" type="password" autoComplete="new-password" minLength={minLength} value={password} onChange={e => setPassword(e.target.value)} required className="input" />
          <p className="text-xs text-slate-500 mt-1">Të paktën {minLength} karaktere.</p>
        </div>
        <div>
          <label className="label" htmlFor="cp-confirm">Përsërit fjalëkalimin e ri</label>
          <input id="cp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="input" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary">{loading && <Spinner />} Ruaj</button>
      </form>
    </Sheet>
  );
}
