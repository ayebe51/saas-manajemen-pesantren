import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';
import { 
  Home, Users, Briefcase, GraduationCap, 
  Wallet, ArchiveRestore, Building2, FileBarChart, Settings, Shield, CreditCard 
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', icon: Home, label: 'Beranda' },
  { path: '/santri', icon: Users, label: 'Kesantrian' },
  { path: '/akademik', icon: GraduationCap, label: 'Akademik' },
  { path: '/finance', icon: Wallet, label: 'Keuangan' },
  { path: '/wallet/topup', icon: CreditCard, label: 'Top-Up Saldo' },
  { path: '/inventory', icon: ArchiveRestore, label: 'Koperasi' },
  { path: '/asrama', icon: Building2, label: 'Asrama' },
  { path: '/hr', icon: Briefcase, label: 'Kepegawaian' },
  { path: '/laporan', icon: FileBarChart, label: 'Laporan' },
];

export function Sidebar() {
  const { user } = useAuthStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r rounded-none border-light">
      <div className="flex items-center justify-center h-16 border-b border-light">
        <h2 className="text-xl font-bold bg-clip-text text-primary">
          APSS ERP
        </h2>
      </div>

      <div className="p-4">
        <div className="mb-4 px-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Menu Utama
          </p>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium',
                  isActive 
                    ? 'bg-primary text-inverse shadow-glow' 
                    : 'text-muted hover:bg-surface-glass hover:text-primary'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 w-full p-4 border-t border-light bg-app">
        <NavLink 
           to="/audit-log"
           className="flex items-center gap-3 px-3 py-2 mb-1 rounded-md text-muted hover:text-primary transition-colors font-medium"
        >
          <Shield className="w-5 h-5" />
          <span>Audit Log</span>
        </NavLink>
        <NavLink 
           to="/settings"
           className="flex items-center gap-3 px-3 py-2 rounded-md text-muted hover:text-primary transition-colors font-medium"
        >
          <Settings className="w-5 h-5" />
          <span>Pengaturan</span>
        </NavLink>
        <div className="mt-4 pt-3 border-t flex flex-col gap-1 border-light">
          <span className="text-sm font-semibold truncate">{user?.name || 'Admin User'}</span>
          <span className="badge badge-success self-start text-[0.65rem]">
            {user?.role || 'SUPERADMIN'}
          </span>
        </div>
      </div>
    </aside>
  );
}
