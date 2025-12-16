/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/GuestPayment.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  // Remove legacy Grid from here
} from '@mui/material';
// Import Grid2 explicitly (Standard for MUI v6/v7)
import Grid from '@mui/material/Grid';
import {
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import api from '../services/api';
import { PaymentModal } from '../components/payments';
import type { Booking } from '../types/booking';

export default function GuestPayment() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      const bookingId = searchParams.get('bookingId');

      if (!bookingId) {
        setError(t('payment.guest.noBookingId'));
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/bookings/${bookingId}`);
        const bookingData = response.data;

        // Check if booking is valid and payable
        if (bookingData.paymentStatus === 'FULLY_PAID') {
          setError(t('payment.guest.alreadyPaid'));
          setLoading(false);
          return;
        }

        // Check if this is a guest booking
        if (!bookingData.guestName) {
          setError(t('payment.guest.notGuestBooking'));
          setLoading(false);
          return;
        }

        setBooking(bookingData);
        setError('');
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          t('payment.guest.loadError')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [searchParams, t]);

  const handlePayment = () => {
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setPaymentComplete(true);
    toast.success(t('payment.success'));

    // Redirect to success page after 3 seconds
    setTimeout(() => {
      navigate('/payment-success');
    }, 3000);
  };

  const getPaymentAmount = () => {
    if (!booking) return 0;
    if (booking.paymentStatus === 'UNPAID') {
      return booking.depositPaid;
    }
    return booking.remainingAmount;
  };

  const getPaymentType = (): 'DEPOSIT' | 'REMAINING' | 'FULL' => {
    if (!booking) return 'DEPOSIT';
    if (booking.paymentStatus === 'UNPAID') {
      return 'DEPOSIT';
    }
    return 'REMAINING';
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            {t('payment.guest.loading')}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error.main">
              {t('payment.guest.error')}
            </Typography>
            <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
            >
              {t('payment.guest.backHome')}
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (paymentComplete) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              {t('payment.success')}
            </Typography>
            <Alert severity="success" sx={{ mt: 2, mb: 3 }}>
              {t('payment.guest.successMessage')}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              {t('payment.guest.redirecting')}
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
          {t('payment.guest.title')}
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          {/* Booking Details */}
          <Typography variant="h6" gutterBottom fontWeight="600">
            {t('payment.guest.bookingDetails')}
          </Typography>

          <Card variant="outlined" sx={{ mt: 2, mb: 3 }}>
            <CardContent>
              {/* MUI Grid v2 Implementation */}
              <Grid container spacing={2}>
                {/* Replaced item xs={12} with size={12} */}
                <Grid size={12}>
                  <Typography variant="h5" fontWeight="600" color="primary">
                     {/* NOTE: Ensure your Booking type has 'activity' object or use optional chaining */}
                    {(booking as any)?.activity?.name || 'Activity Name'}
                  </Typography>
                </Grid>

                {/* Replaced item xs={12} sm={6} with size={{ xs: 12, sm: 6 }} */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('booking.date')}
                      </Typography>
                      <Typography variant="body1">
                        {dayjs(booking?.bookingDate).format('DD MMM YYYY')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('booking.time')}
                      </Typography>
                      <Typography variant="body1">
                        {booking?.startTime} - {booking?.endTime}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('booking.participants')}
                      </Typography>
                      <Typography variant="body1">
                        {booking?.numberOfParticipants} {t('booking.people')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EuroIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('booking.totalPrice')}
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        RON {booking?.totalPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('booking.bookingId')}: #{booking?.id}
                    </Typography>
                    <Chip
                      label={booking?.paymentStatus}
                      color={
                        booking?.paymentStatus === 'FULLY_PAID' ? 'success' :
                        booking?.paymentStatus === 'DEPOSIT_PAID' ? 'warning' :
                        'error'
                      }
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom fontWeight="600">
            {t('payment.guest.paymentSection')}
          </Typography>

          <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
            {booking?.paymentStatus === 'UNPAID'
              ? t('payment.guest.depositInfo', { amount: booking?.depositPaid.toFixed(2) })
              : t('payment.guest.remainingInfo', { amount: booking?.remainingAmount.toFixed(2) })}
          </Alert>

          <Card variant="outlined" sx={{ bgcolor: 'action.hover', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WalletIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {booking?.paymentStatus === 'UNPAID'
                      ? t('payment.amountDue')
                      : t('payment.remainingAmount')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    RON {getPaymentAmount().toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={handlePayment}
                startIcon={<EuroIcon />}
                sx={{ minWidth: 150 }}
              >
                {t('payment.payNow')}
              </Button>
            </Box>
          </Card>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            {t('payment.guest.securePayment')}
          </Typography>
        </Paper>
      </Box>

      {/* Payment Modal */}
      {booking && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          bookingId={booking.id}
          amount={getPaymentAmount()}
          paymentType={getPaymentType()}
          title={
            booking.paymentStatus === 'UNPAID'
              ? t('payment.payDeposit')
              : t('payment.payRemaining')
          }
        />
      )}
    </Container>
  );
}