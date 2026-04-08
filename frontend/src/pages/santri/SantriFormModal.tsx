import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api/client';
import { X, Loader2, Camera, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface SantriFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const KECAMATAN_DATA: Record<string, string[]> = {
  'Cilacap': ['Cilacap Utara', 'Cilacap Tengah', 'Cilacap Selatan', 'Gandrungmangu', 'Sidareja'],
  'Banyumas': ['Purwokerto Utara', 'Purwokerto Selatan', 'Purwokerto Timur', 'Purwokerto Barat', 'Sokaraja'],
};

const KELURAHAN_DATA: Record<string, string[]> = {
  'Gandrungmangu': ['Gandrungmangu', 'Cisumur', 'Karanganyar', 'Layansari', 'Muktisari'],
  'Cilacap Utara': ['Gumilir', 'Karangtalun', 'Mertasinga', 'Tritih Kulon', 'Tritih Lor'],
};

export function SantriFormModal({ isOpen, onClose, onSuccess, initialData }: SantriFormProps) {
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nisn: '', nik: '', name: '', gender: 'L', tempatLahir: '',
    dob: '', kelas: '', status: 'AKTIF', namaAyah: '', namaIbu: '',
    noHp: '', provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '',
    alamat: '', waliName: '', waliPhone: '', waliRelation: 'Ayah',
  });

  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [kelurahanList, setKelurahanList] = useState<string[]>([]);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        nisn: initialData.nisn || '',
        nik: initialData.nik || '',
        name: initialData.name || initialData.namaLengkap || '',
        gender: initialData.gender || 'L',
        tempatLahir: initialData.tempatLahir || '',
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
        kelas: initialData.kelas || '',
        status: initialData.status || 'AKTIF',
        namaAyah: initialData.namaAyah || '',
        namaIbu: initialData.namaIbu || '',
        noHp: initialData.noHp || initialData.contact || '',
        provinsi: initialData.provinsi || '',
        kabupaten: initialData.kabupaten || '',
        kecamatan: initialData.kecamatan || '',
        kelurahan: initialData.kelurahan || '',
        alamat: initialData.alamat || initialData.address || '',
        waliName: initialData.walis?.[0]?.name || '',
        waliPhone: initialData.walis?.[0]?.phone || '',
        waliRelation: initialData.walis?.[0]?.relation || 'Ayah',
      });
      if (initialData.photo || initialData.fotoUrl) {
        setPhotoPreview(initialData.photo || initialData.fotoUrl);
      }
    } else if (!isOpen) {
      setFormData({ nisn: '', nik: '', name: '', gender: 'L', tempatLahir: '', dob: '', kelas: '', status: 'AKTIF', namaAyah: '', namaIbu: '', noHp: '', provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '', alamat: '', waliName: '', waliPhone: '', waliRelation: 'Ayah' });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (formData.provinsi && KECAMATAN_DATA[formData.provinsi]) {
      setKecamatanList(KECAMATAN_DATA[formData.provinsi]);
    } else {
      setKecamatanList([]);
    }
  }, [formData.provinsi]);

  useEffect(() => {
    if (formData.kecamatan && KELURAHAN_DATA[formData.kecamatan]) {
      setKelurahanList(KELURAHAN_DATA[formData.kecamatan]);
    } else {
      setKelurahanList([]);
    }
  }, [formData.kecamatan]);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fotoUrl = initialData?.photo || initialData?.fotoUrl || '';

      // Upload foto dulu jika ada
      if (photoFile) {
        const fd = new FormData();
        fd.append('file', photoFile);
        const uploadRes = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        fotoUrl = uploadRes.data?.url || uploadRes.data?.path || '';
      }

      const payload = {
        nisn: formData.nisn,
        nik: formData.nik,
        name: formData.name,
        namaLengkap: formData.name,
        gender: formData.gender,
        tempatLahir: formData.tempatLahir,
        dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
        kelas: formData.kelas,
        status: formData.status,
        namaAyah: formData.namaAyah,
        namaIbu: formData.namaIbu,
        noHp: formData.noHp,
        contact: formData.noHp,
        provinsi: formData.provinsi,
        kabupaten: formData.kabupaten,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        alamat: formData.alamat,
        address: formData.alamat,
        ...(fotoUrl && { photo: fotoUrl, fotoUrl }),
      };

      if (initialData?.id) {
        await api.put(`/santri/${initialData.id}`, payload);
      } else {
        const res = await api.post('/santri', payload);
        // Tambah wali jika diisi
        if (formData.waliName && formData.waliPhone && res.data?.data?.id) {
          await api.post(`/santri/${res.data.data.id}/wali`, {
            name: formData.waliName,
            phone: formData.waliPhone,
            relation: formData.waliRelation,
          });
        }
      }

      toast.success(initialData ? 'Data santri berhasil diperbarui' : 'Santri berhasil ditambahkan');
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Gagal menyimpan data santri.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!initialData?.id) return;
    if (!confirm(`Promosikan ${initialData.name} menjadi Pengurus/Ustadz? Akun login akan dibuat.`)) return;
    setPromoting(true);
    try {
      await api.post(`/santri/${initialData.id}/promote`, { role: 'PENGURUS' });
      toast.success(`${initialData.name} berhasil dipromosikan menjadi Pengurus`);
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal mempromosikan santri');
    } finally {
      setPromoting(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-panel w-full max-w-3xl bg-surface p-6 overflow-y-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-light">
          <h2 className="text-xl font-bold text-main">{initialData ? 'Edit Data Siswa' : 'Tambah Data Santri'}</h2>
          <div className="flex items-center gap-2">
            {initialData && (
              <button
                type="button"
                onClick={handlePromote}
                disabled={promoting}
                className="btn btn-outline text-sm flex items-center gap-1.5 text-accent border-accent hover:bg-accent/10"
                title="Promosikan menjadi Pengurus/Ustadz"
              >
                {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                Promosi Pengurus
              </button>
            )}
            <button onClick={onClose} className="p-2 text-muted hover:bg-surface-glass rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Foto Profil */}
          <div className="flex flex-col items-center gap-2 pb-4 border-b border-light">
            <div
              className="w-24 h-24 rounded-full border-2 border-dashed border-light flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-surface-glass"
              onClick={() => photoInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted" />
              )}
            </div>
            <span className="text-xs text-muted uppercase tracking-wider">Foto Profil Siswa</span>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Row 1: NISN, Nama Lengkap, NIK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">NISN <span className="text-danger">*</span></label>
              <input required type="text" className="input-base" value={formData.nisn} onChange={set('nisn')} placeholder="0012345678" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap <span className="text-danger">*</span></label>
              <input required type="text" className="input-base" value={formData.name} onChange={set('name')} placeholder="Ahmad Fauzi" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NIK</label>
              <input type="text" className="input-base" value={formData.nik} onChange={set('nik')} placeholder="NIK Siswa" />
            </div>
          </div>

          {/* Row 2: Tempat Lahir, Tanggal Lahir, Kelas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
              <input type="text" className="input-base" value={formData.tempatLahir} onChange={set('tempatLahir')} placeholder="Cilacap" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
              <input type="date" className="input-base" value={formData.dob} onChange={set('dob')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kelas</label>
              <input type="text" className="input-base" value={formData.kelas} onChange={set('kelas')} placeholder="6" />
            </div>
          </div>

          {/* Row 3: Jenis Kelamin, Status, Nama Ayah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
              <select className="input-base" value={formData.gender} onChange={set('gender')}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status Siswa</label>
              <select className="input-base" value={formData.status} onChange={set('status')}>
                <option value="AKTIF">Aktif</option>
                <option value="ALUMNI">Alumni</option>
                <option value="KELUAR">Keluar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nama Ayah</label>
              <input type="text" className="input-base" value={formData.namaAyah} onChange={set('namaAyah')} placeholder="Nama ayah kandung" />
            </div>
          </div>

          {/* Row 4: Nama Ibu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Ibu</label>
              <input type="text" className="input-base" value={formData.namaIbu} onChange={set('namaIbu')} placeholder="Nama ibu kandung" />
            </div>
          </div>

          {/* Alamat Section */}
          <div className="border-t border-light pt-4">
            <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Alamat Domisili</h3>

            {/* Provinsi & Kabupaten (otomatis dari kecamatan) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Provinsi</label>
                <select className="input-base bg-surface-glass" value={formData.provinsi} onChange={set('provinsi')}>
                  <option value="">Pilih Provinsi</option>
                  {Object.keys(KECAMATAN_DATA).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kabupaten/Kota</label>
                <input type="text" className="input-base bg-surface-glass" value={formData.kabupaten} onChange={set('kabupaten')} placeholder="Otomatis" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kecamatan</label>
                <select className="input-base" value={formData.kecamatan} onChange={set('kecamatan')}>
                  <option value="">Pilih Kecamatan</option>
                  {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
                  {!kecamatanList.length && formData.kecamatan && <option value={formData.kecamatan}>{formData.kecamatan}</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kelurahan/Desa</label>
                <select className="input-base" value={formData.kelurahan} onChange={set('kelurahan')}>
                  <option value="">Pilih Kelurahan/Desa</option>
                  {kelurahanList.map(k => <option key={k} value={k}>{k}</option>)}
                  {!kelurahanList.length && formData.kelurahan && <option value={formData.kelurahan}>{formData.kelurahan}</option>}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Alamat Lengkap (Jalan/RT/RW)</label>
              <input type="text" className="input-base" value={formData.alamat} onChange={set('alamat')} placeholder="Jl. Merdeka No.12" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">No. Telepon</label>
                <input type="text" className="input-base" value={formData.noHp} onChange={set('noHp')} placeholder="081328308530" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Wali</label>
                <input type="text" className="input-base" value={formData.waliName} onChange={set('waliName')} placeholder="Siti Aminah" />
              </div>
            </div>
          </div>

          {/* Wali Section (hanya saat tambah baru) */}
          {!initialData && (
            <div className="border-t border-light pt-4">
              <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Data Wali / Orang Tua</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Wali</label>
                  <input type="text" className="input-base" value={formData.waliName} onChange={set('waliName')} placeholder="Nama lengkap wali" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No. HP Wali</label>
                  <input type="text" className="input-base" value={formData.waliPhone} onChange={set('waliPhone')} placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hubungan</label>
                  <select className="input-base" value={formData.waliRelation} onChange={set('waliRelation')}>
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Kakak">Kakak</option>
                    <option value="Paman">Paman</option>
                    <option value="Bibi">Bibi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-light">
            <button type="button" onClick={onClose} className="btn btn-outline">Batal</button>
            <button type="submit" disabled={loading} className="btn btn-primary min-w-[120px]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
