import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';
import { 
  Home, Users, Briefcase, GraduationCap, 
  Wallet, ArchiveRestore, Building2, FileBarChart, Settings, Shield, CreditCard, IdCard,
  ClipboardList, MessageSquare, Receipt, Heart, AlertTriangle, UserCheck,
  Sun, Moon, LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Beranda' },
  { path: '/santri', icon: Users, label: 'Kesantrian' },
  { path: '/ppdb', icon: ClipboardList, label: 'PPDB' },
  { path: '/akademik', icon: GraduationCap, label: 'Akademik' },
  { path: '/catatan', icon: MessageSquare, label: 'Buku Penghubung' },
  { path: '/pelanggaran', icon: AlertTriangle, label: 'Pelanggaran' },
  { path: '/kesehatan', icon: Heart, label: 'Kesehatan' },
  { path: '/kunjungan', icon: UserCheck, label: 'Kunjungan' },
  { path: '/finance', icon: Wallet, label: 'Keuangan' },
  { path: '/pembayaran', icon: Receipt, label: 'Pembayaran SPP' },
  { path: '/wallet/topup', icon: CreditCard, label: 'Top-Up Saldo' },
  { path: '/inventory', icon: ArchiveRestore, label: 'Koperasi' },
  { path: '/asrama', icon: Building2, label: 'Perizinan' },
  { path: '/dormitory', icon: Building2, label: 'Asrama' },
  { path: '/hr', icon: Briefcase, label: 'Kepegawaian' },
  { path: '/id-card', icon: IdCard, label: 'E-ID Card' },
  { path: '/laporan', icon: FileBarChart, label: 'Laporan' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r rounded-none border-light flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-light shrink-0">
        <h2 className="text-xl font-bold bg-clip-text text-primary">
          APSS ERP
        </h2>
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-lg hover:bg-surface-glass text-muted hover:text-primary transition-colors"
          title={dark ? 'Light Mode' : 'Dark Mode'}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto p-4 pb-2 scrollbar-thin">
        <div className="mb-3 px-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Menu Utama
          </p>
        </div>
        
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-all font-medium text-sm',
                  isActive 
                    ? 'bg-primary text-inverse shadow-glow' 
                    : 'text-muted hover:bg-surface-glass hover:text-primary'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Panel */}
      <div className="shrink-0 p-3 border-t border-light bg-app">
        <div className="flex gap-1 mb-2">
          <NavLink 
            to="/audit-log"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-muted hover:text-primary transition-colors font-medium text-sm flex-1"
          >
            <Shield className="w-4 h-4" />
            <span>Audit Log</span>
          </NavLink>
          <NavLink 
            to="/settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-muted hover:text-primary transition-colors font-medium text-sm flex-1"
          >
            <Settings className="w-4 h-4" />
            <span>Setting</span>
          </NavLink>
        </div>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-surface-glass">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold truncate block">{user?.name || 'Admin User'}</span>
            <span className="badge badge-success self-start text-[0.6rem] py-0">
              {user?.role || 'SUPERADMIN'}
            </span>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-md text-muted hover:text-danger transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
