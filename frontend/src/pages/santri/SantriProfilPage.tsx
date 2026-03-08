import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, BookOpen, Home, AlertTriangle, Receipt, FileCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';

interface WaliLink { wali: { id: string; name: string; phone: string; relation: string; address: string; }; }
interface SantriDetail {
  id: string; nisn: string; name: string; kelas: string; room: string; status: string;
  contact: string; address: string; createdAt: string;
  walis: WaliLink[];
  _count: { izin: number; pelanggaran: number; invoices: number; };
}

export function SantriProfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [santri, setSantri] = useState<SantriDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/santri/${id}`)
        .then(res => setSantri(res.data))
        .catch(() => setSantri(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!santri) {
    return (
      <div className="text-center py-20 text-muted">
        <p className="text-lg font-semibold mb-2">Data santri tidak ditemukan.</p>
        <button onClick={() => navigate('/santri')} className="btn btn-outline mt-4">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button onClick={() => navigate('/santri')} className="btn btn-outline py-1.5 px-3 text-sm">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Santri
      </button>

      {/* Header Card */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
            {santri.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-main">{santri.name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm text-muted">NISN: {santri.nisn || '-'}</span>
              <span className={`badge ${santri.status?.toLowerCase() === 'active' || santri.status === 'AKTIF' ? 'badge-success' : 'badge-danger'}`}>
                {santri.status === 'active' || santri.status === 'AKTIF' ? 'Aktif' : santri.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 text-center">
          <BookOpen className="w-5 h-5 text-primary mx-auto mb-2" />
          <div className="text-xs text-muted">Kelas</div>
          <div className="font-bold text-lg">{santri.kelas || '-'}</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <Home className="w-5 h-5 text-accent mx-auto mb-2" />
          <div className="text-xs text-muted">Kamar</div>
          <div className="font-bold text-lg">{santri.room || '-'}</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <FileCheck className="w-5 h-5 text-success mx-auto mb-2" />
          <div className="text-xs text-muted">Total Izin</div>
          <div className="font-bold text-lg">{santri._count?.izin || 0}</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-2" />
          <div className="text-xs text-muted">Pelanggaran</div>
          <div className="font-bold text-lg text-warning">{santri._count?.pelanggaran || 0}</div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="glass-panel p-5">
          <h3 className="font-bold text-sm mb-4 text-muted uppercase tracking-wider">Informasi Personal</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div><div className="text-xs text-muted">Kontak</div><div className="text-sm font-medium">{santri.contact || '-'}</div></div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div><div className="text-xs text-muted">Alamat</div><div className="text-sm font-medium">{santri.address || '-'}</div></div>
            </div>
            <div className="flex items-start gap-3">
              <Receipt className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div><div className="text-xs text-muted">Total Tagihan</div><div className="text-sm font-medium">{santri._count?.invoices || 0} invoice</div></div>
            </div>
          </div>
        </div>

        {/* Wali Information */}
        <div className="glass-panel p-5">
          <h3 className="font-bold text-sm mb-4 text-muted uppercase tracking-wider">Data Wali Santri</h3>
          {santri.walis && santri.walis.length > 0 ? (
            <div className="space-y-4">
              {santri.walis.map((wl, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-glass">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs shrink-0">
                    {wl.wali.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{wl.wali.name}</div>
                    <div className="text-xs text-muted">{wl.wali.relation || 'Wali'} • {wl.wali.phone || '-'}</div>
                    {wl.wali.address && <div className="text-xs text-muted mt-1">{wl.wali.address}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted text-center py-4">Belum ada data wali terdaftar.</div>
          )}
        </div>
      </div>

      {/* Registration Info */}
      <div className="glass-panel p-5">
        <h3 className="font-bold text-sm mb-2 text-muted uppercase tracking-wider">Info Registrasi</h3>
        <p className="text-sm text-muted">
          Terdaftar sejak: <span className="font-medium text-main">{new Date(santri.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </p>
      </div>
    </div>
  );
}
