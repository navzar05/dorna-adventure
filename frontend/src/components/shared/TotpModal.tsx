// src/components/TotpModal.tsx
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
import { Security as SecurityIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface TotpModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function TotpModal({ open, onClose, onVerify, loading, error }: TotpModalProps) {
  const { t } = useTranslation();
  const [totpCode, setTotpCode] = useState('');

  const handleSubmit = async () => {
    if (totpCode.length === 6) {
      await onVerify(totpCode);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && totpCode.length === 6 && !loading) {
      handleSubmit();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xs" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      {/* Loading Backdrop */}
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
              {t('auth.totp.verifying')}
            </Typography>
          </Box>
        </Backdrop>
      )}

      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">
            {t('auth.totp.title')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('auth.totp.description')}
          </Typography>

          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <TextField
            label={t('auth.totp.code')}
            value={totpCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 6) {
                setTotpCode(value);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder="123456"
            fullWidth
            autoFocus
            disabled={loading}
            inputProps={{
              maxLength: 6,
              style: { 
                textAlign: 'center', 
                fontSize: '1.5rem', 
                letterSpacing: '0.5rem',
                fontWeight: 500,
              }
            }}
            helperText={t('auth.totp.helper')}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={totpCode.length !== 6 || loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              <span>{t('common.verifying')}</span>
            </Box>
          ) : (
            t('auth.totp.verify')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}