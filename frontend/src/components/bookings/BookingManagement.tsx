// src/components/admin/BookingManagement.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  InputLabel,
  Alert,
  TextField,
  Grid,
  CircularProgress,
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  CheckCircle as ConfirmIcon,
  Cancel as RejectIcon,
  SwapHoriz as ChangeEmployeeIcon,
  Schedule as DeadlineIcon,
  Add as AddIcon,
  PersonOff as GuestIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import { bookingService } from '../../services/bookingService';
import { employeeService } from '../../services/employeeService';
import { activityService } from '../../services/activityService';
import type { Booking, TimeSlot } from '../../types/booking';
import type { Employee, EmployeeSwapOptions } from '../../types/employee';
import type { Activity } from '../../types/activity';
import { formatTimeUntil } from '../../utils/dateUtils';
import i18n from '../../i18n';
import { MuiTelInput } from 'mui-tel-input';
import EmployeeSwapDialog from './EmployeeSwapDialog';

export default function BookingManagement() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [changeEmployeeDialogOpen, setChangeEmployeeDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  // Create booking dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bookingType, setBookingType] = useState<'guest' | 'registered'>('guest');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Guest info
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapOptions, setSwapOptions] = useState<EmployeeSwapOptions | null>(null);
  const [swapping, setSwapping] = useState(false);



  useEffect(() => {
    fetchBookings();
    fetchEmployees();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedActivity && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedActivity, selectedDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getAllBookings();
      setBookings(response.data);
    } catch {
      toast.error(t('admin.bookings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAllEmployees();
      setEmployees(response.data.filter(emp => emp.enabled));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await activityService.getAllActivities();
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedActivity || !selectedDate) return;

    try {
      setLoadingSlots(true);
      const response = await bookingService.getAvailableTimeSlots(
        selectedActivity.id,
        selectedDate.format('YYYY-MM-DD')
      );
      setTimeSlots(response.data);
      setSelectedTime(null);
    } catch {
      toast.error(t('booking.errors.loadSlotsFailed'));
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    resetCreateForm();
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    resetCreateForm();
  };

  const handleChangeEmployee = async () => {
  if (!selectedBooking || !selectedEmployeeId) return;

  try {
    // Get swap options
    const swapOptionsResponse = await employeeService.getEmployeeSwapOptions(
      selectedBooking.id,
      selectedEmployeeId
    );
    
    const options = swapOptionsResponse.data;

    // If swap is needed and possible, show swap dialog
    if (options.hasCompatibleBookings) {
      setSwapOptions(options);
      setSwapDialogOpen(true);
      return;
    }

    // If swap is needed but not possible, show error
    if (!options.hasCompatibleBookings && options.reason !== "No conflicting bookings - direct assignment possible") {
      toast.error(options.reason || t('admin.bookings.employeeChangeError'));
      return;
    }

    // No swap needed, proceed with direct assignment
    await bookingService.updateBookingEmployee(selectedBooking.id, selectedEmployeeId);
    toast.success(t('admin.bookings.employeeChanged'));
    setChangeEmployeeDialogOpen(false);
    fetchBookings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.error(error.response?.data?.error || t('admin.bookings.employeeChangeError'));
  }
};

// Update swap confirmation handler
const handleConfirmSwap = async (selectedBookingId: number) => {
  if (!selectedBooking) return;

  try {
    setSwapping(true);
    await employeeService.swapEmployees(
      selectedBooking.id,
      selectedBookingId
    );
    toast.success(t('admin.bookings.employeesSwapped'));
    setSwapDialogOpen(false);
    setChangeEmployeeDialogOpen(false);
    setSwapOptions(null);
    fetchBookings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.error(error.response?.data?.error || t('admin.bookings.swapError'));
  } finally {
    setSwapping(false);
  }
};


  const resetCreateForm = () => {
    setBookingType('guest');
    setSelectedActivity(null);
    setSelectedDate(dayjs().add(1, 'day'));
    setSelectedTime(null);
    setParticipants(1);
    setNotes('');
    setTimeSlots([]);
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
  };

  const handleCreateBooking = async () => {
    if (!selectedActivity || !selectedDate || !selectedTime) {
      toast.error(t('booking.errors.selectDateTime'));
      return;
    }

    if (bookingType === 'guest') {
      if (!guestName.trim() || !guestPhone.trim()) {
        toast.error(t('admin.bookings.guestInfoRequired'));
        return;
      }
    }

    try {
      setCreatingBooking(true);
      
      await bookingService.createGuestBooking({
        activityId: selectedActivity.id,
        bookingDate: selectedDate.format('YYYY-MM-DD'),
        startTime: selectedTime,
        numberOfParticipants: participants,
        notes: notes || undefined,
        guestName: guestName,
        guestPhone: guestPhone,
        guestEmail: guestEmail || undefined,
      });

      toast.success(t('admin.bookings.bookingCreated'));
      handleCloseCreateDialog();
      fetchBookings();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('booking.errors.bookingFailed'));
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleConfirmBooking = async (id: number) => {
    try {
      await bookingService.updateBookingStatus(id, 'CONFIRMED');
      toast.success(t('admin.bookings.confirmed'));
      fetchBookings();
    } catch {
      toast.error(t('admin.bookings.confirmError'));
    }
  };

  const handleRejectBooking = async (id: number) => {
    if (window.confirm(t('admin.bookings.confirmReject'))) {
      try {
        await bookingService.updateBookingStatus(id, 'CANCELLED');
        toast.success(t('admin.bookings.rejected'));
        fetchBookings();
      } catch {
        toast.error(t('admin.bookings.rejectError'));
      }
    }
  };

  const handleOpenChangeEmployee = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedEmployeeId(booking.employeeId);
    setChangeEmployeeDialogOpen(true);
  };


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

  const getPaymentDeadlineText = (booking: Booking) => {
    if (!booking.paymentDeadline || booking.paymentStatus !== 'UNPAID') {
      return null;
    }

    const deadline = dayjs(booking.paymentDeadline);
    const now = dayjs();
    const isExpired = now.isAfter(deadline);

    if (isExpired) {
      return {
        text: t('admin.bookings.paymentExpired'),
        color: 'error' as const,
      };
    }

    const hoursLeft = deadline.diff(now, 'hour', true);
    const timeText = formatTimeUntil(booking.paymentDeadline, i18n.language);

    if (hoursLeft < 1) {
      return {
        text: timeText,
        color: 'error' as const,
      };
    } else if (hoursLeft < 6) {
      return {
        text: timeText,
        color: 'warning' as const,
      };
    }

    return {
      text: timeText,
      color: 'info' as const,
    };
  };

  const getCustomerName = (booking: Booking) => {
    if (booking.isGuestBooking) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <GuestIcon fontSize="small" color="action" />
          {booking.guestName}
        </Box>
      );
    }
    return booking.userName;
  };

  const columns: GridColDef<Booking>[] = [
    { 
      field: 'activityName', 
      headerName: t('admin.bookings.activityName'), 
      flex: 1, 
      minWidth: 200 
    },
    { 
      field: 'userName', 
      headerName: t('admin.bookings.customerName'), 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => getCustomerName(params.row)
    },
    { 
      field: 'employeeName', 
      headerName: t('admin.bookings.employeeName'), 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => params.value || t('admin.bookings.noEmployee')
    },
    { 
      field: 'bookingDate', 
      headerName: t('admin.bookings.date'), 
      width: 120 
    },
    { 
      field: 'startTime', 
      headerName: t('admin.bookings.time'), 
      width: 100,
      valueGetter: (_params, row) => `${row.startTime} - ${row.endTime}`
    },
    { 
      field: 'numberOfParticipants', 
      headerName: t('admin.bookings.participants'), 
      width: 100,
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'totalPrice', 
      headerName: t('admin.bookings.totalPrice'), 
      width: 100,
      valueFormatter: (params) => `RON ${params}`
    },
    { 
      field: 'status', 
      headerName: t('admin.bookings.status'), 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={t(`booking.status.${params.value.toLowerCase()}`)} 
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    { 
      field: 'paymentStatus', 
      headerName: t('admin.bookings.paymentStatus'), 
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Chip 
            label={t(`payment.status.${params.value.toLowerCase()}`)} 
            color={getPaymentStatusColor(params.value)}
            size="small"
          />
          {(() => {
            const deadlineInfo = getPaymentDeadlineText(params.row);
            if (deadlineInfo) {
              return (
                <Chip
                  icon={<DeadlineIcon />}
                  label={deadlineInfo.text}
                  color={deadlineInfo.color}
                  size="small"
                  variant="outlined"
                />
              );
            }
            return null;
          })()}
        </Box>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('admin.dataGrid.actions'),
      width: 150,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            key="change-employee"
            icon={<ChangeEmployeeIcon />}
            label={t('admin.bookings.changeEmployee')}
            onClick={() => handleOpenChangeEmployee(params.row)}
            disabled={params.row.status === 'CANCELLED' || params.row.status === 'COMPLETED'}
          />,
        ];

        if (params.row.status === 'PENDING') {
          actions.push(
            <GridActionsCellItem
              key="confirm"
              icon={<ConfirmIcon />}
              label={t('admin.bookings.confirm')}
              onClick={() => handleConfirmBooking(params.row.id)}
              showInMenu
            />,
            <GridActionsCellItem
              key="reject"
              icon={<RejectIcon />}
              label={t('admin.bookings.reject')}
              onClick={() => handleRejectBooking(params.row.id)}
              showInMenu
            />
          );
        }

        return actions;
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {t('admin.bookings.title')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            {t('admin.bookings.createBooking')}
          </Button>
          <Button variant="outlined" onClick={fetchBookings}>
            {t('common.refresh')}
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        {t('admin.bookings.approvalInfo')}
      </Alert>

      <DataGrid
        rows={bookings}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          sorting: {
            sortModel: [{ field: 'bookingDate', sort: 'desc' }],
          },
        }}
        disableRowSelectionOnClick
        autoHeight
        getRowClassName={(params) => 
          params.row.status === 'PENDING' ? 'pending-row' : ''
        }
        sx={{
          '& .pending-row': {
            bgcolor: 'action.hover',
          },
        }}
      />

      {/* Create Booking Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('admin.bookings.createBooking')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Booking Type Toggle - REMOVED since we only do guest bookings */}

            {/* Guest Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                {t('admin.bookings.customerInfo')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('admin.bookings.guestName')}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ion Popescu"
                fullWidth
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <MuiTelInput
                label={t('admin.bookings.guestPhone')}
                value={guestPhone}
                onChange={setGuestPhone}
                defaultCountry="RO"
                preferredCountries={['RO', 'US', 'GB']}
                placeholder="+40 XXX XXX XXX"
                fullWidth
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label={t('admin.bookings.guestEmail')}
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="email@example.com"
                type="email"
                fullWidth
              />
            </Grid>

            {/* Activity Selection */}
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                {t('admin.bookings.bookingDetails')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>{t('admin.bookings.selectActivity')}</InputLabel>
                <Select
                  value={selectedActivity?.id || ''}
                  onChange={(e) => {
                    const activity = activities.find(a => a.id === Number(e.target.value));
                    setSelectedActivity(activity || null);
                    if (activity) {
                      setParticipants(activity.minParticipants);
                    }
                  }}
                  label={t('admin.bookings.selectActivity')}
                >
                  {activities.map((activity) => (
                    <MenuItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Selection */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={t('booking.selectDate')}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={dayjs().add(1, 'day')}
                  maxDate={dayjs().add(3, 'month')}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Participants */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="number"
                label={t('booking.participants')}
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
                inputProps={{
                  min: selectedActivity?.minParticipants || 1,
                  max: selectedActivity?.maxParticipants || 100,
                }}
                helperText={
                  selectedActivity 
                    ? `${selectedActivity.minParticipants}-${selectedActivity.maxParticipants} ${t('booking.participantsRange')}`
                    : undefined
                }
                fullWidth
                required
                disabled={!selectedActivity}
              />
            </Grid>

            {/* Time Slots */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('booking.selectTime')} *
              </Typography>
              {!selectedActivity || !selectedDate ? (
                <Alert severity="info">{t('admin.bookings.selectActivityDate')}</Alert>
              ) : loadingSlots ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : timeSlots.length === 0 ? (
                <Alert severity="warning">{t('booking.noSlotsAvailable')}</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {timeSlots.map((slot) => (
                    <Chip
                      key={slot.startTime}
                      icon={<DeadlineIcon />}
                      label={`${slot.startTime} - ${slot.endTime}`}
                      onClick={() => slot.available && setSelectedTime(slot.startTime)}
                      color={selectedTime === slot.startTime ? 'primary' : 'default'}
                      variant={selectedTime === slot.startTime ? 'filled' : 'outlined'}
                      disabled={!slot.available}
                      sx={{ cursor: slot.available ? 'pointer' : 'not-allowed' }}
                    />
                  ))}
                </Box>
              )}
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                multiline
                rows={3}
                label={t('booking.notes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('booking.notesPlaceholder')}
                fullWidth
              />
            </Grid>

            {/* Price Summary */}
            {selectedActivity && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    {t('booking.priceSummary')}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{t('booking.totalPrice')}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      RON {(selectedActivity.pricePerPerson * participants).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={creatingBooking}>
            {t('admin.cancel')}
          </Button>
          <Button 
            onClick={handleCreateBooking}
            variant="contained"
            disabled={
              !selectedActivity || 
              !selectedDate || 
              !selectedTime || 
              !guestName.trim() || 
              !guestPhone.trim() || 
              creatingBooking
            }
          >
            {creatingBooking ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {t('booking.creating')}
              </>
            ) : (
              t('admin.bookings.createBookingButton')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Employee Dialog */}
      <Dialog 
        open={changeEmployeeDialogOpen} 
        onClose={() => setChangeEmployeeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('admin.bookings.changeEmployee')}</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{t('admin.bookings.activityName')}:</strong> {selectedBooking.activityName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{t('admin.bookings.date')}:</strong> {selectedBooking.bookingDate} ({selectedBooking.startTime} - {selectedBooking.endTime})
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>{t('admin.bookings.customerName')}:</strong> {
                  selectedBooking.isGuestBooking 
                    ? selectedBooking.guestName 
                    : selectedBooking.userName
                }
              </Typography>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>{t('admin.bookings.selectEmployee')}</InputLabel>
                <Select
                  value={selectedEmployeeId || ''}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  label={t('admin.bookings.selectEmployee')}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} ({employee.username})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeEmployeeDialogOpen(false)}>
            {t('admin.cancel')}
          </Button>
          <Button 
            onClick={handleChangeEmployee} 
            variant="contained"
            disabled={!selectedEmployeeId}
          >
            {t('admin.bookings.changeEmployeeButton')}
          </Button>
        </DialogActions>
      </Dialog>
      <EmployeeSwapDialog
        open={swapDialogOpen}
        onClose={() => {
          setSwapDialogOpen(false);
          setSwapOptions(null);
        }}
        onConfirm={handleConfirmSwap}
        swapOptions={swapOptions}
        loading={swapping}
      />
    </Box>
    
  );
}