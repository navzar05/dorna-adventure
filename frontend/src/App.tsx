// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ActivityDetail from './pages/ActivityDetail';

function App() {
  return (
    <ThemeContextProvider>
      <CssBaseline />
      <AuthProvider>
        <>
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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activities/:id"
              element={
                <ProtectedRoute>
                  <ActivityDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Landing />} />
          </Routes>
        </>
      </AuthProvider>
    </ThemeContextProvider>
  );
}

export default App;