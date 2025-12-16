// src/types/employee.ts
export interface Employee {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  enabled: boolean;
}

export interface CreateEmployeeRequest {
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  enabled: boolean;
  roles: string[];
  totpSecret?: string;
  totpEnabled?: boolean;
}

export interface UpdateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  enabled: boolean;
}

export interface EmployeeSwapInfo {
  conflictingBookingId: number;
  conflictingBookingActivity: string;
  currentEmployeeName: string;
  newEmployeeName: string;
  location: string;
  category: string;
  startTime: string;
  endTime: string;
  canSwap: boolean;
  reason?: string;
}

export interface CompatibleBooking {
  bookingId: number;
  activityName: string;
  customerName: string;
  isGuestBooking: boolean;
  numberOfParticipants: number;
  startTime: string;
  endTime: string;
  date: string;
}

export interface EmployeeSwapOptions {
  currentEmployeeName: string;
  newEmployeeName: string;
  location: string;
  category: string;
  startTime: string;
  endTime: string;
  compatibleBookings: CompatibleBooking[];
  hasCompatibleBookings: boolean;
  reason?: string;
}

export interface Employee {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  enabled: boolean;
  roles: string[];
  totpEnabled?: boolean;
}

export interface TotpSetupResponse {
  secret: string;
  qrCodeDataUrl: string;
}