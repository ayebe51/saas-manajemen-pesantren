import { useState, useEffect } from 'react';
import { Heart, Loader2, Activity, Plus, X, Save } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface SantriOption { id: string; name: string; kelas: string; }
interface HealthRecord { id: string; santri?: { name: string }; diagnosis: string; treatment: string; notes: string; severity: string; createdAt: string; }

export function KesehatanPage() {
  const [data, setData] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [santriId, setSantriId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [severity, setSeverity] = useState('LOW');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kesehatan/records');
      setData(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch { setData([]); } finally { setLoading(false); }
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
    setSantriId(''); setDiagnosis(''); setTreatment(''); setSeverity('LOW'); setNotes('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriId || !diagnosis) { toast.error('Pilih santri dan isi diagnosa.'); return; }
    setSubmitting(true);
    try {
      await api.post('/kesehatan/records', { santriId, diagnosis, treatment, severity, notes });
      toast.success('Rekam medis berhasil dicatat!');
      resetForm(); fetchData();
    } catch { toast.error('Gagal menyimpan rekam medis.'); } finally { setSubmitting(false); }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Rekam Medis & Kesehatan</h1>
          <p className="text-muted text-sm mt-1">Catatan kesehatan, diagnosa, dan riwayat pengobatan santri.</p>
        </div>
        <button className="btn btn-primary shadow-glow flex items-center gap-2" onClick={openForm}>
          <Plus className="w-4 h-4" /> Tambah Rekam Medis
        </button>
      </div>

      {/* INLINE FORM */}
      {showForm && (
        <div className="glass-panel p-6 border-l-4 border-l-danger animate-in slide-in-from-top duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-main">🏥 Catat Rekam Medis Baru</h3>
            <button onClick={resetForm} className="p-1 hover:bg-surface-glass rounded-full"><X className="w-4 h-4 text-muted" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Santri <span className="text-danger">*</span></label>
                <select title="Pilih Santri" className="input-base" value={santriId} onChange={e => setSantriId(e.target.value)} required>
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => <option key={s.id} value={s.id}>{s.name} (Kls {s.kelas})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tingkat Keparahan</label>
                <select title="Severity" className="input-base" value={severity} onChange={e => setSeverity(e.target.value)}>
                  <option value="LOW">Ringan</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Kritis</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosa <span className="text-danger">*</span></label>
                <input type="text" className="input-base" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Cth: Demam, Flu, Sakit Perut" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Penanganan</label>
                <input type="text" className="input-base" value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="Cth: Paracetamol 3x1, Istirahat" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catatan Tambahan</label>
              <textarea className="input-base min-h-[60px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan dari petugas kesehatan..." />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="btn btn-outline">Batal</button>
              <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
              </button>
            </div>
          </form>
        </div>
      )}

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
