import { useState } from 'react';
import { QrScanner } from '../components/QrScanner';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, LogIn, LogOut as LogOutIcon, Loader2 } from 'lucide-react';

export function ScannerPage() {
  const [mode, setMode] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [lastScan, setLastScan] = useState<{ name: string; time: string; type: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleScan = async (result: string) => {
    if (processing) return;
    setProcessing(true);

    let santriId = result;
    try {
      const parsed = JSON.parse(result);
      if (parsed.id) santriId = parsed.id;
    } catch { /* raw text */ }

    try {
      const res = await api.post('/attendance/scan', { santriId, type: mode });
      const name = res.data?.santriName || res.data?.santri?.name || santriId.substring(0, 8);
      setLastScan({ name, time: new Date().toLocaleTimeString('id-ID'), type: mode });
      toast.success(`✅ ${name} — ${mode === 'MASUK' ? 'Masuk' : 'Keluar'} tercatat!`);
    } catch {
      toast.error('Gagal mencatat presensi. QR tidak valid.');
    }

    setTimeout(() => setProcessing(false), 1500);
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '320px' }}>
        <button
          onClick={() => setMode('MASUK')}
          className={`btn ${mode === 'MASUK' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <LogIn size={18} /> Masuk
        </button>
        <button
          onClick={() => setMode('KELUAR')}
          className={`btn ${mode === 'KELUAR' ? 'btn-danger' : 'btn-outline'}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <LogOutIcon size={18} /> Keluar
        </button>
      </div>

      <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
        Mode: <strong style={{ color: mode === 'MASUK' ? 'var(--success)' : 'var(--danger)' }}>Presensi {mode}</strong>
      </p>

      {/* QR Scanner */}
      <QrScanner onScan={handleScan} />

      {processing && (
        <div className="card" style={{ padding: '1rem', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
          <p style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }} className="text-muted">Memproses...</p>
        </div>
      )}

      {/* Last Scan Result */}
      {lastScan && !processing && (
        <div className="card animate-in" style={{
          padding: '1.25rem', width: '100%', maxWidth: '320px',
          borderLeft: `4px solid ${lastScan.type === 'MASUK' ? 'var(--success)' : 'var(--danger)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={28} style={{ color: lastScan.type === 'MASUK' ? 'var(--success)' : 'var(--danger)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{lastScan.name}</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span className={`badge ${lastScan.type === 'MASUK' ? 'badge-success' : 'badge-danger'}`}>{lastScan.type}</span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{lastScan.time}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Input */}
      <ManualInput mode={mode} onSuccess={(name) => {
        setLastScan({ name, time: new Date().toLocaleTimeString('id-ID'), type: mode });
      }} />
    </div>
  );
}

function ManualInput({ mode, onSuccess }: { mode: string; onSuccess: (name: string) => void }) {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/attendance/scan', { santriId: id.trim(), type: mode });
      const name = res.data?.santriName || id.substring(0, 8);
      toast.success(`✅ ${name} — ${mode === 'MASUK' ? 'Masuk' : 'Keluar'} tercatat!`);
      onSuccess(name);
      setId('');
    } catch {
      toast.error('ID santri tidak valid.');
    } finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ padding: '1rem', width: '100%', maxWidth: '320px' }}>
      <p className="text-muted" style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        Input Manual ID
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Masukkan ID santri..."
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{ flex: 1, fontFamily: 'monospace' }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
        </button>
      </form>
    </div>
  );
}
