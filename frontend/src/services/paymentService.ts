// src/services/paymentService.ts
import axios from 'axios';
import type { 
  Payment, 
  PaymentIntentRequest, 
  PaymentIntentResponse,
  StripeConfig 
} from '../types/payment';

// Ensure this matches your backend URL exactly (check port 8080 vs 8081 etc)
const API_URL = 'http://dorna-adventure-production.up.railway.app/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const paymentService = {
  // Get Stripe publishable key
  getStripeConfig: async () => {
    const response = await axios.get<StripeConfig>(
      `${API_URL}/payments/config`, 
      { headers: getAuthHeader() } 
    );
    return response.data;
  },

  // Create payment intent
  createPaymentIntent: async (request: PaymentIntentRequest) => {
    const response = await axios.post<PaymentIntentResponse>(
      `${API_URL}/payments/create-intent`,
      request,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get booking payments
  getBookingPayments: async (bookingId: number) => {
    const response = await axios.get<Payment[]>(
      `${API_URL}/payments/booking/${bookingId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Mark remaining as cash
  markRemainingAsCash: async (bookingId: number) => {
    await axios.post(
      `${API_URL}/payments/booking/${bookingId}/mark-cash`,
      {},
      { headers: getAuthHeader() }
    );
  },

  // Record cash payment (admin only)
  recordCashPayment: async (bookingId: number) => {
    await axios.post(
      `${API_URL}/payments/booking/${bookingId}/record-cash`,
      {},
      { headers: getAuthHeader() }
    );
  },
};