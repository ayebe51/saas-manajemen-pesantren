import { useState, useEffect } from 'react';
import { Building, DoorOpen, Loader2, Activity, Users } from 'lucide-react';
import { api } from '@/lib/api/client';

interface Building_ { id: string; name: string; type: string; _count?: { rooms: number }; }
interface Room { id: string; name: string; capacity: number; currentOccupancy: number; floor: string; building?: { name: string }; }

export function AsramaPage() {
  const [tab, setTab] = useState<'buildings' | 'rooms'>('buildings');
  const [buildings, setBuildings] = useState<Building_[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch { /* empty */ } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Manajemen Asrama</h1>
        <p className="text-muted text-sm mt-1">Data gedung, kamar, dan penempatan santri.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('buildings')} className={`btn ${tab === 'buildings' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <Building className="w-4 h-4" /> Gedung
        </button>
        <button onClick={() => setTab('rooms')} className={`btn ${tab === 'rooms' ? 'btn-primary shadow-glow' : 'btn-outline'}`}>
          <DoorOpen className="w-4 h-4" /> Kamar
        </button>
      </div>

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
