import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ItemFormModal({ isOpen, onClose, onSuccess }: ItemFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'MAKANAN',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStock: 5,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'costPrice', 'stock', 'minStock'].includes(name) ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      toast.error('Nama barang dan SKU wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/inventory/items', formData);
      toast.success('Barang baru berhasil ditambahkan!');
      setFormData({ sku: '', name: '', description: '', category: 'MAKANAN', price: 0, costPrice: 0, stock: 0, minStock: 5 });
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal menambahkan barang');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-light">
          <h2 className="text-lg font-bold text-main">Tambah Barang Baru</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface transition-colors" aria-label="Tutup">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="item-sku" className="block text-sm font-medium text-muted mb-1">Kode SKU *</label>
              <input id="item-sku" name="sku" type="text" value={formData.sku} onChange={handleChange} className="input-base" placeholder="BRG-001" required />
            </div>
            <div>
              <label htmlFor="item-category" className="block text-sm font-medium text-muted mb-1">Kategori *</label>
              <select id="item-category" name="category" value={formData.category} onChange={handleChange} className="input-base">
                <option value="MAKANAN">Makanan</option>
                <option value="SERAGAM">Seragam</option>
                <option value="BUKU">Buku</option>
                <option value="ALAT_TULIS">Alat Tulis</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="item-name" className="block text-sm font-medium text-muted mb-1">Nama Barang *</label>
            <input id="item-name" name="name" type="text" value={formData.name} onChange={handleChange} className="input-base" placeholder="Nasi Goreng Spesial" required />
          </div>

          <div>
            <label htmlFor="item-description" className="block text-sm font-medium text-muted mb-1">Deskripsi</label>
            <textarea id="item-description" name="description" value={formData.description} onChange={handleChange} className="input-base" rows={2} placeholder="Deskripsi singkat (opsional)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="item-price" className="block text-sm font-medium text-muted mb-1">Harga Jual (Rp)</label>
              <input id="item-price" name="price" type="number" value={formData.price} onChange={handleChange} className="input-base" min="0" />
            </div>
            <div>
              <label htmlFor="item-costPrice" className="block text-sm font-medium text-muted mb-1">Harga Modal (Rp)</label>
              <input id="item-costPrice" name="costPrice" type="number" value={formData.costPrice} onChange={handleChange} className="input-base" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="item-stock" className="block text-sm font-medium text-muted mb-1">Stok Awal</label>
              <input id="item-stock" name="stock" type="number" value={formData.stock} onChange={handleChange} className="input-base" min="0" />
            </div>
            <div>
              <label htmlFor="item-minStock" className="block text-sm font-medium text-muted mb-1">Stok Minimum</label>
              <input id="item-minStock" name="minStock" type="number" value={formData.minStock} onChange={handleChange} className="input-base" min="0" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">Batal</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 shadow-glow">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Menyimpan...' : 'Simpan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
