import React from 'react';
import { Download, FileText, FileSpreadsheet, ListFilter } from 'lucide-react';

export function LaporanPage() {
  const reports = [
    { title: 'Laporan Mutasi Keuangan Global', desc: 'Arus Kas masuk/keluar, pembayaran SPP dan invoice yayasan bulan ini.', icon: FileSpreadsheet, color: 'success' },
    { title: 'Laporan Induk Kesantrian', desc: 'Buku induk data santri aktif, wali santri, dan rekaman status akademik/asrama.', icon: FileText, color: 'primary' },
    { title: 'Laporan Tahfidz & Akademik', desc: 'Rekap progress hafalan komprehensif seluruh santri dalam 1 bulan kalender.', icon: FileText, color: 'accent' },
    { title: 'Buku Rekap Inventori', desc: 'Data stok akhir barang di Koperasi, nilai depresiasi, dan barang rusak.', icon: FileSpreadsheet, color: 'warning' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Pusat Laporan Terpadu</h1>
          <p className="text-muted text-sm mt-1">Ekspor dan unduh dokumen rekapitulasi operasional Pesantren.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, idx) => (
          <div key={idx} className="glass-panel p-6 relative overflow-hidden group hover:shadow-glow transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-opacity-10" 
                style={{ backgroundColor: `var(--color-${report.color}-light)`, color: `var(--color-${report.color})` }}
              >
                <report.icon className="w-6 h-6" />
              </div>
              
              <div className="flex gap-2">
                 <button className="btn btn-outline py-1.5 px-3 text-xs flex items-center gap-2" title="Filter Tanggal">
                   <ListFilter className="w-3 h-3" /> Filter
                 </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-2">{report.title}</h3>
            <p className="text-sm text-muted mb-6 leading-relaxed min-h-[40px]">{report.desc}</p>
            
            <div className="flex gap-3">
              <button className="btn btn-primary flex-1 py-2 shadow-glow text-sm flex items-center justify-center gap-2">
                 <Download className="w-4 h-4" /> Unduh PDF
              </button>
              <button 
                 className="btn btn-outline flex-1 py-2 text-sm flex items-center justify-center gap-2"
                 {...(report.icon === FileText ? { disabled: true, title: 'Hanya tersedia format PDF untuk laporan ini' } : {})}
              >
                 <FileSpreadsheet className="w-4 h-4" /> Ekspor Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
