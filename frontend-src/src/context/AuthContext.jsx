import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('foto360_token');
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      localStorage.removeItem('foto360_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = (token, user) => {
    localStorage.setItem('foto360_token', token);
    setUser(user);
  };
  const logout = () => {
    localStorage.removeItem('foto360_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
