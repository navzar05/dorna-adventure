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
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Save as SaveIcon,
  CalendarMonth as CalendarIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
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

const ALL_EMPLOYEES_ID = -1;

export default function AdminWorkHoursManagement() {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<WorkHourRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Reject Dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WorkHourRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Calendar state
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month());
  const [monthWorkHours, setMonthWorkHours] = useState<EmployeeWorkHour[]>([]);
  const [allEmployeesWorkHours, setAllEmployeesWorkHours] = useState<Record<number, EmployeeWorkHour[]>>({});
  const [selectedDates, setSelectedDates] = useState<Dayjs[]>([]);
  
  // Work hours form
  const [workHoursFormData, setWorkHoursFormData] = useState({
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEmployee && selectedEmployee !== ALL_EMPLOYEES_ID) {
      fetchMonthWorkHours(selectedEmployee, selectedYear, selectedMonth);
      setAllEmployeesWorkHours({});
    } else if (selectedEmployee === ALL_EMPLOYEES_ID) {
      fetchAllEmployeesWorkHours(selectedYear, selectedMonth);
      setMonthWorkHours([]);
    } else {
      setMonthWorkHours([]);
      setAllEmployeesWorkHours({});
      setSelectedDates([]);
    }
  }, [selectedEmployee, selectedYear, selectedMonth]);

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

  const fetchMonthWorkHours = async (employeeId: number, year: number, month: number) => {
    try {
      const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');
      
      const response = await workHourRequestService.getEmployeeWorkHoursByDateRange(
        employeeId,
        startDate,
        endDate
      );
      setMonthWorkHours(response.data);
      
      // Pre-populate form with most recent work hours
      if (response.data.length > 0) {
        const recentWorkHours = response.data
          .filter((wh: EmployeeWorkHour) => wh.isAvailable)
          .sort((a: EmployeeWorkHour, b: EmployeeWorkHour) => b.workDate.localeCompare(a.workDate))[0];
        
        if (recentWorkHours) {
          setWorkHoursFormData({
            startTime: recentWorkHours.startTime || '09:00',
            endTime: recentWorkHours.endTime || '17:00',
            isAvailable: recentWorkHours.isAvailable,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching month work hours:', error);
      setMonthWorkHours([]);
    }
  };

  const fetchAllEmployeesWorkHours = async (year: number, month: number) => {
    try {
      const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');
      
      const allWorkHours: Record<number, EmployeeWorkHour[]> = {};
      
      // Fetch work hours for each employee
      await Promise.all(
        employees.map(async (employee) => {
          try {
            const response = await workHourRequestService.getEmployeeWorkHoursByDateRange(
              employee.id,
              startDate,
              endDate
            );
            if (response.data.length > 0) {
              allWorkHours[employee.id] = response.data;
            }
          } catch (error) {
            console.error(`Error fetching work hours for employee ${employee.id}:`, error);
          }
        })
      );
      
      setAllEmployeesWorkHours(allWorkHours);
    } catch (error) {
      console.error('Error fetching all employees work hours:', error);
      setAllEmployeesWorkHours({});
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      await workHourRequestService.approveRequest(id);
      toast.success(t('workHours.requestApproved'));
      fetchData();
      if (selectedEmployee && selectedEmployee !== ALL_EMPLOYEES_ID) {
        fetchMonthWorkHours(selectedEmployee, selectedYear, selectedMonth);
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

  const handleDeleteWorkHour = async (workHourId: number) => {
    if (window.confirm(t('workHours.confirmDelete'))) {
      try {
        await workHourRequestService.deleteEmployeeWorkHour(workHourId);
        toast.success(t('workHours.deleted'));
        if (selectedEmployee && selectedEmployee !== ALL_EMPLOYEES_ID) {
          fetchMonthWorkHours(selectedEmployee, selectedYear, selectedMonth);
        }
      } catch {
        toast.error(t('workHours.deleteError'));
      }
    }
  };

  const handleDateToggle = (date: Dayjs) => {
    setSelectedDates(prev => {
      const dateStr = date.format('YYYY-MM-DD');
      const exists = prev.some(d => d.format('YYYY-MM-DD') === dateStr);
      
      if (exists) {
        return prev.filter(d => d.format('YYYY-MM-DD') !== dateStr);
      } else {
        return [...prev, date].sort((a, b) => a.valueOf() - b.valueOf());
      }
    });
  };

  const handleSelectAllDatesInMonth = () => {
    const datesInMonth = getDatesForSelectedMonth();
    setSelectedDates(datesInMonth);
  };

  const handleDeselectAllDates = () => {
    setSelectedDates([]);
  };

  const handleSaveWorkHours = async () => {
    if (selectedDates.length === 0) {
      toast.error(t('workHours.selectAtLeastOneDate'));
      return;
    }

    if (!selectedEmployee || selectedEmployee === 0) {
      toast.error(t('workHours.selectEmployeeFirst'));
      return;
    }

    setProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const bulkData = {
        workDates: selectedDates.map(d => d.format('YYYY-MM-DD')),
        startTime: workHoursFormData.isAvailable ? workHoursFormData.startTime : null,
        endTime: workHoursFormData.isAvailable ? workHoursFormData.endTime : null,
        isAvailable: workHoursFormData.isAvailable,
      };

      if (selectedEmployee === ALL_EMPLOYEES_ID) {
        // Process all employees
        for (const employee of employees) {
          try {
            await workHourRequestService.createBulkEmployeeWorkHours(employee.id, bulkData);
            successCount++;
          } catch (error) {
            console.error(`Failed for employee ${employee.id}:`, error);
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(
            t('workHours.bulkSuccess', { 
              count: successCount, 
              dates: selectedDates.length 
            })
          );
        }
        
        if (failCount > 0) {
          toast.error(t('workHours.bulkPartialError', { count: failCount }));
        }
      } else {
        // Process single employee
        await workHourRequestService.createBulkEmployeeWorkHours(selectedEmployee, bulkData);
        toast.success(t('workHours.added'));
        successCount = 1;
      }

      setSelectedDates([]);
      
      // Refresh data
      if (selectedEmployee && selectedEmployee !== ALL_EMPLOYEES_ID) {
        fetchMonthWorkHours(selectedEmployee, selectedYear, selectedMonth);
      } else if (selectedEmployee === ALL_EMPLOYEES_ID) {
        fetchAllEmployeesWorkHours(selectedYear, selectedMonth);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('workHours.addError'));
    } finally {
      setProcessing(false);
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

  // Generate years (current year + 1 year ahead)
  const getAvailableYears = () => {
    const currentYear = dayjs().year();
    return [currentYear, currentYear + 1];
  };

  // Get months for selected year
  const getAvailableMonths = () => {
    const currentDate = dayjs();
    const currentYear = currentDate.year();
    const currentMonth = currentDate.month();
    
    if (selectedYear === currentYear) {
      return Array.from({ length: 12 - currentMonth }, (_, i) => currentMonth + i);
    } else if (selectedYear > currentYear) {
      return Array.from({ length: 12 }, (_, i) => i);
    }
    return [];
  };

  // Get dates for selected month
  const getDatesForSelectedMonth = () => {
    const startOfMonth = dayjs().year(selectedYear).month(selectedMonth).startOf('month');
    const endOfMonth = startOfMonth.endOf('month');
    const today = dayjs().startOf('day');
    
    const dates: Dayjs[] = [];
    let currentDate = startOfMonth;
    
    while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth, 'day')) {
      if (currentDate.isAfter(today) || currentDate.isSame(today, 'day')) {
        dates.push(currentDate);
      }
      currentDate = currentDate.add(1, 'day');
    }
    
    return dates;
  };

  // Get work hours for a specific date (returns array for multiple shifts)
  const getWorkHoursForDate = (date: Dayjs): EmployeeWorkHour[] => {
    if (selectedEmployee === ALL_EMPLOYEES_ID) {
      // Return all work hours from all employees for this date
      const allHours: EmployeeWorkHour[] = [];
      Object.values(allEmployeesWorkHours).forEach(employeeHours => {
        const hoursForDate = employeeHours.filter(wh => wh.workDate === date.format('YYYY-MM-DD'));
        allHours.push(...hoursForDate);
      });
      return allHours;
    } else {
      return monthWorkHours.filter(wh => wh.workDate === date.format('YYYY-MM-DD'));
    }
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId: number): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  // Render calendar view
  const renderCalendarView = () => {
    const datesInMonth = getDatesForSelectedMonth();
    const firstDayOfMonth = dayjs().year(selectedYear).month(selectedMonth).startOf('month');
    const startDayOfWeek = firstDayOfMonth.day();
    
    const weeks: (Dayjs | null)[][] = [[]];
    let currentWeek = 0;
    
    for (let i = 0; i < startDayOfWeek; i++) {
      weeks[currentWeek].push(null);
    }
    
    datesInMonth.forEach(date => {
      if (weeks[currentWeek].length === 7) {
        currentWeek++;
        weeks[currentWeek] = [];
      }
      weeks[currentWeek].push(date);
    });
    
    while (weeks[currentWeek].length < 7) {
      weeks[currentWeek].push(null);
    }
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <Box>
        <Grid container spacing={0.5} sx={{ mb: 1 }}>
          {weekDays.map(day => (
            <Grid size={{ xs: 12/7 }} key={day}>
              <Typography 
                variant="caption" 
                align="center" 
                display="block"
                fontWeight="bold"
                color="text.secondary"
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>
        
        {weeks.map((week, weekIndex) => (
          <Grid container spacing={0.5} key={weekIndex} sx={{ mb: 0.5 }}>
            {week.map((date, dayIndex) => {
              if (!date) {
                return <Grid size={{ xs: 12/7 }} key={dayIndex} />;
              }
              
              const isSelected = selectedDates.some(
                d => d.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
              );
              const existingWorkHours = getWorkHoursForDate(date);
              const hasExistingHours = existingWorkHours.length > 0;
              
              return (
                <Grid size={{ xs: 12/7 }} key={dayIndex}>
                  <Box
                    onClick={() => handleDateToggle(date)}
                    sx={{
                      minHeight: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      p: 0.5,
                      border: 1,
                      borderColor: isSelected 
                        ? 'primary.main' 
                        : hasExistingHours 
                          ? 'success.main' 
                          : 'divider',
                      borderRadius: 1,
                      bgcolor: isSelected 
                        ? 'primary.light' 
                        : hasExistingHours 
                          ? 'success.lighter' 
                          : 'background.paper',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderWidth: 2,
                        borderColor: 'primary.main',
                      }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={isSelected ? 'primary.contrastText' : 'text.primary'}
                      sx={{ mb: 0.25 }}
                    >
                      {date.date()}
                    </Typography>
                    
                    {hasExistingHours && (
                      <Box sx={{ 
                        width: '100%',
                        maxHeight: 80,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        '&::-webkit-scrollbar': { width: 3 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 1 }
                      }}>
                        {existingWorkHours.map((workHour) => (
                          <Box 
                            key={workHour.id}
                            sx={{ 
                              position: 'relative',
                              bgcolor: 'background.paper',
                              borderRadius: 0.5,
                              p: 0.25,
                              mb: 0.25,
                              fontSize: '0.65rem',
                            }}
                          >
                            {selectedEmployee === ALL_EMPLOYEES_ID && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontSize: '0.6rem',
                                  fontWeight: 600,
                                  display: 'block',
                                  lineHeight: 1,
                                  color: 'text.primary',
                                  mb: 0.25,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={getEmployeeName(workHour.employeeId)}
                              >
                                {getEmployeeName(workHour.employeeId)}
                              </Typography>
                            )}
                            
                            {workHour.isAvailable ? (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontSize: '0.6rem',
                                  color: 'success.dark',
                                  fontWeight: 600,
                                  display: 'block',
                                  lineHeight: 1.1
                                }}
                              >
                                {workHour.startTime?.substring(0, 5)} - {workHour.endTime?.substring(0, 5)}
                              </Typography>
                            ) : (
                              <Typography 
                                variant="caption"
                                sx={{ fontSize: '0.55rem', color: 'text.secondary' }}
                              >
                                N/A
                              </Typography>
                            )}
                            
                            {selectedEmployee !== ALL_EMPLOYEES_ID && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWorkHour(workHour.id);
                                }}
                                sx={{ 
                                  position: 'absolute',
                                  top: 0,
                                  right: 0,
                                  width: 20,
                                  height: 20,
                                  padding: 0.5,
                                  color: 'error.main',
                                  bgcolor: 'background.paper',
                                  border: 1,
                                  borderColor: 'error.main',
                                  borderRadius: '50%',
                                  '&:hover': {
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    transform: 'scale(1.1)',
                                  }
                                }}
                              >
                                <ClearIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        ))}
      </Box>
    );
  };

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

      <Paper sx={{ p: 2 }}>
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
                onChange={(e) => {
                  setSelectedEmployee(Number(e.target.value));
                  setSelectedDates([]);
                }}
              >
                <MenuItem value={ALL_EMPLOYEES_ID}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" />
                    <strong>{t('workHours.allEmployees')}</strong>
                  </Box>
                </MenuItem>
                <Divider />
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      {emp.firstName} {emp.lastName} ({emp.username})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedEmployee && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              {/* Year and Month Selection */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>{t('workHours.year')}</InputLabel>
                  <Select
                    value={selectedYear}
                    label={t('workHours.year')}
                    onChange={(e) => {
                      setSelectedYear(Number(e.target.value));
                      setSelectedDates([]);
                    }}
                    disabled={processing}
                  >
                    {getAvailableYears().map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>{t('workHours.month')}</InputLabel>
                  <Select
                    value={selectedMonth}
                    label={t('workHours.month')}
                    onChange={(e) => {
                      setSelectedMonth(Number(e.target.value));
                      setSelectedDates([]);
                    }}
                    disabled={processing}
                  >
                    {getAvailableMonths().map(month => (
                      <MenuItem key={month} value={month}>
                        {dayjs().month(month).format('MMMM')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Calendar Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {dayjs().year(selectedYear).month(selectedMonth).format('MMMM YYYY')}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {selectedEmployee === ALL_EMPLOYEES_ID && Object.keys(allEmployeesWorkHours).length > 0 && (
                      <Button 
                        size="medium"
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                          setSelectedEmployee(null);
                          setAllEmployeesWorkHours({});
                          setSelectedDates([]);
                        }}
                      >
                        {t('workHours.clearView')}
                      </Button>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {selectedDates.length} {t('workHours.selected')}
                    </Typography>
                    <Button 
                      size="medium" 
                      variant="outlined"
                      onClick={handleSelectAllDatesInMonth}
                      disabled={processing}
                    >
                      {t('workHours.selectAll')}
                    </Button>
                    <Button 
                      size="medium"
                      variant="outlined"
                      onClick={handleDeselectAllDates}
                      disabled={processing}
                    >
                      {t('workHours.clear')}
                    </Button>
                  </Box>
                </Box>

                {/* Simplified Legend */}
                {(monthWorkHours.length > 0 || Object.keys(allEmployeesWorkHours).length > 0) && (
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: 'success.lighter', 
                        border: 1, 
                        borderColor: 'success.main',
                        borderRadius: 0.5 
                      }} />
                      <Typography variant="caption">
                        {t('workHours.hasSchedule')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: 'primary.light', 
                        border: 1, 
                        borderColor: 'primary.main',
                        borderRadius: 0.5 
                      }} />
                      <Typography variant="caption">
                        {t('workHours.selectedDate')}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {renderCalendarView()}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Work Hours Configuration */}
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {t('workHours.workHoursConfiguration')}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={workHoursFormData.isAvailable}
                        onChange={(e) => setWorkHoursFormData({ 
                          ...workHoursFormData, 
                          isAvailable: e.target.checked 
                        })}
                        disabled={processing}
                      />
                    }
                    label={t('workHours.availableThisDay')}
                  />

                  {workHoursFormData.isAvailable && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label={t('workHours.startTime')}
                        type="time"
                        value={workHoursFormData.startTime}
                        onChange={(e) => setWorkHoursFormData({ 
                          ...workHoursFormData, 
                          startTime: e.target.value 
                        })}
                        sx={{ width: 200 }}
                        InputLabelProps={{ shrink: true }}
                        disabled={processing}
                      />

                      <TextField
                        label={t('workHours.endTime')}
                        type="time"
                        value={workHoursFormData.endTime}
                        onChange={(e) => setWorkHoursFormData({ 
                          ...workHoursFormData, 
                          endTime: e.target.value 
                        })}
                        sx={{ width: 200 }}
                        InputLabelProps={{ shrink: true }}
                        disabled={processing}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={processing ? <CircularProgress size={20} /> : <SaveIcon />}
                      onClick={handleSaveWorkHours}
                      disabled={selectedDates.length === 0 || processing}
                    >
                      {selectedEmployee === ALL_EMPLOYEES_ID 
                        ? t('workHours.applyToAllEmployees')
                        : t('workHours.saveWorkHours')
                      }
                    </Button>
                    
                    {processing && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        {selectedEmployee === ALL_EMPLOYEES_ID 
                          ? t('workHours.processingBulkOperation')
                          : t('workHours.processing')
                        }
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
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
    </Box>
  );
}