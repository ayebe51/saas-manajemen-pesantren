import { useState, useEffect } from 'react';
import { AlertTriangle, HandHeart, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';

interface Pelanggaran { id: string; santri?: { name: string }; category: string; description: string; points: number; createdAt: string; }
interface Pembinaan { id: string; santri?: { name: string }; type: string; description: string; startDate: string; status: string; }

export function PelanggaranPage() {
  const [tab, setTab] = useState<'pelanggaran' | 'pembinaan'>('pelanggaran');
  const [pelanggaran, setPelanggaran] = useState<Pelanggaran[]>([]);
  const [pembinaan, setPembinaan] = useState<Pembinaan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'pelanggaran') {
        const res = await api.get('/pelanggaran');
        setPelanggaran(Array.isArray(res.data) ? res.data : (res.data.data || []));
      } else {
        const res = await api.get('/pembinaan');
        setPembinaan(Array.isArray(res.data) ? res.data : (res.data.data || []));
      }
    } catch { /* empty */ } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Pelanggaran & Pembinaan</h1>
        <p className="text-muted text-sm mt-1">Catatan pelanggaran tata tertib dan program pembinaan santri.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('pelanggaran')} className={`btn ${tab === 'pelanggaran' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <AlertTriangle className="w-4 h-4" /> Pelanggaran
        </button>
        <button onClick={() => setTab('pembinaan')} className={`btn ${tab === 'pembinaan' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <HandHeart className="w-4 h-4" /> Pembinaan
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" /><p>Memuat data...</p></div>
        ) : tab === 'pelanggaran' ? (
          pelanggaran.length === 0 ? (
            <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada catatan pelanggaran.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-light bg-app">
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Santri</th>
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Kategori</th>
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Keterangan</th>
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Poin</th>
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Tanggal</th>
                </tr></thead>
                <tbody>
                  {pelanggaran.map(row => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                      <td className="py-4 px-6 font-medium text-sm">{row.santri?.name || '-'}</td>
                      <td className="py-4 px-6"><span className="badge badge-warning text-[10px]">{row.category}</span></td>
                      <td className="py-4 px-6 text-sm">{row.description}</td>
                      <td className="py-4 px-6 font-bold text-danger">{row.points || 0}</td>
                      <td className="py-4 px-6 text-sm text-muted">{new Date(row.createdAt).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          pembinaan.length === 0 ? (
            <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada program pembinaan.</p></div>
          ) : (
            <div className="divide-y divide-[var(--border-light)]">
              {pembinaan.map(p => (
                <div key={p.id} className="p-5 hover:bg-surface-glass transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <HandHeart className="w-4 h-4 text-success" />
                    <span className="font-semibold text-sm">{p.santri?.name || 'Santri'}</span>
                    <span className="badge bg-success/20 text-success text-[10px]">{p.type}</span>
                    <span className="badge bg-primary/20 text-primary text-[10px]">{p.status}</span>
                  </div>
                  <p className="text-sm text-muted">{p.description}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
