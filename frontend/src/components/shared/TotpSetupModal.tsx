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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface TotpSetupModalProps {
  open: boolean;
  onClose?: () => void;
  onVerify: (code: string) => Promise<void>;
  qrCodeDataUrl: string;
  secret: string;
  loading?: boolean;
  error?: string;
  isRequired?: boolean;
}

export default function TotpSetupModal({
  open,
  onClose,
  onVerify,
  qrCodeDataUrl,
  secret,
  loading,
  error,
  isRequired = false
}: TotpSetupModalProps) {
  const { t } = useTranslation();
  const [verificationCode, setVerificationCode] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    t('auth.totp.setup.scanStep'),
    t('auth.totp.setup.verifyStep')
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (verificationCode.length === 6) {
      await onVerify(verificationCode);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6 && !loading && activeStep === 1) {
      handleSubmit();
    }
  };

  const handleClose = () => {
    if (!loading && onClose && !isRequired) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading || isRequired}
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
              {t('auth.totp.setup.verifying')}
            </Typography>
          </Box>
        </Backdrop>
      )}

      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">
            {t('auth.totp.setup.title')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {isRequired && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('auth.totp.setup.requiredWarning')}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              {t('auth.totp.setup.scanInstructions')}
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                style={{
                  maxWidth: '250px',
                  border: '2px solid #ddd',
                  borderRadius: '8px'
                }}
              />
            </Box>

            <Alert severity="warning" icon={false}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                {t('auth.totp.setup.manualEntry')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  fontSize: '0.875rem'
                }}
              >
                {secret}
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              {t('auth.totp.setup.downloadApp')}
            </Typography>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth.totp.setup.verifyInstructions')}
            </Typography>

            <TextField
              label={t('auth.totp.setup.verificationCode')}
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 6) {
                  setVerificationCode(value);
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
              helperText={t('auth.totp.setup.enterCode')}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Box>
          {!isRequired && (
            <Button onClick={handleClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep === 1 && (
            <Button onClick={handleBack} disabled={loading}>
              {t('common.back')}
            </Button>
          )}
          {activeStep === 0 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={loading}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={verificationCode.length !== 6 || loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>{t('common.verifying')}</span>
                </Box>
              ) : (
                t('auth.totp.setup.verify')
              )}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
