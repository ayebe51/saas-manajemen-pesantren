import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Users, Wallet, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

interface DashboardStats {
  kpi: {
    totalSantri: number;
    koperasiIncomeThisMonth: number;
    totalIzinThisMonth: number;
    izinPending: number;
  };
  chartData: {
    date: string;
    Koperasi: number;
    TopUp: number;
  }[];
}
export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/foundation');
        setStats(res.data);
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
      value: stats?.kpi?.totalSantri || 0,
      icon: Users,
      trend: 'Live',
      trendUp: true,
      color: 'primary',
    },
    {
      title: 'Izin Tertunda / Menunggu',
      value: stats?.kpi?.izinPending || 0,
      icon: Activity,
      trend: `${stats?.kpi?.totalIzinThisMonth || 0} Total Izin`,
      trendUp: false,
      color: 'warning',
    },
    {
      title: 'Omzet Koperasi Bulan Ini',
      value: `Rp ${(stats?.kpi?.koperasiIncomeThisMonth || 0).toLocaleString('id-ID')}`,
      icon: Wallet,
      trend: 'Akumulasi Transaksi POS',
      trendUp: true,
      color: 'success',
    }
  ];

  const getColorClass = (color: string) => {
     switch(color) {
       case 'primary': return 'text-primary bg-primary/10';
       case 'warning': return 'text-warning bg-warning/10';
       case 'success': return 'text-success bg-success/10';
       default: return 'text-primary bg-primary/10';
     }
  };

  const getGlowClass = (color: string) => {
     switch(color) {
       case 'primary': return 'bg-primary text-primary';
       case 'warning': return 'bg-warning text-warning';
       case 'success': return 'bg-success text-success';
       default: return 'bg-primary text-primary';
     }
  };

  return (
    <div className="space-y-6">
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
                className={clsx('absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 filter blur-2xl transition-all duration-500 group-hover:scale-150', getGlowClass(card.color))}
              />

              <div className="flex justify-between items-start mb-4">
                <div 
                  className={clsx('p-3 rounded-xl inline-flex', getColorClass(card.color))}
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
        <div className="glass-panel p-6 lg:col-span-2 min-h-[350px]">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                 Tren Pendapatan Harian (7 Hari Terakhir)
             </h3>
             <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorKoperasi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTopup" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <YAxis 
                      tick={{fontSize: 12}} 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="#94A3B8"
                      tickFormatter={(value) => `Rp${value/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => `Rp ${Number(value).toLocaleString()}`}
                    />
                    <Area type="monotone" dataKey="TopUp" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTopup)" />
                    <Area type="monotone" dataKey="Koperasi" stroke="#22C55E" fillOpacity={1} fill="url(#colorKoperasi)" />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
        </div>

        <div className="glass-panel p-6 min-h-[300px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
             Notifikasi Terbaru
          </h3>
          <div className="space-y-4">
            {[1,2,3].map((v) => (
               <div key={v} className="flex gap-3 pb-4 border-b last:border-0 border-light">
                 <div className="w-2 h-2 mt-2 rounded-full flex-shrink-0 bg-accent"></div>
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
