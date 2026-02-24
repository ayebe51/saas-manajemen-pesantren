import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';
import { 
  Home, Users, Briefcase, GraduationCap, 
  Wallet, ArchiveRestore, Building2, FileBarChart, Settings 
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', icon: Home, label: 'Beranda' },
  { path: '/santri', icon: Users, label: 'Kesantrian' },
  { path: '/akademik', icon: GraduationCap, label: 'Akademik' },
  { path: '/finance', icon: Wallet, label: 'Keuangan' },
  { path: '/inventory', icon: ArchiveRestore, label: 'Koperasi' },
  { path: '/asrama', icon: Building2, label: 'Asrama' },
  { path: '/hr', icon: Briefcase, label: 'Kepegawaian' },
  { path: '/laporan', icon: FileBarChart, label: 'Laporan' },
];

export function Sidebar() {
  const { user } = useAuthStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r" style={{ borderRadius: '0', borderRightColor: 'var(--border-light)' }}>
      <div className="flex items-center justify-center h-16 border-b" style={{ borderColor: 'var(--border-light)' }}>
        <h2 className="text-xl font-bold bg-clip-text" style={{ color: 'var(--color-primary)' }}>
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
              // Inline styling helper untuk mengakomodasi CSS variables
              style={({ isActive }) => isActive ? { 
                backgroundColor: 'var(--color-primary)', 
                color: 'var(--text-inverse)',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
              } : {}}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 w-full p-4 border-t" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-app)' }}>
        <NavLink 
           to="/settings"
           className="flex items-center gap-3 px-3 py-2 rounded-md text-muted hover:text-primary transition-colors font-medium"
        >
          <Settings className="w-5 h-5" />
          <span>Pengaturan</span>
        </NavLink>
        <div className="mt-4 pt-3 border-t flex flex-col gap-1" style={{ borderColor: 'var(--border-light)' }}>
          <span className="text-sm font-semibold truncate">{user?.name || 'Admin User'}</span>
          <span className="badge badge-success self-start" style={{ fontSize: '0.65rem' }}>
            {user?.role || 'SUPERADMIN'}
          </span>
        </div>
      </div>
    </aside>
  );
}
