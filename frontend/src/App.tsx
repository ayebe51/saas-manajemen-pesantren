import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SantriPage } from '@/pages/santri/SantriPage';
import { WalletPage } from '@/pages/wallet/WalletPage';
import { PerizinanPage } from '@/pages/perizinan/PerizinanPage';
import { AkademikPage } from '@/pages/akademik/AkademikPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { HRPage } from '@/pages/hr/HRPage';
import { LaporanPage } from '@/pages/laporan/LaporanPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';



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
          <Route path="akademik" element={<AkademikPage />} />
          <Route path="finance" element={<WalletPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="asrama" element={<PerizinanPage />} />
          <Route path="hr" element={<HRPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
