import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SantriPage } from '@/pages/santri/SantriPage';

// Placeholder Pages
const PlaceholderPage = ({ title }: { title: string }) => <div className="p-8"><h1>{title}</h1></div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rute Terproteksi JWT (Private) */}
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          {/* Index Route memuat Beranda Dasbor */}
          <Route index element={<DashboardPage />} />
          <Route path="santri" element={<SantriPage />} />
          <Route path="akademik" element={<PlaceholderPage title="Modul Akademik" />} />
          <Route path="finance" element={<PlaceholderPage title="Tabungan & Kasir" />} />
          <Route path="laporan" element={<PlaceholderPage title="Laporan Pesantren" />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
