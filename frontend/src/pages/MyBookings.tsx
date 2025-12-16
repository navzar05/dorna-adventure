// src/pages/MyBookings.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  HourglassEmpty as WaitingIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { PaymentModal } from '../components/payments';
import type { Booking } from '../types/booking';
import { formatTimeUntil } from '../utils/dateUtils';
import i18n from '../i18n';

dayjs.extend(relativeTime);

const ITEMS_PER_PAGE = 6;

export default function MyBookings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'REMAINING' | 'FULL'>('DEPOSIT');
  const [paymentTitle, setPaymentTitle] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings();
      setBookings(response.data);
      console.log(response.data);
    } catch (error) {
      toast.error(t('myBookings.loadError'));
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;

    try {
      // This already sends DELETE request
      await bookingService.cancelBooking(selectedBooking.id);
      toast.success(t('myBookings.cancelled'));
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(t('myBookings.cancelError'));
    }
  };

  const handlePayDeposit = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentAmount(booking.depositPaid);
    setPaymentType('DEPOSIT');
    setPaymentTitle(t('payment.payDeposit'));
    setPaymentModalOpen(true);
  };

  const handlePayRemaining = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentAmount(booking.remainingAmount);
    setPaymentType('REMAINING');
    setPaymentTitle(t('payment.payRemaining'));
    setPaymentModalOpen(true);
  };

  const handleMarkCash = async (bookingId: number) => {
    try {
      await paymentService.markRemainingAsCash(bookingId);
      toast.success(t('payment.markedCash'));
      fetchBookings();
    } catch {
      toast.error(t('payment.markCashError'));
    }
  };

  const handlePaymentSuccess = () => {
    fetchBookings();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(1); // Reset to page 1 when filter changes
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Filtering Logic ---
  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') {
      return bookings;
    }
    return bookings.filter(booking => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  
  const paginatedBookings = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'error';
      case 'DEPOSIT_PAID':
        return 'warning';
      case 'FULLY_PAID':
        return 'success';
      default:
        return 'default';
    }
  };

  const canCancel = (booking: Booking) => {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  };

  const isPaymentDeadlineExpired = (booking: Booking) => {
    if (!booking.paymentDeadline) return false;
    return dayjs().isAfter(dayjs(booking.paymentDeadline));
  };

  const canPayDeposit = (booking: Booking) => {
    return (
      booking.status === 'CONFIRMED' &&
      booking.paymentStatus === 'UNPAID' &&
      booking.paymentDeadline &&
      !isPaymentDeadlineExpired(booking)
    );
  };

  const canPayRemaining = (booking: Booking) => {
    return (
      booking.paymentStatus === 'DEPOSIT_PAID' &&
      booking.remainingAmount > 0 &&
      !booking.willPayRemainingCash &&
      booking.status !== 'CANCELLED'
    );
  };

  const getPaymentDeadlineAlert = (booking: Booking) => {
    if (!booking.paymentDeadline || booking.paymentStatus !== 'UNPAID' || booking.status !== 'CONFIRMED') {
      return null;
    }

    const deadline = dayjs(booking.paymentDeadline);
    const now = dayjs();
    const isExpired = now.isAfter(deadline);

    if (isExpired) {
      return (
        <Alert severity="error" icon={<CancelIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2">
            {t('myBookings.paymentExpired')}
          </Typography>
        </Alert>
      );
    }

    const hoursLeft = deadline.diff(now, 'hour', true);
    const severity = hoursLeft < 6 ? 'error' : 'warning';
    
    const timeText = formatTimeUntil(booking.paymentDeadline, i18n.language);

    return (
      <Alert severity={severity} icon={<PaymentIcon />} sx={{ mb: 2 }}>
        <Typography variant="body2">
          {t('myBookings.paymentDeadline', { time: timeText })}
        </Typography>
      </Alert>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          fontWeight="bold"
          sx={{
            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('myBookings.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {t('myBookings.subtitle')}
        </Typography>
      </Box>

      {bookings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('myBookings.noBookings')}
          </Alert>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/home')}
          >
            {t('myBookings.exploreActivities')}
          </Button>
        </Box>
      ) : (
        <>
          {/* Filter Section */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} justifyContent="center">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth sx={{ bgcolor: 'background.paper' }}>
                  <InputLabel id="status-filter-label">
                    {t('myBookings.filterByStatus')}
                  </InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label={t('myBookings.filterByStatus')}
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value="all">
                      <em>{t('myBookings.allBookings')}</em>
                    </MenuItem>
                    <MenuItem value="PENDING">{t('booking.status.pending')}</MenuItem>
                    <MenuItem value="CONFIRMED">{t('booking.status.confirmed')}</MenuItem>
                    <MenuItem value="COMPLETED">{t('booking.status.completed')}</MenuItem>
                    <MenuItem value="CANCELLED">{t('booking.status.cancelled')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Results Section */}
          {filteredBookings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Alert severity="info">
                {t('myBookings.noBookingsWithFilter')}
              </Alert>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {paginatedBookings.map((booking) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={booking.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        '&:hover': {
                          boxShadow: 6,
                        },
                      }}
                    >
                      {/* Status Chips */}
                      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip
                          label={t(`booking.status.${booking.status.toLowerCase()}`)}
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                        <Chip
                          label={t(`payment.status.${booking.paymentStatus.toLowerCase()}`)}
                          color={getPaymentStatusColor(booking.paymentStatus)}
                          size="small"
                        />
                      </Box>

                      <CardContent sx={{ flexGrow: 1 }}>
                        {/* Activity Name */}
                        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ pr: 8 }}>
                          {booking.activityName}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        {/* Payment Deadline Alert */}
                        {getPaymentDeadlineAlert(booking)}

                        {/* Pending Approval Alert */}
                        {booking.status === 'PENDING' && (
                          <Alert severity="info" icon={<WaitingIcon />} sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              {t('myBookings.waitingApproval')}
                            </Typography>
                          </Alert>
                        )}

                        {/* Booking Details */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon color="action" fontSize="small" />
                            <Typography variant="body2">
                              <strong>{t('myBookings.date')}:</strong> {booking.bookingDate}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon color="action" fontSize="small" />
                            <Typography variant="body2">
                              <strong>{t('myBookings.time')}:</strong> {booking.startTime} - {booking.endTime}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="action" fontSize="small" />
                            <Typography variant="body2">
                              <strong>{t('myBookings.participants')}:</strong> {booking.numberOfParticipants}
                            </Typography>
                          </Box>

                          {booking.employeeName && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon color="action" fontSize="small" />
                              <Typography variant="body2">
                                <strong>{t('myBookings.employee')}:</strong> {booking.employeeName}
                              </Typography>
                            </Box>
                          )}

                          <Divider sx={{ my: 1 }} />

                          {/* Payment Progress */}
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {t('payment.progress')}
                              </Typography>
                              <Typography variant="body2" color="primary">
                                RON {booking.paidAmount.toFixed(2)} / RON {booking.totalPrice.toFixed(2)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={(booking.paidAmount / booking.totalPrice) * 100}
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </Box>

                          {booking.remainingAmount > 0 && (
                            <Alert severity="info" icon={<EuroIcon />} sx={{ py: 0.5 }}>
                              <Typography variant="body2">
                                {t('payment.remaining')}: RON {booking.remainingAmount.toFixed(2)}
                              </Typography>
                            </Alert>
                          )}

                          {booking.willPayRemainingCash && (
                            <Alert severity="success" icon={<WalletIcon />} sx={{ py: 0.5 }}>
                              <Typography variant="body2">
                                {t('payment.willPayCash')}
                              </Typography>
                            </Alert>
                          )}

                          {booking.notes && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>{t('myBookings.notes')}:</strong> {booking.notes}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>

                      {/* Actions */}
                      <Box sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Payment Actions - Only if confirmed and within deadline */}
                        {canPayDeposit(booking) && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PaymentIcon />}
                            onClick={() => handlePayDeposit(booking)}
                            fullWidth
                          >
                            {t('payment.payDeposit')} (RON {booking.depositPaid.toFixed(2)})
                          </Button>
                        )}

                        {canPayRemaining(booking) && (
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<PaymentIcon />}
                              onClick={() => handlePayRemaining(booking)}
                              fullWidth
                            >
                              {t('payment.payRemaining')}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<WalletIcon />}
                              onClick={() => handleMarkCash(booking.id)}
                            >
                              {t('payment.payCash')}
                            </Button>
                          </Stack>
                        )}

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => navigate(`/activity/${booking.activityId}`)}
                            fullWidth
                          >
                            {t('myBookings.viewActivity')}
                          </Button>
                          {canCancel(booking) && (
                            <IconButton
                              color="error"
                              onClick={() => handleCancelClick(booking)}
                              size="small"
                            >
                              <CancelIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handlePageChange} 
                    color="primary" 
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('myBookings.cancel')}</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box>
              <Typography variant="body1" paragraph>
                {t('myBookings.confirmCancel')}
              </Typography>
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>{t('myBookings.activityName')}:</strong> {selectedBooking.activityName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>{t('myBookings.date')}:</strong> {selectedBooking.bookingDate}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('myBookings.time')}:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            {t('common.no')}
          </Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained">
            {t('myBookings.cancelBooking')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      {selectedBooking && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          bookingId={selectedBooking.id}
          amount={paymentAmount}
          paymentType={paymentType}
          title={paymentTitle}
        />
      )}
    </Container>
  );
}