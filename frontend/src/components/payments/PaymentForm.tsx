// src/components/PaymentForm.tsx
import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ amount, onSuccess, onCancel }: PaymentFormProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError('');

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || t('payment.error'));
      setProcessing(false);
    } else {
      // Payment successful
      onSuccess();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('payment.amount')}: RON {amount.toFixed(2)}
        </Typography>
      </Box>

      <PaymentElement />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          onClick={onCancel}
          disabled={processing}
          fullWidth
          variant="outlined"
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          fullWidth
          variant="contained"
        >
          {processing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {t('payment.processing')}
            </>
          ) : (
            t('payment.pay')
          )}
        </Button>
      </Box>
    </Box>
  );
}