import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore auth state from localStorage
    const savedToken = localStorage.getItem('ceo_token');
    const savedUser = localStorage.getItem('ceo_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('ceo_token');
        localStorage.removeItem('ceo_user');
      }
    }
    setLoading(false);
  }, []);

  function login(authToken, userData) {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('ceo_token', authToken);
    localStorage.setItem('ceo_user', JSON.stringify(userData));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ceo_token');
    localStorage.removeItem('ceo_user');
  }

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
