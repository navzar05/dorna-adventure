// src/services/workHoursService.ts
import api from './api';
import type { WorkHours } from '../types/booking';

export const workHoursService = {
  getAllWorkHours: () => api.get<WorkHours[]>('/work-hours'),
  
  createOrUpdateWorkHours: (data: Partial<WorkHours>) => 
    api.post<WorkHours>('/work-hours', data),
  
  deleteWorkHours: (id: number) => 
    api.delete(`/work-hours/${id}`),
};