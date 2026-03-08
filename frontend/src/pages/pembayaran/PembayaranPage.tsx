import { useState, useEffect } from 'react';
import { Loader2, Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api/client';

interface Invoice {
  id: string;
  santri?: { name: string };
  description: string;
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export function PembayaranPage() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchData(); }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/payments/invoices${params}`);
      setData(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch { setData([]); } finally { setLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return <span className="badge badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Lunas</span>;
      case 'PARTIAL': return <span className="badge badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> Sebagian</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Batal</span>;
      default: return <span className="badge bg-danger/20 text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Belum Bayar</span>;
    }
  };

  const totalTagihan = data.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalLunas = data.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Pembayaran & Tagihan SPP</h1>
        <p className="text-muted text-sm mt-1">Kelola invoice dan status pembayaran santri.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 flex items-center justify-between border-l-4 border-danger">
          <div><div className="text-sm font-semibold text-muted mb-1">Total Tagihan Belum Lunas</div><div className="text-2xl font-bold text-danger">Rp {totalTagihan.toLocaleString('id-ID')}</div></div>
          <AlertCircle className="w-8 h-8 text-danger opacity-50" />
        </div>
        <div className="glass-panel p-5 flex items-center justify-between border-l-4 border-success">
          <div><div className="text-sm font-semibold text-muted mb-1">Total Terbayar</div><div className="text-2xl font-bold text-success">Rp {totalLunas.toLocaleString('id-ID')}</div></div>
          <CheckCircle className="w-8 h-8 text-success opacity-50" />
        </div>
      </div>

      <div className="glass-panel p-4">
        <select className="input-base py-2 w-auto min-w-[160px]" title="Filter Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="UNPAID">Belum Bayar</option>
          <option value="PARTIAL">Sebagian</option>
          <option value="PAID">Lunas</option>
        </select>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" /><p>Memuat data tagihan...</p></div>
        ) : data.length === 0 ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada data tagihan.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-light bg-app">
                <th className="py-4 px-6 font-semibold text-sm text-muted">Santri</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Deskripsi</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Jumlah</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Jatuh Tempo</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Status</th>
              </tr></thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                    <td className="py-4 px-6 font-medium text-sm">{row.santri?.name || '-'}</td>
                    <td className="py-4 px-6 text-sm">{row.description}</td>
                    <td className="py-4 px-6 font-bold text-sm text-primary">Rp {(row.amount || 0).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6 text-sm">{row.dueDate ? new Date(row.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="py-4 px-6">{getStatusBadge(row.status)}</td>
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
