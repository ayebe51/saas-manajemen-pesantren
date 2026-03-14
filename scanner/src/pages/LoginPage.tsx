import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Isi email dan password'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      toast.success('Login berhasil!');
      navigate('/');
    } catch {
      toast.error('Email atau password salah');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: '24rem', padding: '2rem' }}>
        <div className="text-center mb-6">
          <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <QrCode size={32} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>QR Scanner</h1>
          <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Portal Presensi Digital Pesantren</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="guru@pesantren.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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
