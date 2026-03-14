import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

interface SantriFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any; // To support editing
}

export function SantriFormModal({ isOpen, onClose, onSuccess, initialData }: SantriFormProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nisn: '',
    name: '',
    gender: 'L',
    dob: '',
    kelas: '10',
    room: '',
    address: '',
    waliName: '',
    waliPhone: '',
    waliRelation: 'Ayah'
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        nisn: initialData.nisn || '',
        name: initialData.name || '',
        gender: initialData.gender || 'L',
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '', // format YYYY-MM-DD
        kelas: initialData.kelas || '10',
        room: initialData.room || '',
        address: initialData.address || '',
        waliName: initialData.waliName || '',
        waliPhone: initialData.waliPhone || '',
        waliRelation: initialData.waliRelation || 'Ayah'
      });
    } else if (!isOpen) {
       setFormData({ nisn: '', name: '', gender: 'L', dob: '', kelas: '10', room: '', address: '', waliName: '', waliPhone: '', waliRelation: 'Ayah' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (initialData?.id) {
         await api.put(`/santri/${initialData.id}`, {
            ...formData,
            tenantId: user?.tenantId,
            dob: formData.dob ? new Date(formData.dob).toISOString() : undefined
         });
      } else {
         // Endpoint API expect dob in ISO String or YYYY-MM-DD
         await api.post('/santri', {
           ...formData,
           tenantId: user?.tenantId,
           dob: formData.dob ? new Date(formData.dob).toISOString() : undefined
         });
      }
      onSuccess(); // Triggers parent to refetch data and close modal
    } catch (err: unknown) {
       const error = err as { response?: { data?: { message?: string } } };
       setError(error.response?.data?.message || 'Gagal menyimpan data santri.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative glass-panel w-full max-w-2xl bg-surface p-6 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 bg-surface">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-light">
          <h2 className="text-xl font-bold text-main">{initialData ? 'Ubah Data Santri' : 'Formulir Pendaftaran Santri'}</h2>
          <button title="Tutup Formulir" onClick={onClose} className="p-2 text-muted hover:bg-surface-glass rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md badge-danger flex items-center justify-center text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
           {/* Row 1 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label htmlFor="nisn" className="block text-sm font-medium mb-1">NISN</label>
                 <input id="nisn" required type="text" className="input-base" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} placeholder="Contoh: 1234567890" />
              </div>
              <div>
                 <label htmlFor="name" className="block text-sm font-medium mb-1">Nama Lengkap</label>
                 <input id="name" required type="text" className="input-base" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Masukan nama santri" />
              </div>
           </div>

           {/* Row 2 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label htmlFor="gender" className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                 <select id="gender" title="Jenis Kelamin" className="input-base" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                   <option value="L">Laki-Laki</option>
                   <option value="P">Perempuan</option>
                 </select>
              </div>
              <div>
                 <label htmlFor="dob" className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                 <input id="dob" title="Tanggal Lahir" placeholder="DD/MM/YYYY" required type="date" className="input-base" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>
           </div>

           {/* Row 3 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label htmlFor="kelas" className="block text-sm font-medium mb-1">Kelas Aktif</label>
                 <select id="kelas" title="Pilih Kelas" className="input-base" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})}>
                   <option value="10">Kelas 10 (Satu Aliyah)</option>
                   <option value="11">Kelas 11 (Dua Aliyah)</option>
                   <option value="12">Kelas 12 (Tiga Aliyah)</option>
                 </select>
              </div>
              <div>
                 <label htmlFor="room" className="block text-sm font-medium mb-1">Penempatan Kamar (Opsional)</label>
                 <input id="room" type="text" className="input-base" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="Cth: Abu Bakar 01" />
              </div>
           </div>

           {/* Row 4 */}
           <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">Alamat Domisili</label>
              <textarea id="address" className="input-base min-h-[80px]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Alamat lengkap asal santri"></textarea>
           </div>

           {/* WALI SECTION */}
           <div className="border-t border-light pt-4 mt-4">
              <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Data Wali / Orang Tua</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="waliName" className="block text-sm font-medium mb-1">Nama Wali</label>
                    <input id="waliName" type="text" className="input-base" value={formData.waliName} onChange={e => setFormData({...formData, waliName: e.target.value})} placeholder="Nama lengkap wali" />
                 </div>
                 <div>
                    <label htmlFor="waliPhone" className="block text-sm font-medium mb-1">No. HP Wali</label>
                    <input id="waliPhone" type="text" className="input-base" value={formData.waliPhone} onChange={e => setFormData({...formData, waliPhone: e.target.value})} placeholder="08xxxxxxxxxx" />
                 </div>
                 <div>
                    <label htmlFor="waliRelation" className="block text-sm font-medium mb-1">Hubungan</label>
                    <select id="waliRelation" title="Hubungan Wali" className="input-base" value={formData.waliRelation} onChange={e => setFormData({...formData, waliRelation: e.target.value})}>
                      <option value="Ayah">Ayah</option>
                      <option value="Ibu">Ibu</option>
                      <option value="Kakak">Kakak</option>
                      <option value="Paman">Paman</option>
                      <option value="Bibi">Bibi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                 </div>
              </div>
           </div>

           {/* Actions Footers */}
           <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-light">
              <button type="button" onClick={onClose} className="btn btn-outline">Batal</button>
              <button type="submit" disabled={loading} className="btn btn-primary min-w-[120px]">
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
