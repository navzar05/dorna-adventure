// src/components/admin/EmployeeForm.tsx
import { useState, useEffect } from 'react'; // Added useEffect to reset form when opening
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Employee } from '../types/employee';
import { MuiTelInput } from 'mui-tel-input';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  employee?: Employee | null;
}

export default function EmployeeForm({ open, onClose, onSave, employee }: EmployeeFormProps) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    enabled: true,
  });
  
  const [loading, setLoading] = useState(false);

  // Reset/Populate form when dialog opens or employee prop changes
  useEffect(() => {
    if (open) {
      setFormData({
        username: employee?.username || '',
        email: employee?.email || '',
        password: '', // Password always starts empty
        firstName: employee?.firstName || '',
        lastName: employee?.lastName || '',
        phoneNumber: employee?.phoneNumber || '',
        enabled: employee?.enabled ?? true,
      });
    }
  }, [open, employee]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (newPhone: string) => {
    setFormData(prev => ({ ...prev, phoneNumber: newPhone }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {employee ? t('admin.employees.edit') : t('admin.employees.add')}
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('admin.employees.username')}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            fullWidth
            disabled={!!employee}
            helperText={employee ? t('admin.employees.usernameHelper') : ''}
          />

          {!employee && (
            <TextField
              label={t('admin.employees.password')}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
            />
          )}

          <TextField
            label={t('admin.employees.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('admin.employees.firstName')}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('admin.employees.lastName')}
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              fullWidth
            />
          </Box>

          {/* FIXED MuiTelInput Implementation */}
          <MuiTelInput
            label={t('admin.employees.phoneNumber')}
            value={formData.phoneNumber}
            onChange={handlePhoneChange} // Use the wrapper function
            defaultCountry="RO" // Optional: Set default country to Romania
            required
            fullWidth
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
            }
            label={t('admin.employees.enabled')}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('admin.cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? t('common.loading') : t('admin.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}