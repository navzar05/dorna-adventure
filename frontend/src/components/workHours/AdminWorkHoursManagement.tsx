/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/AdminWorkHoursManagement.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
import { workHourRequestService } from '../../services/workHourRequestService';
import { employeeService } from '../../services/employeeService';
import type { WorkHourRequest, EmployeeWorkHour } from '../../types/workHourRequest';
import type { Employee } from '../../types/employee';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminWorkHoursManagement() {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<WorkHourRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [employeeWorkHours, setEmployeeWorkHours] = useState<EmployeeWorkHour[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WorkHourRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [addFormData, setAddFormData] = useState({
    workDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeWorkHours(selectedEmployee);
    }
  }, [selectedEmployee]);

  // Update addFormData when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setAddFormData(prev => ({
        ...prev,
        workDate: selectedDate.format('YYYY-MM-DD')
      }));
    }
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, employeesRes] = await Promise.all([
        workHourRequestService.getPendingRequests(),
        employeeService.getAllEmployees(),
      ]);
      setRequests(requestsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('workHours.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeWorkHours = async (employeeId: number) => {
    try {
      const response = await workHourRequestService.getEmployeeWorkHours(employeeId);
      setEmployeeWorkHours(response.data);
    } catch (error) {
      console.error('Error fetching employee work hours:', error);
      toast.error(t('workHours.loadError'));
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      await workHourRequestService.approveRequest(id);
      toast.success(t('workHours.requestApproved'));
      fetchData();
      if (selectedEmployee) {
        fetchEmployeeWorkHours(selectedEmployee);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('workHours.approveError'));
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      await workHourRequestService.rejectRequest(selectedRequest.id, rejectReason);
      toast.success(t('workHours.requestRejected'));
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('workHours.rejectError'));
    }
  };

  const handleAddWorkHours = async () => {
    if (!selectedEmployee) return;
    
    try {
      await workHourRequestService.updateEmployeeWorkHours(selectedEmployee, addFormData);
      toast.success(t('workHours.added'));
      setAddDialogOpen(false);
      setSelectedDate(dayjs().add(1, 'day'));
      setAddFormData({
        workDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      });
      fetchEmployeeWorkHours(selectedEmployee);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('workHours.addError'));
    }
  };

  const handleDeleteWorkHour = async (id: number) => {
    if (window.confirm(t('workHours.confirmDelete'))) {
      try {
        await workHourRequestService.deleteEmployeeWorkHour(id);
        toast.success(t('workHours.deleted'));
        if (selectedEmployee) {
          fetchEmployeeWorkHours(selectedEmployee);
        }
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

  // Group work hours by month
  const groupedWorkHours = employeeWorkHours.reduce((acc, hour) => {
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
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {t('workHours.management')}
      </Typography>

      <Paper  sx={{p: 2}}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('workHours.pendingRequests')} />
          <Tab label={t('workHours.employeeSchedules')} />
        </Tabs>

        {/* Pending Requests Tab */}
        <TabPanel value={tabValue} index={0}>
          {requests.length === 0 ? (
            <Alert severity="info">{t('workHours.noPendingRequests')}</Alert>
          ) : (
            <Grid container spacing={2}>
              {requests
                .sort((a, b) => a.workDate.localeCompare(b.workDate))
                .map((request) => (
                  <Grid size={{ xs: 12 }} key={request.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {request.employeeName}
                              </Typography>
                              <Chip
                                label={t(`workHours.status.${request.status.toLowerCase()}`)}
                                color={getStatusColor(request.status)}
                                size="small"
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CalendarIcon fontSize="small" color="primary" />
                              <Typography variant="body1" fontWeight={500}>
                                {dayjs(request.workDate).format('dddd, MMMM D, YYYY')}
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary">
                              {request.isAvailable ? (
                                <>
                                  {t('workHours.requestedHours')}: {request.startTime} - {request.endTime}
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
                            
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              {t('workHours.requestedAt')}: {new Date(request.requestedAt).toLocaleString()}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<ApproveIcon />}
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              {t('workHours.approve')}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<RejectIcon />}
                              onClick={() => {
                                setSelectedRequest(request);
                                setRejectDialogOpen(true);
                              }}
                            >
                              {t('workHours.reject')}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </TabPanel>

        {/* Employee Schedules Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>{t('workHours.selectEmployee')}</InputLabel>
              <Select
                value={selectedEmployee || ''}
                label={t('workHours.selectEmployee')}
                onChange={(e) => setSelectedEmployee(Number(e.target.value))}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedEmployee && (
            <>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                >
                  {t('workHours.addAvailability')}
                </Button>
              </Box>

              {employeeWorkHours.length === 0 ? (
                <Alert severity="info">{t('workHours.noWorkHoursForEmployee')}</Alert>
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
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <CalendarIcon fontSize="small" color="primary" />
                                          <Typography variant="subtitle2" fontWeight="bold">
                                            {dayjs(hour.workDate).format('ddd, MMM D')}
                                          </Typography>
                                        </Box>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleDeleteWorkHour(hour.id)}
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
            </>
          )}
        </TabPanel>
      </Paper>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('workHours.rejectRequest')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('workHours.rejectReason')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={4}
            fullWidth
            sx={{ mt: 2 }}
            placeholder={t('workHours.rejectReasonPlaceholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleRejectRequest} color="error" variant="contained">
            {t('workHours.reject')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Work Hours Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('workHours.addAvailability')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <DatePicker
              label={t('workHours.date')}
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={dayjs()}
              maxDate={dayjs().add(3, 'month')}
              slotProps={{ textField: { fullWidth: true } }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={addFormData.isAvailable}
                  onChange={(e) => setAddFormData({ ...addFormData, isAvailable: e.target.checked })}
                />
              }
              label={t('workHours.availableThisDay')}
            />

            {addFormData.isAvailable && (
              <>
                <TextField
                  label={t('workHours.startTime')}
                  type="time"
                  value={addFormData.startTime}
                  onChange={(e) => setAddFormData({ ...addFormData, startTime: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label={t('workHours.endTime')}
                  type="time"
                  value={addFormData.endTime}
                  onChange={(e) => setAddFormData({ ...addFormData, endTime: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAddWorkHours} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}