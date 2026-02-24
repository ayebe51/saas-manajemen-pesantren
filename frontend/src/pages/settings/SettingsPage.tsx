import React from 'react';
import { Save, Building, Phone, Mail, Globe, Shield, Key } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Pengaturan Sistem Aplikasi</h1>
          <p className="text-muted text-sm mt-1">Konfigurasi profil pesantren, keamanan, dan *User Access Control*.</p>
        </div>
        <button className="btn btn-primary shadow-glow flex items-center gap-2">
           <Save className="w-4 h-4" /> Simpan Perubahan
        </button>
      </div>

      <div className="glass-panel p-6">
         <h2 className="text-lg font-bold mb-6 pb-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-light)' }}>
            <Building className="w-5 h-5 text-primary" /> Profil Organisasi & Yayasan
         </h2>
         <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium mb-1">Nama Yayasan / Pesantren</label>
                  <input type="text" className="input-base" defaultValue="Pondok Pesantren Darul Ulum" />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">NSPP (Nomor Statistik Pondok Pesantren)</label>
                  <input type="text" className="input-base" defaultValue="510035040011" />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">Alamat Lengkap Pusat</label>
               <textarea className="input-base min-h-[80px]" defaultValue="Jl. Kyai Mojo No. 99, Jombang, Jawa Timur"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
               <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                     <Phone className="w-3 h-3 text-muted" /> Telepon Resmi
                  </label>
                  <input type="text" className="input-base" defaultValue="(0321) 861111" />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                     <Mail className="w-3 h-3 text-muted" /> Email Institusi
                  </label>
                  <input type="email" className="input-base" defaultValue="info@darululum.id" />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                     <Globe className="w-3 h-3 text-muted" /> Website (*Public*)
                  </label>
                  <input type="url" className="input-base" defaultValue="https://darululum.id" />
               </div>
            </div>
         </div>
      </div>

      <div className="glass-panel p-6">
         <h2 className="text-lg font-bold mb-6 pb-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-light)' }}>
            <Shield className="w-5 h-5 text-accent" /> Akun & Keamanan Admin
         </h2>
         <div className="space-y-4">
            <div className="p-4 bg-danger/10 text-danger rounded-md text-sm flex items-start gap-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
               <Key className="w-6 h-6 shrink-0 mt-0.5" />
               <p>
                  <strong>Sandi Login:</strong> Untuk memperbarui *Password* Admin Anda, kami akan mengirimkan email konfirmasi ke *superuser*. Gunakan sistem enkripsi Bcrypt terbaru.
               </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
               <div>
                  <label className="block text-sm font-medium mb-1">Email Masuk (Admin)</label>
                  <input type="text" className="input-base opacity-70 cursor-not-allowed" defaultValue="admin@pesantren.id" disabled />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Ubah Kata Sandi Baru</label>
                  <input type="password" className="input-base" placeholder="••••••••••••" />
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
