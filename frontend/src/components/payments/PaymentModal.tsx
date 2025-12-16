// src/components/PaymentModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import PaymentForm from './PaymentForm';
import type { PaymentIntentRequest } from '../../types/payment';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookingId: number;
  amount: number;
  paymentType: 'DEPOSIT' | 'REMAINING' | 'FULL';
  title: string;
}

export default function PaymentModal({
  open,
  onClose,
  onSuccess,
  bookingId,
  amount,
  paymentType,
  title,
}: PaymentModalProps) {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load Stripe publishable key
    paymentService.getStripeConfig().then((config) => {
      setStripePromise(loadStripe(config.data.publishableKey));
    });
  }, []);

  useEffect(() => {
    if (open && bookingId && amount > 0) {
      initializePayment();
    }
  }, [open, bookingId, amount, paymentType]);

  const initializePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const request: PaymentIntentRequest = {
        bookingId,
        paymentType,
        amount,
      };

      const response = await paymentService.createPaymentIntent(request);
      setClientSecret(response.data.clientSecret);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error initializing payment:', err);
      setError(err.response?.data?.message || t('payment.initError'));
      toast.error(t('payment.initError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success(t('payment.success'));
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const appearance = {
    theme: 'stripe' as const,
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={handleClose} edge="end" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm
              amount={amount}
              onSuccess={handleSuccess}
              onCancel={handleClose}
            />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}