import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SantriPage } from '@/pages/santri/SantriPage';
import { WalletPage } from '@/pages/wallet/WalletPage';
import TopUpPage from './pages/wallet/TopUpPage';
import { PerizinanPage } from '@/pages/perizinan/PerizinanPage';
import { ScanPage } from '@/pages/perizinan/ScanPage';
import { AkademikPage } from '@/pages/akademik/AkademikPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { POSPage } from '@/pages/inventory/POSPage';
import { HRPage } from '@/pages/hr/HRPage';
import { LaporanPage } from '@/pages/laporan/LaporanPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AuditLogPage } from '@/pages/audit-log/AuditLogPage';



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
          <Route path="/wallet/topup" element={<TopUpPage />} />

          <Route path="inventory">
            <Route index element={<InventoryPage />} />
            <Route path="pos" element={<POSPage />} />
          </Route>
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="asrama">
            <Route index element={<PerizinanPage />} />
            <Route path="scan" element={<ScanPage />} />
          </Route>
          <Route path="hr" element={<HRPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
