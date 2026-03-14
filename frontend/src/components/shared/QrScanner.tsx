import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface QrScannerProps {
  onScan: (result: string) => void;
  width?: number;
  height?: number;
  label?: string;
}

export function QrScanner({ onScan, width = 300, height = 300, label = 'Arahkan kamera ke QR Code' }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-scanner-region';

  const startScanner = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: Math.min(width - 40, 250), height: Math.min(height - 40, 250) },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          // Don't stop automatically - let the user control when to stop
        },
        () => {
          // QR code not found in this frame - this is normal
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch {
      // Ignore errors when stopping
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        id={containerId}
        className="rounded-xl overflow-hidden bg-black/10 border-2 border-dashed border-light"
        style={{ width, height, minHeight: isScanning ? height : 'auto' }}
      >
        {!isScanning && !error && (
          <div className="flex flex-col items-center justify-center h-full text-muted gap-3 p-6">
            <Camera className="w-12 h-12 opacity-30" />
            <p className="text-sm text-center">{label}</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="text-sm text-danger text-center p-3 bg-danger/10 rounded-lg w-full max-w-xs">
          {error}
        </div>
      )}

      <button
        onClick={isScanning ? stopScanner : startScanner}
        className={`btn ${isScanning ? 'btn-outline text-danger border-danger hover:bg-danger/10' : 'btn-primary shadow-glow'} flex items-center gap-2`}
      >
        {isScanning ? (
          <>
            <CameraOff className="w-4 h-4" /> Matikan Kamera
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" /> Nyalakan Kamera Scanner
          </>
        )}
      </button>

      {isScanning && (
        <div className="flex items-center gap-2 text-sm text-muted animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" /> Menunggu QR Code...
        </div>
      )}
    </div>
  );
}
