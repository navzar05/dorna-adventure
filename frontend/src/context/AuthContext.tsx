import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { AuthContextType, RegisterRequest, AuthResponse } from '../types/auth.ts';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (
    username: string,
    password: string,
    // rememberMe: boolean = true
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post<string>('/auth/login', {
        username,
        password
      });

      const token = response.data;
      
      localStorage.setItem('token', token);

      setToken(token);
      
      return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid username or password'
      };
    }
  };

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      await api.post<string>('/auth/register', userData);
      return { success: true, message: 'User registered successfully!' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };

  const isAuthenticated = (): boolean => {
    return token !== null;
  };

  const value: AuthContextType = {
    token,
    login,
    register,
    logout,
    isAuthenticated: isAuthenticated(),
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};