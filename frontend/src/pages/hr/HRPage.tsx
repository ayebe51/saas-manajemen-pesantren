import React, { useState } from 'react';
import { Search, UserPlus, Briefcase, CalendarClock, Phone } from 'lucide-react';
import clsx from 'clsx';

const dummyPegawai = [
  { id: '1', name: 'Ust. Abdul Somad, Lc.', role: 'Kepala Kepesantrenan', nip: '198002022010', status: 'HADIR' },
  { id: '2', name: 'Ust. Fahmi Amrullah', role: 'Musyrif Asrama', nip: '199201152015', status: 'CUTI' },
  { id: '3', name: 'Siti Maryam, S.Pd', role: 'Guru Umum (Matematika)', nip: '198511202008', status: 'HADIR' },
];

export function HRPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Manajemen SDM & Asatidz</h1>
          <p className="text-muted text-sm mt-1">Sistem informasi presensi dan data kepegawaian yayasan.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="btn btn-primary flex-1 sm:flex-none shadow-glow">
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden mt-6">
         <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-light)' }}>
           <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Cari Nama Pegawai atau NIP..."
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
                     <th className="py-4 px-6 font-semibold text-sm text-muted">Nama Pegawai & Kontak</th>
                     <th className="py-4 px-6 font-semibold text-sm text-muted">Jabatan Terdaftar</th>
                     <th className="py-4 px-6 font-semibold text-sm text-muted">Presensi Harian</th>
                     <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Rekam Jejak</th>
                  </tr>
               </thead>
               <tbody>
                  {dummyPegawai.map((row) => (
                     <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors" style={{ borderColor: 'var(--border-light)' }}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                              {row.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                               <span className="font-semibold text-sm">{row.name}</span>
                               <span className="text-xs text-muted flex items-center gap-1 mt-1">
                                 <Briefcase className="w-3 h-3" /> NIP. {row.nip}
                               </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">{row.role}</td>
                        <td className="py-4 px-6">
                           <span className={clsx('badge', row.status === 'HADIR' ? 'badge-success' : 'badge-warning')}>
                             {row.status === 'HADIR' ? 'Hadir (Check-In)' : 'Sedang Cuti'}
                           </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                           <button className="btn btn-outline py-1.5 px-3 text-xs flex items-center gap-2 ml-auto" title="Log Absensi & Gaji">
                             <CalendarClock className="w-3 h-3" /> Log
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
      
    </div>
  );
}
