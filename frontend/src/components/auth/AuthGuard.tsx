import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Arahkan ke halaman login jika tidak memiliki JWT di state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
