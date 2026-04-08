import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout, setInitializing, isInitializing } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for forced logout from interceptor
    const handleForcedLogout = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [logout, navigate]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const userData = response.data?.data || response.data;
        if (userData?.id) {
          setUser(userData);
        }
      } catch (err: any) {
        // Hanya logout jika 401 — bukan network error atau 500
        if (err?.response?.status === 401) {
          logout();
        }
      } finally {
        setInitializing(false);
      }
    };

    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-app">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
