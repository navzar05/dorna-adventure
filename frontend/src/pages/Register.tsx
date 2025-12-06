import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Container, Paper, TextField, Button, Box, Alert } from '@mui/material';
import { MuiTelInput } from 'mui-tel-input'; // Add this import
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RegisterFormData {
  username: string;
  firstname: string;
  lastname: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    firstname: '',
    lastname: '',
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
    if (!formData.username || !formData.firstname || !formData.lastname || !formData.password || !formData.phoneNumber) {
      setError('All fields are required');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
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
      firstName: formData.firstname,
      lastName: formData.lastname,
      phoneNumber: formData.phoneNumber,
      password: formData.password
    });

    if (result.success) {
      setSuccess(result.message || 'Registration successful');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error || 'An error occurred');
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
        <h1>Register</h1>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <TextField
            label="Firstname"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <TextField
            label="Lastname"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            fullWidth
            required
          />

          {/* MuiTelInput with its own handler */}
          <MuiTelInput
            label="Phone number"
            value={formData.phoneNumber}
            onChange={handlePhoneChange}  // Use the special handler
            defaultCountry="RO"  // Optional: set default country
            fullWidth
            required
          />
          
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            required
            error={!!formData.confirmPassword && formData.password !== formData.confirmPassword}
            helperText={
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'Passwords do not match'
                : ''
            }
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
          
          <Button variant="outlined" href='/login' fullWidth>
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}