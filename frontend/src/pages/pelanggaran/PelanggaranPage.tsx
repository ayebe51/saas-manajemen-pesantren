import { useState, useEffect } from 'react';
import { AlertTriangle, HandHeart, Loader2, Activity, Plus, X, Save } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface SantriOption { id: string; name: string; kelas: string; }
interface Pelanggaran { id: string; santri?: { name: string }; category: string; description: string; points: number; createdAt: string; }
interface Pembinaan { id: string; santri?: { name: string }; type: string; description: string; startDate: string; status: string; }

export function PelanggaranPage() {
  const [tab, setTab] = useState<'pelanggaran' | 'pembinaan'>('pelanggaran');
  const [pelanggaran, setPelanggaran] = useState<Pelanggaran[]>([]);
  const [pembinaan, setPembinaan] = useState<Pembinaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form - Pelanggaran
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [santriId, setSantriId] = useState('');
  const [category, setCategory] = useState('RINGAN');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('5');

  // Form - Pembinaan
  const [pemType, setPemType] = useState('COUNSELING');
  const [pemDesc, setPemDesc] = useState('');
  const [pemSantriId, setPemSantriId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openForm = async () => {
    setShowForm(true);
    if (santriList.length === 0) {
      try {
        const res = await api.get('/santri?limit=100');
        setSantriList(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      } catch { /* empty */ }
    }
  };

  const resetForm = () => {
    setSantriId(''); setCategory('RINGAN'); setDescription(''); setPoints('5');
    setPemType('COUNSELING'); setPemDesc(''); setPemSantriId('');
    setShowForm(false);
  };

  const handleSubmitPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriId || !description) { toast.error('Pilih santri dan isi keterangan.'); return; }
    setSubmitting(true);
    try {
      await api.post('/pelanggaran', { santriId, category, description, points: parseInt(points) || 0 });
      toast.success('Pelanggaran berhasil dicatat!');
      resetForm(); fetchData();
    } catch { toast.error('Gagal mencatat pelanggaran.'); } finally { setSubmitting(false); }
  };

  const handleSubmitPembinaan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pemSantriId || !pemDesc) { toast.error('Pilih santri dan isi deskripsi pembinaan.'); return; }
    setSubmitting(true);
    try {
      await api.post('/pembinaan', { santriId: pemSantriId, type: pemType, description: pemDesc });
      toast.success('Program pembinaan berhasil dibuat!');
      resetForm(); fetchData();
    } catch { toast.error('Gagal membuat program pembinaan.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Pelanggaran & Pembinaan</h1>
          <p className="text-muted text-sm mt-1">Catatan pelanggaran tata tertib dan program pembinaan santri.</p>
        </div>
        <button className="btn btn-primary shadow-glow flex items-center gap-2" onClick={openForm}>
          <Plus className="w-4 h-4" /> {tab === 'pelanggaran' ? 'Catat Pelanggaran' : 'Buat Pembinaan'}
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setTab('pelanggaran'); resetForm(); }} className={`btn ${tab === 'pelanggaran' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <AlertTriangle className="w-4 h-4" /> Pelanggaran
        </button>
        <button onClick={() => { setTab('pembinaan'); resetForm(); }} className={`btn ${tab === 'pembinaan' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <HandHeart className="w-4 h-4" /> Pembinaan
        </button>
      </div>

      {/* INLINE FORM */}
      {showForm && (
        <div className="glass-panel p-6 border-l-4 border-l-warning animate-in slide-in-from-top duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-main">{tab === 'pelanggaran' ? '⚠️ Catat Pelanggaran Baru' : '🤝 Buat Program Pembinaan'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-surface-glass rounded-full"><X className="w-4 h-4 text-muted" /></button>
          </div>
          {tab === 'pelanggaran' ? (
            <form onSubmit={handleSubmitPelanggaran} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Santri <span className="text-danger">*</span></label>
                  <select title="Pilih Santri" className="input-base" value={santriId} onChange={e => setSantriId(e.target.value)} required>
                    <option value="">-- Pilih Santri --</option>
                    {santriList.map(s => <option key={s.id} value={s.id}>{s.name} (Kls {s.kelas})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select title="Kategori" className="input-base" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="RINGAN">Ringan</option>
                    <option value="SEDANG">Sedang</option>
                    <option value="BERAT">Berat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Poin Hukuman</label>
                  <input type="number" className="input-base" value={points} onChange={e => setPoints(e.target.value)} min="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keterangan <span className="text-danger">*</span></label>
                <textarea className="input-base min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Jelaskan pelanggaran yang dilakukan..." required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="btn btn-outline">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitPembinaan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Santri <span className="text-danger">*</span></label>
                  <select title="Pilih Santri" className="input-base" value={pemSantriId} onChange={e => setPemSantriId(e.target.value)} required>
                    <option value="">-- Pilih Santri --</option>
                    {santriList.map(s => <option key={s.id} value={s.id}>{s.name} (Kls {s.kelas})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis Pembinaan</label>
                  <select title="Jenis" className="input-base" value={pemType} onChange={e => setPemType(e.target.value)}>
                    <option value="COUNSELING">Konseling</option>
                    <option value="MENTORING">Mentoring</option>
                    <option value="COMMUNITY_SERVICE">Kerja Sosial</option>
                    <option value="PARENT_MEETING">Pemanggilan Orang Tua</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi Program <span className="text-danger">*</span></label>
                <textarea className="input-base min-h-[60px]" value={pemDesc} onChange={e => setPemDesc(e.target.value)} placeholder="Jelaskan program pembinaan..." required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="btn btn-outline">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
              </div>
            </form>
          )}
        </div>
      )}

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
