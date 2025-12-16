// src/types/booking.ts
export interface Booking {
  id: number;
  activityId: number;
  activityName: string;
  userId: number;
  userName: string;
  employeeId: number | null;
  employeeName: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  numberOfParticipants: number;
  totalPrice: number;
  depositPaid: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  
  // Payment fields
  paymentStatus: 'UNPAID' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'PARTIALLY_REFUNDED' | 'FULLY_REFUNDED';
  paidAmount: number;
  remainingAmount: number;
  willPayRemainingCash: boolean;
  
  // New fields
  confirmedAt?: string;
  paymentDeadline?: string;

  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  isGuestBooking?: boolean;
}
export interface BookingRequest {
  activityId: number;
  bookingDate: string; // ISO date format
  startTime: string; // HH:mm format
  numberOfParticipants: number;
  notes?: string;
}

export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  available: boolean;
}

export interface WorkHours {
  id: number;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  active: boolean;
}