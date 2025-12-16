// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import { AdminRoute, Navbar, Footer, ProtectedRoute } from './components/shared';
import Landing from './pages/Landing';
import Home from './pages/Home';
import ActivityDetail from './pages/ActivityDetail';
import Admin from './pages/Admin';
import Account from './pages/Account';
import MyBookings from './pages/MyBookings';
import PaymentSuccess from './components/PaymentSuccess';
import EmailVerification from './pages/EmailVerification';
import GuestPayment from './pages/GuestPayment';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import MyWorkHours from './components/workHours/MyWorkHours';
import EmployeeRoute from './components/shared/EmployeeRoute';
import EmailSent from './pages/EmailSent';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
function App() {
  return (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
    <ThemeContextProvider>
      <CssBaseline />
      <AuthProvider>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#1b4332',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#40916c',
                },
              },
              error: {
                style: {
                  background: '#d64545',
                },
              },
            }}
          />
          <Navbar />
          <Box component="main" sx={{ flex: 1 }}>
            <Routes>
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<EmailVerification />} />
              <Route path="/payment" element={<GuestPayment />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/my-work-hours" 
                element={
                  <EmployeeRoute>
                    <MyWorkHours />
                  </EmployeeRoute>
                } 
              />
              <Route path="/email-sent" element={<EmailSent />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/home"
                element={<Home />}/>
              <Route path="/activities/:id" element={<ActivityDetail />}/>
              <Route path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="/" element={<Landing />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </AuthProvider>
    </ThemeContextProvider>
    </LocalizationProvider>
  );
}

export default App;