import React, { useState } from 'react';
import { Search, PackagePlus, ShoppingCart, Archive, TrendingUp, AlertTriangle } from 'lucide-react';

const dummyStock = [
  { id: '1', sku: 'BRG-001', name: 'Kitab Jurumiyah', category: 'Kitab', stock: 120, price: 25000, status: 'AMAN' },
  { id: '2', sku: 'BRG-002', name: 'Seragam Koko Putih (L)', category: 'Atribut', stock: 5, price: 150000, status: 'KRITIS' },
  { id: '3', sku: 'BRG-003', name: 'Sarung BHS Signature', category: 'Pakaian', stock: 42, price: 850000, status: 'AMAN' },
  { id: '4', sku: 'BRG-004', name: 'Buku Tulis Sinar Dunia', category: 'ATK', stock: 0, price: 4500, status: 'KOSONG' },
];

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Inventori & Koperasi</h1>
          <p className="text-muted text-sm mt-1">Gudang stok barang asrama dan mesin kasir (POS).</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="btn btn-outline flex-1 sm:flex-none shadow-glow text-accent" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
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
        <div className="glass-panel p-5 flex items-center justify-between">
           <div>
              <div className="text-sm font-semibold text-muted mb-1">Total Aset Koperasi</div>
              <div className="text-2xl font-bold">Rp 48.5M</div>
           </div>
           <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="w-6 h-6" />
           </div>
        </div>
        <div className="glass-panel p-5 flex items-center justify-between border-l-4" style={{ borderLeftColor: 'var(--color-warning)' }}>
           <div>
              <div className="text-sm font-semibold text-muted mb-1">Barang Kritis (Menipis)</div>
              <div className="text-2xl font-bold text-warning">14 Item</div>
           </div>
           <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
              <AlertTriangle className="w-6 h-6" />
           </div>
        </div>
        <div className="glass-panel p-5 flex items-center justify-between">
           <div>
              <div className="text-sm font-semibold text-muted mb-1">Total SKU Tersedia</div>
              <div className="text-2xl font-bold text-primary">842 SKU</div>
           </div>
           <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary" style={{ backgroundColor: 'var(--color-primary-light)' }}>
              <Archive className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden mt-6">
         <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-light)' }}>
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
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-app)' }}>
                     <th className="py-4 px-6 font-semibold text-sm text-muted">SKU (Kode)</th>
                     <th className="py-4 px-6 font-semibold text-sm text-muted">Nama Barang</th>
                     <th className="py-4 px-6 font-semibold text-sm text-muted">Kategori</th>
                     <th className="py-4 px-6 font-semibold text-sm text-muted">Harga Jual</th>
                     <th className="py-4 px-6 font-semibold text-sm text-muted">Stok Gudang</th>
                  </tr>
               </thead>
               <tbody>
                  {dummyStock.map((row) => (
                     <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors" style={{ borderColor: 'var(--border-light)' }}>
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-muted">{row.sku}</td>
                        <td className="py-4 px-6 font-medium text-sm">{row.name}</td>
                        <td className="py-4 px-6 text-sm">{row.category}</td>
                        <td className="py-4 px-6 font-bold text-sm text-primary">Rp {row.price.toLocaleString('id-ID')}</td>
                        <td className="py-4 px-6">
                           <div className="flex items-center gap-2">
                             <div className="font-semibold text-sm">{row.stock} Unit</div>
                             {row.status === 'KRITIS' && <span className="badge badge-warning text-[10px]">KRITIS</span>}
                             {row.status === 'KOSONG' && <span className="badge badge-danger text-[10px]">HABIS</span>}
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
      
    </div>
  );
}
