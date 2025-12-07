export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ROLE_ADMIN' | 'ROLE_EMPLOYEE' | 'ROLE_USER';
  isActive: boolean;
  createdAt: string;
}