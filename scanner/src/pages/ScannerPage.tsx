import { useState, useEffect } from 'react';
import { QrScanner } from '../components/QrScanner';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, LogIn, LogOut as LogOutIcon, Loader2, BookOpen, Clock, AlertTriangle } from 'lucide-react';

type ScanMode = 'HARIAN' | 'MAPEL' | 'PERIZINAN';

interface Schedule {
  id: string;
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
}

export function ScannerPage() {
  const [scanMode, setScanMode] = useState<ScanMode>('HARIAN');
  const [harianType, setHarianType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  
  const [lastScan, setLastScan] = useState<{ name: string; time: string; text: string; success: boolean } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  useEffect(() => {
    if (scanMode === 'MAPEL') {
      fetchSchedules();
    }
    setLastScan(null);
  }, [scanMode]);

  const fetchSchedules = async () => {
    setLoadingInitial(true);
    try {
      const res = await api.get('/attendance/schedules/today');
      setSchedules(res.data || []);
      if (res.data?.length > 0) {
        setSelectedScheduleId(res.data[0].id);
      }
    } catch {
      toast.error('Gagal mengambil jadwal pelajaran hr ini');
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleHarianScan = async (santriId: string, gps?: { lat: number; lng: number; accuracy: number }) => {
    try {
      const res = await api.post('/attendance/scan', {
        santriId,
        type: harianType,
        mode: 'HARIAN',
        gpsLat: gps?.lat || 0,
        gpsLng: gps?.lng || 0,
        gpsAccuracy: gps?.accuracy || 0,
      });
      const name = res.data?.santriName || res.data?.santri?.name || santriId.substring(0, 8);
      setLastScan({ 
        name, 
        time: new Date().toLocaleTimeString('id-ID'), 
        text: `Presensi ${harianType} tercatat`, 
        success: true 
      });
      toast.success(`✅ ${name} — ${harianType === 'MASUK' ? 'Masuk' : 'Keluar'} tercatat!`);
    } catch {
      toast.error('Gagal mencatat presensi harian.');
      setLastScan(null);
    }
  };

  const handleMapelScan = async (santriId: string, gps?: { lat: number; lng: number; accuracy: number }) => {
    if (!selectedScheduleId) {
      toast.error('Pilih jadwal pelajaran terlebih dahulu');
      return;
    }
    try {
      const res = await api.post('/attendance/scan', {
        santriId,
        mode: 'MAPEL',
        scheduleId: selectedScheduleId,
        gpsLat: gps?.lat || 0,
        gpsLng: gps?.lng || 0,
        gpsAccuracy: gps?.accuracy || 0,
      });
      const name = res.data?.santriName || res.data?.santri?.name || santriId.substring(0, 8);
      
      const scheduleName = schedules.find(s => s.id === selectedScheduleId)?.subject || 'Mapel';
      setLastScan({ 
        name, 
        time: new Date().toLocaleTimeString('id-ID'), 
        text: `Hadir Kelas ${scheduleName}`, 
        success: true 
      });
      toast.success(`✅ ${name} — Hadir Mapel!`);
    } catch {
      toast.error('Gagal mencatat presensi mapel.');
      setLastScan(null);
    }
  };

  const handlePerizinanScan = async (qr: string) => {
    try {
      // 1. Fetch info by barcode
      const res = await api.get(`/izin/barcode/${qr}`);
      const izin = res.data;

      // 2. Determine action based on status
      if (izin.status === 'APPROVED_WAITING_CHECKOUT' || izin.status === 'APPROVED') {
        // Checking Out
        const check = window.confirm(`Santri: ${izin.santri.name}\nIzin Keluar: ${new Date(izin.startAt).toLocaleString('id-ID')}\nHingga: ${new Date(izin.endAt).toLocaleString('id-ID')}\nAlasan: ${izin.reason}\n\nKonfirmasi santri keluar pondok sekarang?`);
        if (!check) return;

        await api.post(`/izin/${izin.id}/checkout`);
        
        setLastScan({ 
          name: izin.santri.name, 
          time: new Date().toLocaleTimeString('id-ID'), 
          text: `Santri Keluar Pondok`, 
          success: true 
        });
        toast.success(`✅ Santri Keluar dicatat!`);
      } 
      else if (izin.status === 'CHECKED_OUT') {
        // Checking In
        const endAt = new Date(izin.endAt);
        const now = new Date();
        const isLate = now > endAt;
        
        let confirmMsg = `Santri: ${izin.santri.name}\nBatas Waktu: ${endAt.toLocaleString('id-ID')}\n\nKonfirmasi santri kembali ke pondok?`;
        
        if (isLate) {
          confirmMsg = `⚠️ PERINGATAN KETERLAMBATAN ⚠️\n\nSantri: ${izin.santri.name}\nTerlambat kembali! Batas waktu: ${endAt.toLocaleString('id-ID')}\n\nTetap konfirmasi masuk?`;
        }

        const check = window.confirm(confirmMsg);
        if (!check) return;

        await api.post(`/izin/${izin.id}/checkin`);
        
        setLastScan({ 
          name: izin.santri.name, 
          time: now.toLocaleTimeString('id-ID'), 
          text: isLate ? `Kembali (Terlambat)` : `Kembali (Tepat Waktu)`, 
          success: !isLate 
        });
        toast.success(`✅ Santri Kembali dicatat!`);
      } else {
        toast.error(`Status Izin tidak valid untuk discan: ${izin.status}`);
      }
    } catch {
      toast.error('QR Izin tidak valid atau tidak ditemukan.');
      setLastScan(null);
    }
  };

  const handleScan = async (result: string, gps?: { lat: number; lng: number; accuracy: number }) => {
    if (processing) return;
    setProcessing(true);

    let parsedId = result;
    try {
      const parsed = JSON.parse(result);
      if (parsed.id) parsedId = parsed.id;
    } catch { /* raw text */ }

    if (scanMode === 'HARIAN') {
      await handleHarianScan(parsedId, gps);
    } else if (scanMode === 'MAPEL') {
      await handleMapelScan(parsedId, gps);
    } else if (scanMode === 'PERIZINAN') {
      await handlePerizinanScan(result);
    }

    setTimeout(() => setProcessing(false), 2000);
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      
      {/* Top Mode Selector */}
      <div style={{ display: 'flex', gap: '0.25rem', width: '100%', maxWidth: '340px', background: 'var(--surface)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setScanMode('HARIAN')}
          className={`btn ${scanMode === 'HARIAN' ? 'btn-primary' : ''}`}
          style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', background: scanMode === 'HARIAN' ? '' : 'transparent', color: scanMode === 'HARIAN' ? '' : 'var(--muted)' }}
        >
          <Clock size={16} style={{ marginBottom: '0.25rem', display: 'block', margin: '0 auto' }} />
          Harian
        </button>
        <button
          onClick={() => setScanMode('MAPEL')}
          className={`btn ${scanMode === 'MAPEL' ? 'btn-primary' : ''}`}
          style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', background: scanMode === 'MAPEL' ? '' : 'transparent', color: scanMode === 'MAPEL' ? '' : 'var(--muted)' }}
        >
          <BookOpen size={16} style={{ marginBottom: '0.25rem', display: 'block', margin: '0 auto' }} />
          Mapel
        </button>
        <button
          onClick={() => setScanMode('PERIZINAN')}
          className={`btn ${scanMode === 'PERIZINAN' ? 'btn-primary' : ''}`}
          style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', background: scanMode === 'PERIZINAN' ? '' : 'transparent', color: scanMode === 'PERIZINAN' ? '' : 'var(--muted)' }}
        >
          <LogOutIcon size={16} style={{ marginBottom: '0.25rem', display: 'block', margin: '0 auto' }} />
          Perizinan
        </button>
      </div>

      {/* Sub Mode Actions */}
      {scanMode === 'HARIAN' && (
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '340px' }}>
          <button
            onClick={() => setHarianType('MASUK')}
            className={`btn ${harianType === 'MASUK' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <LogIn size={18} /> Masuk Pondok
          </button>
          <button
            onClick={() => setHarianType('KELUAR')}
            className={`btn ${harianType === 'KELUAR' ? 'btn-danger' : 'btn-outline'}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <LogOutIcon size={18} /> Keluar Pondok
          </button>
        </div>
      )}

      {scanMode === 'MAPEL' && (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          {loadingInitial ? (
            <div style={{ textAlign: 'center', padding: '1rem' }} className="text-muted">
              <Loader2 className="animate-spin inline-block mr-2" size={16} /> Memuat Jadwal...
            </div>
          ) : schedules.length > 0 ? (
            <select
              className="input-field"
              value={selectedScheduleId}
              onChange={e => setSelectedScheduleId(e.target.value)}
              style={{ width: '100%' }}
            >
              {schedules.map(s => (
                <option key={s.id} value={s.id}>
                  {s.startTime.substring(0, 5)} - {s.subject} ({s.room})
                </option>
              ))}
            </select>
          ) : (
            <div className="card text-center text-muted" style={{ padding: '1rem', fontSize: '0.8125rem' }}>
              Tidak ada jadwal pelajaran hari ini.
            </div>
          )}
        </div>
      )}

      {scanMode === 'PERIZINAN' && (
        <div className="card text-center" style={{ padding: '1rem', width: '100%', maxWidth: '340px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: 'var(--main)' }}>
          <p style={{ fontSize: '0.8125rem', margin: 0 }}>
            <strong>Scan QR Izin</strong> untuk mengonfirmasi kepulangan atau kembalinya santri dari perizinan.
          </p>
        </div>
      )}

      {/* Main Scanner Area */}
      {((scanMode === 'MAPEL' && schedules.length > 0) || scanMode !== 'MAPEL') && (
        <>
          <QrScanner onScan={handleScan} />

          {processing && (
            <div className="card" style={{ padding: '1rem', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }} className="text-muted">Memproses Scan...</p>
            </div>
          )}

          {/* Last Scan Result */}
          {lastScan && !processing && (
            <div className="card animate-in" style={{
              padding: '1.25rem', width: '100%', maxWidth: '340px',
              borderLeft: `4px solid ${lastScan.success ? 'var(--success)' : 'var(--danger)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {lastScan.success ? (
                  <CheckCircle size={28} style={{ color: 'var(--success)' }} />
                ) : (
                  <AlertTriangle size={28} style={{ color: 'var(--danger)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{lastScan.name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${lastScan.success ? 'badge-success' : 'badge-danger'}`}>{lastScan.text}</span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{lastScan.time}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Input (Only for Harian/Mapel) */}
          {scanMode !== 'PERIZINAN' && (
            <ManualInput 
              onSuccess={(name) => {
                setLastScan({ name, time: new Date().toLocaleTimeString('id-ID'), text: 'Manual Input', success: true });
              }} 
              onSubmit={handleScan}
            />
          )}
        </>
      )}
    </div>
  );
}

function ManualInput({ onSubmit, onSuccess }: { onSubmit: (id: string) => Promise<void>, onSuccess: (name: string) => void }) {
  const [id, setId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return;
    await onSubmit(id.trim());
    setId('');
  };

  return (
    <div className="card" style={{ padding: '1rem', width: '100%', maxWidth: '340px', marginTop: '1rem' }}>
      <p className="text-muted" style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        Input Manual ID Santri
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Masukkan NISN / ID..."
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{ flex: 1, fontFamily: 'monospace' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          <CheckCircle size={16} />
        </button>
      </form>
    </div>
  );
}
