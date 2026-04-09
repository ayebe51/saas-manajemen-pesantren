import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Plus, Edit2, Trash2, Loader2, ArrowUpCircle, X, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
  rombel: string | null;
  kapasitas: number;
  isTertinggi: boolean;
  waliKelasId: string | null;
  tahunAjaran: string | null;
  isActive: boolean;
}

interface KelasFormData {
  nama: string;
  tingkat: number;
  rombel: string;
  kapasitas: number;
  isTertinggi: boolean;
  tahunAjaran: string;
}

interface Santri {
  id: string;
  nis: string | null;
  nisn: string | null;
  name: string;
  namaLengkap: string | null;
  gender: string;
  kelas: string | null;
  status: string;
  photo: string | null;
  fotoUrl: string | null;
  noHp: string | null;
  contact: string | null;
}

interface KelasDetail {
  kelas: {
    id: string;
    nama: string;
    tingkat: number;
    rombel: string | null;
    kapasitas: number;
    tahunAjaran: string | null;
  };
  santri: Santri[];
  total: number;
}

const defaultForm: KelasFormData = {
  nama: '', tingkat: 1, rombel: 'A', kapasitas: 30, isTertinggi: false, tahunAjaran: '',
};

export function ManajemenKelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editKelas, setEditKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState<KelasFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  // Santri modal state
  const [showSantriModal, setShowSantriModal] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [kelasDetail, setKelasDetail] = useState<KelasDetail | null>(null);
  const [loadingSantri, setLoadingSantri] = useState(false);

  // Naik kelas state
  const [showNaikKelas, setShowNaikKelas] = useState(false);
  const [mappings, setMappings] = useState<{ kelasAsalId: string; kelasTujuanId: string }[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [executing, setExecuting] = useState(false);

  const fetchKelas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/kelas');
      setKelasList(res.data?.data || res.data || []);
    } catch {
      toast.error('Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSantriModal = async (kelas: Kelas) => {
    setSelectedKelas(kelas);
    setShowSantriModal(true);
    setLoadingSantri(true);
    try {
      const res = await api.get(`/academic/kelas/${kelas.id}`);
      setKelasDetail(res.data?.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat data santri');
      setShowSantriModal(false);
    } finally {
      setLoadingSantri(false);
    }
  };

  useEffect(() => { fetchKelas(); }, []);

  const handleOpenForm = (kelas?: Kelas) => {
    if (kelas) {
      setEditKelas(kelas);
      setFormData({
        nama: kelas.nama,
        tingkat: kelas.tingkat,
        rombel: kelas.rombel || 'A',
        kapasitas: kelas.kapasitas,
        isTertinggi: kelas.isTertinggi,
        tahunAjaran: kelas.tahunAjaran || '',
      });
    } else {
      setEditKelas(null);
      setFormData(defaultForm);
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editKelas) {
        await api.put(`/academic/kelas/${editKelas.id}`, formData);
        toast.success('Kelas berhasil diperbarui');
      } else {
        await api.post('/academic/kelas', formData);
        toast.success('Kelas berhasil ditambahkan');
      }
      setShowForm(false);
      fetchKelas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kelas');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (kelas: Kelas) => {
    if (!confirm(`Nonaktifkan kelas ${kelas.nama}?`)) return;
    try {
      await api.delete(`/academic/kelas/${kelas.id}`);
      toast.success('Kelas dinonaktifkan');
      fetchKelas();
    } catch {
      toast.error('Gagal menonaktifkan kelas');
    }
  };

  const handlePreviewNaikKelas = async () => {
    if (mappings.length === 0) { toast.error('Tambahkan minimal satu mapping kelas'); return; }
    setPreviewing(true);
    try {
      const res = await api.post('/academic/kelas/naik-kelas/preview', { mappings });
      setPreview(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat preview');
    } finally {
      setPreviewing(false);
    }
  };

  const handleEksekusi = async () => {
    if (!confirm('Yakin ingin mengeksekusi naik kelas massal? Tindakan ini tidak dapat dibatalkan.')) return;
    setExecuting(true);
    try {
      const res = await api.post('/academic/kelas/naik-kelas/eksekusi', { mappings });
      const { totalNaik, totalPromosi, errors } = res.data?.data || res.data;
      toast.success(`Selesai: ${totalNaik} naik kelas, ${totalPromosi} dipromosikan`);
      if (errors?.length) toast.error(`${errors.length} error: ${errors[0]}`);
      setShowNaikKelas(false);
      setMappings([]);
      setPreview([]);
      fetchKelas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal eksekusi naik kelas');
    } finally {
      setExecuting(false);
    }
  };

  const addMapping = () => {
    setMappings(prev => [...prev, { kelasAsalId: '', kelasTujuanId: '' }]);
  };

  const updateMapping = (idx: number, field: string, value: string) => {
    setMappings(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const removeMapping = (idx: number) => {
    setMappings(prev => prev.filter((_, i) => i !== idx));
  };

  const set = (field: keyof KelasFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: field === 'tingkat' || field === 'kapasitas' ? Number(val) : val }));
  };

  // Auto-generate nama kelas
  useEffect(() => {
    if (!editKelas) {
      setFormData(prev => ({ ...prev, nama: `Kelas ${prev.tingkat}${prev.rombel}` }));
    }
  }, [formData.tingkat, formData.rombel, editKelas]);

  const grouped = kelasList.reduce<Record<number, Kelas[]>>((acc, k) => {
    if (!acc[k.tingkat]) acc[k.tingkat] = [];
    acc[k.tingkat].push(k);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-main">Manajemen Kelas</h1>
          <p className="text-muted text-sm mt-1">Kelola struktur kelas, tingkat, dan rombel</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline flex items-center gap-2"
            onClick={() => { setShowNaikKelas(true); setMappings([]); setPreview([]); }}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Naik Kelas Massal
          </button>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4" />
            Tambah Kelas
          </button>
        </div>
      </div>

      {/* Kelas List grouped by tingkat */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-muted">Memuat data kelas...</div>
      ) : kelasList.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted">Belum ada kelas. Tambahkan kelas pertama.</div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([tingkat, kelas]) => (
          <div key={tingkat} className="glass-panel overflow-hidden">
            <div className="px-6 py-3 bg-app border-b border-light flex items-center gap-2">
              <span className="font-bold text-main">Tingkat {tingkat}</span>
              <span className="text-muted text-sm">({kelas.length} kelas)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {kelas.map(k => (
                <div key={k.id} className={clsx('border rounded-lg p-4 flex flex-col gap-2', k.isTertinggi ? 'border-accent/50 bg-accent/5' : 'border-light')}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-main">{k.nama}</div>
                      {k.isTertinggi && <span className="text-xs text-accent font-medium">Kelas Tertinggi</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenSantriModal(k)} className="p-1 text-muted hover:text-primary rounded" title="Lihat santri"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleOpenForm(k)} className="p-1 text-muted hover:text-primary rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(k)} className="p-1 text-muted hover:text-danger rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Users className="w-3 h-3" />
                    <span>Kapasitas: {k.kapasitas}</span>
                  </div>
                  {k.tahunAjaran && <div className="text-xs text-muted">TA: {k.tahunAjaran}</div>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative glass-panel w-full max-w-md bg-surface p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-light">
              <h2 className="font-bold text-main">{editKelas ? 'Edit Kelas' : 'Tambah Kelas'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tingkat</label>
                  <input type="number" min={1} max={12} className="input-base" value={formData.tingkat} onChange={set('tingkat')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rombel</label>
                  <input type="text" className="input-base" value={formData.rombel} onChange={set('rombel')} placeholder="A" maxLength={3} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Kelas</label>
                <input type="text" required className="input-base" value={formData.nama} onChange={set('nama')} placeholder="Kelas 1A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kapasitas</label>
                  <input type="number" min={1} className="input-base" value={formData.kapasitas} onChange={set('kapasitas')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tahun Ajaran</label>
                  <input type="text" className="input-base" value={formData.tahunAjaran} onChange={set('tahunAjaran')} placeholder="2024/2025" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isTertinggi"
                  checked={formData.isTertinggi}
                  onChange={e => setFormData(prev => ({ ...prev, isTertinggi: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="isTertinggi" className="text-sm">Kelas tertinggi (santri lulus → dipromosikan)</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Batal</button>
                <button type="submit" disabled={saving} className="btn btn-primary min-w-[100px]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Naik Kelas Modal */}
      {showNaikKelas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNaikKelas(false)} />
          <div className="relative glass-panel w-full max-w-2xl bg-surface p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-light">
              <h2 className="font-bold text-main">Naik Kelas Massal</h2>
              <button onClick={() => setShowNaikKelas(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>

            <p className="text-sm text-muted mb-4">Tentukan mapping kelas asal → kelas tujuan. Santri di kelas tertinggi akan otomatis dipromosikan menjadi Pengurus.</p>

            <div className="space-y-3 mb-4">
              {mappings.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="input-base flex-1" value={m.kelasAsalId} onChange={e => updateMapping(idx, 'kelasAsalId', e.target.value)}>
                    <option value="">Kelas Asal</option>
                    {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}{k.isTertinggi ? ' (Tertinggi)' : ''}</option>)}
                  </select>
                  <span className="text-muted">→</span>
                  <select className="input-base flex-1" value={m.kelasTujuanId} onChange={e => updateMapping(idx, 'kelasTujuanId', e.target.value)}
                    disabled={kelasList.find(k => k.id === m.kelasAsalId)?.isTertinggi}>
                    <option value="">{kelasList.find(k => k.id === m.kelasAsalId)?.isTertinggi ? 'Promosi Pengurus' : 'Kelas Tujuan'}</option>
                    {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                  <button onClick={() => removeMapping(idx)} className="p-1.5 text-muted hover:text-danger"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={addMapping} className="btn btn-outline text-sm w-full">
                <Plus className="w-4 h-4" /> Tambah Mapping
              </button>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="border border-light rounded-lg overflow-hidden mb-4">
                <div className="px-4 py-2 bg-app border-b border-light text-sm font-medium">Preview Dampak</div>
                {preview.map((p, i) => (
                  <div key={i} className="px-4 py-3 border-b last:border-0 border-light">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{p.kelasAsal}</span>
                      <span className="text-muted">→</span>
                      <span className={clsx('text-sm font-medium', p.aksi === 'PROMOSI' ? 'text-accent' : 'text-primary')}>
                        {p.aksi === 'PROMOSI' ? 'Promosi Pengurus' : p.kelasTujuan}
                      </span>
                    </div>
                    <div className="text-xs text-muted">{p.santri?.length || 0} santri terdampak</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={handlePreviewNaikKelas} disabled={previewing} className="btn btn-outline">
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Preview'}
              </button>
              <button onClick={handleEksekusi} disabled={executing || preview.length === 0} className="btn btn-primary">
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eksekusi Naik Kelas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Santri Modal */}
      {showSantriModal && selectedKelas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSantriModal(false)} />
          <div className="relative glass-panel w-full max-w-3xl bg-surface p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-light">
              <div>
                <h2 className="font-bold text-main">Daftar Santri - {selectedKelas.nama}</h2>
                <p className="text-xs text-muted mt-1">Tingkat {selectedKelas.tingkat} | Kapasitas: {selectedKelas.kapasitas}</p>
              </div>
              <button onClick={() => setShowSantriModal(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>

            {loadingSantri ? (
              <div className="py-12 text-center text-muted">Memuat data santri...</div>
            ) : kelasDetail && kelasDetail.santri.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-muted mb-3">Total: {kelasDetail.total} santri</div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {kelasDetail.santri.map(s => (
                    <div key={s.id} className="border border-light rounded-lg p-3 flex items-center gap-3 hover:bg-app/50 transition">
                      {s.fotoUrl || s.photo ? (
                        <img src={s.fotoUrl || s.photo || ''} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-main truncate">{s.name}</div>
                        <div className="text-xs text-muted">NIS: {s.nis || '-'} | NISN: {s.nisn || '-'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-primary">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                        <div className="text-xs text-muted">{s.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted">Belum ada santri di kelas ini</div>
            )}

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-light">
              <button onClick={() => setShowSantriModal(false)} className="btn btn-outline">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
