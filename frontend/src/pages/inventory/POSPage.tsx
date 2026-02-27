import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, CreditCard, ScanLine, X, UserCircle } from 'lucide-react';
import { api } from '../../lib/api/client';
import toast from 'react-hot-toast';

interface Item {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Item {
  quantity: number;
}

export function POSPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState(''); // Akan di-scan/input NISN
  const [loading, setLoading] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory/items');
      setItems(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch items', error);
      toast.error('Gagal memuat katalog barang');
    }
  };

  const addToCart = (item: Item) => {
    if (item.stock <= 0) {
      toast.error('Stok barang habis!');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          toast.error('Melebihi batas stok tersedia');
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return { ...item, quantity: 0 }; // Will be filtered out
        if (newQuantity > item.stock) {
          toast.error('Melebihi batas stok tersedia');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!studentId) {
      toast.error('Harap masukkan NISN / Scan Kartu Santri');
      return;
    }

    setLoading(true);
    try {
      // Endpoint yang akan kita buat di backend untuk atomic transaction (Wallet + Inventory)
      await api.post('/cooperative/checkout', {
        santriId: studentId, // Asumsi form input berupa NISN atau ID Santri (Nanti diolah backend)
        items: cart.map(item => ({ itemId: item.id, quantity: item.quantity })),
        totalAmount
      });
      
      toast.success('Transaksi Berhasil! Saldo dompet terpotong.');
      setCart([]);
      setStudentId('');
      setIsCheckoutModalOpen(false);
      fetchItems(); // Refresh stok
    } catch (error: any) {
      console.error('Checkout failed', error);
      toast.error(error.response?.data?.message || 'Transaksi gagal. Periksa saldo atau validitas Santri.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mesin POS Koperasi</h1>
          <p className="text-muted">Layanan kasir santri berbasis Dompet Digital (Cashless).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kiri: Katalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari barang atau scan barcode SKU..."
                className="input-base pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={item.stock <= 0}
                className={`glass-panel p-4 text-left transition-all hover:-translate-y-1 ${
                  item.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-muted">{item.sku}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.stock > 10 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    Stok: {item.stock}
                  </span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">{item.name}</h3>
                <div className="mt-3 text-primary font-bold">
                  Rp {item.price.toLocaleString('id-ID')}
                </div>
              </button>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted glass-panel">
                Barang tidak ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* Kanan: Cart / Struk */}
        <div className="glass-panel flex flex-col h-[calc(100vh-8rem)] sticky top-6">
          <div className="p-4 border-b border-light flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Keranjang Belanja
            </h2>
            <span className="badge-primary">{cart.length} item</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted gap-3">
                <ShoppingCart className="w-12 h-12 opacity-20" />
                <p>Belum ada barang dipilih</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-light/30 border border-light">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                    <div className="text-xs text-muted">Rp {item.price.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-md hover:bg-light hover:text-danger">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-md hover:bg-light text-primary">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 ml-2 text-muted hover:text-danger transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-light bg-light/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted">Total Tagihan</span>
              <span className="text-2xl font-bold text-success">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              disabled={cart.length === 0}
              className="btn-primary w-full py-3 flex justify-center items-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/50 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ScanLine className="w-6 h-6 text-primary" />
                Verifikasi Pembeli
              </h2>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-2 hover:bg-light rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted">Total Pembayaran</div>
                  <div className="text-xl font-bold text-primary">Rp {totalAmount.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ID Santri / NISN (Scan Barcode ID Card)</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input-base pl-10 w-full text-lg font-mono focus:ring-primary focus:border-primary"
                    placeholder="Contoh: 10029302"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    autoFocus
                  />
                  <ScanLine className="w-5 h-5 absolute left-3 top-3 text-muted" />
                </div>
                <p className="text-xs text-muted mt-2">
                  Saldo wallet santri ini akan dipotong secara otomatis. Kosongkan ID jika pembayaran tunai (guest).
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-primary flex items-center gap-2"
                  onClick={handleCheckout}
                  disabled={loading || !studentId}
                >
                  {loading ? (
                    'Memproses...'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Konfirmasi Transaksi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
