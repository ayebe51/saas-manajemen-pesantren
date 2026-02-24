import React, { useState } from 'react';
import { Search, BookOpen, GraduationCap, Award, FileText, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

const dummyTahfidz = [
  { id: '1', santriName: 'Ahmad Dahlan', kelas: '12', surah: 'Al-Baqarah', ayat: '1-141', juz: 2, status: 'LANCAR', date: '2023-10-25' },
  { id: '2', santriName: 'Siti Aminah', kelas: '11', surah: 'An-Nisa', ayat: '1-50', juz: 4, status: 'MENGULANG', date: '2023-10-25' },
  { id: '3', santriName: 'Budi Santoso', kelas: '10', surah: 'Juz Amma', ayat: 'Lengkap', juz: 30, status: 'MUMTAZ', date: '2023-10-24' },
];

export function AkademikPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tahfidz' | 'jadwal' | 'nilai'>('tahfidz');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Akademik & Penilaian</h1>
          <p className="text-muted text-sm mt-1">Pusat mutaba'ah hafalan (Tahfidz), jadwal diniyah, dan rapor ujian.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="btn btn-outline flex-1 sm:flex-none">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak Rapor</span>
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none shadow-glow">
            <BookOpen className="w-4 h-4" />
            <span>Input Setoran</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-light)' }}>
         <button 
           onClick={() => setActiveTab('tahfidz')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2',
             activeTab === 'tahfidz' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
           style={activeTab === 'tahfidz' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
         >
           <BookOpen className="w-4 h-4" /> Mutaba'ah Tahfidz
         </button>
         <button 
           onClick={() => setActiveTab('jadwal')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2',
             activeTab === 'jadwal' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
           style={activeTab === 'jadwal' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
         >
           <GraduationCap className="w-4 h-4" /> Jadwal Kegiatan
         </button>
         <button 
           onClick={() => setActiveTab('nilai')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2',
             activeTab === 'nilai' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
           style={activeTab === 'nilai' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
         >
           <Award className="w-4 h-4" /> Distribusi Nilai
         </button>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel overflow-hidden animate-in fade-in duration-300">
         <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-light)' }}>
           <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Cari Santri atau Halaqah..."
                className="input-base pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
           </div>
         </div>
         
         <div className="overflow-x-auto">
            {activeTab === 'tahfidz' ? (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-app)' }}>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Santri Penghafal</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Surah / Juz Terakhir</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Predikat Hafalan</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Waktu Setoran</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Murojaah</th>
                    </tr>
                 </thead>
                 <tbody>
                    {dummyTahfidz.map((row) => (
                       <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors" style={{ borderColor: 'var(--border-light)' }}>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-sm">{row.santriName}</div>
                            <div className="text-xs text-muted">Kelas {row.kelas}</div>
                          </td>
                          <td className="py-4 px-6">
                             <div className="font-medium">{row.surah}</div>
                             <div className="text-xs text-muted">Ayat {row.ayat} (Juz {row.juz})</div>
                          </td>
                          <td className="py-4 px-6">
                             <span className={clsx(
                               'badge',
                               row.status === 'LANCAR' || row.status === 'MUMTAZ' ? 'badge-success' : 'badge-warning'
                             )}>
                               {row.status}
                             </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-muted">
                             Hari Ini, 05:30 WIB
                          </td>
                          <td className="py-4 px-6 text-right">
                             <button className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors" style={{ color: 'var(--color-primary)' }}>
                               <ArrowRight className="w-4 h-4" />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            ) : (
               <div className="p-12 text-center text-muted">
                  Konstruksi modul antarmuka {activeTab} sedang menanti integrasi data relasional (*Mockup*).
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
