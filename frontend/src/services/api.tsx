import axios, { type AxiosInstance, AxiosError } from 'axios';
import type { LoginRequest, RegisterRequest } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Check if the error is 401
    if (error.response?.status === 401) {
      
      const requestUrl = error.config?.url || '';
      if (requestUrl.includes('/auth/login')) {
        return Promise.reject(error);
      }

      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      console.warn('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data: RegisterRequest) => api.post<string>('/v1/auth/register', data),
  login: (data: LoginRequest) => api.post<string>('/v1/auth/login', data),
};

export default api;