export interface AuthenticatedUser {
  userId: string;
  email: string;
  companyId: string;
  roles: string[];
  employeeId?: string;
}
