import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface Registration {
  id: string;
  childName: string;
  parentName: string;
  parentPhone: string;
  previousSchool: string;
  status: string;
  createdAt: string;
}

export function PpdbPage() {
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchData(); }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/ppdb${params}`);
      setData(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/ppdb/${id}`, { status });
      toast.success(`Status pendaftar berhasil diubah ke ${status}`);
      fetchData();
    } catch { toast.error('Gagal mengubah status'); }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED': return <span className="badge badge-success">Diterima</span>;
      case 'REJECTED': return <span className="badge badge-danger">Ditolak</span>;
      case 'INTERVIEW': return <span className="badge bg-accent/20 text-accent">Wawancara</span>;
      default: return <span className="badge badge-warning">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">PPDB — Penerimaan Peserta Didik Baru</h1>
          <p className="text-muted text-sm mt-1">Kelola pendaftaran calon santri baru pesantren.</p>
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-wrap gap-4 items-center">
        <select className="input-base py-2 w-auto min-w-[160px]" title="Filter Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="INTERVIEW">Wawancara</option>
          <option value="ACCEPTED">Diterima</option>
          <option value="REJECTED">Ditolak</option>
        </select>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" /><p>Memuat data pendaftar...</p></div>
        ) : data.length === 0 ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada data pendaftar PPDB.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-light bg-app">
                <th className="py-4 px-6 font-semibold text-sm text-muted">Nama Calon Santri</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Wali / Kontak</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Asal Sekolah</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Status</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Aksi</th>
              </tr></thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                    <td className="py-4 px-6 font-medium text-sm">{row.childName}</td>
                    <td className="py-4 px-6 text-sm"><div>{row.parentName}</div><div className="text-xs text-muted">{row.parentPhone}</div></td>
                    <td className="py-4 px-6 text-sm">{row.previousSchool || '-'}</td>
                    <td className="py-4 px-6">{getStatusBadge(row.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleUpdateStatus(row.id, 'ACCEPTED')} className="p-1.5 text-muted hover:text-success transition-colors rounded-md hover:bg-surface-glass" title="Terima"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleUpdateStatus(row.id, 'REJECTED')} className="p-1.5 text-muted hover:text-danger transition-colors rounded-md hover:bg-surface-glass" title="Tolak"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
