// src/pages/PaymentSuccess.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/my-bookings');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Container sx={{ py: 8, textAlign: 'center' }}>
      <Box>
        <CheckCircleIcon sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
        <Typography variant="h3" gutterBottom>
          {t('payment.successTitle')}
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {t('payment.successMessage')}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/my-bookings')}
          sx={{ mt: 2 }}
        >
          {t('payment.viewBookings')}
        </Button>
      </Box>
    </Container>
  );
}