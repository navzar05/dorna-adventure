/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/employee/MyWorkHours.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
import { workHourRequestService } from '../../services/workHourRequestService';
import type { EmployeeWorkHour, WorkHourRequest, WorkHourRequestCreate } from '../../types/workHourRequest';

export default function MyWorkHours() {
  const { t } = useTranslation();
  const [workHours, setWorkHours] = useState<EmployeeWorkHour[]>([]);
  const [requests, setRequests] = useState<WorkHourRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  
  const [formData, setFormData] = useState<WorkHourRequestCreate>({
    workDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Update formData when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        workDate: selectedDate.format('YYYY-MM-DD')
      }));
    }
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hoursRes, requestsRes] = await Promise.all([
        workHourRequestService.getMyWorkHours(),
        workHourRequestService.getMyRequests(),
      ]);
      setWorkHours(hoursRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('workHours.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    // Validate date is not in the past
    if (dayjs(formData.workDate).isBefore(dayjs(), 'day')) {
      toast.error(t('workHours.cannotRequestPastDate'));
      return;
    }

    try {
      await workHourRequestService.createRequest(formData);
      toast.success(t('workHours.requestCreated'));
      setDialogOpen(false);
      fetchData();
      // Reset form to tomorrow
      setSelectedDate(dayjs().add(1, 'day'));
      setFormData({
        workDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        notes: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('workHours.requestError'));
    }
  };

  const handleCancelRequest = async (id: number) => {
    if (window.confirm(t('workHours.confirmCancelRequest'))) {
      try {
        await workHourRequestService.cancelRequest(id);
        toast.success(t('workHours.requestCancelled'));
        fetchData();
      } catch {
        toast.error(t('workHours.cancelError'));
      }
    }
  };

  const handleDeleteWorkHour = async (id: number, date: string) => {
    if (window.confirm(t('workHours.confirmDeleteWorkHour', { date }))) {
      try {
        await workHourRequestService.deleteMyWorkHour(id);
        toast.success(t('workHours.workHourDeleted'));
        fetchData();
      } catch {
        toast.error(t('workHours.deleteError'));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return <ApprovedIcon fontSize="small" />;
    case 'REJECTED':
      return <RejectedIcon fontSize="small" />;
    case 'PENDING':
      return <PendingIcon fontSize="small" />;
    default:
      return undefined;
  }
};

  // Group work hours by month
  const groupedWorkHours = workHours.reduce((acc, hour) => {
    const monthKey = dayjs(hour.workDate).format('YYYY-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(hour);
    return acc;
  }, {} as Record<string, EmployeeWorkHour[]>);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{p: 2}}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {t('workHours.myWorkHours')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          {t('workHours.requestAvailability')}
        </Button>
      </Box>

      {/* Current Work Hours */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon />
          {t('workHours.approvedSchedule')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {workHours.length === 0 ? (
          <Alert severity="info">{t('workHours.noWorkHours')}</Alert>
        ) : (
          <Box>
            {Object.entries(groupedWorkHours)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([monthKey, hours]) => (
                <Box key={monthKey} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
                    {dayjs(monthKey).format('MMMM YYYY')}
                  </Typography>
                  <Grid container spacing={2}>
                    {hours
                      .sort((a, b) => a.workDate.localeCompare(b.workDate))
                      .map((hour) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={hour.id}>
                          <Card variant="outlined" sx={{
                            bgcolor: hour.isAvailable ? 'success.lighter' : 'action.hover',
                            borderColor: hour.isAvailable ? 'success.main' : 'divider'
                          }}>
                            <CardContent>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                    <CalendarIcon fontSize="small" color="primary" />
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      {dayjs(hour.workDate).format('ddd, MMM D, YYYY')}
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteWorkHour(hour.id, dayjs(hour.workDate).format('MMM D, YYYY'))}
                                    sx={{ ml: 1 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                {hour.isAvailable ? (
                                  <Typography variant="body2" color="text.secondary">
                                    {hour.startTime} - {hour.endTime}
                                  </Typography>
                                ) : (
                                  <Chip
                                    label={t('workHours.notAvailable')}
                                    size="small"
                                    color="default"
                                  />
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              ))}
          </Box>
        )}
      </Paper>

      {/* Pending Requests */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('workHours.myRequests')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {requests.length === 0 ? (
          <Alert severity="info">{t('workHours.noRequests')}</Alert>
        ) : (
          <Grid container spacing={2}>
            {requests
              .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
              .map((request) => (
                <Grid size={{ xs: 12 }} key={request.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarIcon fontSize="small" color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {dayjs(request.workDate).format('dddd, MMMM D, YYYY')}
                            </Typography>
                            <Chip
                              label={t(`workHours.status.${request.status.toLowerCase()}`)}
                              color={getStatusColor(request.status)}
                              size="small"
                              {...(getStatusIcon(request.status) && { icon: getStatusIcon(request.status) })}
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary">
                            {request.isAvailable ? (
                              <>
                                {t('workHours.hours')}: {request.startTime} - {request.endTime}
                              </>
                            ) : (
                              t('workHours.requestedNotAvailable')
                            )}
                          </Typography>
                          
                          {request.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {t('workHours.notes')}: {request.notes}
                            </Typography>
                          )}
                          
                          {request.rejectionReason && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                <strong>{t('workHours.rejectionReason')}:</strong> {request.rejectionReason}
                              </Typography>
                            </Alert>
                          )}
                          
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {t('workHours.requestedAt')}: {new Date(request.requestedAt).toLocaleString()}
                          </Typography>
                        </Box>
                        
                        {request.status === 'PENDING' && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleCancelRequest(request.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        )}
      </Paper>

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('workHours.newAvailabilityRequest')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <DatePicker
              label={t('workHours.date')}
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={dayjs().add(1, 'day')}
              maxDate={dayjs().add(3, 'month')}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  helperText: t('workHours.selectFutureDate')
                } 
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
              }
              label={t('workHours.availableThisDay')}
            />

            {formData.isAvailable && (
              <>
                <TextField
                  label={t('workHours.startTime')}
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label={t('workHours.endTime')}
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}

            <TextField
              label={t('workHours.notes')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder={t('workHours.notesPlaceholder')}
            />

            <Alert severity="info">
              {t('workHours.requestInfo')}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmitRequest} variant="contained">
            {t('workHours.submitRequest')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}