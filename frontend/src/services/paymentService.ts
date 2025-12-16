// src/services/paymentService.ts
import api from './api';
import type { 
  Payment, 
  PaymentIntentRequest, 
  PaymentIntentResponse,
  StripeConfig 
} from '../types/payment';

export const paymentService = {
  // Get Stripe publishable key
  getStripeConfig: () => 
    api.get<StripeConfig>('/payments/config'),

  // Create payment intent
  createPaymentIntent: (request: PaymentIntentRequest) => 
    api.post<PaymentIntentResponse>('/payments/create-intent', request),

  // Get booking payments
  getBookingPayments: (bookingId: number) => 
    api.get<Payment[]>(`/payments/booking/${bookingId}`),

  // Mark remaining as cash
  markRemainingAsCash: (bookingId: number) => 
    api.post(`/payments/booking/${bookingId}/mark-cash`),

  // Record cash payment (admin only)
  recordCashPayment: (bookingId: number) => 
    api.post(`/payments/booking/${bookingId}/record-cash`),
};