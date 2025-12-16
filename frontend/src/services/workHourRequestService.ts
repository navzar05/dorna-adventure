// src/services/workHourRequestService.ts
import api from './api';
import type { WorkHourRequest, WorkHourRequestCreate, EmployeeWorkHour } from '../types/workHourRequest';

export const workHourRequestService = {
  // Employee endpoints
  getMyWorkHours: () => 
    api.get<EmployeeWorkHour[]>('/work-hours/my-hours'),  // Removed /v1
  
  getMyWorkHoursByDateRange: (startDate: string, endDate: string) =>
    api.get<EmployeeWorkHour[]>(`/work-hours/my-hours/range?startDate=${startDate}&endDate=${endDate}`),
  
  createRequest: (data: WorkHourRequestCreate) => 
    api.post<WorkHourRequest>('/work-hours/requests', data),
  
  getMyRequests: () => 
    api.get<WorkHourRequest[]>('/work-hours/requests/my-requests'),
  
  cancelRequest: (id: number) => 
    api.delete(`/work-hours/requests/${id}`),
  
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
    api.get<EmployeeWorkHour[]>(`/work-hours/employee/${employeeId}/range?startDate=${startDate}&endDate=${endDate}`),
  
  updateEmployeeWorkHours: (employeeId: number, data: {
    workDate: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }) => 
    api.put<EmployeeWorkHour>(`/work-hours/employee/${employeeId}`, data),
  
  createBulkEmployeeWorkHours: (employeeId: number, data: {
    workDates: string[];
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }) =>
    api.post<EmployeeWorkHour[]>(`/work-hours/employee/${employeeId}/bulk`, data),
  
  deleteEmployeeWorkHour: (id: number) => 
    api.delete(`/work-hours/employee/hours/${id}`),
  
  deleteEmployeeWorkHourByDate: (employeeId: number, workDate: string) =>
    api.delete(`/work-hours/employee/${employeeId}/date/${workDate}`),
};