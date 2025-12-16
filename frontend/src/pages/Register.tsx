// src/pages/Register.tsx
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
import { MuiTelInput } from 'mui-tel-input';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface RegisterFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (value: string): void => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.username) {
      setError(t('auth.register.usernameRequired'));
      return false;
    }

    if (!formData.email) {
      setError(t('auth.register.emailRequired'));
      return false;
    }

    if (!formData.firstName) {
      setError(t('auth.register.firstNameRequired'));
      return false;
    }

    if (!formData.lastName) {
      setError(t('auth.register.lastNameRequired'));
      return false;
    }

    if (!formData.phoneNumber) {
      setError(t('auth.register.phoneRequired'));
      return false;
    }

    if (!formData.password) {
      setError(t('auth.register.passwordRequired'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      return false;
    }

    if (formData.password.length < 6) {
      setError(t('account.errors.passwordTooShort'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await register({
      username: formData.username,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      password: formData.password
    });

    if (result.success) {
      navigate('/email-sent', { state: { email: formData.email } }); 
    } else {
      setError(result.error || t('auth.register.error'));
    }
    
    setLoading(false);
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 4,
      }}
    >
      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          width: "100%",
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            {t('auth.register.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('auth.register.subtitle')}
          </Typography>
        </Box>

        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 2.5
          }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          
          <TextField
            label={t('auth.register.username')}
            name="username"
            value={formData.username}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="username"
          />

          <TextField
            label={t('auth.register.email')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="email"
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('auth.register.firstName')}
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="given-name"
            />
            
            <TextField
              label={t('auth.register.lastName')}
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="family-name"
            />
          </Box>

          <MuiTelInput
            label={t('auth.register.phoneNumber')}
            value={formData.phoneNumber}
            onChange={handlePhoneChange}
            defaultCountry="RO"
            fullWidth
            required
          />
          
          <TextField
            label={t('auth.register.password')}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="new-password"
            helperText={t('account.errors.passwordTooShort')}
          />
          
          <TextField
            label={t('auth.register.confirmPassword')}
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="new-password"
            error={!!formData.confirmPassword && formData.password !== formData.confirmPassword}
            helperText={
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? t('auth.register.passwordMismatch')
                : ''
            }
          />
          
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? t('common.loading') : t('auth.register.registerButton')}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth.register.haveAccount')}{' '}
              <MuiLink component={Link} to="/login" underline="hover">
                {t('auth.register.signIn')}
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}