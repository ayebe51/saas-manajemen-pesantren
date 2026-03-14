import { useState, useEffect } from 'react';
import { UserCheck, Loader2, Activity, Calendar, Clock, Plus, X, Save } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface SantriOption { id: string; name: string; kelas: string; }
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
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [santriId, setSantriId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [relation, setRelation] = useState('Orang Tua');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kunjungan');
      setData(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleCheckin = async (id: string, vName: string) => {
    try {
      await api.post(`/kunjungan/${id}/checkin`, { visitorName: vName });
      toast.success('Check-in berhasil!');
      fetchData();
    } catch { toast.error('Gagal melakukan check-in'); }
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
    setSantriId(''); setVisitorName(''); setRelation('Orang Tua'); setScheduledAt('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriId || !visitorName || !scheduledAt) { toast.error('Lengkapi semua data kunjungan.'); return; }
    setSubmitting(true);
    try {
      await api.post('/kunjungan', {
        santriId,
        visitorName,
        relation,
        scheduledAt: new Date(scheduledAt).toISOString()
      });
      toast.success('Jadwal kunjungan berhasil dicatat!');
      resetForm(); fetchData();
    } catch { toast.error('Gagal mencatat jadwal kunjungan.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Log Kunjungan Wali</h1>
          <p className="text-muted text-sm mt-1">Jadwal dan rekam jejak kunjungan wali santri ke pesantren.</p>
        </div>
        <button className="btn btn-primary shadow-glow flex items-center gap-2" onClick={openForm}>
          <Plus className="w-4 h-4" /> Tambah Jadwal Kunjungan
        </button>
      </div>

      {/* INLINE FORM */}
      {showForm && (
        <div className="glass-panel p-6 border-l-4 border-l-accent animate-in slide-in-from-top duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-main">📅 Catat Jadwal Kunjungan Baru</h3>
            <button onClick={resetForm} className="p-1 hover:bg-surface-glass rounded-full"><X className="w-4 h-4 text-muted" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Santri yang Dikunjungi <span className="text-danger">*</span></label>
                <select title="Pilih Santri" className="input-base" value={santriId} onChange={e => setSantriId(e.target.value)} required>
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => <option key={s.id} value={s.id}>{s.name} (Kls {s.kelas})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Pengunjung <span className="text-danger">*</span></label>
                <input type="text" className="input-base" value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="Nama lengkap pengunjung" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hubungan</label>
                <select title="Hubungan" className="input-base" value={relation} onChange={e => setRelation(e.target.value)}>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Saudara">Saudara</option>
                  <option value="Tamu">Tamu</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jadwal Kunjungan <span className="text-danger">*</span></label>
                <input type="datetime-local" title="Jadwal" className="input-base" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required />
              </div>
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
