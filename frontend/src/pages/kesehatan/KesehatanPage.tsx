import { useState, useEffect } from 'react';
import { Heart, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';

interface HealthRecord { id: string; santri?: { name: string }; diagnosis: string; treatment: string; notes: string; severity: string; createdAt: string; }

export function KesehatanPage() {
  const [data, setData] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kesehatan/records');
      setData(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch { setData([]); } finally { setLoading(false); }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH': case 'CRITICAL': return <span className="badge badge-danger">Kritis</span>;
      case 'MEDIUM': return <span className="badge badge-warning">Sedang</span>;
      default: return <span className="badge badge-success">Ringan</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Rekam Medis & Kesehatan</h1>
        <p className="text-muted text-sm mt-1">Catatan kesehatan, diagnosa, dan riwayat pengobatan santri.</p>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" /><p>Memuat data kesehatan...</p></div>
        ) : data.length === 0 ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada rekam medis.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-light bg-app">
                <th className="py-4 px-6 font-semibold text-sm text-muted">Santri</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Diagnosa</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Penanganan</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Tingkat</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Tanggal</th>
              </tr></thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                    <td className="py-4 px-6 font-medium text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-danger" />{row.santri?.name || '-'}</td>
                    <td className="py-4 px-6 text-sm">{row.diagnosis}</td>
                    <td className="py-4 px-6 text-sm">{row.treatment || '-'}</td>
                    <td className="py-4 px-6">{getSeverityBadge(row.severity)}</td>
                    <td className="py-4 px-6 text-sm text-muted">{new Date(row.createdAt).toLocaleDateString('id-ID')}</td>
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
