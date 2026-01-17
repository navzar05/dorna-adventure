import api from './api';
import type { User, UpdateUserRequest, ChangePasswordRequest, DeleteAccountRequest } from '../types/auth';
import type { TotpSetupResponse } from '../types/employee';

export const userService = {
  getCurrentUser: () => api.get<User>('/user/me'),
  
  updateUser: (data: UpdateUserRequest) => 
    api.put<User>('/user/me', data),
  
  changePassword: (data: ChangePasswordRequest) =>
    api.put<{ message: string }>('/user/me/password', data),

  changeTemporaryPassword: (newPassword: string) =>
    api.put<{ message: string }>('/user/me/password/temporary', { newPassword }),

  deleteAccount: (data: DeleteAccountRequest) =>
    api.delete<{ message: string }>('/user/me', { data }),

  getAllUsers: () => api.get('/users'),

  // TOTP Setup
  getTotpSetup: () =>
    api.get<TotpSetupResponse>('/user/me/totp/setup'),

  verifyTotp: (code: string) =>
    api.post<{ message: string }>('/user/me/totp/verify', { code }),
};