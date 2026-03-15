import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { LogOut, Bell, Search, Menu, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function Header() {
  const { logout } = useAuthStore();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dummyNotifications = [
    { id: 1, title: 'Pembayaran Diterima', desc: 'SPP Bulan Maret untuk Ananda Budi telah lunas.', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', time: '10 menit yang lalu' },
    { id: 2, title: 'Izin Pulang', desc: 'Ahmad mengajukan izin pulang (Sakit).', icon: Clock, color: 'text-warning', bg: 'bg-warning/10', time: '1 jam yang lalu' },
    { id: 3, title: 'Rekam Medis', desc: 'Santri Ciko tercatat di Klinik (Demam).', icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', time: '2 jam yang lalu' },
    { id: 4, title: 'Pengumuman Sistem', desc: 'Update sistem ke versi 1.2 berahasil.', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', time: 'Kemarin' },
  ];

  return (
    <header className="h-16 glass-panel border-b sticky top-0 z-40 flex items-center justify-between px-6 rounded-none border-light">
      {/* Left Area: Mobile Menu & Search */}
      <div className="flex items-center gap-4">
        <button 
          title="Toggle Menu" 
          className="md:hidden text-muted hover:text-primary transition-colors"
          onClick={() => toast('Menu mobile akan segera hadir', { icon: '📱' })}
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="Pencarian cepat (NISN, Nama)..." 
            className="input-base pl-10 h-10 w-64 md:w-80 rounded-full bg-app"
          />
        </div>
      </div>

      {/* Right Area: Actions & Profile */}
      <div className="flex items-center gap-4">
        
        <div className="relative" ref={notifRef}>
          <button 
            title="Notifikasi" 
            className="relative p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-surface-glass"
            onClick={() => setShowNotif(!showNotif)}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-white animate-pulse"></span>
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-panel border border-light rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-light flex items-center justify-between bg-surface-glass">
                <h3 className="font-bold text-sm">Notifikasi</h3>
                <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Tandai semua dibaca</span>
              </div>
              <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                {dummyNotifications.map((n) => (
                  <div key={n.id} className="p-4 border-b border-light last:border-0 hover:bg-surface-glass transition-colors cursor-pointer flex gap-3">
                    <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${n.bg} ${n.color}`}>
                      <n.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-main truncate">{n.title}</p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.desc}</p>
                      <p className="text-[10px] text-muted font-medium mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-light text-center bg-surface-glass">
                <button className="text-xs text-primary font-medium hover:underline p-1">Lihat Semua Notifikasi</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px mx-2 bg-light"></div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity p-2 rounded-md hover:bg-surface-glass text-danger"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
