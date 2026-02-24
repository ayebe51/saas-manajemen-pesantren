import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Placeholder Pages
const DashboardHome = () => <div className="p-8"><h1>Dashboard Home</h1><p>Selamat Datang di APSS Koperasi & ERP</p></div>;
const PlaceholderPage = ({ title }: { title: string }) => <div className="p-8"><h1>{title}</h1></div>;

export default function App() {
  return (
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
          <Route index element={<DashboardHome />} />
          <Route path="santri" element={<PlaceholderPage title="Manajemen Santri" />} />
          <Route path="akademik" element={<PlaceholderPage title="Modul Akademik" />} />
          <Route path="finance" element={<PlaceholderPage title="Tabungan & Kasir" />} />
          <Route path="laporan" element={<PlaceholderPage title="Laporan Pesantren" />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
