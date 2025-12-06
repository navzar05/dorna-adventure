export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber: string;
}

export interface AuthContextType {
  token: string | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
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