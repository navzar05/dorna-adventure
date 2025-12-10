// src/services/bookingService.ts
import api from './api';
import type { Booking, BookingRequest, TimeSlot } from '../types/booking';

export const bookingService = {
  getAvailableTimeSlots: (activityId: number, date: string, numberOfParticipants?: number) => {
    const params = new URLSearchParams({
      activityId: activityId.toString(),
      date: date,
    });
    
    if (numberOfParticipants) {
      params.append('numberOfParticipants', numberOfParticipants.toString());
    }
    
    return api.get<TimeSlot[]>(`/bookings/available-slots?${params.toString()}`);
  },
  
  createBooking: (data: BookingRequest) => 
    api.post<Booking>('/bookings', data),
  
  getMyBookings: () => 
    api.get<Booking[]>('/bookings/my-bookings'),
  
  getAllBookings: () => 
    api.get<Booking[]>('/bookings'),
  
  getBookingById: (id: number) => 
    api.get<Booking>(`/bookings/${id}`),
  
  updateBookingStatus: (id: number, status: string) =>
    api.put<Booking>(`/bookings/${id}/status`, { status }),
  
  updateBookingEmployee: (id: number, employeeId: number) =>
    api.put<Booking>(`/bookings/${id}/employee`, { employeeId }),
  
  cancelBooking: (id: number) => 
    api.delete(`/bookings/${id}`),

  canAcceptPayment: (bookingId: number) => {
    api.get(`/bookings/${bookingId}/can-pay`)
  },

  createBookingAsAdmin: (data: {
    activityId: number;
    userId: number;
    bookingDate: string;
    startTime: string;
    numberOfParticipants: number;
    notes?: string;
  }) => api.post<Booking>('/bookings/admin/create', data),

  createGuestBooking: (data: {
    activityId: number;
    bookingDate: string;
    startTime: string;
    numberOfParticipants: number;
    notes?: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
  }) => api.post<Booking>('/bookings/guest', data),
};