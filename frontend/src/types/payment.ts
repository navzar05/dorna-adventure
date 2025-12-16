export interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  paymentType: 'DEPOSIT' | 'REMAINING' | 'FULL';
  paymentMethod: 'CARD' | 'CASH';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  completedAt?: string;
}

export interface PaymentIntentRequest {
  bookingId: number;
  paymentType: 'DEPOSIT' | 'REMAINING' | 'FULL';
  amount: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: number;
  paymentIntentId: string;
}

export interface StripeConfig {
  publishableKey: string;
}