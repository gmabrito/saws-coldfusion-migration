export interface AuthUser {
  employeeId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  departmentCode: string;
  title: string;
  roles: string[];
  isAuthenticated: boolean;
}

export interface AuthContext {
  user: AuthUser;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  logout: () => void;
}
