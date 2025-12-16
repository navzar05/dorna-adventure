// src/components/admin/WorkHoursForm.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { workHoursService } from '../../services/workHoursService';
import type { WorkHours } from '../../types/booking';

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export default function WorkHoursForm() {
  const { t } = useTranslation();
  const [workHours, setWorkHours] = useState<Record<string, Partial<WorkHours>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkHours();
  }, []);

  const fetchWorkHours = async () => {
    try {
      const response = await workHoursService.getAllWorkHours();
      const hoursMap: Record<string, Partial<WorkHours>> = {};
      
      response.data.forEach(wh => {
        hoursMap[wh.dayOfWeek] = wh;
      });

      // Initialize missing days
      DAYS_OF_WEEK.forEach(day => {
        if (!hoursMap[day]) {
          hoursMap[day] = {
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            active: false,
          };
        }
      });

      setWorkHours(hoursMap);
    } catch {
      toast.error(t('admin.workHours.loadError'));
    }
  };

  // New function to save all days at once
  const handleSaveAll = async () => {
    try {
      setLoading(true);
      
      // Create an array of promises to save each day
      const promises = DAYS_OF_WEEK.map(day => {
        const dayData = workHours[day];
        if (dayData) {
          return workHoursService.createOrUpdateWorkHours(dayData);
        }
        return Promise.resolve();
      });

      // Wait for all requests to finish
      await Promise.all(promises);
      
      toast.success(t('admin.workHours.saved')); // Ensure you have a generic "Saved successfully" key
      fetchWorkHours(); // Refresh data
    } catch (error) {
      console.error(error);
      toast.error(t('admin.workHours.saveError'));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (day: string, field: keyof WorkHours, value: any) => {
    setWorkHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            {t('admin.workHours.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.workHours.description')}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {DAYS_OF_WEEK.map((day) => {
          const hours = workHours[day] || {};
          return (
            <Grid size={{ xs: 12, md: 6 }} key={day}>
              <Card variant="outlined" sx={{ 
                height: '100%',
                opacity: hours.active ? 1 : 0.7,
                transition: 'opacity 0.2s'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} color={hours.active ? 'text.primary' : 'text.disabled'}>
                      {t(`admin.workHours.days.${day.toLowerCase()}`)}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={hours.active || false}
                          onChange={(e) => handleChange(day, 'active', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={t('admin.workHours.open')}
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label={t('admin.workHours.startTime')}
                      type="time"
                      value={hours.startTime || '09:00'}
                      onChange={(e) => handleChange(day, 'startTime', e.target.value)}
                      disabled={!hours.active}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label={t('admin.workHours.endTime')}
                      type="time"
                      value={hours.endTime || '17:00'}
                      onChange={(e) => handleChange(day, 'endTime', e.target.value)}
                      disabled={!hours.active}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  {/* Individual Save Button Removed Here */}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Global Save Button Area */}
      <Box 
        sx={{ 
          position: 'sticky', 
          bottom: 20, 
          display: 'flex', 
          justifyContent: 'flex-end',
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          zIndex: 10
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveAll}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          sx={{ minWidth: 150 }}
        >
          {t('admin.save')}
        </Button>
      </Box>
    </Box>
  );
}