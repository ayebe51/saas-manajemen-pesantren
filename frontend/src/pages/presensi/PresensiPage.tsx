import { useState, useEffect } from 'react';
import { QrCode, Camera, Loader2, Activity, CheckCircle, Clock, Users } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Santri { id: string; name: string; nisn: string; kelas: string; room: string; }
interface AttendanceLog { id: string; santriName: string; type: string; timestamp: string; }

export function PresensiPage() {
  const [tab, setTab] = useState<'qr' | 'scan' | 'log'>('qr');
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [santriRes, logRes] = await Promise.allSettled([
        api.get('/santri'),
        api.get('/attendance/today'),
      ]);
      if (santriRes.status === 'fulfilled') {
        const d = Array.isArray(santriRes.value.data) ? santriRes.value.data : (santriRes.value.data?.data || []);
        setSantriList(d);
      }
      if (logRes.status === 'fulfilled') {
        const d = Array.isArray(logRes.value.data) ? logRes.value.data : (logRes.value.data?.data || []);
        setLogs(d);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    try {
      await api.post('/attendance/scan', { santriId: scanInput.trim(), type: 'MASUK' });
      toast.success('Presensi berhasil dicatat!');
      setScanInput('');
      fetchData();
    } catch {
      toast.error('Gagal mencatat presensi. ID santri tidak valid.');
    }
  };

  // Generate QR data URL using a simple SVG-based QR placeholder
  const generateQRSvg = (text: string) => {
    // Use a simple encoded SVG as QR placeholder
    const encoded = btoa(text);
    const size = 160;
    const cells = 8;
    const cellSize = size / cells;
    let rects = '';
    // Deterministic pseudo-random pattern based on text hash
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const hash = (encoded.charCodeAt((x + y * cells) % encoded.length) + x * 7 + y * 13) % 3;
        if (hash !== 0 || (x < 2 && y < 2) || (x >= cells-2 && y < 2) || (x < 2 && y >= cells-2)) {
          rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="currentColor"/>`;
        }
      }
    }
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${rects}</svg>`)}`;
  };

  const filteredSantri = santriList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.nisn || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Presensi Digital QR Code</h1>
        <p className="text-muted text-sm mt-1">Kelola presensi santri dengan pemindaian QR code.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-light">
        <button onClick={() => setTab('qr')} className={clsx('px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2', tab === 'qr' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main')}>
          <QrCode className="w-4 h-4" /> QR Code Santri
        </button>
        <button onClick={() => setTab('scan')} className={clsx('px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2', tab === 'scan' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main')}>
          <Camera className="w-4 h-4" /> Scan Presensi
        </button>
        <button onClick={() => setTab('log')} className={clsx('px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2', tab === 'log' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main')}>
          <Clock className="w-4 h-4" /> Log Hari Ini
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center items-center flex-col text-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p>Memuat data...</p>
        </div>
      ) : tab === 'qr' ? (
        <div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Cari santri..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-base w-full md:w-80"
            />
          </div>
          {filteredSantri.length === 0 ? (
            <div className="p-12 flex justify-center items-center flex-col text-muted">
              <Activity className="w-12 h-12 mb-4 opacity-50" />
              <p>Tidak ada santri ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSantri.slice(0, 20).map(s => (
                <div key={s.id} className="glass-panel p-4 text-center hover:shadow-glow transition-all">
                  <img
                    src={generateQRSvg(s.id)}
                    alt={`QR ${s.name}`}
                    className="w-32 h-32 mx-auto mb-3 text-main"
                    style={{ filter: 'none' }}
                  />
                  <div className="text-xs text-muted font-mono mb-1 truncate" title={s.id}>{s.id.substring(0, 8)}...</div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-muted">Kelas {s.kelas || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'scan' ? (
        <div className="max-w-md mx-auto">
          <div className="glass-panel p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Scan / Input Manual</h3>
            <p className="text-sm text-muted mb-6">Scan QR code santri atau masukkan ID santri secara manual untuk mencatat presensi.</p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="Masukkan ID Santri..."
                className="input-base flex-1"
              />
              <button onClick={handleScan} className="btn btn-primary shadow-glow px-5">
                <CheckCircle className="w-4 h-4" /> Catat
              </button>
            </div>

            <div className="text-xs text-muted p-3 rounded-lg bg-surface-glass">
              💡 Untuk scan QR menggunakan kamera, gunakan aplikasi scanner built-in di perangkat Anda dan paste ID yang didapat ke kolom di atas.
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-light flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Log Presensi Hari Ini</span>
            <span className="badge badge-success ml-2">{logs.length} catatan</span>
          </div>
          {logs.length === 0 ? (
            <div className="p-12 flex justify-center items-center flex-col text-muted">
              <Activity className="w-12 h-12 mb-4 opacity-50" />
              <p>Belum ada presensi tercatat hari ini.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-light bg-app">
                  <th className="py-3 px-6 font-semibold text-sm text-muted">Nama Santri</th>
                  <th className="py-3 px-6 font-semibold text-sm text-muted">Tipe</th>
                  <th className="py-3 px-6 font-semibold text-sm text-muted">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                    <td className="py-3 px-6 text-sm font-medium">{log.santriName}</td>
                    <td className="py-3 px-6"><span className={`badge ${log.type === 'MASUK' ? 'badge-success' : 'badge-warning'}`}>{log.type}</span></td>
                    <td className="py-3 px-6 text-sm text-muted">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
