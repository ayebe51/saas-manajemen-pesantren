import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import JsBarcode from 'jsbarcode';
import { api } from '@/lib/api/client';
import { Search, Printer, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PersonData {
  id: string;
  name: string;
  identifier: string; // NISN or NIP
  subtitle: string; // Class or Department
  type: 'SANTRI' | 'ASATIDZ';
}

export function IdCardGeneratorPage() {
  const [activeTab, setActiveTab] = useState<'SANTRI' | 'ASATIDZ'>('SANTRI');
  const [dataList, setDataList] = useState<PersonData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Generate barcode when selectedPerson changes
  useEffect(() => {
    if (selectedPerson) {
      try {
        JsBarcode(`#barcode-${selectedPerson.id}`, selectedPerson.id, {
          format: 'CODE128',
          width: 2,
          height: 30,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        console.error('Failed to generate barcode:', err);
      }
    }
  }, [selectedPerson]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'SANTRI') {
        const res = await api.get('/santri');
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: PersonData[] = raw.map((s: any) => ({
          id: s.id,
          name: s.name,
          identifier: s.nisn || '-',
          subtitle: `Kelas: ${s.kelas || '-'} - ${s.room || '-'}`,
          type: 'SANTRI' as const
        }));
        setDataList(mapped);
      } else {
        const res = await api.get('/employee');
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: PersonData[] = raw.map((e: any) => ({
          id: e.id,
          name: e.name,
          identifier: e.nip || '-',
          subtitle: `${e.department || '-'} - ${e.position || '-'}`,
          type: 'ASATIDZ' as const
        }));
        setDataList(mapped);
      }
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = dataList.filter(
    (item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.identifier.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-primary">ID Card Generator</h1>
          <p className="text-muted">Cetak & ekspor E-ID Card Santri dan Asatidz</p>
        </div>
        {selectedPerson && (
           <button onClick={handlePrint} className="btn btn-primary gap-2">
             <Printer className="w-4 h-4" /> Cetak Kartu
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Selector Panel - Hidden on Print */}
        <div className="glass-panel p-6 lg:col-span-1 print:hidden flex flex-col min-h-[500px]">
           <div className="flex bg-surface-glass rounded-lg p-1 mb-4 select-none">
              <button 
                onClick={() => { setActiveTab('SANTRI'); setSelectedPerson(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'SANTRI' ? 'bg-primary text-inverse shadow-md' : 'text-muted hover:text-white'}`}
              >
                Data Santri
              </button>
              <button 
                onClick={() => { setActiveTab('ASATIDZ'); setSelectedPerson(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ASATIDZ' ? 'bg-primary text-inverse shadow-md' : 'text-muted hover:text-white'}`}
              >
                Data Asatidz
              </button>
           </div>

           <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Cari Nama / ID..." 
                className="input-field pl-10 w-full bg-surface-glass/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="w-5 h-5 absolute left-3 top-3.5 text-muted focus:text-primary" />
           </div>

           <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[400px]">
              {loading ? (
                 <div className="text-center p-4 text-muted text-sm animate-pulse">Memuat...</div>
              ) : filteredData.length === 0 ? (
                 <div className="text-center p-4 text-muted text-sm">Tidak ada data.</div>
              ) : (
                 filteredData.map(person => (
                    <div 
                      key={person.id}
                      onClick={() => setSelectedPerson(person)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedPerson?.id === person.id ? 'border-primary bg-primary/10 shadow-glow' : 'border-light bg-surface hover:bg-surface-glass'}`}
                    >
                       <p className="font-semibold text-sm truncate">{person.name}</p>
                       <p className="text-xs text-muted font-mono">{person.identifier}</p>
                    </div>
                 ))
              )}
           </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 flex justify-center items-start lg:mt-0 print:m-0 print:col-span-3">
           {!selectedPerson ? (
             <div className="glass-panel w-full flex flex-col items-center justify-center p-12 text-muted border-dashed print:hidden">
               <UserCircle className="w-16 h-16 mb-4 opacity-50" />
               <p>Pilih nama dari daftar di samping untuk melihat pratinjau ID Card</p>
             </div>
           ) : (
             <div className="relative w-[340px] h-[540px] bg-white rounded-2xl shadow-xl overflow-hidden print:w-[325px] print:h-[510px] print:shadow-none print:break-inside-avoid print:mx-auto select-none print-only-card group" id="id-card-preview">
                 
                 {/* Card Background Graphics */}
                 <div className="absolute top-0 w-full h-32 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-b-[40px] shadow-sm z-0"></div>
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-xl z-0"></div>
                 <div className="absolute top-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-lg z-0"></div>

                 <div className="relative z-10 flex flex-col items-center pt-6 px-6 h-full text-gray-800">
                    <h2 className="text-lg font-black tracking-widest text-white uppercase drop-shadow-md">APSS Pesantren</h2>
                    <p className="text-[10px] font-medium tracking-widest text-emerald-100 uppercase opacity-90 mb-6">Kartu Identitas Terpadu</p>
                    
                    {/* Photo Placeholder */}
                    <div className="w-32 h-32 bg-gray-100 rounded-2xl shadow-md border-4 border-white overflow-hidden mb-4 relative z-20 flex items-center justify-center text-gray-300">
                         {/* Replace with real img src if available */}
                         <UserCircle className="w-24 h-24 stroke-1" />
                    </div>

                    {/* Meta Data */}
                    <div className="text-center w-full mb-6">
                       <h3 className="text-xl font-bold uppercase text-gray-900 leading-tight line-clamp-2">{selectedPerson.name}</h3>
                       <div className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold mt-2 font-mono border border-teal-100 shadow-sm">
                          {selectedPerson.type === 'SANTRI' ? 'NISN: ' : 'NIP: '}{selectedPerson.identifier}
                       </div>
                       <p className="text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">{selectedPerson.subtitle}</p>
                    </div>

                    {/* QR Code & Barcode */}
                    <div className="mt-auto mb-4 space-y-2">
                       {/* QR Code */}
                       <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 flex justify-center">
                          <QRCode 
                             value={JSON.stringify({ id: selectedPerson.id, type: selectedPerson.type })}
                             size={70}
                             level="H"
                             bgColor="#ffffff"
                             fgColor="#0f172a"
                          />
                       </div>
                       
                       {/* Barcode */}
                       <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-1 flex justify-center">
                          <svg id={`barcode-${selectedPerson.id}`} className="w-full h-8"></svg>
                       </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="w-full text-center pb-4 text-[9px] text-gray-400 font-medium">
                       Kartu ini harap dikembalikan jika ditemukan.<br/>
                       &copy; {new Date().getFullYear()} APSS Sistem Terpadu
                    </div>
                 </div>

                 {/* Decorative Footer Bar */}
                 <div className="absolute bottom-0 w-full h-2 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
             </div>
           )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #id-card-preview, #id-card-preview * {
            visibility: visible;
          }
          #id-card-preview {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
          }
          @page { size: auto; margin: 0mm; }
        }
      `}} />
    </div>
  );
}
