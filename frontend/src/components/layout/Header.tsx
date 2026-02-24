import React from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { LogOut, Bell, Search, Menu } from 'lucide-react';

export function Header() {
  const { logout } = useAuthStore();

  return (
    <header className="h-16 glass-panel border-b sticky top-0 z-40 flex items-center justify-between px-6" style={{ borderRadius: '0', borderBottomColor: 'var(--border-light)' }}>
      {/* Left Area: Mobile Menu & Search */}
      <div className="flex items-center gap-4">
        <button className="md:hidden text-muted hover:text-primary transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="Pencarian cepat (NISN, Nama)..." 
            className="input-base pl-10 h-10 w-64 md:w-80" 
            style={{ borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-app)' }}
          />
        </div>
      </div>

      {/* Right Area: Actions & Profile */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-surface-glass">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-white" style={{ backgroundColor: 'var(--color-danger)' }}></span>
        </button>
        
        <div className="h-8 w-px bg-light mx-2" style={{ backgroundColor: 'var(--border-light)' }}></div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium text-danger hover:opacity-80 transition-opacity p-2 rounded-md hover:bg-surface-glass"
          style={{ color: 'var(--color-danger)' }}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
