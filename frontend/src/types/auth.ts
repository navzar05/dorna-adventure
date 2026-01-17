// src/types/auth.ts
export interface LoginRequest {
  username: string;
  password: string;
  totpCode?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  requiresTotp: boolean;
  tempToken?: string;
}

export interface RegisterRequest {
  username: string;
  firstName: string;
  email: string;
  lastName: string;
  password: string;
  phoneNumber: string;
}

export interface AuthContextType {
  token: string | null;
  userRoles: string[] | null;
  isAdmin: boolean;
  isEmployee: boolean;
  login: (username: string, password: string, totpCode?: string) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface AuthResponse {
  errorCode?: string;
  success: boolean;
  error?: string;
  message?: string;
  requiresTotp?: boolean;
  tempToken?: string;
  user?: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[];
  totpEnabled?: boolean;
  passwordTemporary?: boolean;
}

export interface UpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
}