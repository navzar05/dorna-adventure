import api from './api';
import type { Activity, ActivityTimeSlot } from '../types/activity';

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

  getMonthlyAvailability: (activityId: number, date: string, participants: number) => {
      // The 'date' param here is just to extract the Year and Month
      return api.get<string[]>(`/activities/${activityId}/availability/month`, {
        params: {
          date, // Send '2023-10-01'
          participants
        }
      });
    },

  // Time slot management
  getActivityTimeSlots: (activityId: number) =>
    api.get<ActivityTimeSlot[]>(`/activities/${activityId}/time-slots`),

  createTimeSlot: (activityId: number, timeSlot: Omit<ActivityTimeSlot, 'id'>) =>
    api.post<ActivityTimeSlot>(`/activities/${activityId}/time-slots`, timeSlot),

  updateTimeSlot: (activityId: number, slotId: number, timeSlot: Omit<ActivityTimeSlot, 'id'>) =>
    api.put<ActivityTimeSlot>(`/activities/${activityId}/time-slots/${slotId}`, timeSlot),

  deleteTimeSlot: (activityId: number, slotId: number) =>
    api.delete(`/activities/${activityId}/time-slots/${slotId}`),

};