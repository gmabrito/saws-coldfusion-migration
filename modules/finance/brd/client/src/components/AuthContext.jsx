import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('finance_user');
    return stored ? JSON.parse(stored) : null;
  });

  // Check for SSO token from portal on initial load
  useEffect(() => {
    if (user) return; // already logged in

    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');

    if (ssoToken) {
      const decoded = parseJwt(ssoToken);
      if (decoded && decoded.email) {
        const userData = {
          uid: decoded.uid,
          email: decoded.email,
          contact_name: decoded.contact_name,
          business_name: decoded.business_name,
          roles: decoded.roles || [],
        };
        localStorage.setItem('finance_token', ssoToken);
        localStorage.setItem('finance_user', JSON.stringify(userData));
        setUser(userData);

        // Clean the URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('finance_token', token);
    localStorage.setItem('finance_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('finance_token');
    localStorage.removeItem('finance_user');
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
