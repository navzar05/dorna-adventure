// src/services/workHourRequestService.ts
import api from './api';
import type { WorkHourRequest, WorkHourRequestCreate, EmployeeWorkHour, EmployeeWorkHourBulkCreate, EmployeeWorkHourUpdate } from '../types/workHourRequest';


export const workHourRequestService = {
  // Employee endpoints
  getMyWorkHours: () => 
    api.get<EmployeeWorkHour[]>('/work-hours/my-hours'),

  getMyWorkHoursByDateRange: (startDate: string, endDate: string) =>
    api.get<EmployeeWorkHour[]>('/work-hours/my-hours/range', {
      params: { startDate, endDate }
    }),

  createRequest: (data: WorkHourRequestCreate) =>
    api.post<WorkHourRequest>('/work-hours/requests', data),

  getMyRequests: () =>
    api.get<WorkHourRequest[]>('/work-hours/requests/my-requests'),

  cancelRequest: (id: number) =>
    api.delete(`/work-hours/requests/${id}`),

  deleteMyWorkHour: (id: number) =>
    api.delete(`/work-hours/my-hours/${id}`),

  // Admin endpoints
  getAllRequests: () =>
    api.get<WorkHourRequest[]>('/work-hours/requests'),

  getPendingRequests: () =>
    api.get<WorkHourRequest[]>('/work-hours/requests/pending'),

  approveRequest: (id: number) =>
    api.put<WorkHourRequest>(`/work-hours/requests/${id}/approve`),

  rejectRequest: (id: number, reason?: string) =>
    api.put<WorkHourRequest>(`/work-hours/requests/${id}/reject`, { reason }),

  getEmployeeWorkHours: (employeeId: number) =>
    api.get<EmployeeWorkHour[]>(`/work-hours/employee/${employeeId}`),

  getEmployeeWorkHoursByDateRange: (employeeId: number, startDate: string, endDate: string) =>
    api.get<EmployeeWorkHour[]>(`/work-hours/employee/${employeeId}/range`, {
      params: { startDate, endDate }
    }),

  updateEmployeeWorkHours: (employeeId: number, data: EmployeeWorkHourUpdate) =>
    api.put<EmployeeWorkHour>(`/work-hours/employee/${employeeId}`, data),

  createBulkEmployeeWorkHours: (employeeId: number, data: EmployeeWorkHourBulkCreate) =>
    api.post<EmployeeWorkHour[]>(`/work-hours/employee/${employeeId}/bulk`, data),

  deleteEmployeeWorkHour: (id: number) =>
    api.delete(`/work-hours/employee/hours/${id}`),

  deleteEmployeeWorkHourByDate: (employeeId: number, workDate: string) =>
    api.delete(`/work-hours/employee/${employeeId}/date/${workDate}`),
};
