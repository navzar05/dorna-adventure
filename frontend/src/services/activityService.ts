import api from './api';
import type { Activity } from '../types/activity';

export const activityService = {
  getAllActivities: () => api.get<Activity[]>('/activities'),
  
  getActivityById: (id: number) => api.get<Activity>(`/activities/${id}`),
  
  getActivitiesByCategory: (categoryId: number) => 
    api.get<Activity[]>(`/activities/category/${categoryId}`),
  
  createActivity: (activity: Partial<Activity>) => 
    api.post<Activity>('/activities', activity),
  
  updateActivity: (id: number, activity: Partial<Activity>) => 
    api.put<Activity>(`/activities/${id}`, activity),
  
  deleteActivity: (id: number) => 
    api.delete(`/activities/${id}`),
};