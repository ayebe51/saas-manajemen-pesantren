import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api/client';
import { Search, Filter, Plus, FileSpreadsheet, Edit2, Trash2, Eye, Loader2, Download } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
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
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);

  // Pagination & Meta
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Import State & Filter State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    const toastId = toast.loading('Memproses berkas Excel...');
    
    try {
      await api.post('/santri/import/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Data Santri sukses diimpor ke sistem!', { id: toastId });
      fetchSantri();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal mengimpor rekaman data.', { id: toastId });
    } finally {
      setImporting(false);
      e.target.value = ''; // reset
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/santri/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template_Import_Santri.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Gagal mengunduh template Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Data Kesantrian</h1>
          <p className="text-muted text-sm mt-1">Kelola direktori {totalItems > 0 ? totalItems : ''} data santri, wali, dan riwayat akademik.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            className="btn btn-outline flex-none px-3"
            onClick={handleDownloadTemplate}
            title="Unduh Template Excel"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            className="btn btn-outline flex-1 sm:flex-none"
            onClick={handleImportClick}
            disabled={importing}
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            <span className="hidden sm:inline">{importing ? 'Memproses...' : 'Import Excel'}</span>
          </button>
          <input 
            title="Upload Excel File"
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileChange} 
          />
          <button 
            className="btn btn-primary flex-1 sm:flex-none shadow-glow"
            onClick={() => {
              setSelectedSantri(null);
              setIsFormOpen(true);
            }}
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
          <div className="relative">
             <button 
               className="btn btn-outline px-3" 
               title="Filter Lanjutan"
               onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
             >
               <Filter className="w-5 h-5" />
             </button>
             {showAdvancedFilter && (
               <div className="absolute right-0 top-full mt-2 w-64 glass-panel p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <h4 className="font-semibold text-sm mb-3 text-main">Filter Spesifik</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted mb-1 block">Status Beasiswa</label>
                      <select title="Status Beasiswa" className="input-base w-full text-sm">
                        <option>Semua Status</option>
                        <option>Penerima Beasiswa Yatim</option>
                        <option>Prestasi Akademik</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted mb-1 block">Provinsi Asal</label>
                      <input type="text" className="input-base w-full text-sm" placeholder="Ketik provinsi asal..." />
                    </div>
                    <button 
                      className="btn btn-primary w-full text-sm mt-4 shadow-glow py-2"
                      onClick={() => {
                        setShowAdvancedFilter(false);
                        toast.success('Parameter filter spesifik mulai diaplikasikan.');
                        fetchSantri();
                      }}
                    >
                      Aktifkan Filter
                    </button>
                  </div>
               </div>
             )}
          </div>
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
                        <button onClick={() => toast.success(`Profil ${row.name} segera hadir!`)} className="p-1.5 text-muted hover:text-primary transition-colors rounded-md hover:bg-surface-glass" title="Lihat Profil"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedSantri(row); setIsFormOpen(true); }} className="p-1.5 text-muted hover:text-accent transition-colors rounded-md hover:bg-surface-glass" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => toast.error('Fungsi hapus tidak diizinkan untuk data santri. Silakan ubah status menjadi non-aktif.')} className="p-1.5 text-muted hover:text-danger transition-colors rounded-md hover:bg-surface-glass" title="Hapus"><Trash2 className="w-4 h-4" /></button>
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
        initialData={selectedSantri}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSantri(null);
        }} 
        onSuccess={() => {
           setIsFormOpen(false);
           setSelectedSantri(null);
           fetchSantri();
        }}
      />
    </div>
  );
}
