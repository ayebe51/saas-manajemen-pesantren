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

export function TahfidzFormModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [santriyList, setSantriyList] = useState<SantriOption[]>([]);
  const [fetchingSantri, setFetchingSantri] = useState(false);

  // Form State
  const [santriId, setSantriId] = useState('');
  const [surah, setSurah] = useState('');
  const [ayat, setAyat] = useState('');
  const [type, setType] = useState('ZIYADAH');
  const [grade, setGrade] = useState('LANCAR');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSantri();
      // Reset form on open
      setSantriId('');
      setSurah('');
      setAyat('');
      setType('ZIYADAH');
      setGrade('LANCAR');
      setNotes('');
    }
  }, [isOpen]);

  const fetchSantri = async () => {
    setFetchingSantri(true);
    try {
       // Ideally we search/paginate for large list, but for now fetch all or active
       const res = await api.get('/santri?limit=100'); 
       setSantriyList(Array.isArray(res.data) ? res.data : (res.data?.data?.items || res.data?.data || []));
    } catch (e) {
       console.error(e);
       toast.error('Gagal memuat daftar santri');
    } finally {
       setFetchingSantri(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriId || !surah || !type) {
       toast.error('Mohon lengkapi bagian Santri, Surah, dan Jenis Hafalan.');
       return;
    }

    setLoading(true);
    try {
      await api.post('/tahfidz', {
        santriId,
        surah,
        ayat,
        type,
        grade,
        notes,
      });

      toast.success('Setoran tahfidz berhasi dicatat!');
      onSuccess();
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string | object } } };
      const msg = err.response?.data?.message || 'Gagal menyimpan setoran hafalan.';
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
          <h2 className="text-lg font-bold text-main">Catat Setoran Baru</h2>
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
          <form id="tahfidz-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium mb-1">Nama Santri <span className="text-danger">*</span></label>
              {fetchingSantri ? (
                 <div className="input-base flex items-center gap-2 text-muted">
                   <Loader2 className="w-4 h-4 animate-spin" /> Memuat santri...
                 </div>
              ) : (
                <select 
                  title="Pilih Santri"
                  className="input-base" 
                  value={santriId} 
                  onChange={e => setSantriId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriyList.map(s => (
                     <option key={s.id} value={s.id}>{s.name} (Kls {s.kelas})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Surah / Juz <span className="text-danger">*</span></label>
                 <input 
                   type="text" 
                   className="input-base" 
                   placeholder="Contoh: Al-Baqarah"
                   value={surah}
                   onChange={e => setSurah(e.target.value)}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Ayat / Halaman</label>
                 <input 
                   type="text" 
                   className="input-base" 
                   placeholder="Contoh: 1-5"
                   value={ayat}
                   onChange={e => setAyat(e.target.value)}
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Tipe Setoran</label>
                 <select title="Tipe Setoran" className="input-base" value={type} onChange={e => setType(e.target.value)}>
                   <option value="ZIYADAH">Ziyadah (Hafalan Baru)</option>
                   <option value="MUROJAAH">Muroja'ah (Ulangan)</option>
                   <option value="SABAQ">Sabaq</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Predikat</label>
                 <select title="Predikat hafalan" className="input-base" value={grade} onChange={e => setGrade(e.target.value)}>
                   <option value="MUMTAZ">Mumtaz (Sangat Baik)</option>
                   <option value="LANCAR">Lancar (Jiyyad)</option>
                   <option value="CUKUP">Cukup (Maqbul)</option>
                   <option value="KURANG">Perlu Diulang</option>
                 </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Catatan Tambahan (Opsional)</label>
              <textarea 
                className="input-base min-h-[80px]" 
                placeholder="Catatan tajwid atau makhraj untuk santri..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              ></textarea>
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
             form="tahfidz-form"
             className="btn btn-primary flex items-center gap-2"
             disabled={loading}
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Simpan Setoran
           </button>
        </div>

      </div>
    </div>
  );
}
