import { useState, useEffect, useCallback } from 'react';
import { QrCode, Loader2, Activity, Settings, Clock, Users, RefreshCw, Key, Smartphone, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuthStore } from '@/lib/store/auth.store';

interface Santri { id: string; name: string; nisn: string; kelas: string; room: string; }
interface AttendanceLog { id: string; santriName: string; type: string; timestamp: string; }

export function PresensiPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'qr' | 'log' | 'settings'>('qr');
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(user?.tenantId || null);
  const [scannerPin, setScannerPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinLoading, setPinLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  const scannerUrl = window.location.hostname === 'localhost'
    ? `${window.location.protocol}//${window.location.hostname}:5174`
    : `${window.location.protocol}//scanner.${window.location.hostname}`;

  const fetchScannerPin = useCallback(async () => {
    const targetId = selectedTenantId || 'me';
    if (user?.role === 'SUPERADMIN' && !selectedTenantId) return;
    try {
      const res = await api.get(`/tenants/${targetId}/scanner-pin?tenantId=${targetId}`);
      setScannerPin(res.data.scannerPin);
    } catch {
      console.error('Failed to fetch scanner PIN');
    }
  }, [selectedTenantId, user?.role]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let targetTenantId = selectedTenantId;
    if (user?.role === 'SUPERADMIN' && !targetTenantId) {
      try {
        const tenantsRes = await api.get('/tenants');
        if (tenantsRes.data && tenantsRes.data.length > 0) {
          targetTenantId = tenantsRes.data[0].id;
          setSelectedTenantId(targetTenantId);
        }
      } catch { /* silent */ }
    }
    if (!targetTenantId) { setLoading(false); return; }
    const tenantParam = `?tenantId=${targetTenantId}`;
    try {
      const [santriRes, logRes] = await Promise.allSettled([
        api.get(`/santri${tenantParam}`),
        api.get(`/attendance/today${tenantParam}`),
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
  }, [user?.role, selectedTenantId]);

  useEffect(() => {
    fetchData();
    if (user?.role === 'SUPERADMIN' || user?.role === 'TENANT_ADMIN') {
      fetchScannerPin();
    }
  }, [user?.role, fetchScannerPin, fetchData]);

  const generateNewPin = async () => {
    setPinLoading(true);
    const targetId = user?.tenantId || 'all';
    const tenantParam = user?.role === 'SUPERADMIN' ? '?tenantId=' + targetId : '';
    try {
      if (user?.role === 'SUPERADMIN' && !user?.tenantId) {
        toast.error('Gunakan akun Admin Pesantren untuk generate PIN Scanner.');
        return;
      }
      const res = await api.post(`/tenants/${targetId}/scanner-pin/generate${tenantParam}`);
      setScannerPin(res.data.scannerPin);
      toast.success('PIN Scanner berhasil digenerate');
    } catch {
      toast.error('Gagal generate PIN Scanner');
    } finally {
      setPinLoading(false);
    }
  };

  const generateQRSvg = (text: string) => {
    const encoded = btoa(text);
    const size = 160;
    const cells = 8;
    const cellSize = size / cells;
    let rects = '';
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-main">Presensi Digital QR Code</h1>
          <p className="text-muted text-sm mt-1">Kelola presensi santri dan pengaturan Portal Scanner.</p>
        </div>
        <a
          href={scannerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary shadow-glow flex items-center gap-2"
        >
          <Smartphone className="w-4 h-4" /> Scanner Mobile
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-light">
        <button onClick={() => setTab('qr')} className={clsx('px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2', tab === 'qr' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main')}>
          <QrCode className="w-4 h-4" /> QR Code Santri
        </button>
        <button onClick={() => setTab('log')} className={clsx('px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2', tab === 'log' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main')}>
          <Clock className="w-4 h-4" /> Log Hari Ini
        </button>
        {(user?.role === 'SUPERADMIN' || user?.role === 'TENANT_ADMIN') && (
          <button onClick={() => setTab('settings')} className={clsx('px-6 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2', tab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main')}>
            <Settings className="w-4 h-4" /> Pengaturan Scanner
          </button>
        )}
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
                  />
                  <div className="text-xs text-muted font-mono mb-1 truncate" title={s.id}>{s.id.substring(0, 8)}...</div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-muted">Kelas {s.kelas || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'settings' ? (
        <div className="max-w-md mx-auto mt-8">
          <div className="glass-panel p-6 border border-light rounded-xl space-y-6 flex flex-col items-center">
            <div className="bg-primary/20 p-4 rounded-full text-primary">
              <Key className="w-8 h-8" />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-main mb-1">PIN Portal Scanner</h3>
              <p className="text-sm text-muted">Gunakan PIN ini untuk login ke Scanner Mobile di HP.</p>
            </div>

            <div className="w-full bg-surface-glass border border-light rounded-lg p-6 text-center">
              {scannerPin ? (
                <div className="text-4xl font-mono font-bold tracking-[0.2em] text-primary">
                  {scannerPin}
                </div>
              ) : (
                <div className="text-muted italic flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" /> Belum ada PIN digenerate
                </div>
              )}
            </div>

            <button
              onClick={generateNewPin}
              disabled={pinLoading}
              className="btn btn-primary w-full shadow-glow"
            >
              {pinLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {scannerPin ? 'Generate Ulang PIN' : 'Generate PIN Scanner'}
            </button>

            {/* Scanner URL Section */}
            <div className="w-full border-t border-light pt-6 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-main mb-1 flex items-center justify-center gap-2">
                  <Smartphone className="w-5 h-5" /> Akses Scanner Mobile
                </h3>
                <p className="text-sm text-muted">Scan QR code ini dari HP untuk membuka scanner absensi</p>
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-light">
                  <QRCode value={scannerUrl} size={160} level="H" bgColor="#ffffff" fgColor="#0f172a" />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-surface-glass border border-light rounded-lg px-3 py-2">
                <span className="text-sm font-mono text-muted flex-1 truncate">{scannerUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(scannerUrl);
                    setUrlCopied(true);
                    toast.success('URL disalin!');
                    setTimeout(() => setUrlCopied(false), 2000);
                  }}
                  className="btn btn-sm btn-outline flex items-center gap-1 shrink-0"
                >
                  {urlCopied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {urlCopied ? 'Disalin' : 'Salin'}
                </button>
              </div>

              <a
                href={scannerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline w-full flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" /> Buka Scanner Mobile
              </a>
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
                    <td className="py-3 px-6">
                      <span className={`badge ${log.type === 'MASUK' || log.type === 'HADIR' ? 'badge-success' : 'badge-warning'}`}>
                        {log.type}
                      </span>
                    </td>
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
