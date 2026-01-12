// src/services/activityEmployeeService.ts
import api from './api';
import type { AssignedEmployee } from '../types/activity';

export const activityEmployeeService = {
  // Get assigned employees for an activity
  getAssignedEmployees: (activityId: number) =>
    api.get<AssignedEmployee[]>(`/activities/${activityId}/employees`),

  // Assign an employee to an activity
  assignEmployee: (activityId: number, employeeId: number) =>
    api.post<AssignedEmployee>(`/activities/${activityId}/employees/${employeeId}`),

  // Remove an employee from an activity
  removeEmployee: (activityId: number, employeeId: number) =>
    api.delete(`/activities/${activityId}/employees/${employeeId}`),

  // Update employee selection enabled flag
  updateEmployeeSelectionEnabled: (activityId: number, enabled: boolean) =>
    api.put(`/activities/${activityId}/employee-selection-enabled`, { enabled }),

  // Bulk assign employees
  assignEmployees: (activityId: number, employeeIds: number[]) =>
    api.post<AssignedEmployee[]>(`/activities/${activityId}/employees/bulk`, employeeIds),
};
