import { useState, useEffect } from 'react';
import { Wallet, Search, ArrowUpRight, RefreshCcw, PlusCircle, CreditCard, History, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';
import clsx from 'clsx';
import { format } from 'date-fns';

interface WalletAccount {
  id: string;
  santri: { name: string; nisn: string };
  balance: number;
  isActive: boolean;
  updatedAt: string;
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  handledBy: string;
  createdAt: string;
}

export function WalletPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resWallets, resTrx] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/transactions')
      ]);
      setWallets(resWallets.data.data || resWallets.data || []);
      setTransactions(resTrx.data.data || resTrx.data || []);
    } catch (error) {
      console.error('Failed to fetch wallet data', error);
      // Empty State: Tidak melakukan assignment data fallback statis lagi
      setWallets([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWallets = wallets.filter(w => 
    w.santri?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.santri?.nisn?.includes(searchTerm)
  );

  const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);
  const totalTrxVolume = transactions.reduce((acc, curr) => curr.type === 'PAYMENT' || curr.type === 'WITHDRAWAL' ? acc + curr.amount : acc, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Dompet Digital Santri</h1>
          <p className="text-muted text-sm mt-1">Sistem Tabungan *Cashless* & Riwayat Transaksi Koperasi.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="btn btn-outline flex-1 sm:flex-none">
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Sinkronisasi</span>
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none shadow-glow">
            <PlusCircle className="w-4 h-4" />
            <span>Top-up Saldo</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl z-0 bg-primary"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary bg-primary-light text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-muted">Total Dana Mengendap</span>
            </div>
            <h3 className="text-3xl font-bold mt-4">Rp {totalBalance.toLocaleString('id-ID')}</h3>
            <p className="text-xs text-success mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Tersedia di {wallets.length} dompet santri
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl z-0 bg-accent"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-muted">Sirkulasi Koperasi (Kasir)</span>
            </div>
            <h3 className="text-3xl font-bold mt-4">Rp {totalTrxVolume.toLocaleString('id-ID')}</h3>
            <p className="text-xs text-muted mt-2 flex items-center gap-1">
              {transactions.length} Transaksi Tercatat
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-light">
         <button 
           onClick={() => setActiveTab('overview')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2',
             activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
         >
           Direktori Akun
         </button>
         <button 
           onClick={() => setActiveTab('history')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2',
             activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
         >
           Riwayat Mutasi Global
         </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' ? (
        <div className="glass-panel overflow-hidden animate-in fade-in duration-300">
           <div className="p-4 border-b flex justify-between items-center border-light">
             <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Cari Santri atau NISN..."
                  className="input-base pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
             </div>
           </div>
           
           <div className="overflow-x-auto">
              {loading ? (
                 <div className="p-12 flex justify-center items-center flex-col text-muted">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                    <p>Memuat rekam data dompet digital...</p>
                 </div>
              ) : filteredWallets.length === 0 ? (
                 <div className="p-12 flex justify-center items-center flex-col text-muted">
                    <Activity className="w-12 h-12 mb-4 opacity-50" />
                    <p>Belum ada santri yang memiliki akun dompet aktif.</p>
                 </div>
              ) : (
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-light bg-app">
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Pemilik Akun (Santri)</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">NISN</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Saldo Tersedia</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Aktivitas Terakhir</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Opsi</th>
                      </tr>
                   </thead>
                   <tbody>
                      {filteredWallets.map((wallet) => (
                         <tr key={wallet.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs bg-primary-light text-primary">
                                  {wallet.santri?.name.charAt(0) || '-'}
                                </div>
                                <span className="font-semibold text-sm">{wallet.santri?.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm font-medium">{wallet.santri?.nisn || '-'}</td>
                            <td className="py-4 px-6 font-bold text-lg text-success">
                               Rp {wallet.balance.toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-6 text-sm">
                               <div className="text-xs text-muted">Update: {format(new Date(wallet.updatedAt), 'dd MMM yyyy, HH:mm')}</div>
                            </td>
                            <td className="py-4 px-6 text-right">
                               <button className="btn btn-outline py-1.5 px-3 text-xs">Kelola Saldo</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden animate-in fade-in duration-300">
           <div className="overflow-x-auto">
              {loading ? (
                 <div className="p-12 flex justify-center items-center flex-col text-muted">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                    <p>Memuat rekam jejak mutasi global...</p>
                 </div>
              ) : transactions.length === 0 ? (
                 <div className="p-12 flex justify-center items-center flex-col text-muted">
                    <History className="w-12 h-12 mb-4 opacity-50" />
                    <p>Belum ada rekaman transasi / mutasi e-Wallet.</p>
                 </div>
              ) : (
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-light bg-app">
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Waktu Transaksi</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Keterangan</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Tipe</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Nominal</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Operator/Sistem</th>
                      </tr>
                   </thead>
                   <tbody>
                      {transactions.map((trx) => (
                         <tr key={trx.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                            <td className="py-4 px-6 text-sm">
                               {format(new Date(trx.createdAt), 'dd MMM yyyy, HH:mm')}
                            </td>
                            <td className="py-4 px-6 text-sm font-medium">{trx.description || '-'}</td>
                            <td className="py-4 px-6">
                               <span className={clsx('badge', trx.type === 'DEPOSIT' ? 'badge-success' : 'badge-danger')}>
                                 {trx.type === 'DEPOSIT' ? 'Uang Masuk (+)' : 'Uang Keluar (-)'}
                               </span>
                            </td>
                            <td className={clsx('py-4 px-6 font-bold', trx.type === 'DEPOSIT' ? 'text-success' : 'text-danger')}>
                               {trx.type === 'DEPOSIT' ? '+' : '-'} Rp {trx.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-6 text-sm text-muted">{trx.handledBy || 'Sistem Oto'}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>
        </div>
      )}

    </div>
  );
}
