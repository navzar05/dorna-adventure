/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Alert,
  Typography,
  Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowBack } from '@mui/icons-material';
import api from '../services/api';

export default function ForgotPassword() {
  const { t } = useTranslation();

  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      
      setMessage({
        type: 'success',
        text: t('auth.forgotPassword.success', 'If an account exists for this email, you will receive password reset instructions.')
      });
      
      // Optional: Clear field on success
      setEmail('');
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('auth.errorOccurred', 'An error occurred. Please try again.')
      });
    } finally {
      setLoading(false);
    }
  };

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
          {t('auth.forgotPassword.title', 'Reset Password')}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('auth.forgotPassword.subtitle', 'Enter your email address and we\'ll send you a link to reset your password.')}
        </Typography>

        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          {message && (
            <Alert severity={message.type} sx={{ textAlign: 'left' }}>
              {message.text}
            </Alert>
          )}

          <TextField
            label={t('auth.login.email', 'Email Address')}
            name="email"
            type="email"
            value={email}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="email"
            disabled={loading}
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !email}
          >
            {loading ? t('common.sending', 'Sending...') : t('auth.forgotPassword.submit', 'Send Reset Link')}
          </Button>

          <Box sx={{ mt: 1 }}>
            <MuiLink 
              component={Link} 
              to="/login" 
              variant="body2" 
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
            >
              <ArrowBack fontSize="small" />
              {t('auth.forgotPassword.backToLogin', 'Back to Login')}
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}