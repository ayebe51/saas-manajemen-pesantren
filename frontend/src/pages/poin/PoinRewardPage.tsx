import { useState, useEffect } from 'react';
import { Trophy, Star, Plus, Loader2, Activity, Medal, Gift } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Santri { id: string; name: string; kelas: string; room: string; }
interface PointEntry { id: string; santriId: string; santriName: string; category: string; points: number; description: string; createdAt: string; }

export function PoinRewardPage() {
  const [tab, setTab] = useState<'leaderboard' | 'manage'>('leaderboard');
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedSantri, setSelectedSantri] = useState('');
  const [category, setCategory] = useState('HAFALAN');
  const [points, setPoints] = useState(10);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [santriRes, pointsRes] = await Promise.allSettled([
        api.get('/santri'),
        api.get('/points'),
      ]);
      if (santriRes.status === 'fulfilled') {
        const d = Array.isArray(santriRes.value.data) ? santriRes.value.data : (santriRes.value.data?.data || []);
        setSantriList(d);
      }
      if (pointsRes.status === 'fulfilled') {
        const d = Array.isArray(pointsRes.value.data) ? pointsRes.value.data : (pointsRes.value.data?.data || []);
        setPointEntries(d);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleAddPoints = async () => {
    if (!selectedSantri || !description) {
      toast.error('Pilih santri dan isi deskripsi.');
      return;
    }
    try {
      await api.post('/points', { santriId: selectedSantri, category, points, description });
      toast.success('Poin berhasil ditambahkan!');
      setSelectedSantri('');
      setDescription('');
      setPoints(10);
      fetchData();
    } catch {
      toast.error('Gagal menambahkan poin.');
    }
  };

  // Build leaderboard from point entries
  const leaderboard = (() => {
    const map: Record<string, { name: string; total: number; kelas: string }> = {};
    // From point entries
    pointEntries.forEach(e => {
      if (!map[e.santriId]) map[e.santriId] = { name: e.santriName, total: 0, kelas: '' };
      map[e.santriId].total += e.points;
    });
    // If no point entries, build from santri list with 0 points
    if (Object.keys(map).length === 0) {
      santriList.forEach(s => {
        map[s.id] = { name: s.name, total: 0, kelas: s.kelas || '-' };
      });
    }
    return Object.entries(map)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);
  })();

  const categories = [
    { value: 'HAFALAN', label: '📖 Hafalan Al-Quran', defaultPoints: 15 },
    { value: 'AKADEMIK', label: '🎓 Prestasi Akademik', defaultPoints: 10 },
    { value: 'DISIPLIN', label: '⭐ Kedisiplinan', defaultPoints: 5 },
    { value: 'KEBERSIHAN', label: '🧹 Kebersihan', defaultPoints: 5 },
    { value: 'KEPEMIMPINAN', label: '👑 Kepemimpinan', defaultPoints: 10 },
    { value: 'OLAHRAGA', label: '⚽ Olahraga', defaultPoints: 8 },
  ];

  const getMedalColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-500';
    if (rank === 1) return 'text-gray-400';
    if (rank === 2) return 'text-amber-600';
    return 'text-muted';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Sistem Poin & Reward</h1>
          <p className="text-muted text-sm mt-1">Berikan apresiasi untuk pencapaian santri melalui sistem poin.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-light">
        <button onClick={() => setTab('leaderboard')} className={clsx('px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2', tab === 'leaderboard' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main')}>
          <Trophy className="w-4 h-4" /> Leaderboard
        </button>
        <button onClick={() => setTab('manage')} className={clsx('px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2', tab === 'manage' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main')}>
          <Plus className="w-4 h-4" /> Tambah Poin
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center items-center flex-col text-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p>Memuat data...</p>
        </div>
      ) : tab === 'leaderboard' ? (
        <div className="space-y-4">
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 0, 2].map(rank => {
                const s = leaderboard[rank];
                if (!s) return null;
                return (
                  <div key={s.id} className={clsx(
                    'glass-panel p-5 text-center transition-all hover:shadow-glow',
                    rank === 0 && 'md:-mt-4 ring-2 ring-yellow-400/30'
                  )}>
                    <Medal className={clsx('w-8 h-8 mx-auto mb-2', getMedalColor(rank))} />
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mx-auto mb-2">
                      {s.name.charAt(0)}
                    </div>
                    <div className="font-bold text-sm">{s.name}</div>
                    <div className="text-xs text-muted">Kelas {s.kelas}</div>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-warning" />
                      <span className="font-bold text-lg text-warning">{s.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Ranking */}
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-light bg-app">
                  <th className="py-3 px-6 font-semibold text-sm text-muted w-16">#</th>
                  <th className="py-3 px-6 font-semibold text-sm text-muted">Nama Santri</th>
                  <th className="py-3 px-6 font-semibold text-sm text-muted">Kelas</th>
                  <th className="py-3 px-6 font-semibold text-sm text-muted text-right">Total Poin</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-muted">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada data poin.</p>
                  </td></tr>
                ) : leaderboard.map((s, i) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                    <td className="py-3 px-6">
                      {i < 3 ? <Medal className={clsx('w-5 h-5', getMedalColor(i))} /> : <span className="text-sm text-muted font-mono">{i + 1}</span>}
                    </td>
                    <td className="py-3 px-6 font-medium text-sm">{s.name}</td>
                    <td className="py-3 px-6 text-sm text-muted">{s.kelas || '-'}</td>
                    <td className="py-3 px-6 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Star className="w-3.5 h-3.5 text-warning" />
                        <span className="font-bold">{s.total}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reward Info */}
          <div className="glass-panel p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Gift className="w-4 h-4 text-accent" /> Hadiah yang Bisa Ditukar</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Snack Koperasi', pts: 25, emoji: '🍫' },
                { name: 'Buku Tulis', pts: 50, emoji: '📓' },
                { name: 'Alat Tulis Set', pts: 100, emoji: '✏️' },
                { name: 'Piagam Prestasi', pts: 200, emoji: '🏆' },
              ].map(r => (
                <div key={r.name} className="p-3 rounded-lg bg-surface-glass text-center">
                  <div className="text-2xl mb-1">{r.emoji}</div>
                  <div className="text-xs font-semibold">{r.name}</div>
                  <div className="text-xs text-warning font-bold mt-1">⭐ {r.pts} poin</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="glass-panel p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Tambah Poin Santri</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Pilih Santri</label>
                <select
                  title="Pilih Santri"
                  value={selectedSantri}
                  onChange={e => setSelectedSantri(e.target.value)}
                  className="input-base w-full"
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — Kelas {s.kelas || '-'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Kategori</label>
                <select
                  title="Kategori Poin"
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    const cat = categories.find(c => c.value === e.target.value);
                    if (cat) setPoints(cat.defaultPoints);
                  }}
                  className="input-base w-full"
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Jumlah Poin</label>
                <input type="number" title="Jumlah Poin" value={points} onChange={e => setPoints(Number(e.target.value))} className="input-base w-full" min={1} max={100} />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Deskripsi</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input-base w-full" placeholder="e.g. Hafal Juz 30 lancar" />
              </div>

              <button onClick={handleAddPoints} className="btn btn-primary w-full shadow-glow py-2.5">
                <Star className="w-4 h-4" /> Tambahkan Poin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
