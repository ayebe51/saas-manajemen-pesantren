import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SantriPage } from '@/pages/santri/SantriPage';
import { SantriProfilPage } from '@/pages/santri/SantriProfilPage';
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
import { IdCardGeneratorPage } from '@/pages/id-card/IdCardGeneratorPage';
import { PpdbPage } from '@/pages/ppdb/PpdbPage';
import { PpdbPortalPage } from '@/pages/ppdb/PpdbPortalPage';
import { CatatanPage } from '@/pages/catatan/CatatanPage';
import { PembayaranPage } from '@/pages/pembayaran/PembayaranPage';
import { AsramaPage } from '@/pages/dormitory/AsramaPage';
import { KesehatanPage } from '@/pages/kesehatan/KesehatanPage';
import { PelanggaranPage } from '@/pages/pelanggaran/PelanggaranPage';
import { KunjunganPage } from '@/pages/kunjungan/KunjunganPage';
import { WaliPortalPage } from '@/pages/wali/WaliPortalPage';
import { PresensiPage } from '@/pages/presensi/PresensiPage';
import { PoinRewardPage } from '@/pages/poin/PoinRewardPage';
import { LandingPage } from '@/pages/public/LandingPage';



export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/wali" element={<WaliPortalPage />} />
        <Route path="/ppdb-daftar" element={<PpdbPortalPage />} />
        <Route path="/ppdb-daftar/:tenantId" element={<PpdbPortalPage />} />
        
        {/* Rute Terproteksi JWT (Private) */}
        <Route 
          path="/dashboard" 
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          {/* Index Route memuat Beranda Dasbor */}
          <Route index element={<DashboardPage />} />
          <Route path="santri" element={<SantriPage />} />
          <Route path="santri/:id" element={<SantriProfilPage />} />
          <Route path="akademik" element={<AkademikPage />} />
          <Route path="finance" element={<WalletPage />} />
          <Route path="wallet/topup" element={<TopUpPage />} />

          <Route path="inventory">
            <Route index element={<InventoryPage />} />
            <Route path="pos" element={<POSPage />} />
          </Route>
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="id-card" element={<IdCardGeneratorPage />} />
          <Route path="asrama">
            <Route index element={<PerizinanPage />} />
            <Route path="scan" element={<ScanPage />} />
          </Route>
          <Route path="hr" element={<HRPage />} />
          <Route path="ppdb" element={<PpdbPage />} />
          <Route path="catatan" element={<CatatanPage />} />
          <Route path="pembayaran" element={<PembayaranPage />} />
          <Route path="dormitory" element={<AsramaPage />} />
          <Route path="kesehatan" element={<KesehatanPage />} />
          <Route path="pelanggaran" element={<PelanggaranPage />} />
          <Route path="kunjungan" element={<KunjunganPage />} />
          <Route path="presensi" element={<PresensiPage />} />
          <Route path="poin-reward" element={<PoinRewardPage />} />
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
