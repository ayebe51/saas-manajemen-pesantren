import { useState, useEffect } from 'react';
import { Search, BookOpen, GraduationCap, Award, FileText, ArrowRight, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';
import { format } from 'date-fns';
import clsx from 'clsx';

interface TahfidzItem {
  id: string;
  santri: { name: string; kelas: string };
  surah: string;
  ayat: string;
  type: string;
  grade: string;
  date: string;
}

export function AkademikPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tahfidz' | 'jadwal' | 'nilai'>('tahfidz');
  const [tahfidzList, setTahfidzList] = useState<TahfidzItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTahfidz();
  }, []);

  const fetchTahfidz = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tahfidz');
      setTahfidzList(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch tahfidz', error);
      // Empty State
      setTahfidzList([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = tahfidzList.filter(item => 
    item.santri?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Akademik & Penilaian</h1>
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
      <div className="flex border-b border-light">
         <button 
           onClick={() => setActiveTab('tahfidz')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2',
             activeTab === 'tahfidz' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
         >
           <BookOpen className="w-4 h-4" /> Mutaba'ah Tahfidz
         </button>
         <button 
           onClick={() => setActiveTab('jadwal')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2',
             activeTab === 'jadwal' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
         >
           <GraduationCap className="w-4 h-4" /> Jadwal Kegiatan
         </button>
         <button 
           onClick={() => setActiveTab('nilai')}
           className={clsx(
             'px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2',
             activeTab === 'nilai' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
           )}
         >
           <Award className="w-4 h-4" /> Distribusi Nilai
         </button>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel overflow-hidden animate-in fade-in duration-300">
         <div className="p-4 border-b flex justify-between items-center border-light">
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
              loading ? (
                <div className="p-12 flex justify-center items-center flex-col text-muted">
                   <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                   <p>Memuat rekam hafalan santri...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-12 flex justify-center items-center flex-col text-muted">
                   <Activity className="w-12 h-12 mb-4 opacity-50" />
                   <p>Belum ada rincian setoran hafalan yang terdaftar.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-light bg-app">
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Santri Penghafal</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Surah / Juz Terakhir</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Predikat Hafalan</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted">Waktu Setoran</th>
                         <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Murojaah</th>
                      </tr>
                   </thead>
                   <tbody>
                      {filteredData.map((row) => (
                         <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-sm">{row.santri?.name}</div>
                              <div className="text-xs text-muted">Kelas {row.santri?.kelas || '-'}</div>
                            </td>
                            <td className="py-4 px-6">
                               <div className="font-medium">{row.surah}</div>
                               <div className="text-xs text-muted">Ayat {row.ayat} ({row.type})</div>
                            </td>
                            <td className="py-4 px-6">
                               <span className={clsx(
                                 'badge',
                                 row.grade === 'LANCAR' || row.grade === 'MUMTAZ' ? 'badge-success' : 'badge-warning'
                               )}>
                                 {row.grade}
                               </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-muted">
                               {format(new Date(row.date), 'dd MMM yyyy, HH:mm')}
                            </td>
                            <td className="py-4 px-6 text-right">
                               <button title="Aksi Akademik" className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors">
                                 <ArrowRight className="w-4 h-4" />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              )
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
