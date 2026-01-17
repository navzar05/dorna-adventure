/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { AuthContextType, RegisterRequest, AuthResponse, LoginResponse } from '../types/auth';
import { getUserRolesFromToken, isAdmin as checkIsAdmin, isTokenExpired, isEmployee } from '../utils/jwt';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userRoles, setUserRole] = useState<string[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          // Token expired, clear it
          localStorage.removeItem('token');
          setToken(null);
          setUserRole(null);
        } else {
          // Token valid, extract role
          setToken(storedToken);
          const roles = getUserRolesFromToken(storedToken);
          setUserRole(roles);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

const login = async (
    username: string,
    password: string,
    totpCode?: string
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        username,
        password,
        totpCode
      });

      const loginData = response.data;

      if (loginData.requiresTotp) {
        return {
          success: false,
          requiresTotp: true,
          tempToken: loginData.tempToken,
          user: loginData.user
        };
      }

      const token = loginData.token;
      const roles = getUserRolesFromToken(token);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      
      setToken(token);
      setUserRole(roles);

      return { success: true, user: loginData.user};
    } catch (error: any) {
      console.error('Login error details:', error);
      
      const backendErrorData = error.response?.data;

      const errorCode = backendErrorData?.errorCode;

      return {
        success: false,
        errorCode: errorCode
      };
    }
  };

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      await api.post<string>('/auth/register', userData);
      return { success: true, message: 'User registered successfully!' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUserRole(null);
    navigate('/login');
  };

  const isAuthenticated = (): boolean => {
    return token !== null;
  };

  const value: AuthContextType = {
    token,
    userRoles,
    isAdmin: token ? checkIsAdmin(token) : false,
    isEmployee: token ? isEmployee(token) : false,
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