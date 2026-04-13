export interface Department {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  managerEmployeeId: number | null;
  isActive: boolean;
}
