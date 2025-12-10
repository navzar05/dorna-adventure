// src/pages/Login.tsx
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
  Typography 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

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
    setLoading(true);

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate('/home');
    } else {
      setError(result.error || t('auth.errorOccurred'));
    }
    
    setLoading(false);
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
      <Paper sx={{ p: 3, width: "100%", textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('auth.login.title')}
        </Typography>
        
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          
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
  );
}