export interface LoginRequest {
  username: string;
  password: string;
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
  login: (username: string, password: string) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}
export interface AuthResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[];
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
