import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { QrCode, ClipboardList, BarChart3, LogOut } from 'lucide-react';
import { LoginPage } from './pages/LoginPage';
import { ScannerPage } from './pages/ScannerPage';
import { LogPage } from './pages/LogPage';
import { RekapPage } from './pages/RekapPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <div style={{ paddingBottom: '5rem', minHeight: '100dvh' }}>
      <header style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)' }}>📷 QR Scanner</h1>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Portal Presensi Digital</p>
        </div>
        <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
          <LogOut size={20} />
        </button>
      </header>

      <main style={{ padding: '1.25rem' }}>
        <Routes>
          <Route path="/" element={<ScannerPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/rekap" element={<RekapPage />} />
        </Routes>
      </main>

      <nav className="nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <QrCode size={22} /> Scan
        </NavLink>
        <NavLink to="/log" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardList size={22} /> Log
        </NavLink>
        <NavLink to="/rekap" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={22} /> Rekap
        </NavLink>
      </nav>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
