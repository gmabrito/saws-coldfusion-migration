import { createContext, useContext, useState } from 'react';

/**
 * Auth context for Take Home Vehicles.
 * DEV mode injects a mock user so the app runs without a real token.
 * Production: replace DEV_USER with token verification against the SAWS portal.
 */

const DEV_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@saws.org',
  role: 'employee',
  department: 'Operations',
  isAdmin: true,
  isManager: true,
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // In DEV mode we auto-populate the user from the mock object above.
  const [user] = useState(DEV_USER);

  function logout() {
    window.location.href = 'http://localhost:3000';
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthProvider;
