import { useState, useEffect } from 'react';
import { Building, DoorOpen, Loader2, Activity, Users, Plus, X, Save } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface Building_ { id: string; name: string; type: string; _count?: { rooms: number }; }
interface Room { id: string; name: string; capacity: number; currentOccupancy: number; floor: string; building?: { name: string }; }

export function AsramaPage() {
  const [tab, setTab] = useState<'buildings' | 'rooms'>('buildings');
  const [buildings, setBuildings] = useState<Building_[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Building form
  const [bName, setBName] = useState('');
  const [bType, setBType] = useState('PUTRA');

  // Room form
  const [rName, setRName] = useState('');
  const [rCapacity, setRCapacity] = useState('10');
  const [rFloor, setRFloor] = useState('1');
  const [rBuildingId, setRBuildingId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'buildings') {
        const res = await api.get('/dormitory/buildings');
        setBuildings(Array.isArray(res.data) ? res.data : (res.data.data || []));
      } else {
        const res = await api.get('/dormitory/rooms');
        setRooms(Array.isArray(res.data) ? res.data : (res.data.data || []));
        // Also fetch buildings for the room form
        if (buildings.length === 0) {
          const bRes = await api.get('/dormitory/buildings');
          setBuildings(Array.isArray(bRes.data) ? bRes.data : (bRes.data.data || []));
        }
      }
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const resetForm = () => {
    setBName(''); setBType('PUTRA');
    setRName(''); setRCapacity('10'); setRFloor('1'); setRBuildingId('');
    setShowForm(false);
  };

  const handleSubmitBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName) { toast.error('Isi nama gedung.'); return; }
    setSubmitting(true);
    try {
      await api.post('/dormitory/buildings', { name: bName, type: bType });
      toast.success('Gedung berhasil ditambahkan!');
      resetForm(); fetchData();
    } catch { toast.error('Gagal menambahkan gedung.'); } finally { setSubmitting(false); }
  };

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName || !rBuildingId) { toast.error('Isi nama kamar dan pilih gedung.'); return; }
    setSubmitting(true);
    try {
      await api.post('/dormitory/rooms', { name: rName, capacity: parseInt(rCapacity) || 10, floor: rFloor, buildingId: rBuildingId });
      toast.success('Kamar berhasil ditambahkan!');
      resetForm(); fetchData();
    } catch { toast.error('Gagal menambahkan kamar.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Manajemen Asrama</h1>
          <p className="text-muted text-sm mt-1">Data gedung, kamar, dan penempatan santri.</p>
        </div>
        <button className="btn btn-primary shadow-glow flex items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> {tab === 'buildings' ? 'Tambah Gedung' : 'Tambah Kamar'}
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setTab('buildings'); resetForm(); }} className={`btn ${tab === 'buildings' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <Building className="w-4 h-4" /> Gedung
        </button>
        <button onClick={() => { setTab('rooms'); resetForm(); }} className={`btn ${tab === 'rooms' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <DoorOpen className="w-4 h-4" /> Kamar
        </button>
      </div>

      {/* INLINE FORM */}
      {showForm && (
        <div className="glass-panel p-6 border-l-4 border-l-primary animate-in slide-in-from-top duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-main">{tab === 'buildings' ? '🏢 Tambah Gedung Baru' : '🚪 Tambah Kamar Baru'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-surface-glass rounded-full"><X className="w-4 h-4 text-muted" /></button>
          </div>
          {tab === 'buildings' ? (
            <form onSubmit={handleSubmitBuilding} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Gedung <span className="text-danger">*</span></label>
                  <input type="text" className="input-base" value={bName} onChange={e => setBName(e.target.value)} placeholder="Cth: Gedung Al-Fatih" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe</label>
                  <select title="Tipe Gedung" className="input-base" value={bType} onChange={e => setBType(e.target.value)}>
                    <option value="PUTRA">Asrama Putra</option>
                    <option value="PUTRI">Asrama Putri</option>
                    <option value="MIXED">Campuran</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="btn btn-outline">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitRoom} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Kamar <span className="text-danger">*</span></label>
                  <input type="text" className="input-base" value={rName} onChange={e => setRName(e.target.value)} placeholder="Cth: K-01A" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gedung <span className="text-danger">*</span></label>
                  <select title="Pilih Gedung" className="input-base" value={rBuildingId} onChange={e => setRBuildingId(e.target.value)} required>
                    <option value="">-- Pilih Gedung --</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kapasitas</label>
                  <input type="number" className="input-base" value={rCapacity} onChange={e => setRCapacity(e.target.value)} min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lantai</label>
                  <input type="text" className="input-base" value={rFloor} onChange={e => setRFloor(e.target.value)} placeholder="1" />
                </div>
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
          <div className="p-12 flex justify-center items-center flex-col text-muted"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" /><p>Memuat data asrama...</p></div>
        ) : tab === 'buildings' ? (
          buildings.length === 0 ? (
            <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada data gedung.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {buildings.map(b => (
                <div key={b.id} className="glass-panel p-5 hover:shadow-glow transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Building className="w-5 h-5" /></div>
                    <div><div className="font-bold">{b.name}</div><div className="text-xs text-muted">{b.type || 'Asrama'}</div></div>
                  </div>
                  <div className="text-sm text-muted">{b._count?.rooms || 0} Kamar</div>
                </div>
              ))}
            </div>
          )
        ) : (
          rooms.length === 0 ? (
            <div className="p-12 flex justify-center items-center flex-col text-muted"><Activity className="w-12 h-12 mb-4 opacity-50" /><p>Belum ada data kamar.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-light bg-app">
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Kamar</th>
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Gedung</th>
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Lantai</th>
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Kapasitas</th>
                  <th className="py-4 px-6 font-semibold text-sm text-muted">Terisi</th>
                </tr></thead>
                <tbody>
                  {rooms.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                      <td className="py-4 px-6 font-medium text-sm flex items-center gap-2"><DoorOpen className="w-4 h-4 text-primary" />{r.name}</td>
                      <td className="py-4 px-6 text-sm">{r.building?.name || '-'}</td>
                      <td className="py-4 px-6 text-sm">{r.floor || '-'}</td>
                      <td className="py-4 px-6 text-sm">{r.capacity} orang</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted" />
                          <span className={`font-bold ${(r.currentOccupancy || 0) >= r.capacity ? 'text-danger' : 'text-success'}`}>{r.currentOccupancy || 0}/{r.capacity}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
