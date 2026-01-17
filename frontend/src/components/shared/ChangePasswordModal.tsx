import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ChangePasswordModalProps {
  open: boolean;
  onClose?: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  isTemporary?: boolean;
}

export default function ChangePasswordModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  isTemporary = false
}: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async () => {
    setValidationError('');

    // Validation
    if (newPassword.length < 6) {
      setValidationError(t('account.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError(t('account.passwordMismatch'));
      return;
    }

    await onSubmit(newPassword);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && newPassword && confirmPassword) {
      handleSubmit();
    }
  };

  const handleClose = () => {
    if (!loading && onClose && !isTemporary) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading || isTemporary}
    >
      {loading && (
        <Backdrop
          sx={{
            position: 'absolute',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 1,
          }}
          open={loading}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" fontWeight={500}>
              {t('account.changingPassword')}
            </Typography>
          </Box>
        </Backdrop>
      )}

      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon color="primary" />
          <Typography variant="h6">
            {isTemporary ? t('account.changeTemporaryPassword') : t('account.changePassword')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {isTemporary && (
            <Alert severity="warning">
              {t('account.temporaryPasswordWarning')}
            </Alert>
          )}

          {(error || validationError) && (
            <Alert severity="error">{error || validationError}</Alert>
          )}

          <TextField
            label={t('account.newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            autoFocus
            disabled={loading}
            helperText={t('account.passwordMinLength')}
          />

          <TextField
            label={t('account.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            disabled={loading}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!isTemporary && (
          <Button onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!newPassword || !confirmPassword || loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              <span>{t('common.saving')}</span>
            </Box>
          ) : (
            t('account.changePassword')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
