import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) { toast.error('Masukkan PIN Scanner'); return; }
    
    // Auto capitalize for consistency (though backend is case-sensitive, usually PINs are uppercase alphanumeric)
    const formattedPin = pin.toUpperCase().trim();
    
    setLoading(true);
    try {
      const res = await api.post('/auth/scanner-login', { pin: formattedPin });
      localStorage.setItem('accessToken', res.data.accessToken);
      // Optional: store tenantName to show in header
      if (res.data.tenantName) {
        localStorage.setItem('tenantName', res.data.tenantName);
      }
      toast.success('Login berhasil!');
      navigate('/');
    } catch {
      toast.error('PIN tidak valid atau Tidak Aktif');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: '24rem', padding: '2rem' }}>
        <div className="text-center mb-6">
          <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <QrCode size={32} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Portal Scanner</h1>
          <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Presensi & Perizinan Pesantren</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', textAlign: 'center' }}>
              Masukkan PIN Scanner
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 'bold' }}
              maxLength={6}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
