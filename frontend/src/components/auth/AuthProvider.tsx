import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        // Jika tidak ada token sama sekali, biarkan state kosong
        setIsInitializing(false);
        return;
      }

      try {
        // Verifikasi token ke backend dan ambil data profil
        const response = await api.get('/auth/me');
        if (response.data && response.data.data) {
           setUser(response.data.data);
        }
      } catch (error) {
        // Jika gagal (token tidak valid / expire), store.logout() akan dipanggil otomatis
        // via interceptor jika 401. Namun kita backup di sini:
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [setUser, logout]);

  // Tampilkan layar loading saat memvalidasi sesi (mencegah kedip halaman login sebentar)
  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-app" style={{ backgroundColor: 'var(--bg-app)' }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return <>{children}</>;
}
