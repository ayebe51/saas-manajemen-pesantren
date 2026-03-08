import { useState, useEffect } from 'react';
import { MessageSquare, Megaphone, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';

interface Catatan { id: string; santri?: { name: string }; content: string; type: string; createdAt: string; }
interface Pengumuman { id: string; title: string; content: string; audience: string; createdAt: string; }

export function CatatanPage() {
  const [tab, setTab] = useState<'catatan' | 'pengumuman'>('catatan');
  const [catatan, setCatatan] = useState<Catatan[]>([]);
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'catatan') {
        const res = await api.get('/catatan');
        setCatatan(Array.isArray(res.data) ? res.data : (res.data.data || []));
      } else {
        const res = await api.get('/pengumuman');
        setPengumuman(Array.isArray(res.data) ? res.data : (res.data.data || []));
      }
    } catch { /* empty */ } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Buku Penghubung</h1>
          <p className="text-muted text-sm mt-1">Catatan harian santri dan pengumuman pesantren.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('catatan')} className={`btn ${tab === 'catatan' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <MessageSquare className="w-4 h-4" /> Catatan Harian
        </button>
        <button onClick={() => setTab('pengumuman')} className={`btn ${tab === 'pengumuman' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <Megaphone className="w-4 h-4" /> Pengumuman
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" /><p>Memuat data...</p></div>
        ) : tab === 'catatan' ? (
          catatan.length === 0 ? (
            <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada catatan harian.</p></div>
          ) : (
            <div className="divide-y divide-[var(--border-light)]">
              {catatan.map(c => (
                <div key={c.id} className="p-5 hover:bg-surface-glass transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{c.santri?.name || 'Santri'}</span>
                    <span className="badge bg-primary/20 text-primary text-[10px]">{c.type}</span>
                  </div>
                  <p className="text-sm text-muted">{c.content}</p>
                  <p className="text-xs text-muted mt-2">{new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )
        ) : (
          pengumuman.length === 0 ? (
            <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada pengumuman.</p></div>
          ) : (
            <div className="divide-y divide-[var(--border-light)]">
              {pengumuman.map(p => (
                <div key={p.id} className="p-5 hover:bg-surface-glass transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="w-4 h-4 text-accent" />
                    <span className="font-bold text-sm">{p.title}</span>
                    <span className="badge bg-accent/20 text-accent text-[10px]">{p.audience}</span>
                  </div>
                  <p className="text-sm text-muted">{p.content}</p>
                  <p className="text-xs text-muted mt-2">{new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
