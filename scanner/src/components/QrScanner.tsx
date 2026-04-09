import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Loader2, MapPin } from 'lucide-react';

interface QrScannerProps {
  onScan: (result: string, gps?: { lat: number; lng: number; accuracy: number }) => void;
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const containerId = 'scanner-camera-region';

  // Start GPS watch when scanning begins
  useEffect(() => {
    if (isScanning) {
      setGpsStatus('loading');
      if (!navigator.geolocation) {
        setGpsStatus('error');
        return;
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
          setGpsStatus('ok');
        },
        () => setGpsStatus('error'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isScanning]);

  const startScanner = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
        (decoded) => { onScan(decoded, gps ?? undefined); },
        () => {}
      );
      setIsScanning(true);
    } catch {
      setError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan dan Anda menggunakan HTTPS.');
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch { /* ignore */ }
    setIsScanning(false);
    setGpsStatus('idle');
    setGps(null);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => {}); } catch { /* ignore */ }
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div
        id={containerId}
        style={{
          width: '100%', maxWidth: '320px', aspectRatio: '1',
          borderRadius: '1rem', overflow: 'hidden',
          background: isScanning ? '#000' : 'var(--surface)',
          border: '2px dashed var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {!isScanning && !error && (
          <div className="text-center" style={{ padding: '2rem' }}>
            <Camera size={48} style={{ opacity: 0.2, margin: '0 auto 0.75rem' }} />
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>Tekan tombol di bawah untuk memulai kamera</p>
          </div>
        )}
      </div>

      {/* GPS Status */}
      {isScanning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: gpsStatus === 'ok' ? 'var(--success)' : gpsStatus === 'error' ? 'var(--danger)' : 'var(--text-muted)' }}>
          <MapPin size={13} />
          {gpsStatus === 'loading' && 'Mencari GPS...'}
          {gpsStatus === 'ok' && gps && `GPS OK (±${gps.accuracy}m)`}
          {gpsStatus === 'error' && 'GPS tidak tersedia'}
          {gpsStatus === 'idle' && ''}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: '0.8125rem', textAlign: 'center', width: '100%', maxWidth: '320px' }}>
          {error}
        </div>
      )}

      <button
        onClick={isScanning ? stopScanner : startScanner}
        className={`btn btn-lg ${isScanning ? 'btn-danger' : 'btn-primary pulse-glow'}`}
        style={{ width: '100%', maxWidth: '320px', justifyContent: 'center' }}
      >
        {isScanning ? <><CameraOff size={20} /> Matikan Kamera</> : <><Camera size={20} /> Nyalakan Kamera</>}
      </button>

      {isScanning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }} className="text-muted">
          <Loader2 size={16} className="animate-spin" /> Menunggu QR Code...
        </div>
      )}
    </div>
  );
}
