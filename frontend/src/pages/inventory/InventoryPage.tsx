import { useState, useEffect } from 'react';
import { Search, PackagePlus, ShoppingCart, Archive, TrendingUp, AlertTriangle, Loader2, Activity } from 'lucide-react';
import { api } from '@/lib/api/client';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: string;
}

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/items');
      const data = res.data.data || res.data || [];
      // Calculate status based on stock
      const mappedData = data.map((item: InventoryItem) => ({
        ...item,
        status: item.stock <= 0 ? 'KOSONG' : (item.stock < 10 ? 'KRITIS' : 'AMAN')
      }));
      setItems(mappedData);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
      // Empty State
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAset = items.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
  const criticalItems = items.filter(i => i.stock < 10).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Inventori & Koperasi</h1>
          <p className="text-muted text-sm mt-1">Gudang stok barang asrama dan mesin kasir (POS).</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="btn btn-outline flex-1 sm:flex-none shadow-glow text-accent border-accent">
            <ShoppingCart className="w-4 h-4" />
            <span>Mode Kasir POS</span>
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none">
            <PackagePlus className="w-4 h-4" />
            <span>Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Inventori Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-panel p-5 flex items-center justify-between flex-1">
            <div>
               <div className="text-sm font-semibold text-muted mb-1">Total Aset Koperasi</div>
               <div className="text-2xl font-bold">Rp {totalAset.toLocaleString('id-ID')}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
               <TrendingUp className="w-6 h-6" />
            </div>
         </div>
         <div className="glass-panel p-5 flex items-center justify-between border-l-4 border-warning flex-1">
            <div>
               <div className="text-sm font-semibold text-muted mb-1">Barang Kritis (Menipis)</div>
               <div className="text-2xl font-bold text-warning">{criticalItems} Item</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
               <AlertTriangle className="w-6 h-6" />
            </div>
         </div>
         <div className="glass-panel p-5 flex items-center justify-between flex-1">
            <div>
               <div className="text-sm font-semibold text-muted mb-1">Total SKU Tersedia</div>
               <div className="text-2xl font-bold text-primary">{items.length} SKU</div>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary bg-primary-light">
               <Archive className="w-6 h-6" />
            </div>
         </div>
      </div>

      <div className="glass-panel overflow-hidden mt-6">
         <div className="p-4 border-b flex justify-between items-center border-light">
           <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Cari Nama Barang atau SKU Barcode..."
                className="input-base pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
           </div>
         </div>
         
         <div className="overflow-x-auto">
            {loading ? (
               <div className="p-12 flex justify-center items-center flex-col text-muted">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p>Memuat rekam data inventori barang...</p>
               </div>
            ) : filteredItems.length === 0 ? (
               <div className="p-12 flex justify-center items-center flex-col text-muted">
                  <Activity className="w-12 h-12 mb-4 opacity-50" />
                  <p>Belum ada data barang di inventori koperasi.</p>
               </div>
            ) : (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-light bg-app">
                       <th className="py-4 px-6 font-semibold text-sm text-muted">SKU (Kode)</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Nama Barang</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Kategori</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Harga Jual</th>
                       <th className="py-4 px-6 font-semibold text-sm text-muted">Stok Gudang</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredItems.map((row) => (
                       <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                          <td className="py-4 px-6 font-mono text-xs font-semibold text-muted">{row.sku || '-'}</td>
                          <td className="py-4 px-6 font-medium text-sm">{row.name}</td>
                          <td className="py-4 px-6 text-sm">{row.category}</td>
                          <td className="py-4 px-6 font-bold text-sm text-primary">Rp {(row.price || 0).toLocaleString('id-ID')}</td>
                          <td className="py-4 px-6">
                             <div className="flex items-center gap-2">
                               <div className="font-semibold text-sm">{row.stock || 0} Unit</div>
                               {row.status === 'KRITIS' && <span className="badge bg-warning/20 text-warning text-[10px]">KRITIS</span>}
                               {row.status === 'KOSONG' && <span className="badge bg-danger/20 text-danger text-[10px]">HABIS</span>}
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            )}
         </div>
      </div>
      
    </div>
  );
}
