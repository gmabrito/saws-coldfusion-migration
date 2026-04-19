/**
 * AuthContext — JWT-based auth for the Locates module.
 *
 * This is an external public-facing app. Guest mode (user: null) is valid —
 * unauthenticated users can access the public submission form without any
 * login wall. Only staff accessing /admin routes need to authenticate.
 *
 * Login:  POST /api/auth/login → { token, user }  (stored in localStorage)
 * Logout: clears localStorage, resets user to null
 *
 * isStaff: true when role is 'staff' or 'admin'
 */

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('locates_user');
      const token = localStorage.getItem('locates_token');
      if (stored && token) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Corrupt storage — start fresh
      localStorage.removeItem('locates_user');
      localStorage.removeItem('locates_token');
    }
    setLoading(false);
  }, []);

  function login(token, userData) {
    localStorage.setItem('locates_token', token);
    localStorage.setItem('locates_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('locates_token');
    localStorage.removeItem('locates_user');
    setUser(null);
  }

  function getToken() {
    return localStorage.getItem('locates_token');
  }

  const value = {
    user,
    loading,
    // { user: null } is valid guest mode — public pages are always accessible
    isAuthenticated: !!user,
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    login,
    logout,
    getToken,
  };

  // Brief loading state while rehydrating from storage
  if (loading) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
