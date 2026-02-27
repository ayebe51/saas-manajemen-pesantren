import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShieldCheck, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

export function ScanPage() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    // Only initialize if we haven't scanned anything successfully yet
    if (!scanResult) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);

      return () => {
        scanner.clear().catch(error => {
          console.error('Failed to clear html5QrcodeScanner. ', error);
        });
      };
    }
  }, [scanResult]);

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanning once we get a result to prevent rapid-fire requests
    setScanResult(decodedText);
    setIsProcessing(true);

    try {
      // Decode assuming format: IZIN-TENANTID-TIMESTAMP-RANDOM
      // For simplicity in this demo, let's assume the QR Code IS the izin ID
      // Realistically, the backend would decrypt `qrCodeData` to find the Ticket.
      // We'll mock the endpoint call here using the raw decodedText as ID for now.
      
      const res = await api.post(`/izin/scan-checkout`, { qrData: decodedText });
      
      setSuccessData(res.data);
      toast.success('Izin Valid! Proses Check-Out Berhasil.');

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(error);
      const errMsg = error.response?.data?.message || 'Tiket Izin tidak valid / Kadaluarsa.';
      toast.error(errMsg);
      // Reset scan immediately on failure so pos satpam can try again
      setTimeout(() => setScanResult(null), 3000); 
    } finally {
      setIsProcessing(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onScanFailure = () => {
    // handle scan failure, usually better to ignore and keep scanning
    // console.warn(`Code scan error = ${error}`);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4">
      <div className="flex items-center gap-4">
        <button 
          title="Kembali ke Asrama"
          onClick={() => navigate('/asrama')}
          className="p-2 bg-surface hover:bg-surface-glass rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-main">Pos Keamanan (Scanner)</h1>
          <p className="text-muted text-sm">Validasi Gatepass Santri</p>
        </div>
      </div>

      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[400px]">
        
        {!scanResult && !successData && (
           <div className="w-full">
              <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-primary/20 shadow-glow bg-black"></div>
              <p className="text-center text-sm text-muted mt-4 flex items-center justify-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-500" />
                 Arahkan Kamera ke QR Code Surat Jalan
              </p>
           </div>
        )}

        {isProcessing && (
           <div className="flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-300">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <h3 className="font-semibold text-lg text-main">Memverifikasi Tiket...</h3>
              <p className="text-muted text-sm px-8">Sedang mencocokkan kode keamanan dengan server pusat.</p>
           </div>
        )}

        {successData && !isProcessing && (
           <div className="flex flex-col items-center text-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-success/20 rounded-full animate-ping"></div>
                 <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <div>
                 <h3 className="font-bold text-2xl text-main text-success">Izin Sah!</h3>
                 <p className="text-muted mt-1">Status santri kini berubah menjadi 'Sedang di luar asrama'</p>
              </div>
              
              <div className="w-full bg-surface-glass border border-light p-4 rounded-xl text-left mt-4 space-y-2">
                 <div className="flex justify-between border-b border-light/50 pb-2">
                    <span className="text-muted text-sm">Pemegang Izin:</span>
                    <span className="font-semibold">{successData.santriName || 'Budi'}</span>
                 </div>
                 <div className="flex justify-between border-b border-light/50 pb-2">
                    <span className="text-muted text-sm">Keperluan:</span>
                    <span className="font-medium text-right max-w-[150px] truncate">{successData.reason || 'Sakit perut pulang'}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted text-sm">Batas Kembali:</span>
                    <span className="text-danger font-semibold text-sm">HARI INI 20:00</span>
                 </div>
              </div>

              <button 
                onClick={() => { setSuccessData(null); setScanResult(null); }}
                className="btn btn-primary w-full mt-4"
              >
                Scan Surat Berikutnya
              </button>
           </div>
        )}

      </div>
    </div>
  );
}
