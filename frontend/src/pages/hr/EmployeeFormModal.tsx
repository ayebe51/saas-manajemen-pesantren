import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { X, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeFormModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [position, setPosition] = useState('GURU');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setNip('');
      setPosition('GURU');
      setPhone('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !position) {
       toast.error('Mohon isi Nama dan Posisi Jabatan.');
       return;
    }

    setLoading(true);
    try {
      await api.post('/employee', {
        name,
        nip,
        position,
        phone,
      });

      toast.success('Pendaftaran staf/guru berhasil!');
      onSuccess();
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string | object } } };
      const msg = err.response?.data?.message || 'Gagal menyimpan data kepegawaian.';
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
          <h2 className="text-lg font-bold text-main">Pendaftaran Pegawai Baru</h2>
          <button 
            title="Tutup Formulir"
            onClick={onClose}
            className="p-2 hover:bg-surface-glass rounded-full transition-colors text-muted hover:text-main"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto">
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="input-base w-full" 
                placeholder="Contoh: Ust. Abdul Somad"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1">NIP / ID (Opsional)</label>
                 <input 
                   type="text" 
                   className="input-base w-full" 
                   placeholder="Contoh: 198203..."
                   value={nip}
                   onChange={e => setNip(e.target.value)}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Jabatan Utama</label>
                 <select title="Pilih Jabatan Utama" className="input-base w-full" value={position} onChange={e => setPosition(e.target.value)}>
                   <option value="GURU">Asatidz / Guru</option>
                   <option value="MUSYRIF">Musyrif Asrama</option>
                   <option value="STAF">Staf TU & Kantor</option>
                   <option value="SECURITY">Karyawan Keamanan</option>
                 </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nomor Handphone (Opsional)</label>
              <input 
                type="text" 
                className="input-base w-full" 
                placeholder="Contoh: 08123456789"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
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
             form="employee-form"
             className="btn btn-primary flex items-center gap-2"
             disabled={loading}
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Simpan Pegawai
           </button>
        </div>

      </div>
    </div>
  );
}
