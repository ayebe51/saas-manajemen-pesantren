import React, { useState } from 'react';
import { Wallet, Search, ArrowUpRight, ArrowDownRight, RefreshCcw, PlusCircle, CreditCard, History } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

// Dummy data for visual presentation while API is integrated
const dummyWallets = [
  { id: '1', santriName: 'Ahmad Dahlan', nisn: '10029302', balance: 450000, lastTrx: 'Top Up Harian', date: new Date().toISOString() },
  { id: '2', santriName: 'Siti Aminah', nisn: '10029303', balance: 125000, lastTrx: 'Koperasi (Snack)', date: new Date().toISOString() },
  { id: '3', santriName: 'Budi Santoso', nisn: '10029304', balance: 850000, lastTrx: 'Pembayaran LKS', date: new Date().toISOString() },
];

const dummyTransactions = [
  { id: 't1', type: 'IN', amount: 500000, desc: 'Suntikan Dana Wali', date: new Date().toISOString(), by: 'Admin TU' },
  { id: 't2', type: 'OUT', amount: 15000, desc: 'Kantin Pusat', date: new Date().toISOString(), by: 'Sistem POS' },
  { id: 't3', type: 'OUT', amount: 25000, desc: 'Koperasi Kitab', date: new Date().toISOString(), by: 'Sistem POS' },
];

export function WalletPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Dompet Digital Santri</h1>
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
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl z-0" style={{ backgroundColor: 'var(--color-primary)' }}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-muted">Total Dana Mengendap</span>
            </div>
            <h3 className="text-3xl font-bold mt-4">Rp 1.425.000</h3>
            <p className="text-xs text-success mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Terisi Rp 500rb hari ini
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl z-0" style={{ backgroundColor: 'var(--color-accent)' }}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent/10 rounded-lg text-accent" style={{ backgroundColor: 'rgba(var(--color-accent-rgb), 0.1)', color: 'var(--color-accent)' }}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-muted">Sirkulasi Koperasi (Harian)</span>
            </div>
            <h3 className="text-3xl font-bold mt-4">Rp 350.500</h3>
            <p className="text-xs text-muted mt-2 flex items-center gap-1">
              142 Transaksi POS berhasil
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-light)' }}>
         <button 
           onClick={() => setActiveTab('overview')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2',
             activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
           style={activeTab === 'overview' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
         >
           Direktori Akun
         </button>
         <button 
           onClick={() => setActiveTab('history')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2',
             activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
           style={activeTab === 'history' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
         >
           Riwayat Mutasi Global
         </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' ? (
        <div className="glass-panel overflow-hidden animate-in fade-in duration-300">
           <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-light)' }}>
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
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-app)' }}>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Pemilik Akun (Santri)</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">NISN</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Saldo Tersedia</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Aktivitas Terakhir</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Opsi</th>
                    </tr>
                 </thead>
                 <tbody>
                    {dummyWallets.map((wallet) => (
                       <tr key={wallet.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors" style={{ borderColor: 'var(--border-light)' }}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                                {wallet.santriName.charAt(0)}
                              </div>
                              <span className="font-semibold text-sm">{wallet.santriName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium">{wallet.nisn}</td>
                          <td className="py-4 px-6 font-bold text-lg" style={{ color: 'var(--color-success)' }}>
                             Rp {wallet.balance.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-sm">
                             <div>{wallet.lastTrx}</div>
                             <div className="text-xs text-muted">{format(new Date(wallet.date), 'dd MMM yyyy, HH:mm')}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <button className="btn btn-outline py-1.5 px-3 text-xs">Kelola Saldo</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden animate-in fade-in duration-300">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-app)' }}>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Waktu Transaksi</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Keterangan</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Tipe</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Nominal</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Otorisator</th>
                    </tr>
                 </thead>
                 <tbody>
                    {dummyTransactions.map((trx) => (
                       <tr key={trx.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors" style={{ borderColor: 'var(--border-light)' }}>
                          <td className="py-4 px-6 text-sm">
                             {format(new Date(trx.date), 'dd MMM yyyy, HH:mm')}
                          </td>
                          <td className="py-4 px-6 text-sm font-medium">{trx.desc}</td>
                          <td className="py-4 px-6">
                             <span className={clsx('badge', trx.type === 'IN' ? 'badge-success' : 'badge-danger')}>
                               {trx.type === 'IN' ? 'Uang Masuk' : 'Uang Keluar'}
                             </span>
                          </td>
                          <td className={clsx('py-4 px-6 font-bold', trx.type === 'IN' ? 'text-success' : 'text-danger')}>
                             {trx.type === 'IN' ? '+' : '-'} Rp {trx.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-sm text-muted">{trx.by}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

    </div>
  );
}
