// src/types/workHourRequest.ts
export interface WorkHourRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  workDate: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  rejectionReason?: string;
}

export interface WorkHourRequestCreate {
  workDate: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
  notes?: string;
}

export interface EmployeeWorkHour {
  id: number;
  employeeId: number;
  workDate: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}