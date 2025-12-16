// src/services/workHoursService.ts
import api from './api';
import type { WorkHours } from '../types/booking';

export const workHoursService = {
  getAllWorkHours: () => api.get<WorkHours[]>('/business-hours'),
  
  createOrUpdateWorkHours: (data: Partial<WorkHours>) => 
    api.post<WorkHours>('/business-hours', data),
  
  deleteWorkHours: (id: number) => 
    api.delete(`/business-hours/${id}`),  // Fixed: changed backtick to parentheses
};