import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { X, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
  employeeName: string | null;
}

export function PayrollModal({ isOpen, onClose, employeeId, employeeName }: Props) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState(3000000);
  const [allowances, setAllowances] = useState(0);
  const [deductions, setDeductions] = useState(0);

  useEffect(() => {
    if (isOpen) {
       // Reset for current month
       setMonth(new Date().getMonth() + 1);
       setYear(new Date().getFullYear());
       setBaseSalary(3000000);
       setAllowances(0);
       setDeductions(0);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setLoading(true);
    try {
      await api.post('/employee/payroll', {
        employeeId,
        month: Number(month),
        year: Number(year),
        baseSalary: Number(baseSalary),
        allowances: Number(allowances),
        deductions: Number(deductions)
      });

      toast.success(`Gaji untuk ${employeeName} berhasil direkam!`);
      onClose();
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string | object } } };
      const msg = err.response?.data?.message || 'Gagal menyimpan rekaman gaji.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-light w-full max-w-sm rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-light">
          <h2 className="text-lg font-bold text-main">Rekam Penggajian</h2>
          <button 
            title="Tutup Formulir"
            onClick={onClose}
            className="p-2 hover:bg-surface-glass rounded-full transition-colors text-muted hover:text-main"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto">
          <form id="payroll-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="p-3 bg-primary/10 rounded-lg text-primary text-sm font-semibold mb-2">
               Pegawai: {employeeName || 'Pilih Pegawai'}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Bulan</label>
                 <select title="Pilih Bulan" className="input-base w-full" value={month} onChange={e => setMonth(Number(e.target.value))}>
                   {[...Array(12)].map((_, i) => (
                     <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Tahun</label>
                 <input 
                   title="Tahun"
                   placeholder="Tahun"
                   type="number" 
                   className="input-base w-full" 
                   value={year}
                   onChange={e => setYear(Number(e.target.value))}
                   required
                 />
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Gaji Pokok (Rp) <span className="text-danger">*</span></label>
              <input 
                title="Gaji Pokok"
                placeholder="Gaji Pokok"
                type="number" 
                className="input-base w-full font-mono font-bold" 
                value={baseSalary}
                onChange={e => setBaseSalary(Number(e.target.value))}
                min={0}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Tunjangan</label>
                 <input 
                   title="Total Tunjangan"
                   placeholder="Total Tunjangan"
                   type="number" 
                   className="input-base w-full text-success" 
                   value={allowances}
                   onChange={e => setAllowances(Number(e.target.value))}
                   min={0}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Potongan</label>
                 <input 
                   title="Total Potongan"
                   placeholder="Total Potongan"
                   type="number" 
                   className="input-base w-full text-danger" 
                   value={deductions}
                   onChange={e => setDeductions(Number(e.target.value))}
                   min={0}
                 />
               </div>
            </div>

            <div className="pt-2 text-right text-sm">
               <span className="text-muted">Total Diterima: </span>
               <span className="font-bold text-accent text-lg">
                  Rp {(baseSalary + allowances - deductions).toLocaleString('id-ID')}
               </span>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-light bg-surface-glass flex justify-end gap-3 rounded-b-2xl">
           <button 
             type="button" 
             onClick={onClose}
             className="btn btn-outline"
             disabled={loading}
           >
             Batal
           </button>
           <button 
             type="submit" 
             form="payroll-form"
             className="btn btn-primary flex items-center gap-2"
             disabled={loading}
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Rekam Tagihan
           </button>
        </div>

      </div>
    </div>
  );
}
