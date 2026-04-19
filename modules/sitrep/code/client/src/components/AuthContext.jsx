/**
 * AuthContext — simple JWT auth context for SITREP module.
 * In DEV mode (import.meta.env.DEV), auto-logins with a mock EOC staff user
 * without calling /api/auth/me.
 *
 * In production, calls /api/auth/me with a stored JWT token to hydrate user.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@saws.org',
  role: 'eoc_staff',
  isAdmin: true,
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) {
      // Auto-login with mock user in development — no network call
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // Production: attempt to restore session from stored token
    const token = localStorage.getItem('sitrep_token');
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('sitrep_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem('sitrep_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('sitrep_token');
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin === true,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
