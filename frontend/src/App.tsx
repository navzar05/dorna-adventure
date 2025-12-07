// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRoute from './components/AdminRoute'; // Import AdminRoute
import Landing from './pages/Landing';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ActivityDetail from './pages/ActivityDetail';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import Account from './pages/Account';

function App() {
  return (
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
              duration: 3000,
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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
  );
}

export default App;