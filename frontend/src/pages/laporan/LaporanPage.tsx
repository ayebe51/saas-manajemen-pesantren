import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ListFilter, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';

export function LaporanPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<Record<string, { from: string; to: string }>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const reports = [
    { id: 'keuangan', title: 'Laporan Mutasi Keuangan Global', desc: 'Arus Kas masuk/keluar, pembayaran SPP dan invoice yayasan bulan ini.', icon: FileSpreadsheet, color: 'success' },
    { id: 'kesantrian', title: 'Laporan Induk Kesantrian', desc: 'Buku induk data santri aktif, wali santri, dan rekaman status akademik/asrama.', icon: FileText, color: 'primary' },
    { id: 'tahfidz', title: 'Laporan Tahfidz & Akademik', desc: 'Rekap progress hafalan komprehensif seluruh santri dalam 1 bulan kalender.', icon: FileText, color: 'accent' },
    { id: 'inventori', title: 'Buku Rekap Inventori', desc: 'Data stok akhir barang di Koperasi, nilai depresiasi, dan barang rusak.', icon: FileSpreadsheet, color: 'warning' },
  ];

  const getIconColorClass = (color: string) => {
    switch (color) {
      case 'success': return 'bg-success/10 text-success';
      case 'primary': return 'bg-primary-light text-primary';
      case 'accent': return 'bg-accent/10 text-accent';
      case 'warning': return 'bg-warning/10 text-warning';
      default: return 'bg-primary-light text-primary';
    }
  };

  const toggleFilter = (moduleId: string) => {
    if (openFilter === moduleId) {
      setOpenFilter(null);
    } else {
      setOpenFilter(moduleId);
      if (!filters[moduleId]) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];
        setFilters(prev => ({ ...prev, [moduleId]: { from: firstDay, to: today } }));
      }
    }
  };

  const handleDownload = async (type: 'pdf' | 'excel', moduleId: string) => {
    setDownloading(`${type}-${moduleId}`);
    try {
      const endpoint = moduleId === 'keuangan' && type === 'pdf' 
        ? `/report/monthly/${user?.tenantId}` 
        : `/reports/${type}/${moduleId}`;

      const dateFilter = filters[moduleId];
      const params = dateFilter ? `?from=${dateFilter.from}&to=${dateFilter.to}` : '';

      const response = await api.get(`${endpoint}${params}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-${moduleId}-${new Date().getTime()}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Failed to download ${type} for ${moduleId}`, error);
      toast.error('Gagal mengunduh laporan. Silakan coba lagi.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-main">Pusat Laporan Terpadu</h1>
          <p className="text-muted text-sm mt-1">Ekspor dan unduh dokumen rekapitulasi operasional Pesantren.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, idx) => (
          <div key={idx} className="glass-panel p-6 relative overflow-hidden group hover:shadow-glow transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconColorClass(report.color)}`}
              >
                <report.icon className="w-6 h-6" />
              </div>
              
              <div className="flex gap-2">
                 <button 
                   onClick={() => toggleFilter(report.id)} 
                   className={`btn ${openFilter === report.id ? 'btn-primary' : 'btn-outline'} py-1.5 px-3 text-xs flex items-center gap-2`} 
                   title="Filter Tanggal"
                 >
                   <ListFilter className="w-3 h-3" /> Filter
                 </button>
              </div>
            </div>

            {/* Date Range Filter */}
            {openFilter === report.id && (
              <div className="mb-4 p-3 rounded-lg bg-surface-glass border border-light animate-in fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted">Rentang Tanggal Laporan</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    title="Tanggal Mulai"
                    value={filters[report.id]?.from || ''}
                    onChange={e => setFilters(prev => ({ ...prev, [report.id]: { ...prev[report.id], from: e.target.value } }))}
                    className="input-base py-1.5 text-xs flex-1"
                  />
                  <span className="text-xs text-muted">s/d</span>
                  <input
                    type="date"
                    title="Tanggal Akhir"
                    value={filters[report.id]?.to || ''}
                    onChange={e => setFilters(prev => ({ ...prev, [report.id]: { ...prev[report.id], to: e.target.value } }))}
                    className="input-base py-1.5 text-xs flex-1"
                  />
                </div>
              </div>
            )}
            
            <h3 className="text-lg font-bold mb-2">{report.title}</h3>
            <p className="text-sm text-muted mb-6 leading-relaxed min-h-[40px]">{report.desc}</p>
            
            <div className="flex gap-3">
              <button 
                 onClick={() => handleDownload('pdf', report.id)}
                 disabled={!!downloading}
                 className="btn btn-primary flex-1 py-2 shadow-glow text-sm flex items-center justify-center gap-2"
              >
                 {downloading === `pdf-${report.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                 Unduh PDF
              </button>
              <button 
                 onClick={() => handleDownload('excel', report.id)}
                 disabled={!!downloading || report.icon === FileText}
                 className="btn btn-outline flex-1 py-2 text-sm flex items-center justify-center gap-2"
                 {...(report.icon === FileText ? { title: 'Hanya tersedia format PDF untuk laporan ini' } : {})}
              >
                 {downloading === `excel-${report.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                 Ekspor Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
