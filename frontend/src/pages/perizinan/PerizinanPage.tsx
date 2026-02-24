import React, { useState } from 'react';
import { Search, Plus, QrCode, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const dummyIzin = [
  { id: '1', santriName: 'Ahmad Dahlan', type: 'PULANG', reason: 'Sakit Tipes', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'APPROVED', approvedBy: 'Ustadz Ali' },
  { id: '2', santriName: 'Siti Aminah', type: 'KELUAR_SEBENTAR', reason: 'Membeli Kacamata', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 3600000 * 4).toISOString(), status: 'PENDING', approvedBy: null },
  { id: '3', santriName: 'Budi Santoso', type: 'PULANG', reason: 'Acara Keluarga (Pernikahan Kakak)', startAt: new Date(Date.now() - 86400000 * 2).toISOString(), endAt: new Date(Date.now() - 86400000).toISOString(), status: 'REJECTED', approvedBy: 'Ustadz Ali' },
  { id: '4', santriName: 'Hasan Syadzili', type: 'KELUAR_SEBENTAR', reason: 'Lomba MTQ Tingkat Kota', startAt: new Date(Date.now() - 3600000 * 5).toISOString(), endAt: new Date(Date.now() - 3600000).toISOString(), status: 'COMPLETED', approvedBy: 'Ustadz Usman' },
];

export function PerizinanPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED': return <span className="badge badge-success bg-opacity-20 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Disetujui</span>;
      case 'PENDING': return <span className="badge badge-warning bg-opacity-20 flex items-center gap-1"><Clock className="w-3 h-3" /> Menunggu</span>;
      case 'REJECTED': return <span className="badge badge-danger bg-opacity-20 flex items-center gap-1"><XCircle className="w-3 h-3" /> Ditolak</span>;
      case 'COMPLETED': return <span className="badge bg-slate-500/20 text-slate-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Selesai (Kembali)</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Pusat Perizinan Asrama</h1>
          <p className="text-muted text-sm mt-1">Sistem *Gatepass* dan pemantauan keluar-masuk santri.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="btn btn-outline flex-1 sm:flex-none">
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Scan QR Satpam</span>
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none shadow-glow">
            <Plus className="w-4 h-4" />
            <span>Buat Surat Izin</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Cari Nama Santri atau Keterangan..."
            className="input-base pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select className="input-base w-full md:w-32 bg-transparent text-sm cursor-pointer">
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui Aktif</option>
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-app)' }}>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Pemohon (Santri)</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Keterangan / Alasan</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Durasi & Waktu</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted">Status Izin</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted text-right">Aksi Eksekusi</th>
              </tr>
            </thead>
            <tbody>
              {dummyIzin.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-surface-glass transition-colors" style={{ borderColor: 'var(--border-light)' }}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                        {row.santriName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                         <span className="font-semibold text-sm">{row.santriName}</span>
                         <span className="text-xs text-muted">{row.type === 'PULANG' ? 'Izin Pulang' : 'Luar Komplek (Bentar)'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm max-w-xs truncate" title={row.reason}>
                    {row.reason}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{format(new Date(row.startAt), 'dd/MM/yy HH:mm')}</span>
                      <span className="text-xs text-muted">s.d {format(new Date(row.endAt), 'dd/MM/yy HH:mm')}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {renderStatusBadge(row.status)}
                    {row.approvedBy && <div className="text-[10px] text-muted mt-1 uppercase">Oleh: {row.approvedBy}</div>}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {row.status === 'PENDING' && (
                        <>
                           <button className="btn btn-primary py-1 px-3 text-xs bg-success border-success" title="Setujui (Approve)">Beri Izin</button>
                           <button className="btn btn-outline py-1 px-3 text-xs hover:bg-danger/10 hover:text-danger hover:border-danger" title="Tolak (Reject)">Tolak</button>
                        </>
                      )}
                      {(row.status === 'APPROVED' || row.status === 'COMPLETED') && (
                        <button className="btn btn-outline py-1 px-3 text-xs flex items-center gap-1" title="Cetak Surat Jalan Gatepass">
                           <FileText className="w-3 h-3" /> Cetak
                        </button>
                      )}
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
