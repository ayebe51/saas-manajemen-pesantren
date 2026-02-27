import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';
import { Lock, Mail, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Panggil backend login
      const response = await api.post('/auth/login', formData);
      const { user, accessToken } = response.data;
      
      // Simpan session
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
      
      // Redirect ke Dashboard
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-animated">
      <div className="w-full max-w-md p-8 m-4 glass-panel relative overflow-hidden z-10">
        
        {/* Dekorasi Cahaya Sphere */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary blur-[50px] opacity-30 -z-10"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-accent blur-[50px] opacity-30 -z-10"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2 text-primary">APSS Portal</h1>
          <p className="text-muted">Manajemen Pesantren Terpadu</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md badge-danger flex items-center justify-center text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="email">Email Pengguna</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                type="email"
                required
                className="input-base pl-10"
                placeholder="admin@al-ikhlas.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
             <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" htmlFor="password">Kata Sandi</label>
                <a href="#" className="text-sm font-medium">Lupa sandi?</a>
             </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                type="password"
                required
                className="input-base pl-10"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full h-12 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk ke Dasbor'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-muted">
          Sistem Informasi Pesantren &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
