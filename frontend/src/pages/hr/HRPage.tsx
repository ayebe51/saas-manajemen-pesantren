import { useState, useEffect } from 'react';
import { Search, UserPlus, Briefcase, CalendarClock, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';
import clsx from 'clsx';

interface Employee {
  id: string;
  name: string;
  role: string;
  nip: string;
  status: string;
}

export function HRPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employee');
      setEmployees(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch employees', error);
      // Empty State: Fallback to dummy data removed
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (emp.nip && emp.nip.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Manajemen SDM & Asatidz</h1>
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
         <div className="p-4 border-b flex justify-between items-center border-light">
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
            {loading ? (
               <div className="p-12 flex justify-center items-center flex-col text-muted">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p>Memuat rekam data asatidz & pegawai...</p>
               </div>
            ) : filteredData.length === 0 ? (
               <div className="p-12 flex justify-center items-center flex-col text-muted">
                  <Activity className="w-12 h-12 mb-4 opacity-50" />
                  <p>Belum ada data pegawai yang terdaftar.</p>
               </div>
            ) : (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-light bg-app">
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Nama Pegawai & Kontak</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Jabatan Terdaftar</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Status Aktif</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Rekam Jejak</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredData.map((row) => (
                       <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold bg-primary-light text-primary">
                                {row.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                 <span className="font-semibold text-sm">{row.name}</span>
                                 <span className="text-xs text-muted flex items-center gap-1 mt-1">
                                   <Briefcase className="w-3 h-3" /> NIP. {row.nip || '-'}
                                 </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm">{row.role}</td>
                          <td className="py-4 px-6">
                             <span className={clsx('badge', row.status === 'ACTIVE' ? 'badge-success' : 'badge-warning')}>
                               {row.status}
                             </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <button className="btn btn-outline py-1.5 px-3 text-xs flex items-center gap-2 ml-auto" title="Log Absensi & Gaji">
                               <CalendarClock className="w-3 h-3" /> Rekam Gaji
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            )}
         </div>
      </div>
      
    </div>
  );
}
