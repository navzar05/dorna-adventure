import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface EmployeeRouteProps {
  children: ReactNode;
}

export default function EmployeeRoute({ children }: EmployeeRouteProps) {
  const { isAuthenticated, isEmployee } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isEmployee) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}