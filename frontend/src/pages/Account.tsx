/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Account.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  DeleteForever as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import type { User, UpdateUserRequest, ChangePasswordRequest } from '../types/auth';

export default function Account() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // User profile state
  const [user, setUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    });

  const [profileLoading, setProfileLoading] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
  try {
    const response = await userService.getCurrentUser();
    setUser(response.data);
    setProfileForm({
      email: response.data.email, // Add this
      firstName: response.data.firstName,
      lastName: response.data.lastName,
      phoneNumber: response.data.phoneNumber,
    });
  } catch {
    toast.error(t('account.errors.loadFailed'));
  }
};

  const handleProfileUpdate = async () => {
    try {
      setProfileLoading(true);
      const response = await userService.updateUser(profileForm);
      setUser(response.data);
      toast.success(t('account.messages.profileUpdated'));
    } catch {
      toast.error(t('account.errors.updateFailed'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate passwords match
    if (passwordForm.newPassword !== confirmPassword) {
      toast.error(t('account.errors.passwordMismatch'));
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('account.errors.passwordTooShort'));
      return;
    }

    try {
      setPasswordLoading(true);
      await userService.changePassword(passwordForm);
      toast.success(t('account.messages.passwordChanged'));
      
      // Clear form
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('account.errors.passwordChangeFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error(t('account.errors.passwordRequired'));
      return;
    }

    try {
      setDeleteLoading(true);
      await userService.deleteAccount({ password: deletePassword });
      toast.success(t('account.messages.accountDeleted'));
      
      // Logout and redirect
      logout();
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('account.errors.deleteFailed'));
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  if (!user) {
    return (
      <Box 
            sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '80vh' 
            }}
        >
            <CircularProgress />
        </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        {t('account.title')}
      </Typography>

      {/* Profile Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              {t('account.profileSection')}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
                <TextField
                label={t('account.username')}
                value={user.username}
                disabled
                fullWidth
                helperText={t('account.usernameHelper')}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                label={t('account.email')}
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                fullWidth
                required
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                label={t('account.firstName')}
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                fullWidth
                required
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                label={t('account.lastName')}
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                fullWidth
                required
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                label={t('account.phoneNumber')}
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                fullWidth
                required
                />
            </Grid>
            </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleProfileUpdate}
              disabled={profileLoading}
            >
              {profileLoading ? t('common.loading') : t('account.saveChanges')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              {t('account.passwordSection')}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={t('account.currentPassword')}
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('account.newPassword')}
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('account.confirmPassword')}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<LockIcon />}
              onClick={handlePasswordChange}
              disabled={passwordLoading}
            >
              {passwordLoading ? t('common.loading') : t('account.changePassword')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card sx={{ borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} color="error" gutterBottom>
            {t('account.dangerZone')}
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('account.deleteWarning')}
          </Alert>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t('account.deleteAccount')}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle color="error">{t('account.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {t('account.deleteConfirmText')}
          </Typography>
          <TextField
            label={t('account.password')}
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            fullWidth
            margin="normal"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('admin.cancel')}</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? t('common.loading') : t('account.deleteAccount')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}