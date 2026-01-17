/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/EmployeeForm.tsx
import { useState, useEffect } from 'react';
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
  Alert,
  FormGroup,
  FormLabel,
} from '@mui/material';
import { 
  Close as CloseIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { MuiTelInput } from 'mui-tel-input';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { Employee, TotpSetupResponse } from '../../types/employee';
import { employeeService } from '../../services/employeeService';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  employee?: Employee | null;
}

export default function EmployeeForm({ open, onClose, onSave, employee }: EmployeeFormProps) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    enabled: true,
    roles: ['ROLE_EMPLOYEE'] as string[]
  });
  
  const [loading, setLoading] = useState(false);
  const [totpSetup, setTotpSetup] = useState<TotpSetupResponse | null>(null);
  const [totpStep, setTotpStep] = useState<'disabled' | 'generating' | 'scanning' | 'verifying' | 'enabled'>('disabled');
  const [initialRoles, setInitialRoles] = useState<string[]>(['ROLE_EMPLOYEE']);

  useEffect(() => {
    if (open) {
      const roles = employee?.roles || ['ROLE_EMPLOYEE'];
      
      setFormData({
        username: employee?.username || '',
        email: employee?.email || '',
        firstName: employee?.firstName || '',
        lastName: employee?.lastName || '',
        phoneNumber: employee?.phoneNumber || '',
        enabled: employee?.enabled ?? true,
        roles: roles
      });
      
      setInitialRoles(roles);
      setTotpSetup(null);

      // Set initial TOTP state based on existing user
      if (employee?.totpEnabled) {
        setTotpStep('enabled');
      } else {
        setTotpStep('disabled');
      }
    }
  }, [open, employee]);

  // Handle role changes
  useEffect(() => {
    if (!open) return;

    const isNewUser = !employee;
    const hasAdminRole = formData.roles.includes('ROLE_ADMIN');
    const hadAdminRole = initialRoles.includes('ROLE_ADMIN');
    const isChangingToAdmin = hasAdminRole && !hadAdminRole;

    // NEW USER selecting ADMIN role → auto-generate TOTP
    if (isNewUser && hasAdminRole && totpStep === 'disabled' && formData.username) {
      handleGenerateTotpForNewUser();
    }

    // EXISTING USER changing TO ADMIN → auto-generate TOTP
    if (!isNewUser && isChangingToAdmin && totpStep === 'disabled') {
      handleGenerateTotpForNewUser();
    }

    // Changing FROM ADMIN to non-ADMIN → reset TOTP
    if (!hasAdminRole && (totpStep === 'scanning' || totpStep === 'generating')) {
      setTotpSetup(null);
      setTotpStep('disabled');
    }
  }, [formData.roles, formData.username, open]);

  const handleRoleChange = (role: string, checked: boolean) => {
    let newRoles = [...formData.roles];

    if (role === 'ROLE_ADMIN') {
      if (checked) {
        // Add ROLE_ADMIN and ensure ROLE_EMPLOYEE is also added
        if (!newRoles.includes('ROLE_ADMIN')) {
          newRoles.push('ROLE_ADMIN');
        }
        if (!newRoles.includes('ROLE_EMPLOYEE')) {
          newRoles.push('ROLE_EMPLOYEE');
        }
      } else {
        // Remove ROLE_ADMIN
        newRoles = newRoles.filter(r => r !== 'ROLE_ADMIN');
      }
    } else if (role === 'ROLE_EMPLOYEE') {
      if (checked) {
        // Add ROLE_EMPLOYEE
        if (!newRoles.includes('ROLE_EMPLOYEE')) {
          newRoles.push('ROLE_EMPLOYEE');
        }
      } else {
        // Remove ROLE_EMPLOYEE only if ROLE_ADMIN is not selected
        if (!newRoles.includes('ROLE_ADMIN')) {
          newRoles = newRoles.filter(r => r !== 'ROLE_EMPLOYEE');
        }
        // If trying to uncheck EMPLOYEE while ADMIN is checked, show warning and prevent
        else {
          toast(t('admin.employees.cannotRemoveEmployeeFromAdmin'));
          return;
        }
      }
    }

    setFormData({ ...formData, roles: newRoles });
  };

  const handleGenerateTotpForNewUser = async () => {
    if (!formData.username) {
      toast.error(t('admin.employees.enterUsernameFirst'));
      return;
    }

    try {
      setTotpStep('generating');
      const response = await employeeService.generateTotpForNewUser(formData.username);
      setTotpSetup(response.data);
      setTotpStep('scanning');
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('admin.employees.totpSetupError'));
      setTotpStep('disabled');
    }
  };

  const handleSubmit = async () => {
    const hasAdminRole = formData.roles.includes('ROLE_ADMIN');
    const hadAdminRole = initialRoles.includes('ROLE_ADMIN');
    const isRoleChange = employee && !hadAdminRole && hasAdminRole;
    
    try {
      setLoading(true);
      
      const dataToSave: any = {
        ...formData,
        roles: formData.roles,
      };

      // Add TOTP data for new admin or role change to admin
      if (hasAdminRole && totpSetup?.secret) {
        if (!employee || isRoleChange) {
          dataToSave.totpSecret = totpSetup.secret;
          // Set to false so the user must verify it themselves on first login
          dataToSave.totpEnabled = false;
          console.log('✅ Including TOTP data:', {
            totpEnabled: false,
            secretLength: totpSetup.secret.length
          });
        }
      }

      // Disable TOTP when removing admin role
      if (employee && !hasAdminRole && hadAdminRole) {
        dataToSave.totpSecret = null;
        dataToSave.totpEnabled = false;
      }
      
      await onSave(dataToSave);
      onClose();
      toast.success(employee ? t('admin.employees.updated') : t('admin.employees.created'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('admin.employees.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (newPhone: string) => {
    setFormData(prev => ({ ...prev, phoneNumber: newPhone }));
  };


  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = () => {
    if (!formData.username || !formData.email || !formData.firstName || !formData.lastName) {
      return false;
    }
    
    // Email format validation
    if (!validateEmail(formData.email)) {
      return false;
    }

    if (formData.roles.length === 0) {
      return false;
    }
    return true;
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('admin.employees.basicInfo')}
            </Typography>
            
            <TextField
              label={t('admin.employees.username')}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              fullWidth
              disabled={!!employee}
              helperText={employee ? t('admin.employees.usernameHelper') : ''}
            />

            <TextField
              label={t('admin.employees.email')}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
              error={formData.email !== '' && !validateEmail(formData.email)}
              helperText={
                formData.email !== '' && !validateEmail(formData.email)
                  ? t('admin.employees.emailInvalid')
                  : ''
              }
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

            <MuiTelInput
              label={t('admin.employees.phoneNumber')}
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              defaultCountry="RO"
              required
              fullWidth
            />

            <Box>
              <FormLabel component="legend" sx={{ mb: 1 }}>
                {t('admin.employees.isEnabled')} *
              </FormLabel>
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

            {/* Role Selection - Checkboxes */}
            <Box>
              <FormLabel component="legend" sx={{ mb: 1 }}>
                {t('admin.employees.roles')} *
              </FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.roles.includes('ROLE_EMPLOYEE')}
                      onChange={(e) => handleRoleChange('ROLE_EMPLOYEE', e.target.checked)}
                      disabled={formData.roles.includes('ROLE_ADMIN')}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{t('admin.employees.roleEmployee')}</Typography>
                      {formData.roles.includes('ROLE_ADMIN') && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ({t('admin.employees.requiredForAdmin')})
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.roles.includes('ROLE_ADMIN')}
                      onChange={(e) => handleRoleChange('ROLE_ADMIN', e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{t('admin.employees.roleAdmin')}</Typography>
                      <SecurityIcon fontSize="small" color="action" />
                    </Box>
                  }
                />
              </FormGroup>
            </Box>

            {formData.roles.includes('ROLE_ADMIN') && (
              <Alert severity="info" icon={<SecurityIcon />}>
                {t('admin.employees.adminIncludesEmployeeNote')}
              </Alert>
            )}

          </Box>

          {/* Warning if trying to save admin without TOTP */}
          {formData.roles.includes('ROLE_ADMIN') && !isFormValid() && (
            <Alert severity="error" icon={<WarningIcon />}>
              {t('admin.employees.mustVerifyTotpToSave')}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('admin.cancel')}</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !isFormValid()}
        >
          {loading ? t('common.loading') : t('admin.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}