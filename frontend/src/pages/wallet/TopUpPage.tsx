import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api/client';
import { useAuthStore } from '../../lib/store/auth.store';
import toast from 'react-hot-toast';

interface SantriOption {
  id: string;
  name: string;
  nisn: string;
}

// Tambahkan type definition untuk instance midtrans global window
declare global {
  interface Window {
    snap: { pay: (token: string, options: Record<string, unknown>) => void };
  }
}

export default function TopUpPage() {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState<number | ''>('');
  const [santriData, setSantriData] = useState<SantriOption[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Jika Wali Santri, tarik daftar anak (Santri) mereka
  useEffect(() => {
    const fetchSantris = async () => {
      try {
        if (user?.role === 'WALI_SANTRI' && user.id) {
           // Mock get santris of the Wali
           const response = await api.get(`/santri?waliId=${user.id}`);
           if(response.data?.data) {
             setSantriData(response.data.data);
             if(response.data.data.length > 0) {
               setSelectedSantri(response.data.data[0].id);
             }
           }
        }
      } catch (e) {
        console.error(e);
        toast.error("Gagal menarik data Anak.");
      }
    };
    
    fetchSantris();
    
    // Inject Script Midtrans Snap secara dinamis ke dalam halaman
    const script = document.createElement('script');
    // Ganti dengan Production URL sesuai env saat rilis
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'; 
    // Ganti Client Key dengan env variable yang sesungguhnya  
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-y1y2y3y4');
    document.head.appendChild(script);

    return () => {
       document.head.removeChild(script);
    }
  }, [user]);

  const presetAmounts = [20000, 50000, 100000, 200000, 500000];

  const handleTopUp = async () => {
     if(!amount || amount < 10000) {
       toast.error("Nominal Top-Up minimal Rp 10.000");
       return;
     }
     
     if(!selectedSantri) {
       toast.error("Silakan pilih Santri penerima saldo.");
       return;
     }

     setIsLoading(true);

     try {
       // 1. Minta Snap Token dari Backend Kita
       const response = await api.post('/payments/topup/request', {
          santriId: selectedSantri,
          amount: Number(amount)
       });

       const transactionToken = response.data?.token;

       if(transactionToken) {
          // 2. Tampilkan Popup Midtrans
          window.snap.pay(transactionToken, {
            onSuccess: function(result: unknown){
              toast.success("Pembayaran Berhasil! Saldo akan masuk otomatis.");
              console.log(result);
            },
            onPending: function(result: unknown){
              toast.success("Menunggu pembayaran Anda. Silakan bayar sesuai instruksi.");
              console.log(result);
            },
            onError: function(result: unknown){
              toast.error("Pembayaran gagal / dibatalkan.");
              console.log(result);
            },
            onClose: function(){
              toast("Popup ditutup tanpa menyelesaikan pembayaran.");
            }
          });
       } else {
          toast.error("Gagal mendapatkan Token Pembayaran.");
       }
     } catch (e) {
        console.error(e);
        toast.error("Terjadi ksalahan koneksi server.");
     } finally {
        setIsLoading(false);
     }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Top-Up Saldo</h2>
          <p className="text-slate-500 mt-1">Isi ulang E-Wallet anak Anda cepat & aman (Tanpa Ribet).</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
           <ShieldCheck className="w-5 h-5 text-emerald-400" />
           <span className="text-emerald-700 font-medium text-sm">Pembayaran Terverifikasi (Midtrans)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Top Up */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6">
               
               <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Santri Penerima (Anak)</label>
                    <div className="relative">
                      <select 
                        title="Pilih Anak"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        value={selectedSantri}
                        onChange={(e) => setSelectedSantri(e.target.value)}
                      >
                         <option value="" disabled>-- Pilih Anak Anda --</option>
                         {santriData.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.nisn})</option>
                         ))}
                         {santriData.length === 0 && (
                            <option value="test-uuid-demo-123">Budi (Santri Demo - Sandbox)</option>
                         )}
                      </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nominal Top-Up</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">Rp</span>
                       <input 
                         type="number"
                         className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-4 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400 placeholder:font-normal"
                         placeholder="0"
                         value={amount}
                         onChange={(e) => setAmount(Number(e.target.value))}
                       />
                    </div>
                 </div>

                 {/* Cepat Pilih Template Nominal */}
                 <div>
                    <p className="text-xs text-slate-500 mb-2 block font-medium">Pilihan Cepat:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                       {presetAmounts.map((preset) => (
                           <button
                             key={preset}
                             onClick={() => setAmount(preset)}
                             className={`py-2 px-1 text-sm font-medium rounded-lg transition-all ${
                                amount === preset 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-600' 
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                             }`}
                           >
                              {(preset / 1000)}k
                           </button>
                       ))}
                    </div>
                 </div>

                 <button
                    onClick={handleTopUp}
                    disabled={isLoading || !amount || amount < 10000}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                 >
                    {isLoading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                       <CreditCard className="w-5 h-5" />
                    )}
                    <span>Top-Up via Midtrans M-Banking</span>
                 </button>
               </div>
           </div>
        </div>

        {/* Kolom Kanan: Info Panel */}
        <div className="space-y-6">
           {/* Kartu Dompet Bayangan Mini */}
           <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-500 to-purple-600 aspect-[1.6]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-6 -mb-6"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-white/70 font-medium text-sm">Target Saldo</p>
                       <p className="text-white font-bold tracking-widest mt-1 opacity-80 uppercase text-xs">E-WALLET SANTRI</p>
                    </div>
                    <Wallet className="text-white/90 w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-white text-3xl font-bold">
                       {amount ? `+Rp ${amount.toLocaleString('id-ID')}` : 'Rp 0'}
                    </p>
                 </div>
              </div>
           </div>

           <div className="bg-white/70 border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
              <h3 className="text-slate-800 font-semibold mb-2 text-sm uppercase tracking-wider">Metode Pembayaran Tersedia</h3>
              <div className="space-y-3">
                 <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg"><Smartphone className="w-4 h-4 text-blue-500" /></div>
                    <span className="text-sm text-slate-600 font-medium">QRIS <span className="text-slate-400 font-normal">(Gopay, OVO, Dana, LinkAja)</span></span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg"><CreditCard className="w-4 h-4 text-emerald-500" /></div>
                    <span className="text-sm text-slate-600 font-medium">Virtual Account <span className="text-slate-400 font-normal">(BCA, Mandiri, BNI, BRI)</span></span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-2 border border-slate-100 rounded-lg"><CheckCircle2 className="w-4 h-4 text-orange-500" /></div>
                    <span className="text-sm text-slate-600 font-medium">Retail <span className="text-slate-400 font-normal">(Alfamart / Indomaret)</span></span>
                 </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-200">
                Penyelesaian pembayaran akan otomatis mencatat mutasi pada akun anak Anda dengan durasi rata-rata &lt;1 detik.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
