export interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string | null;
  departmentId: number | null;
  isActive: boolean;
  hireDate: string | null;
  terminationDate: string | null;
  photoUrl: string | null;
}
