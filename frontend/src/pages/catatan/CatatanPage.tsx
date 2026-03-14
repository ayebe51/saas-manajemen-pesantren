import { useState, useEffect } from 'react';
import { MessageSquare, Megaphone, Loader2, Activity, Plus, X, Save } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface SantriOption { id: string; name: string; kelas: string; }
interface Catatan { id: string; santri?: { name: string }; content: string; type: string; createdAt: string; }
interface Pengumuman { id: string; title: string; content: string; audience: string; createdAt: string; }

export function CatatanPage() {
  const [tab, setTab] = useState<'catatan' | 'pengumuman'>('catatan');
  const [catatan, setCatatan] = useState<Catatan[]>([]);
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state - Catatan
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [santriId, setSantriId] = useState('');
  const [content, setContent] = useState('');
  const [catType, setCatType] = useState('PERILAKU');

  // Form state - Pengumuman
  const [title, setTitle] = useState('');
  const [pengContent, setPengContent] = useState('');
  const [audience, setAudience] = useState('ALL');

  const [submitting, setSubmitting] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openForm = async () => {
    setShowForm(true);
    if (tab === 'catatan' && santriList.length === 0) {
      try {
        const res = await api.get('/santri?limit=100');
        setSantriList(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      } catch { /* empty */ }
    }
  };

  const resetForm = () => {
    setSantriId(''); setContent(''); setCatType('PERILAKU');
    setTitle(''); setPengContent(''); setAudience('ALL');
    setShowForm(false);
  };

  const handleSubmitCatatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriId || !content) { toast.error('Pilih santri dan isi catatan.'); return; }
    setSubmitting(true);
    try {
      await api.post('/catatan', { santriId, content, type: catType });
      toast.success('Catatan harian berhasil disimpan!');
      resetForm(); fetchData();
    } catch { toast.error('Gagal menyimpan catatan.'); } finally { setSubmitting(false); }
  };

  const handleSubmitPengumuman = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pengContent) { toast.error('Isi judul dan konten pengumuman.'); return; }
    setSubmitting(true);
    try {
      await api.post('/pengumuman', { title, content: pengContent, audience });
      toast.success('Pengumuman berhasil dipublikasikan!');
      resetForm(); fetchData();
    } catch { toast.error('Gagal mempublikasikan pengumuman.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Buku Penghubung</h1>
          <p className="text-muted text-sm mt-1">Catatan harian santri dan pengumuman pesantren.</p>
        </div>
        <button className="btn btn-primary shadow-glow flex items-center gap-2" onClick={openForm}>
          <Plus className="w-4 h-4" /> {tab === 'catatan' ? 'Tulis Catatan' : 'Buat Pengumuman'}
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setTab('catatan'); resetForm(); }} className={`btn ${tab === 'catatan' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <MessageSquare className="w-4 h-4" /> Catatan Harian
        </button>
        <button onClick={() => { setTab('pengumuman'); resetForm(); }} className={`btn ${tab === 'pengumuman' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <Megaphone className="w-4 h-4" /> Pengumuman
        </button>
      </div>

      {/* INLINE FORM */}
      {showForm && (
        <div className="glass-panel p-6 border-l-4 border-l-primary animate-in slide-in-from-top duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-main">{tab === 'catatan' ? '📝 Tulis Catatan Harian Baru' : '📢 Buat Pengumuman Baru'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-surface-glass rounded-full"><X className="w-4 h-4 text-muted" /></button>
          </div>
          {tab === 'catatan' ? (
            <form onSubmit={handleSubmitCatatan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Santri <span className="text-danger">*</span></label>
                  <select title="Pilih Santri" className="input-base" value={santriId} onChange={e => setSantriId(e.target.value)} required>
                    <option value="">-- Pilih Santri --</option>
                    {santriList.map(s => <option key={s.id} value={s.id}>{s.name} (Kls {s.kelas})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select title="Kategori" className="input-base" value={catType} onChange={e => setCatType(e.target.value)}>
                    <option value="PERILAKU">Perilaku</option>
                    <option value="AKADEMIK">Akademik</option>
                    <option value="IBADAH">Ibadah</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Isi Catatan <span className="text-danger">*</span></label>
                <textarea className="input-base min-h-[80px]" value={content} onChange={e => setContent(e.target.value)} placeholder="Tulis catatan harian untuk santri ini..." required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="btn btn-outline">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitPengumuman} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Judul Pengumuman <span className="text-danger">*</span></label>
                  <input type="text" className="input-base" value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul pengumuman..." required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Audiens</label>
                  <select title="Audiens" className="input-base" value={audience} onChange={e => setAudience(e.target.value)}>
                    <option value="ALL">Semua</option>
                    <option value="SANTRI">Santri Saja</option>
                    <option value="WALI">Wali Saja</option>
                    <option value="GURU">Guru/Asatidz</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Konten Pengumuman <span className="text-danger">*</span></label>
                <textarea className="input-base min-h-[100px]" value={pengContent} onChange={e => setPengContent(e.target.value)} placeholder="Tulis isi pengumuman..." required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="btn btn-outline">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publikasikan
                </button>
              </div>
            </form>
          )}
        </div>
      )}

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
