import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Search, Filter, Plus, FileSpreadsheet, Edit2, Trash2, Eye } from 'lucide-react';
import clsx from 'clsx';
import { SantriFormModal } from './SantriFormModal';

interface Santri {
  id: string;
  nisn: string;
  name: string;
  kelas: string;
  room: string;
  status: string;
  createdAt: string;
}

export function SantriPage() {
  const [data, setData] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Pagination & Meta
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchSantri = async () => {
    setLoading(true);
    try {
      // Backend pagination query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      });
      
      const res = await api.get(`/santri?${params}`);
      if (res.data?.data) {
        setData(res.data.data.items || res.data.data);
        if (res.data.data.meta) {
           setTotalPages(res.data.data.meta.lastPage || 1);
           setTotalItems(res.data.data.meta.total || res.data.data.length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch santri:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); // Re-fetch only on page change, or manual form submit

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on new search
    fetchSantri();
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Data Kesantrian</h1>
          <p className="text-muted text-sm mt-1">Kelola direktori {totalItems > 0 ? totalItems : ''} data santri, wali, dan riwayat akademik.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="btn btn-outline flex-1 sm:flex-none">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Import Excel</span>
          </button>
          <button 
            className="btn btn-primary flex-1 sm:flex-none shadow-glow"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Toolbar Glass Panel */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Cari NISN atau Nama..."
            className="input-base pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <select title="Pilih Kelas" className="input-base w-full md:w-32 bg-transparent text-sm cursor-pointer">
            <option value="">Semua Kelas</option>
            <option value="10">Kelas 10</option>
            <option value="11">Kelas 11</option>
            <option value="12">Kelas 12</option>
          </select>
          <button className="btn btn-outline px-3" title="Filter Lanjutan">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-light bg-app">
                <th className="py-4 px-6 font-semibold text-sm text-muted">NISN</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Nama Lengkap</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Kelas / Kamar</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Status</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">Mencari data ke server...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">Tidak ada data santri ditemukan.</td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors border-light">
                    <td className="py-4 px-6 text-sm font-medium">{row.nisn}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs bg-primary-light text-primary">
                          {row.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-sm">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex flex-col">
                        <span>{row.kelas}</span>
                        <span className="text-xs text-muted">Gedung: {row.room}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={clsx(
                        'badge', 
                        row.status.toLowerCase() === 'active' ? 'badge-success' : 'badge-danger'
                      )}>
                        {row.status === 'active' ? 'Aktif' : row.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-muted hover:text-primary transition-colors rounded-md hover:bg-surface-glass" title="Lihat Profil"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-muted hover:text-accent transition-colors rounded-md hover:bg-surface-glass" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-muted hover:text-danger transition-colors rounded-md hover:bg-surface-glass" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && data.length > 0 && (
          <div className="p-4 border-t flex justify-between items-center border-light bg-app">
            <span className="text-sm text-muted">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button 
                className="btn btn-outline py-1.5 px-3 text-sm" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <button 
                className="btn btn-outline py-1.5 px-3 text-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <SantriFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={() => {
           setIsFormOpen(false);
           fetchSantri();
        }}
      />
    </div>
  );
}
