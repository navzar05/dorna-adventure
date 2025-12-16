// src/components/admin/EmployeeSwapDialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  PersonOff as GuestIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { EmployeeSwapOptions } from '../../types/employee';

interface EmployeeSwapDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedBookingId: number) => void;
  swapOptions: EmployeeSwapOptions | null;
  loading?: boolean;
}

export default function EmployeeSwapDialog({
  open,
  onClose,
  onConfirm,
  swapOptions,
  loading = false,
}: EmployeeSwapDialogProps) {
  const { t } = useTranslation();
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedBookingId) {
      onConfirm(selectedBookingId);
    }
  };

  const handleClose = () => {
    setSelectedBookingId(null);
    onClose();
  };

  if (!swapOptions) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapIcon color="primary" />
          <Typography variant="h6">
            {t('admin.bookings.swapEmployees')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {!swapOptions.hasCompatibleBookings ? (
          <Alert severity="error" icon={<WarningIcon />}>
            <Typography variant="body2" fontWeight={600}>
              {t('admin.bookings.swapNotPossible')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {swapOptions.reason}
            </Typography>
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              {t('admin.bookings.selectBookingToSwap')}
            </Alert>

            {/* Booking Context */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                {t('admin.bookings.bookingDetails')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>{t('admin.bookings.location')}:</strong> {swapOptions.location}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>{t('admin.bookings.category')}:</strong> {swapOptions.category}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>{t('admin.bookings.time')}:</strong> {swapOptions.startTime} - {swapOptions.endTime}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Divider />

            {/* Employee Swap Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
              <Chip 
                label={swapOptions.currentEmployeeName} 
                color="default"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <SwapIcon color="primary" />
              <Chip 
                label={swapOptions.newEmployeeName} 
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Divider />

            {/* Compatible Bookings List */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                {t('admin.bookings.selectCompatibleBooking')}
              </Typography>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                {t('admin.bookings.compatibleBookingsHelp')}
              </Typography>

              <RadioGroup
                value={selectedBookingId?.toString() || ''}
                onChange={(e) => setSelectedBookingId(Number(e.target.value))}
              >
                <List sx={{ mt: 1 }}>
                  {swapOptions.compatibleBookings.map((booking) => (
                    <ListItem
                      key={booking.bookingId}
                      disablePadding
                      sx={{ mb: 1 }}
                    >
                      <Paper
                        variant="outlined"
                        sx={{
                          width: '100%',
                          border: selectedBookingId === booking.bookingId ? 2 : 1,
                          borderColor: selectedBookingId === booking.bookingId ? 'primary.main' : 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemButton
                          onClick={() => setSelectedBookingId(booking.bookingId)}
                          sx={{ py: 2 }}
                        >
                          <FormControlLabel
                            value={booking.bookingId.toString()}
                            control={<Radio />}
                            label=""
                            sx={{ mr: 2 }}
                          />
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {booking.activityName}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={`${booking.startTime} - ${booking.endTime}`}
                                  icon={<ScheduleIcon />}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {booking.isGuestBooking ? (
                                    <GuestIcon fontSize="small" />
                                  ) : (
                                    <PersonIcon fontSize="small" />
                                  )}
                                  <Typography variant="body2">
                                    {booking.customerName}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PeopleIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {booking.numberOfParticipants} {t('booking.participants').toLowerCase()}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </Paper>
                    </ListItem>
                  ))}
                </List>
              </RadioGroup>
            </Box>

            {/* Swap Preview */}
            {selectedBookingId && (
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  {t('admin.bookings.swapPreview')}
                </Typography>
                <Typography variant="body2">
                  • <strong>{swapOptions.currentEmployeeName}</strong> {t('admin.bookings.willTakeOver')} <strong>
                    {swapOptions.compatibleBookings.find(b => b.bookingId === selectedBookingId)?.activityName}
                  </strong>
                </Typography>
                <Typography variant="body2">
                  • <strong>{swapOptions.newEmployeeName}</strong> {t('admin.bookings.willTakeOver')} {t('admin.bookings.currentBooking')}
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('admin.cancel')}
        </Button>
        {swapOptions.hasCompatibleBookings && (
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={!selectedBookingId || loading}
            startIcon={<SwapIcon />}
          >
            {loading ? t('common.loading') : t('admin.bookings.confirmSwap')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}