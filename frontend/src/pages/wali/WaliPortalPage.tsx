import { useState } from 'react';
import { Search, BookOpen, AlertTriangle, Receipt, FileCheck, Heart, Loader2, LogIn } from 'lucide-react';
import { api } from '@/lib/api/client';

interface SantriSummary {
  id: string; name: string; nisn: string; kelas: string; room: string; status: string; photo: string;
  tahfidz: { surah: string; grade: string; date: string }[];
  pelanggaran: { category: string; points: number; date: string }[];
  invoices: { description: string; amount: number; status: string }[];
  catatan: { content: string; type: string; createdAt: string }[];
  _count: { izin: number; pelanggaran: number; invoices: number; };
}

export function WaliPortalPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [santriList, setSantriList] = useState<SantriSummary[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<SantriSummary | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await api.get(`/wali/portal?phone=${encodeURIComponent(phone)}`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.santri || []);
      setSantriList(data);
      if (data.length === 1) setSelectedSantri(data[0]);
      else setSelectedSantri(null);
    } catch {
      setError('Data tidak ditemukan. Pastikan nomor telepon terdaftar di sistem pesantren.');
      setSantriList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app">
      {/* Header */}
      <div className="bg-primary text-inverse py-8 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Portal Wali Santri
        </h1>
        <p className="text-inverse/80 text-sm">Pantau perkembangan putra/putri Anda secara real-time</p>
      </div>

      {/* Search Section */}
      <div className="max-w-md mx-auto -mt-6 px-4">
        <div className="glass-panel p-5">
          <label className="text-sm font-semibold mb-2 block">Masukkan Nomor HP Wali</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="08xxxxxxxxxx"
                className="input-base pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            </div>
            <button onClick={handleSearch} disabled={loading} className="btn btn-primary shadow-glow px-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-danger text-sm mt-2">{error}</p>}
        </div>
      </div>

      {/* Santri Selector (if multiple) */}
      {santriList.length > 1 && !selectedSantri && (
        <div className="max-w-lg mx-auto mt-6 px-4">
          <h3 className="font-bold text-lg mb-3">Pilih Santri</h3>
          <div className="grid gap-3">
            {santriList.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSantri(s)}
                className="glass-panel p-4 text-left hover:shadow-glow transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted">Kelas {s.kelas || '-'} • {s.room || '-'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Santri Dashboard */}
      {selectedSantri && (
        <div className="max-w-3xl mx-auto mt-6 px-4 pb-12 space-y-5">
          {santriList.length > 1 && (
            <button onClick={() => setSelectedSantri(null)} className="btn btn-outline py-1 px-3 text-xs">← Pilih Santri Lain</button>
          )}

          {/* Profile Card */}
          <div className="glass-panel p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {selectedSantri.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedSantri.name}</h2>
                <p className="text-sm text-muted">NISN: {selectedSantri.nisn || '-'} • Kelas {selectedSantri.kelas || '-'} • Kamar {selectedSantri.room || '-'}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-panel p-3 text-center">
              <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-xs text-muted">Setoran Hafalan</div>
              <div className="font-bold text-lg">{selectedSantri.tahfidz?.length || 0}</div>
            </div>
            <div className="glass-panel p-3 text-center">
              <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-1" />
              <div className="text-xs text-muted">Pelanggaran</div>
              <div className="font-bold text-lg text-warning">{selectedSantri.pelanggaran?.length || selectedSantri._count?.pelanggaran || 0}</div>
            </div>
            <div className="glass-panel p-3 text-center">
              <FileCheck className="w-5 h-5 text-success mx-auto mb-1" />
              <div className="text-xs text-muted">Izin</div>
              <div className="font-bold text-lg">{selectedSantri._count?.izin || 0}</div>
            </div>
            <div className="glass-panel p-3 text-center">
              <Receipt className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-xs text-muted">Tagihan</div>
              <div className="font-bold text-lg">{selectedSantri.invoices?.length || selectedSantri._count?.invoices || 0}</div>
            </div>
          </div>

          {/* Tahfidz Progress */}
          <div className="glass-panel p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Progress Tahfidz Terbaru</h3>
            {(selectedSantri.tahfidz?.length || 0) > 0 ? (
              <div className="space-y-2">
                {selectedSantri.tahfidz.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-glass">
                    <div>
                      <div className="text-sm font-medium">{t.surah}</div>
                      <div className="text-xs text-muted">{new Date(t.date).toLocaleDateString('id-ID')}</div>
                    </div>
                    <span className={`badge ${t.grade === 'MUMTAZ' || t.grade === 'LANCAR' ? 'badge-success' : 'badge-warning'}`}>
                      {t.grade}
                    </span>
                  </div>  
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-4">Belum ada data hafalan.</p>
            )}
          </div>

          {/* Pelanggaran */}
          {(selectedSantri.pelanggaran?.length || 0) > 0 && (
            <div className="glass-panel p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Catatan Pelanggaran</h3>
              <div className="space-y-2">
                {selectedSantri.pelanggaran.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-glass">
                    <div className="text-sm">{p.category}</div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-danger">{p.points} poin</span>
                      <span className="text-xs text-muted">{new Date(p.date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pembayaran */}
          {(selectedSantri.invoices?.length || 0) > 0 && (
            <div className="glass-panel p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-accent" /> Status Pembayaran</h3>
              <div className="space-y-2">
                {selectedSantri.invoices.slice(0, 5).map((inv, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-glass">
                    <div className="text-sm">{inv.description}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Rp {inv.amount?.toLocaleString('id-ID')}</span>
                      <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                        {inv.status === 'PAID' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catatan Harian */}
          {(selectedSantri.catatan?.length || 0) > 0 && (
            <div className="glass-panel p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-success" /> Catatan Harian</h3>
              <div className="space-y-2">
                {selectedSantri.catatan.slice(0, 5).map((c, i) => (
                  <div key={i} className="p-2 rounded-lg bg-surface-glass">
                    <div className="text-sm">{c.content}</div>
                    <div className="text-xs text-muted mt-1">{new Date(c.createdAt).toLocaleDateString('id-ID')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {searched && !loading && santriList.length === 0 && !error && (
        <div className="text-center py-12 text-muted">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Tidak ditemukan data santri untuk nomor tersebut.</p>
        </div>
      )}
    </div>
  );
}
