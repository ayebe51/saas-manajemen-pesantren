import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, QrCode, FileText, CheckCircle, XCircle, Clock, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';
import { format } from 'date-fns';

import { useNavigate } from 'react-router-dom';

interface Izin {
  id: string;
  santri: { name: string };
  type: string;
  reason: string;
  startAt: string;
  endAt: string;
  status: string;
  approvedBy: string | null;
}

export function PerizinanPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [izinList, setIzinList] = useState<Izin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIzin = useCallback(async () => {
    setLoading(true);
    try {
      const query = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/izin${query}`);
      setIzinList(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch izin', error);
      // Empty State
      setIzinList([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchIzin();
  }, [fetchIzin]);

  const filteredIzin = izinList.filter(i => 
    i.santri?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED_WAITING_CHECKOUT': return <span className="badge badge-success bg-opacity-20 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Disetujui (Siap Jalan)</span>;
      case 'PENDING_POSKESTREN': return <span className="badge badge-warning bg-opacity-20 flex items-center gap-1 text-orange-600"><Clock className="w-3 h-3" /> Wait: Poskestren</span>;
      case 'PENDING_MUSYRIF': return <span className="badge badge-warning bg-opacity-20 flex items-center gap-1"><Clock className="w-3 h-3" /> Wait: Musyrif</span>;
      case 'REJECTED': return <span className="badge badge-danger bg-opacity-20 flex items-center gap-1"><XCircle className="w-3 h-3" /> Ditolak</span>;
      case 'CHECKED_OUT': return <span className="badge bg-indigo-500/20 text-indigo-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Di Luar Asrama</span>;
      case 'CHECKED_IN': return <span className="badge bg-slate-500/20 text-slate-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Selesai (Kembali)</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Pusat Perizinan Asrama</h1>
          <p className="text-muted text-sm mt-1">Sistem *Gatepass* dan pemantauan keluar-masuk santri.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
             onClick={() => navigate('/asrama/scan')}
             className="btn btn-outline flex-1 sm:flex-none"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Scan QR Satpam</span>
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none shadow-glow">
            <Plus className="w-4 h-4" />
            <span>Buat Surat Izin</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Cari Nama Santri atau Keterangan..."
            className="input-base pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="input-base w-full md:w-48 bg-transparent text-sm cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="PENDING_POSKESTREN">Menunggu Poskestren</option>
            <option value="PENDING_MUSYRIF">Menunggu Musyrif</option>
            <option value="APPROVED_WAITING_CHECKOUT">Sudah Disetujui (Valid)</option>
            <option value="CHECKED_OUT">Berada di Luar Asrama</option>
            <option value="CHECKED_IN">Selesai / Kembali</option>
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
           <div className="overflow-x-auto">
              {loading ? (
                 <div className="p-12 flex justify-center items-center flex-col text-muted">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                    <p>Memuat rekam data perizinan...</p>
                 </div>
              ) : filteredIzin.length === 0 ? (
                 <div className="p-12 flex justify-center items-center flex-col text-muted">
                    <Activity className="w-12 h-12 mb-4 opacity-50" />
                    <p>Belum ada data izin yang diajukan.</p>
                 </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-light bg-app">
                      <th className="py-4 px-6 font-semibold text-sm text-muted">Pemohon (Santri)</th>
                      <th className="py-4 px-6 font-semibold text-sm text-muted">Keterangan / Alasan</th>
                      <th className="py-4 px-6 font-semibold text-sm text-muted">Durasi & Waktu</th>
                      <th className="py-4 px-6 font-semibold text-sm text-muted">Status Izin</th>
                      <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Aksi Eksekusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIzin.map((row) => (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs bg-primary-light text-primary">
                              {row.santri?.name?.charAt(0) || '-'}
                            </div>
                            <div className="flex flex-col">
                               <span className="font-semibold text-sm">{row.santri?.name}</span>
                               <span className="text-xs text-muted">{row.type === 'PULANG' ? 'Izin Pulang' : 'Luar Komplek'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm max-w-xs truncate" title={row.reason}>
                          {row.reason}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{format(new Date(row.startAt), 'dd/MM/yy HH:mm')}</span>
                            <span className="text-xs text-muted">s.d {format(new Date(row.endAt), 'dd/MM/yy HH:mm')}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {renderStatusBadge(row.status)}
                          {row.approvedBy && <div className="text-[10px] text-muted mt-1 uppercase">Oleh: {row.approvedBy}</div>}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(row.status === 'PENDING_POSKESTREN' || row.status === 'PENDING_MUSYRIF') && (
                              <>
                                 <button className="btn btn-primary py-1 px-3 text-xs bg-success border-success" title="Setujui (Approve)">Setujui</button>
                                 <button className="btn btn-outline py-1 px-3 text-xs hover:bg-danger/10 hover:text-danger hover:border-danger" title="Tolak (Reject)">Tolak</button>
                              </>
                            )}
                            {(row.status === 'APPROVED_WAITING_CHECKOUT' || row.status === 'CHECKED_OUT') && (
                              <button className="btn btn-outline py-1 px-3 text-xs flex items-center gap-1" title="Cetak Surat Jalan Gatepass">
                                 <FileText className="w-3 h-3" /> Cetak
                              </button>
                            )}
                          </div>
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
