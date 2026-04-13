import { createContext, useState } from 'react';

export const AuthContext = createContext(null);

// Mock Active Directory authentication provider
// Simulates Windows Authentication / AD integration for the bakeoff prototype
const MOCK_USER = {
  employeeId: 1,
  username: 'jsmith',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jsmith@internal',
  department: 'CEO',
  departmentCode: 'CEO',
  title: 'Administrator',
  roles: ['admin', 'user'],
  isAuthenticated: true
};

export function AuthProvider({ children, mockUser }) {
  const [user] = useState(mockUser || MOCK_USER);

  const value = {
    user,
    isAuthenticated: user.isAuthenticated,
    hasRole: (role) => user.roles.includes(role),
    logout: () => console.log('Logout called (mock)')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
