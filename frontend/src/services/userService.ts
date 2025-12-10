import api from './api';
import type { User, UpdateUserRequest, ChangePasswordRequest, DeleteAccountRequest } from '../types/auth';

export const userService = {
  getCurrentUser: () => api.get<User>('/user/me'),
  
  updateUser: (data: UpdateUserRequest) => 
    api.put<User>('/user/me', data),
  
  changePassword: (data: ChangePasswordRequest) => 
    api.put<{ message: string }>('/user/me/password', data),
  
  deleteAccount: (data: DeleteAccountRequest) => 
    api.delete<{ message: string }>('/user/me', { data }),

  getAllUsers: () => api.get('/users'),
};