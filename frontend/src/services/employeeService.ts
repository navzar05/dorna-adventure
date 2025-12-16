// src/services/employeeService.ts
import api from './api';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, EmployeeSwapInfo, EmployeeSwapOptions, TotpSetupResponse } from '../types/employee';

export const employeeService = {
  getAllEmployees: () => api.get<Employee[]>('/employees'),
  
  getEmployeeById: (id: number) => api.get<Employee>(`/employees/${id}`),
  
  createEmployee: (data: CreateEmployeeRequest) => 
    api.post<Employee>('/employees', data),
  
  updateEmployee: (id: number, data: UpdateEmployeeRequest) => 
    api.put<Employee>(`/employees/${id}`, data),
  
  deleteEmployee: (id: number) => 
    api.delete(`/employees/${id}`),

  checkEmployeeSwap: (bookingId: number, employeeId: number) =>
    api.get<EmployeeSwapInfo>(`/employees/${bookingId}/check-swap/${employeeId}`),

  swapEmployees: (booking1Id: number, booking2Id: number) =>
    api.post('/employees/swap-employees', {
      booking1Id,
      booking2Id,
    }),

  getEmployeeSwapOptions: (bookingId: number, employeeId: number) =>
    api.get<EmployeeSwapOptions>(`/employees/${bookingId}/swap-options/${employeeId}`),

  // TOTP methods for new users (before saving)
  generateTotpForNewUser: (username: string) =>
    api.post<TotpSetupResponse>('/employees/totp/generate', null, { params: { username } }),
  
  verifyTotpCodeForNewUser: (secret: string, code: string) =>
    api.post<boolean>('/employees/totp/verify', { secret, code }),
  
  // TOTP methods for existing users
  setupTotp: (employeeId: number) =>
    api.post<TotpSetupResponse>(`/employees/${employeeId}/totp/setup`),
  
  verifyTotp: (employeeId: number, code: string) =>
    api.post(`/employees/${employeeId}/totp/verify`, { userId: employeeId, verificationCode: code }),
  
  disableTotp: (employeeId: number) =>
    api.delete(`/employees/${employeeId}/totp`),

};