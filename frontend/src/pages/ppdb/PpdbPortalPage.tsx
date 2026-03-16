import React, { useState } from 'react';
import { Hash, MapPin, School, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/client';

interface PpdbFormState {
  tenantId: string;
  fullName: string;
  gender: string;
  dob: string;
  previousSchool: string;
  pathway: string;
}

export const PpdbPortalPage = () => {
  const [formData, setFormData] = useState<PpdbFormState>({
    tenantId: '',
    fullName: '',
    gender: 'L',
    dob: '',
    previousSchool: '',
    pathway: 'REGULER',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantId) {
      toast.error('Kode Pesantren wajib diisi');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.post('/public/ppdb/register', formData);
      setSuccessCode(response.data.registrationNumber);
      toast.success('Pendaftaran berhasil dikirim!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal mendaftar, periksa kembali input Anda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (successCode) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-gray-500 mb-6">Terima kasih telah mendaftar. Silakan simpan Nomor Registrasi Anda di bawah ini untuk melihat status atau melengkapi dokumen nantinya.</p>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-8">
            <span className="block text-sm font-medium text-emerald-800 mb-1">Nomor Registrasi Anda:</span>
            <span className="block text-3xl font-black text-emerald-600 tracking-wider">
              {successCode}
            </span>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            Kembali ke Halaman Awal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1542868727-418507204fc5?q=80&w=2674&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-emerald-900/80 backdrop-blur-sm"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center flex flex-col items-center">
           <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <School className="w-8 h-8 text-emerald-600" />
           </div>
          <h2 className="mt-2 text-center text-4xl font-extrabold text-white">
            Portal PPDB 
          </h2>
          <p className="mt-2 text-center text-emerald-100 font-medium">
            Pendaftaran Santri Baru Online
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <label className="block text-sm font-medium text-emerald-900 mb-1">
                  Kode Pesantren Terdaftar
                </label>
                <p className="text-xs text-emerald-600 mb-3 block">Masukkan kode unik dari pondok pesantren tujuan (Misal: `demopesantren`)</p>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-emerald-400" />
                  </div>
                  <input
                    type="text"
                    name="tenantId"
                    required
                    value={formData.tenantId}
                    onChange={handleChange}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-emerald-300 rounded-lg py-3 bg-white transition-shadow uppercase font-mono tracking-wider"
                    placeholder="KODE-PESANTREN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Lengkap Santri</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 transition-colors"
                        placeholder="Nama sesuai ijazah"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pilih Jenis Kelamin</label>
                    <div className="mt-1">
                        <select
                        title="Jenis Kelamin"
                        name="gender"
                        required
                        value={formData.gender}
                        onChange={handleChange}
                        className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-lg py-3 px-3 transition-colors bg-white shadow-sm"
                        >
                        <option value="L">Laki-laki (Putra)</option>
                        <option value="P">Perempuan (Putri)</option>
                        </select>
                    </div>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="date"
                    title="Tanggal Lahir"
                    placeholder="yyyy-mm-dd"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-lg py-3 px-3 transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Asal Sekolah Sebelumnya</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="previousSchool"
                    required
                    value={formData.previousSchool}
                    onChange={handleChange}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 transition-colors"
                    placeholder="Misal: SDN 01 Kota Jaya"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Jalur Pendaftaran</label>
                <div className="mt-1 flex gap-4">
                  {(['REGULER', 'PRESTASI', 'MUTASI']).map((path) => (
                    <label key={path} className="flex items-center">
                      <input
                        type="radio"
                        name="pathway"
                        value={path}
                        checked={formData.pathway === path}
                        onChange={handleChange}
                        className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-gray-300"
                      />
                      <span className="ml-2 block text-sm text-gray-700 capitalize">
                        {path.toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                >
                  {isSubmitting ? 'Mendaftarkan...' : 'Kirim Pendaftaran Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
