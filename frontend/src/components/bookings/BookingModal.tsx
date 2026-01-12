// src/components/BookingModal.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Close as CloseIcon, Schedule as ScheduleIcon, Person as PersonIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { bookingService } from '../../services/bookingService';
import type { Activity } from '../../types/activity';
import type { TimeSlot } from '../../types/booking';
import { activityService } from '../../services/activityService';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  activity: Activity;
  onSuccess?: () => void;
}

export default function BookingModal({ open, onClose, activity, onSuccess }: BookingModalProps) {
  const { t } = useTranslation();

  // State
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [participants, setParticipants] = useState(activity.minParticipants);
  const [notes, setNotes] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  // Data State
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  // Loading States
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Keep track of the currently viewed month in the calendar to prevent unnecessary fetches
  const currentViewMonth = useRef<Dayjs>(dayjs());

  // Check if employee selection is enabled for this activity
  const employeeSelectionEnabled = activity.employeeSelectionEnabled && activity.assignedEmployees && activity.assignedEmployees.length > 0;

  // --- 1. Fetch Monthly Availability (Green/Red dots on calendar) ---
  const fetchMonthAvailability = async (date: Dayjs, participantCount: number) => {
    try {
      setLoadingMonth(true);
      // Assuming your backend has an endpoint that returns a list of available date strings ['2023-10-01', ...]
      // If you don't have this endpoint, you will need to create it for this feature to work efficiently.
      const response = await activityService.getMonthlyAvailability(
        activity.id,
        date.format('YYYY-MM-DD'),
        participantCount
      );
      
      // Convert array to Set for O(1) lookup in shouldDisableDate
      setAvailableDates(new Set(response.data));
    } catch (error) {
      console.error("Failed to fetch month availability", error);
      // Optional: don't block the user, maybe allow all dates or show error
    } finally {
      setLoadingMonth(false);
    }
  };

  // --- 2. Fetch Time Slots (Specific times for one day) ---
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
      console.log(timeSlots);
      setLoadingSlots(false);
    }
  };

  // Debounce both fetches to prevent API spamming when typing participants
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRefreshData = useCallback(
    debounce((date: Dayjs, participantCount: number) => {
      // Refresh time slots for the selected day
      fetchTimeSlots(date, participantCount);
      // Refresh availability for the whole month (in case participant count changed capacity)
      fetchMonthAvailability(currentViewMonth.current, participantCount);
    }, 500),
    [activity.id]
  );

  // Initial Load & Date Change
  useEffect(() => {
    if (open && selectedDate) {
      currentViewMonth.current = selectedDate; // Sync view ref
      fetchMonthAvailability(selectedDate, participants);
      fetchTimeSlots(selectedDate, participants);
    }
  }, [open, selectedDate, activity.id]); 
  // removed participants from here to handle it via the debounced effect below

  // Handle Participant Changes (Debounced)
  useEffect(() => {
    if (selectedDate && open) {
      debouncedRefreshData(selectedDate, participants);
    }
    return () => {
      debouncedRefreshData.cancel();
    };
  }, [participants, open, debouncedRefreshData, selectedDate]);


  // --- Event Handlers ---

  const handleMonthChange = (date: Dayjs) => {
    currentViewMonth.current = date;
    fetchMonthAvailability(date, participants);
  };

  const shouldDisableDate = (date: Dayjs) => {
    // 1. Disable past dates or dates outside min/max range (handled by minDate/maxDate prop usually, but good to double check)
    const isBeforeMin = date.isBefore(dayjs().add(1, 'day'), 'day');
    if (isBeforeMin) return true;

    // 2. If we are currently loading the month, maybe don't disable yet (or disable all)
    // It's usually better to let them click and find out if data is stale, 
    // but here we check our Set.
    
    // 3. Check if the date string exists in our Set of available dates
    const dateString = date.format('YYYY-MM-DD');
    return !availableDates.has(dateString);
  };

  const handleParticipantsChange = (value: number) => {
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
        employeeId: selectedEmployeeId || undefined,
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
    setSelectedEmployeeId(null);
    setTimeSlots([]);
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
        {/* ... Activity Info Section (Unchanged) ... */}
        
        <Grid container spacing={3}>
          {/* Date Selection */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              {t('booking.selectDate')}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                onMonthChange={handleMonthChange} // Trigger fetch on month switch
                shouldDisableDate={shouldDisableDate} // The magic logic
                minDate={dayjs().add(1, 'day')}
                maxDate={dayjs().add(3, 'month')}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    helperText: loadingMonth ? t('booking.checkingAvailability') : undefined 
                  },
                  // Optional: Add a loading indicator to the calendar day
                  day: {
                    sx: {
                      // You can add custom styles for enabled days here if needed
                    }
                  }
                }}
                disabled={loading}
                loading={loadingMonth}
              />
            </LocalizationProvider>
          </Grid>

          {/* ... Rest of the component (Participants, Time Slots, Notes, etc.) ... */}
          <Grid size={{ xs: 12, md: 6 }}>
             {/* Same as before */}
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
          </Grid>

          {/* Employee Selection */}
          {employeeSelectionEnabled && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                {t('booking.selectEmployee')}
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="employee-select-label">{t('booking.selectEmployeeLabel')}</InputLabel>
                <Select
                  labelId="employee-select-label"
                  value={selectedEmployeeId || ''}
                  onChange={(e) => setSelectedEmployeeId(e.target.value as number)}
                  label={t('booking.selectEmployeeLabel')}
                  disabled={loading}
                  startAdornment={<PersonIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="">
                    <em>{t('booking.anyEmployee')}</em>
                  </MenuItem>
                  {activity.assignedEmployees?.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* ... Time Slots Grid (Same as before) ... */}
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
                <Alert severity="info" sx={{ mt: 2 }} icon={<ScheduleIcon />}>
                  {t('booking.availabilityBasedOnParticipants', { count: participants })}
                </Alert>
              </>
            )}
          </Grid>

          {/* ... Notes, Price Summary, Actions (Same as before) ... */}
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