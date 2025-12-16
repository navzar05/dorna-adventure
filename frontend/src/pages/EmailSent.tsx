import { useState } from 'react';
import { 
  Container, 
  Paper, 
  Box, 
  Typography, 
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { MarkEmailRead as EmailIcon, Send as SendIcon } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api'; // Make sure this path is correct for your project

export default function EmailSent() {
  const { t } = useTranslation();
  const location = useLocation();
  
  // We get the email from the navigation state passed from Register.tsx
  const email = location.state?.email;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleResend = async () => {
    if (!email) {
      setMessage({ type: 'error', text: t('auth.verify.emailMissing', 'Email address not found. Please try registering again.') });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Adjust this URL to match your actual backend endpoint
      await api.post('/auth/resend-verification', { email });
      
      setMessage({ 
        type: 'success', 
        text: t('auth.verify.resendSuccess', 'Verification email resent successfully!') 
      });
    } catch (error) {
      console.error(error);
      setMessage({ 
        type: 'error', 
        text: t('auth.verify.resendError', 'Failed to resend email. Please try again later.') 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper 
        elevation={3}
        sx={{ 
          p: 5, 
          textAlign: "center",
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <EmailIcon color="primary" sx={{ fontSize: 80 }} />
        </Box>

        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          {t('auth.verify.title', 'Verify your email')}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 2 }}>
          {t('auth.verify.sentMessage', 'We have sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to activate your account.')}
        </Typography>

        {email && (
          <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mb: 4 }}>
            {email}
          </Typography>
        )}

        {message && (
          <Alert severity={message.type} sx={{ mb: 3, textAlign: 'left' }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleResend}
            disabled={loading || !email}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          >
            {loading ? t('common.sending', 'Sending...') : t('auth.verify.resendButton', 'Resend Email')}
          </Button>

          <Button
            component={Link}
            to="/login"
            variant="outlined"
            fullWidth
          >
            {t('auth.login.backToLogin', 'Back to Login')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}