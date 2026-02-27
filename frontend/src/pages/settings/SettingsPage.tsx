import { useState, useEffect } from 'react';
import { Save, Building, Phone, Mail, Globe, Shield, Key, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';

interface Tenant {
  id: string;
  name: string;
  address: string;
  phone: string;
  plan: string;
  status: string;
  _count?: { users: number; santri: number };
}

export function SettingsPage() {
  const { user } = useAuthStore();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State for Current Tenant
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Superadmin Form State
  const [showNewTenant, setShowNewTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch current tenant info
      if (user?.tenantId) {
        const res = await api.get(`/tenants/${user.tenantId}`);
        const data = res.data.data || res.data;

        setName(data.name || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        
        let parsedSettings = {};
        if (data.settings && typeof data.settings === 'string') {
           try { parsedSettings = JSON.parse(data.settings); } catch (e) { console.error(e); }
        } else if (data.settings) {
           parsedSettings = data.settings;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEmail((parsedSettings as any).email || '');
      }

      // If SUPERADMIN, fetch all tenants
      if (isSuperAdmin) {
        const resAll = await api.get('/tenants');
        setTenants(resAll.data.data || resAll.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleUpdateCurrentTenant = async () => {
    try {
      await api.put(`/tenants/${user?.tenantId}`, {
         name,
         address,
         phone,
         settings: { email }
      });
      alert('Pengaturan profil berhasil disimpan!');
    } catch (error) {
      console.error('Update failed', error);
      alert('Gagal menyimpan profil.');
    }
  };

  const handleCreateTenant = async () => {
    try {
      if (!newTenantName) return;
      await api.post('/tenants', {
         name: newTenantName,
         plan: 'BASIC',
         address: 'Alamat Cabang Baru',
         phone: '-',
         timezone: 'Asia/Jakarta'
      });
      setNewTenantName('');
      setShowNewTenant(false);
      fetchData(); // Reload list
      alert('Cabang Yayasan baru berhasil dibuat!');
    } catch (error) {
      console.error('Create tenant failed', error);
      alert('Gagal membuat cabang baru.');
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus cabang ini beserta seluruh datanya? Tindakan ini berbahaya!')) return;
    try {
      await api.delete(`/tenants/${id}`);
      fetchData();
    } catch (error) {
       console.error('Delete tenant failed', error);
       alert('Gagal menghapus cabang.');
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-muted">Memuat Konfigurasi...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-main">Pengaturan Sistem Aplikasi</h1>
          <p className="text-muted text-sm mt-1">Konfigurasi profil pesantren, keamanan, dan *User Access Control*.</p>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="glass-panel p-6 border-l-4 border-l-primary">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> Manajemen Multi-Cabang (Tenants)
            </h2>
            <button 
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={() => setShowNewTenant(!showNewTenant)}
            >
              <Plus className="w-4 h-4"/> Tambah Cabang Baru
            </button>
          </div>

          {showNewTenant && (
            <div className="mb-6 p-4 bg-surface rounded-lg border flex gap-4 items-end border-light">
               <div className="flex-1">
                 <label className="block text-sm font-medium mb-1">Nama Yayasan / Cabang Baru</label>
                 <input 
                   type="text" 
                   className="input-base" 
                   value={newTenantName} 
                   onChange={e => setNewTenantName(e.target.value)}
                   placeholder="Misal: Pesantren Cabang 2" 
                 />
               </div>
               <button className="btn btn-primary" onClick={handleCreateTenant}>Simpan Cabang</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface/50 text-xs uppercase text-muted font-bold tracking-wider border-b border-[var(--border-light)]">
                <tr>
                  <th className="px-4 py-3">Nama Cabang / Yayasan</th>
                  <th className="px-4 py-3">Paket (Plan)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Data Santri</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-surface-glass">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3"><span className="badge bg-primary/20 text-primary">{t.plan}</span></td>
                    <td className="px-4 py-3">{t.status === 'ACTIVE' ? <span className="text-success">&bull; Aktif</span> : <span className="text-danger">&bull; Nonaktif</span>}</td>
                    <td className="px-4 py-3 text-center">{t._count?.santri || 0}</td>
                    <td className="px-4 py-3 text-right">
                       <button className="text-danger hover:text-danger-emphasis p-1" onClick={() => handleDeleteTenant(t.id)}>
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-panel p-6">
         <div className="flex justify-between items-center mb-6 pb-2 border-b border-light">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" /> Profil Cabang Anda Saat Ini
            </h2>
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={handleUpdateCurrentTenant}>
              <Save className="w-4 h-4" /> Perbarui Profil
            </button>
         </div>

         <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium mb-1">Nama Yayasan / Pesantren</label>
                  <input type="text" className="input-base" value={name} onChange={e => setName(e.target.value)} />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                     <Mail className="w-3 h-3 text-muted" /> Email Institusi / Info
                  </label>
                  <input type="email" className="input-base" value={email} onChange={e => setEmail(e.target.value)} />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">Alamat Lengkap Cabang</label>
               <textarea className="input-base min-h-[80px]" value={address} onChange={e => setAddress(e.target.value)}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
               <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                     <Phone className="w-3 h-3 text-muted" /> Telepon Resmi
                  </label>
                  <input type="text" className="input-base" value={phone} onChange={e => setPhone(e.target.value)} />
               </div>
            </div>
         </div>
      </div>

      <div className="glass-panel p-6">
         <h2 className="text-lg font-bold mb-6 pb-2 border-b flex items-center gap-2 border-light">
            <Shield className="w-5 h-5 text-accent" /> Profil Pengguna Aktif
         </h2>
         <div className="space-y-4">
            <div className="p-4 bg-primary/10 text-primary rounded-md text-sm flex items-start gap-3">
               <Key className="w-6 h-6 shrink-0 mt-0.5" />
               <p>
                  <strong>Hak Akses Saat Ini:</strong> Anda login sebagai <strong>{user?.name}</strong> dengan peranan perlindungan <strong>{user?.role}</strong>. Sistem mencatat jejak secara ketat.
               </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
               <div>
                  <label className="block text-sm font-medium mb-1">Email Masuk</label>
                  <input type="text" className="input-base opacity-70 cursor-not-allowed" defaultValue={user?.email || ''} disabled />
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
