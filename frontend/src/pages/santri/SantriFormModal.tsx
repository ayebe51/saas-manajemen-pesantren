import React, { useState } from 'react';
import { api } from '@/lib/api/client';
import { X, Loader2 } from 'lucide-react';

interface SantriFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SantriFormModal({ isOpen, onClose, onSuccess }: SantriFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nisn: '',
    name: '',
    gender: 'L',
    dob: '',
    kelas: '10',
    room: '',
    address: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Endpoint API expect dob in ISO String or YYYY-MM-DD
      await api.post('/santri', {
        ...formData,
        dob: new Date(formData.dob).toISOString()
      });
      onSuccess(); // Triggers parent to refetch data and close modal
    } catch (err: any) {
       setError(err.response?.data?.message || 'Gagal menyimpan data santri baru.');
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
      <div className="relative glass-panel w-full max-w-2xl bg-surface p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--bg-surface)' }}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-light)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>Formulir Pendaftaran Santri</h2>
          <button onClick={onClose} className="p-2 text-muted hover:bg-surface-glass rounded-full transition-colors">
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
                 <label className="block text-sm font-medium mb-1">NISN</label>
                 <input required type="text" className="input-base" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} placeholder="Contoh: 1234567890" />
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                 <input required type="text" className="input-base" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Masukan nama santri" />
              </div>
           </div>

           {/* Row 2 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                 <select className="input-base" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                   <option value="L">Laki-Laki</option>
                   <option value="P">Perempuan</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                 <input required type="date" className="input-base" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>
           </div>

           {/* Row 3 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium mb-1">Kelas Aktif</label>
                 <select className="input-base" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})}>
                   <option value="10">Kelas 10 (Satu Aliyah)</option>
                   <option value="11">Kelas 11 (Dua Aliyah)</option>
                   <option value="12">Kelas 12 (Tiga Aliyah)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">Penempatan Kamar (Opsional)</label>
                 <input type="text" className="input-base" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="Cth: Abu Bakar 01" />
              </div>
           </div>

           {/* Row 4 */}
           <div>
              <label className="block text-sm font-medium mb-1">Alamat Domisili</label>
              <textarea className="input-base min-h-[80px]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Alamat lengkap asal santri"></textarea>
           </div>

           {/* Actions Footers */}
           <div className="flex justify-end gap-3 pt-6 mt-6 border-t" style={{ borderColor: 'var(--border-light)' }}>
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
