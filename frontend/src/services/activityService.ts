// src/services/activityService.ts
import api from './api';
import type { Activity } from '../types/activity';

export const activityService = {
  getAllActivities: () => api.get<Activity[]>('/activities'),
  
  getActivityById: (id: number) => api.get<Activity>(`/activities/${id}`),
  
  getActivitiesByCategory: (categoryId: number) => 
    api.get<Activity[]>(`/activities/category/${categoryId}`),
};