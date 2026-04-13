import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('utilitymaps_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData, token) => {
    localStorage.setItem('utilitymaps_token', token);
    localStorage.setItem('utilitymaps_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('utilitymaps_token');
    localStorage.removeItem('utilitymaps_user');
    setUser(null);
  };

  const isAdmin = user?.roles?.includes('ADMIN') || false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
