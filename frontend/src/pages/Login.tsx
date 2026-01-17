/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Checkbox, 
  FormControlLabel, 
  Alert,
  Typography,
  Link as MuiLink // Rename to avoid conflict with Router Link
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom'; // Import Router Link
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { TotpModal } from '../components/shared';
import ChangePasswordModal from '../components/shared/ChangePasswordModal';
import TotpSetupModal from '../components/shared/TotpSetupModal';
import { userService } from '../services/userService';
import type { TotpSetupResponse } from '../types/employee';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: true
  });
  
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isAccountDisabled, setIsAccountDisabled] = useState<boolean>(false);
  
  // TOTP Modal State
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [totpError, setTotpError] = useState<string>('');
  const [totpLoading, setTotpLoading] = useState(false);

  // Change Password Modal State
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string>('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // TOTP Setup Modal State
  const [totpSetupModalOpen, setTotpSetupModalOpen] = useState(false);
  const [totpSetupData, setTotpSetupData] = useState<TotpSetupResponse | null>(null);
  const [totpSetupError, setTotpSetupError] = useState<string>('');
  const [totpSetupLoading, setTotpSetupLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsAccountDisabled(false);
    setLoading(true);

    const result = await login(formData.username, formData.password);

    if (result.success) {
      console.log(result.user);
      // Check if password is temporary
      if (result.user?.passwordTemporary) {
        setChangePasswordModalOpen(true);
        setLoading(false);
      } else {
        navigate('/home');
      }
    } else if (result.requiresTotp) {
      setTotpModalOpen(true);
      setLoading(false);
    } else {
      switch (result.errorCode) {
        case "ACCOUNT_DISABLED":
          setError(t('auth.login.accountDisabled', 'Account disabled. Please verify your email.'));
          setIsAccountDisabled(true);
          break;
        default:
          setError(result.error || t('auth.login.error', 'Login failed'));
      }
      setLoading(false);
    }
  };

  const handleTotpVerify = async (totpCode: string): Promise<void> => {
    setTotpError('');
    setTotpLoading(true);

    try {
      const result = await login(formData.username, formData.password, totpCode);
      if (result.success) {
        setTotpModalOpen(false);
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if password is temporary after TOTP verification
        if (result.user?.passwordTemporary) {
          setChangePasswordModalOpen(true);
          setTotpLoading(false);
        } else {
          navigate('/home', { replace: true });
        }
      } else {
        setTotpError(result.error || t('auth.totp.invalidCode'));
      }
    } catch (error: any) {
      console.error('TOTP verification error:', error);
      setTotpError(error.message || t('auth.totp.invalidCode'));
    } finally {
      setTotpLoading(false);
    }
  };

  const handleCloseTotpModal = () => {
    setTotpModalOpen(false);
    setTotpError('');
    setLoading(false);
  };

  const handleChangePassword = async (newPassword: string): Promise<void> => {
    setChangePasswordError('');
    setChangePasswordLoading(true);

    try {
      await userService.changeTemporaryPassword(newPassword);
      setChangePasswordModalOpen(false);
      setChangePasswordLoading(false);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to fetch TOTP setup data
      try {
        const response = await userService.getTotpSetup();
        console.log('TOTP setup data received:', response.data);
        setTotpSetupData(response.data);
        setTotpSetupModalOpen(true);
      } catch (error: any) {
        console.log('TOTP setup not needed or already enabled, proceeding to home');
        // TOTP setup not needed (already enabled or not required), navigate to home
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      setChangePasswordError(error.response?.data?.error || t('account.changePasswordError', 'Failed to change password'));
      setChangePasswordLoading(false);
    }
  };

  const handleTotpSetupVerify = async (code: string): Promise<void> => {
    setTotpSetupError('');
    setTotpSetupLoading(true);

    try {
      await userService.verifyTotp(code);
      setTotpSetupModalOpen(false);
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/home', { replace: true });
    } catch (error: any) {
      console.error('TOTP setup verification error:', error);
      setTotpSetupError(error.response?.data?.error || t('auth.totp.setup.verificationError', 'Invalid verification code'));
    } finally {
      setTotpSetupLoading(false);
    }
  };

  return (
    <>
      <Container
        maxWidth="xs"
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper sx={{ p: 3, width: "100%", textAlign: "center" }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('auth.login.title')}
          </Typography>
          
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
          >
            {error && (
              <Alert 
                severity="error"
                action={
                  isAccountDisabled ? (
                    <Button 
                      color="inherit" 
                      size="small"
                      onClick={() => navigate('/email-sent', { 
                        state: { email: formData.username } 
                      })}
                    >
                      {t('auth.verify.resendButton', 'Verify Now')}
                    </Button>
                  ) : null
                }
              >
                {error}
              </Alert>
            )}
            
            <TextField
              label={t('auth.login.username')}
              name="username"
              value={formData.username}
              onChange={handleChange}
              fullWidth
              required
            />
            
            <TextField
              label={t('auth.login.password')}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
            />
            
            {/* ✅ Container for Remember Me & Forgot Password */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                }
                label={t('auth.login.rememberMe')}
              />

              <MuiLink 
                component={Link} 
                to="/forgot-password" 
                variant="body2" 
                underline="hover"
              >
                {t('auth.login.forgotPassword', 'Forgot Password?')}
              </MuiLink>
            </Box>
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? t('auth.login.signingIn') : t('auth.login.loginButton')}
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={() => navigate('/register')}
              fullWidth
            >
              {t('auth.login.signUp')}
            </Button>
          </Box>
        </Paper>
      </Container>

      <TotpModal
        open={totpModalOpen}
        onClose={handleCloseTotpModal}
        onVerify={handleTotpVerify}
        loading={totpLoading}
        error={totpError}
      />

      <ChangePasswordModal
        open={changePasswordModalOpen}
        onSubmit={handleChangePassword}
        loading={changePasswordLoading}
        error={changePasswordError}
        isTemporary={true}
      />

      {totpSetupData && (
        <TotpSetupModal
          open={totpSetupModalOpen}
          onVerify={handleTotpSetupVerify}
          qrCodeDataUrl={totpSetupData.qrCodeDataUrl}
          secret={totpSetupData.secret}
          loading={totpSetupLoading}
          error={totpSetupError}
          isRequired={true}
        />
      )}
    </>
  );
}