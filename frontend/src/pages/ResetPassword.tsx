import { useState, type FormEvent, type ChangeEvent, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Alert,
  Typography 
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get the token from the URL (e.g., ?token=xyz...)
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Redirect if no token is present
  useEffect(() => {
    if (!token) {
      setStatus({ 
        type: 'error', 
        text: t('auth.resetPassword.missingToken', 'Invalid link. No token found.') 
      });
    }
  }, [token, t]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus(null);

    if (formData.password !== formData.confirmPassword) {
      setStatus({ 
        type: 'error', 
        text: t('auth.register.passwordMismatch', 'Passwords do not match') 
      });
      return;
    }

    if (formData.password.length < 6) {
        setStatus({
            type: 'error',
            text: t('account.errors.passwordTooShort', 'Password must be at least 6 characters')
        });
        return;
    }

    setLoading(true);

    try {
      // Call the backend endpoint created in the previous step
      await api.post('/auth/reset-password', { 
        token, 
        newPassword: formData.password 
      });
      
      setStatus({ 
        type: 'success', 
        text: t('auth.resetPassword.success', 'Password reset successfully! Redirecting to login...') 
      });

      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Reset password error:', error);
      setStatus({ 
        type: 'error', 
        text: error.response?.data || t('auth.errorOccurred', 'An error occurred.') 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Alert severity="error">
                {t('auth.resetPassword.missingToken', 'Invalid or missing reset token.')}
            </Alert>
        </Container>
    );
  }

  return (
    <Container
      maxWidth="xs"
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper sx={{ p: 4, width: "100%", textAlign: "center", borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          {t('auth.resetPassword.title', 'Set New Password')}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {status && <Alert severity={status.type}>{status.text}</Alert>}

          <TextField
            label={t('auth.register.password', 'New Password')}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label={t('auth.register.confirmPassword', 'Confirm Password')}
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            required
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
          >
            {loading ? t('common.processing', 'Processing...') : t('auth.resetPassword.submit', 'Reset Password')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}