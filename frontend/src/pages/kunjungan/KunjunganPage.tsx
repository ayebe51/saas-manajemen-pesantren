import { useState, useEffect } from 'react';
import { UserCheck, Loader2, Activity, Calendar, Clock } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface Kunjungan {
  id: string;
  santri?: { name: string };
  visitorName: string;
  relation: string;
  scheduledAt: string;
  status: string;
  checkinAt: string | null;
}

export function KunjunganPage() {
  const [data, setData] = useState<Kunjungan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kunjungan');
      setData(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleCheckin = async (id: string, visitorName: string) => {
    try {
      await api.post(`/kunjungan/${id}/checkin`, { visitorName });
      toast.success('Check-in berhasil!');
      fetchData();
    } catch { toast.error('Gagal melakukan check-in'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Log Kunjungan Wali</h1>
        <p className="text-muted text-sm mt-1">Jadwal dan rekam jejak kunjungan wali santri ke pesantren.</p>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" /><p>Memuat data kunjungan...</p></div>
        ) : data.length === 0 ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada data kunjungan.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-light bg-app">
                <th className="py-4 px-6 font-semibold text-sm text-muted">Santri</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Pengunjung</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Hubungan</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Jadwal</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Status</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Aksi</th>
              </tr></thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                    <td className="py-4 px-6 font-medium text-sm">{row.santri?.name || '-'}</td>
                    <td className="py-4 px-6 text-sm">{row.visitorName}</td>
                    <td className="py-4 px-6 text-sm">{row.relation || '-'}</td>
                    <td className="py-4 px-6 text-sm flex items-center gap-1"><Calendar className="w-3 h-3 text-muted" />{row.scheduledAt ? new Date(row.scheduledAt).toLocaleString('id-ID') : '-'}</td>
                    <td className="py-4 px-6">
                      {row.checkinAt ? <span className="badge badge-success">Sudah Check-in</span> : <span className="badge badge-warning flex items-center gap-1"><Clock className="w-3 h-3" />Menunggu</span>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {!row.checkinAt && (
                        <button onClick={() => handleCheckin(row.id, row.visitorName)} className="btn btn-outline py-1.5 px-3 text-xs flex items-center gap-2 ml-auto">
                          <UserCheck className="w-3 h-3" /> Check-in
                        </button>
                      )}
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
