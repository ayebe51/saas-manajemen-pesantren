import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Users, UserCheck, Wallet, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface DashboardStats {
  totalSantri: number;
  activeIzin: number;
  financialRevenue?: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.data?.data) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Santri Aktif',
      value: stats?.totalSantri || 0,
      icon: Users,
      trend: '+2.5%',
      trendUp: true,
      color: 'bg-primary',
    },
    {
      title: 'Santri Izin (Luar Asrama)',
      value: stats?.activeIzin || 0,
      icon: UserCheck,
      trend: '-1.2%',
      trendUp: false,
      color: 'bg-accent',
    },
    {
      title: 'Pemasukan Bulan Ini',
      value: `Rp ${(stats?.financialRevenue || 0).toLocaleString('id-ID')}`,
      icon: Wallet,
      trend: '+12.5%',
      trendUp: true,
      color: 'bg-success',
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Ringkasan Portofolio</h1>
          <p className="text-muted text-sm mt-1">Perkembangan asrama dan indikator pesantren harian.</p>
        </div>
        <button className="btn btn-primary">Unduh Laporan</button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Activity className="w-8 h-8 animate-spin text-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, idx) => (
            <div key={idx} className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-default">
              
              {/* Decorative Glow blob */}
              <div 
                className={clsx('absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 filter blur-2xl transition-all duration-500 group-hover:scale-150', `text-${card.color.split('-')[1]}`)}
                style={{ backgroundColor: `var(--color-${card.color.split('-')[1]})` }}
              />

              <div className="flex justify-between items-start mb-4">
                <div 
                  className="p-3 rounded-xl inline-flex" 
                  style={{ backgroundColor: `rgba(var(--color-${card.color.split('-')[1]}-rgb, 79, 70, 229), 0.1)`, color: `var(--color-${card.color.split('-')[1]})` }}
                >
                  <card.icon className="w-6 h-6" />
                </div>
                <div className={clsx(
                  'flex items-center gap-1 text-sm font-semibold',
                  card.trendUp ? 'text-success' : 'text-danger'
                )}>
                  {card.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                  {card.trend}
                </div>
              </div>
              
              <h3 className="text-3xl font-bold mb-1">{card.value}</h3>
              <p className="text-sm font-medium text-muted">{card.title}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart Placeholder / Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="glass-panel p-6 lg:col-span-2 min-h-[300px] flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
             <div className="text-center z-10 relative">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: 'var(--color-primary)' }}/>
                <h3 className="text-lg font-semibold text-muted">Grafik Pertumbuhan Santri Baru</h3>
                <p className="text-sm text-muted opacity-60">Menunggu integrasi Recharts.js</p>
             </div>
        </div>

        <div className="glass-panel p-6 min-h-[300px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
             Notifikasi Terbaru
          </h3>
          <div className="space-y-4">
            {[1,2,3].map((v) => (
               <div key={v} className="flex gap-3 pb-4 border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
                 <div className="w-2 h-2 mt-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }}></div>
                 <div>
                    <p className="text-sm font-medium">Santri Budi Izin Pulang</p>
                    <p className="text-xs text-muted mt-1">2 Menit yang lalu</p>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
