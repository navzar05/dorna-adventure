/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/EmailVerification.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function EmailVerification() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError(t('auth.verification.noToken'));
        setLoading(false);
        return;
      }

      try {
        await api.get(`/auth/verify?token=${token}`);
        setSuccess(true);
        setError('');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        console.error('Verification error:', err);
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          t('auth.verification.failed')
        );
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, t]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {loading && (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                {t('auth.verification.verifying')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('auth.verification.pleaseWait')}
              </Typography>
            </>
          )}

          {!loading && success && (
            <>
              <SuccessIcon
                sx={{
                  fontSize: 80,
                  color: 'success.main',
                  mb: 2,
                }}
              />
              <Typography variant="h5" gutterBottom color="success.main">
                {t('auth.verification.success')}
              </Typography>
              <Alert severity="success" sx={{ mt: 2, mb: 3 }}>
                {t('auth.verification.successMessage')}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('auth.verification.redirecting')}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                fullWidth
              >
                {t('auth.verification.goToLogin')}
              </Button>
            </>
          )}

          {!loading && error && (
            <>
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h5" gutterBottom color="error.main">
                {t('auth.verification.error')}
              </Typography>
              <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
                {error}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('auth.verification.errorHelp')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                  fullWidth
                >
                  {t('auth.verification.backToRegister')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  fullWidth
                >
                  {t('auth.verification.goToLogin')}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
