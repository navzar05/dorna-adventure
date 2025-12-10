// src/components/BookingModal.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { bookingService } from '../services/bookingService';
import type { Activity } from '../types/activity';
import type { TimeSlot } from '../types/booking';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  activity: Activity;
  onSuccess?: () => void;
}

export default function BookingModal({ open, onClose, activity, onSuccess }: BookingModalProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [participants, setParticipants] = useState(activity.minParticipants);
  const [notes, setNotes] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch time slots considering participant count
  const fetchTimeSlots = async (date: Dayjs, participantCount: number) => {
    try {
      setLoadingSlots(true);
      const response = await bookingService.getAvailableTimeSlots(
        activity.id,
        date.format('YYYY-MM-DD'),
        participantCount
      );
      setTimeSlots(response.data);
      
      const selectedSlot = response.data.find(slot => slot.startTime === selectedTime);
      if (selectedTime && (!selectedSlot || !selectedSlot.available)) {
        setSelectedTime(null);
      }
    } catch {
      toast.error(t('booking.errors.loadSlotsFailed'));
    } finally {
      setLoadingSlots(false);
    }
  };

  // Debounced version for participant changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchTimeSlots = useCallback(
    debounce((date: Dayjs, participantCount: number) => {
      fetchTimeSlots(date, participantCount);
    }, 500), // 500ms delay
    [activity.id]
  );

  // Effect for date changes (immediate)
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate, participants);
    }
  }, [selectedDate, activity.id]);

  // Effect for participant changes (debounced)
  useEffect(() => {
    if (selectedDate) {
      debouncedFetchTimeSlots(selectedDate, participants);
    }
    
    // Cleanup
    return () => {
      debouncedFetchTimeSlots.cancel();
    };
  }, [participants, selectedDate, debouncedFetchTimeSlots]);

  const handleParticipantsChange = (value: number) => {
    // Validate range
    const validValue = Math.max(
      activity.minParticipants,
      Math.min(activity.maxParticipants, value)
    );
    setParticipants(validValue);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error(t('booking.errors.selectDateTime'));
      return;
    }

    try {
      setLoading(true);
      await bookingService.createBooking({
        activityId: activity.id,
        bookingDate: selectedDate.format('YYYY-MM-DD'),
        startTime: selectedTime,
        numberOfParticipants: participants,
        notes: notes || undefined,
      });

      toast.success(t('booking.successPendingApproval'));
      onClose();
      if (onSuccess) onSuccess();
      resetForm();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('booking.errors.bookingFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(dayjs().add(1, 'day'));
    setSelectedTime(null);
    setParticipants(activity.minParticipants);
    setNotes('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const totalPrice = activity.pricePerPerson * participants;
  const depositAmount = (totalPrice * activity.depositPercent) / 100;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{t('booking.title')}</Typography>
          <IconButton onClick={handleClose} edge="end" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {activity.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activity.description}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Date Selection */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              {t('booking.selectDate')}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={dayjs().add(1, 'day')}
                maxDate={dayjs().add(3, 'month')}
                slotProps={{ textField: { fullWidth: true } }}
                disabled={loading}
              />
            </LocalizationProvider>
          </Grid>

          {/* Participants */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              {t('booking.participants')}
            </Typography>
            <TextField
              type="number"
              value={participants}
              onChange={(e) => handleParticipantsChange(Number(e.target.value))}
              inputProps={{
                min: activity.minParticipants,
                max: activity.maxParticipants,
              }}
              helperText={`${activity.minParticipants}-${activity.maxParticipants} ${t('booking.participantsRange')}`}
              fullWidth
              disabled={loading}
            />
            {loadingSlots && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  {t('booking.updatingAvailability')}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Time Slots */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              {t('booking.selectTime')}
            </Typography>

            {loadingSlots ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : timeSlots.length === 0 ? (
              <Alert severity="info">{t('booking.noSlotsAvailable')}</Alert>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {timeSlots.map((slot) => (
                    <Chip
                      key={slot.startTime}
                      icon={<ScheduleIcon />}
                      label={`${slot.startTime} - ${slot.endTime}`}
                      onClick={() => slot.available && !loading && setSelectedTime(slot.startTime)}
                      color={selectedTime === slot.startTime ? 'primary' : 'default'}
                      variant={selectedTime === slot.startTime ? 'filled' : 'outlined'}
                      disabled={!slot.available || loading}
                      sx={{ cursor: slot.available && !loading ? 'pointer' : 'not-allowed' }}
                    />
                  ))}
                </Box>
                
                {/* Info about availability */}
                <Alert severity="info" sx={{ mt: 2 }} icon={<ScheduleIcon />}>
                  {t('booking.availabilityBasedOnParticipants', { count: participants })}
                </Alert>
              </>
            )}
          </Grid>

          {/* Notes */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              {t('booking.notes')}
            </Typography>
            <TextField
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('booking.notesPlaceholder')}
              fullWidth
              disabled={loading}
            />
          </Grid>

          {/* Price Summary */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                {t('booking.priceSummary')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{t('booking.totalPrice')}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  RON {totalPrice.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="primary">
                  {t('booking.depositRequired')} ({activity.depositPercent}%)
                </Typography>
                <Typography variant="body2" fontWeight={600} color="primary">
                  RON {depositAmount.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Admin Approval Info Alert */}
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('booking.adminApprovalRequired')}
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('admin.cancel')}
        </Button>
        <Button
          onClick={handleBooking}
          variant="contained"
          disabled={!selectedDate || !selectedTime || loading}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {t('booking.creating')}
            </>
          ) : (
            t('booking.confirmBooking')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}