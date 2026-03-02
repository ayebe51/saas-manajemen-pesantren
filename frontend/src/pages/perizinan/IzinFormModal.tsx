import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { X, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface SantriOption {
  id: string;
  name: string;
  kelas: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function IzinFormModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [santriyList, setSantriyList] = useState<SantriOption[]>([]);
  const [fetchingSantri, setFetchingSantri] = useState(false);

  // Form State
  const [santriId, setSantriId] = useState('');
  const [type, setType] = useState('PULANG');
  const [reason, setReason] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSantri();
      setSantriId('');
      setType('PULANG');
      setReason('');
      setStartAt('');
      setEndAt('');
    }
  }, [isOpen]);

  const fetchSantri = async () => {
    setFetchingSantri(true);
    try {
       const res = await api.get('/santri?limit=100'); 
       setSantriyList(res.data?.data?.items || res.data?.data || []);
    } catch (e) {
       console.error(e);
       toast.error('Gagal memuat daftar santri');
    } finally {
       setFetchingSantri(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriId || !reason || !startAt || !endAt) {
       toast.error('Mohon isi formulir dengan lengkap!');
       return;
    }

    // Format ISO Dates
    const isoStart = new Date(startAt).toISOString();
    const isoEnd = new Date(endAt).toISOString();

    setLoading(true);
    try {
      await api.post('/izin', {
        santriId,
        type,
        reason,
        startAt: isoStart,
        endAt: isoEnd
      });

      toast.success('Pengajuan Surat Izin Asrama berhasil diajukan!');
      onSuccess();
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string | object } } };
      const msg = err.response?.data?.message || 'Gagal menyimpan pemohonan izin.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-light w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-light">
          <h2 className="text-lg font-bold text-main">Buat Surat Izin Asrama</h2>
          <button 
            title="Tutup Formulir Izin"
            onClick={onClose}
            className="p-2 hover:bg-surface-glass rounded-full transition-colors text-muted hover:text-main"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto">
          <form id="izin-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium mb-1">Pilih Santri <span className="text-danger">*</span></label>
              {fetchingSantri ? (
                 <div className="input-base flex items-center gap-2 text-muted">
                   <Loader2 className="w-4 h-4 animate-spin" /> Memuat santri...
                 </div>
              ) : (
                <select 
                  title="Pilih Nama Santri"
                  className="input-base" 
                  value={santriId} 
                  onChange={e => setSantriId(e.target.value)}
                  required
                >
                  <option value="">-- Cari Nama Santri --</option>
                  {santriyList.map(s => (
                     <option key={s.id} value={s.id}>{s.name} (Kls {s.kelas})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kepentingan</label>
              <select title="Pilih Kepentingan Izin" className="input-base" value={type} onChange={e => setType(e.target.value)}>
                <option value="PULANG">Izin Pulang (Rumah)</option>
                <option value="KELUAR">Izin Keluar Komplek (Beli Barang, dll)</option>
                <option value="SAKIT">Izin Sakit (Rawat Inap/Jalan)</option>
              </select>
            </div>

            <div>
               <label className="block text-sm font-medium mb-1">Alasan Terperinci <span className="text-danger">*</span></label>
               <input 
                 type="text" 
                 className="input-base" 
                 placeholder="Contoh: Menjenguk nenek sakit / Beli Kitab Kuning"
                 value={reason}
                 onChange={e => setReason(e.target.value)}
                 required
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1 text-amber-500 font-semibold">Berangkat</label>
                 <input 
                   title="Waktu Berangkat"
                   placeholder="Waktu Berangkat"
                   type="datetime-local" 
                   className="input-base" 
                   value={startAt}
                   onChange={e => setStartAt(e.target.value)}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1 text-green-500 font-semibold">Pulang</label>
                 <input 
                   title="Waktu Kembali"
                   placeholder="Waktu Kembali"
                   type="datetime-local" 
                   className="input-base" 
                   value={endAt}
                   onChange={e => setEndAt(e.target.value)}
                   required
                 />
               </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-light bg-surface-glass flex justify-end gap-3 rounded-b-2xl">
           <button 
             type="button" 
             onClick={onClose}
             className="btn btn-outline"
             disabled={loading}
           >
             Batal
           </button>
           <button 
             type="submit" 
             form="izin-form"
             className="btn btn-primary flex items-center gap-2 shadow-glow"
             disabled={loading}
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Kirim Pengajuan
           </button>
        </div>

      </div>
    </div>
  );
}
