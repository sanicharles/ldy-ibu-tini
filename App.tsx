
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Search, 
  WashingMachine, 
  UserCircle, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Package, 
  ArrowRight,
  Phone,
  FileText,
  TrendingUp,
  Moon,
  Sun,
  X,
  Printer,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  History,
  User,
  BellRing,
  Lock,
  Unlock,
  Shirt,
  Waves,
  Sparkles,
  Droplets
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Order, 
  Role, 
  OrderStatus, 
  ServiceType, 
  SERVICE_PRICES 
} from './types';
import { 
  formatIDR, 
  generateNotaNumber, 
  playNotificationSound, 
  sendWhatsAppMessage,
  showPushNotification
} from './utils';

// Hardcoded Admin PIN for simplicity
const ADMIN_PIN = "1234";

// --- Shared Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }: any) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200',
    secondary: 'bg-white/50 text-gray-700 hover:bg-white/80 backdrop-blur-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-100',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50/50 backdrop-blur-sm'
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <div className={`bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 ${className}`}>
    {children}
  </div>
);

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'info', onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-xl border flex items-center gap-3 animate-slide-in-right ${type === 'success' ? 'bg-green-50/90 backdrop-blur-md border-green-200 text-green-800' : 'bg-blue-50/90 backdrop-blur-md border-blue-200 text-blue-800'}`}>
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <BellRing className="w-5 h-5 text-blue-600" />}
    <p className="font-medium text-sm">{message}</p>
    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full"><X className="w-4 h-4" /></button>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'add'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  
  // Auth state for Admin
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);

  // Persistence and Permission
  useEffect(() => {
    const savedOrders = localStorage.getItem('tini_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    
    const savedPhone = localStorage.getItem('tini_customer_phone');
    if (savedPhone) setCustomerPhone(savedPhone);

    const savedRole = localStorage.getItem('tini_role');
    if (savedRole) {
      setRole(savedRole as Role);
      setActiveTab(savedRole === 'ADMIN' ? 'dashboard' : 'add');
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
      // Only show welcome if no role is selected
      if (!savedRole) {
        setShowWelcome(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('tini_orders', JSON.stringify(orders));
  }, [orders]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === ADMIN_PIN) {
      setRole('ADMIN');
      localStorage.setItem('tini_role', 'ADMIN');
      setActiveTab('dashboard');
      setShowAdminLogin(false);
      setAdminPinInput('');
      setAdminPinError(false);
    } else {
      setAdminPinError(true);
      setAdminPinInput('');
    }
  };

  const handleRoleSelect = (selectedRole: Role) => {
    if (selectedRole === 'ADMIN') {
      setShowAdminLogin(true);
    } else {
      setRole(selectedRole);
      localStorage.setItem('tini_role', selectedRole);
      setActiveTab('add');
    }
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('tini_role');
    setShowAdminLogin(false);
    setShowWelcome(true);
  };

  const addOrder = (newOrder: Order, notify: boolean = true) => {
    setOrders(prev => [newOrder, ...prev]);
    if (notify) {
      playNotificationSound();
      setToast({ message: `Order baru dari ${newOrder.customerName} diterima!`, type: 'info' });
      showPushNotification("Order Baru Diterima", `${newOrder.customerName} baru saja membuat pesanan ${newOrder.serviceType}.`);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const updateOrderStatus = (id: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    playNotificationSound();
    
    let body = `Status laundry Anda sekarang: ${newStatus}`;
    if (newStatus === 'Proses') {
      body = `Laundry atas nama ${order.customerName} sedang dalam PROSES pengerjaan. 🧺`;
    } else if (newStatus === 'Selesai') {
      body = `Laundry atas nama ${order.customerName} sudah SELESAI ✅ Total: ${formatIDR(order.totalPrice)}. Silakan ambil atau hubungi kami untuk pengantaran. 🚚`;
    }

    showPushNotification(`Update Order: ${order.notaNumber}`, body);
    
    setToast({ 
      message: `Status order ${order.notaNumber} (${order.customerName}) diubah ke ${newStatus}`, 
      type: 'success' 
    });
    setTimeout(() => setToast(null), 4000);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const omzet = monthlyOrders.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const completed = monthlyOrders.filter(o => o.status === 'Selesai').length;
    const process = monthlyOrders.filter(o => o.status === 'Proses').length;
    
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const dayTotal = orders
        .filter(o => new Date(o.createdAt).toDateString() === d.toDateString())
        .reduce((sum, o) => sum + o.totalPrice, 0);
      return { name: dateStr, revenue: dayTotal };
    });

    return { omzet, completed, process, chartData: last7Days };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (role === 'CUSTOMER' && customerPhone) {
      result = result.filter(o => o.customerPhone === customerPhone);
    }
    if (searchQuery) {
      result = result.filter(o => 
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.notaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone.includes(searchQuery)
      );
    }
    return result;
  }, [orders, role, customerPhone, searchQuery]);

  const whatsappOrderTemplate = `Halo 👋 Terima kasih sudah menghubungi LAUNDRY IBU TINI.
Silakan kirim format berikut untuk pemesanan:

FORMAT ORDER LAUNDRY
Nama: 
Alamat: 
No HP: 
Jenis Layanan: Cuci Setrika / Cuci Lipat / Setrika / Express / Handuk / Sprei 1 Set / Bed Cover / Hordeng 1 Set
Berat / Jumlah Perkiraan: 
Request Khusus (jika ada): 
Metode Antar/Jemput: 

Laundry siap jemput & antar 🚚✨`;

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-blue-600 flex items-center justify-center flex-col text-white z-[1000]">
        <div className="relative">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 animate-bounce shadow-2xl overflow-hidden">
                <WashingMachine className="w-16 h-16 text-blue-600 z-10" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-blue-100 opacity-50 animate-pulse"></div>
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">LAUNDRY IBU TINI</h1>
        <p className="mt-2 text-blue-100">Bersih • Wangi • Rapi</p>
      </div>
    );
  }

  // --- Welcome View ---
  if (showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 backdrop-blur-sm rounded-full border border-blue-200 text-blue-700 font-bold text-xs uppercase tracking-widest shadow-sm">
              <Sparkles className="w-4 h-4" /> Higienis & Terpercaya
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gray-800 tracking-tighter leading-tight">
              Pakaian Bersih <br />
              <span className="text-blue-600">Hati Senang.</span>
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto md:mx-0">
              Nikmati jasa laundry profesional dari Ibu Tini. Pakaian Anda akan kembali bersih, wangi, dan rapi seperti baru.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={() => setShowWelcome(false)}
                className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-blue-200 active:scale-95"
              >
                Mulai Sekarang <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
              <a 
                href={`https://wa.me/6285695014434`}
                target="_blank"
                className="flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md border border-white/80 hover:bg-white text-gray-700 px-6 py-5 rounded-2xl font-bold transition-all shadow-sm"
              >
                <MessageCircle className="w-5 h-5 text-green-500" /> Hubungi Kami
              </a>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-8 pt-6 opacity-60">
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800 tracking-tighter">100%</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Puas</p>
              </div>
              <div className="text-center border-x border-gray-200 px-8">
                <p className="text-2xl font-black text-gray-800 tracking-tighter">24H</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Express</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800 tracking-tighter">Eco</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Friendly</p>
              </div>
            </div>
          </div>
          
          <div className="relative flex justify-center items-center">
            {/* Attractive visual representation */}
            <div className="relative w-72 h-72 md:w-96 md:h-96">
                <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-blue-500/10 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-3xl shadow-2xl flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-500 overflow-hidden group">
                      <WashingMachine className="w-24 h-24 md:w-32 md:h-32 text-blue-600 group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-blue-50/80 backdrop-blur-sm flex items-center justify-center border-t border-blue-100">
                          <Shirt className="w-8 h-8 text-blue-400" />
                      </div>
                  </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute top-10 right-0 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce" style={{animationDuration: '2s'}}>
                  <Droplets className="w-8 h-8 text-blue-400" />
                </div>
                <div className="absolute bottom-10 left-0 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}>
                  <Sparkles className="w-8 h-8 text-orange-400" />
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Login Screen
  if (showAdminLogin && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="max-w-md w-full">
          <Card className="p-8 text-center animate-fade-in border-blue-200">
            <button onClick={() => setShowAdminLogin(false)} className="mb-6 text-sm text-blue-600 flex items-center gap-1 hover:underline">
               <X className="w-4 h-4" /> Kembali
            </button>
            <div className="w-20 h-20 bg-blue-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 border border-blue-200 shadow-inner">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Login Admin</h2>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">Masukkan PIN Keamanan untuk mengakses dashboard admin Laundry Ibu Tini.</p>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="relative">
                <input 
                  required
                  autoFocus
                  type="password"
                  maxLength={4}
                  className={`w-full px-4 py-5 border rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-center text-4xl tracking-[1rem] font-black transition-all bg-white/50 ${adminPinError ? 'border-red-500 bg-red-50/50' : 'border-blue-200'}`}
                  placeholder="••••"
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value.replace(/\D/g, ''));
                    setAdminPinError(false);
                  }}
                />
                {adminPinError && (
                  <p className="text-red-500 text-xs mt-3 font-bold">PIN yang Anda masukkan salah!</p>
                )}
              </div>
              <Button type="submit" className="w-full py-4 text-lg">
                Buka Portal <Unlock className="w-5 h-5" />
              </Button>
            </form>
            <p className="mt-8 text-[10px] text-gray-400 font-medium tracking-widest uppercase">Default PIN: 1234</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="max-w-md w-full">
          <Card className="text-center py-10 border-white/80">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform -rotate-3 overflow-hidden relative group">
                <WashingMachine className="w-12 h-12 text-white z-10 relative" />
                <Waves className="absolute bottom-0 left-0 w-full h-1/2 text-white/20 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Sistem Laundry Ibu Tini</h2>
            <p className="text-gray-500 mb-10 leading-relaxed px-4">Solusi kebersihan pakaian terbaik di kota Anda. Pilih akses masuk:</p>
            <div className="space-y-4 px-2">
              <button 
                onClick={() => handleRoleSelect('ADMIN')}
                className="w-full flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all group shadow-xl shadow-blue-200/50"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Akses Admin</p>
                    <p className="text-xs text-blue-100">Laporan & Pengaturan</p>
                  </div>
                </div>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => handleRoleSelect('CUSTOMER')}
                className="w-full flex items-center justify-between p-5 bg-white/80 border-2 border-blue-600/30 hover:border-blue-600 hover:bg-white text-blue-600 rounded-2xl transition-all group backdrop-blur-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Akses Pelanggan</p>
                    <p className="text-xs text-blue-500">Buat Order & Cek Status</p>
                  </div>
                </div>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <button 
              onClick={() => setShowWelcome(true)}
              className="mt-8 text-xs font-bold text-blue-600 hover:underline"
            >
              Kembali ke Beranda
            </button>
          </Card>
        </div>

        <a 
          href={`https://wa.me/6285695014434?text=${encodeURIComponent(whatsappOrderTemplate)}`}
          target="_blank" 
          className="whatsapp-float"
        >
          <div className="whatsapp-pulse"></div>
          <MessageCircle className="w-8 h-8" />
          <span className="wa-label">Order via WA</span>
        </a>
      </div>
    );
  }

  // Customer Authentication Screen
  if (role === 'CUSTOMER' && !customerPhone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="max-w-md w-full">
          <Card className="p-8 border-blue-100 shadow-2xl">
             <button onClick={() => setRole(null)} className="mb-6 text-sm text-blue-600 flex items-center gap-1 hover:underline font-bold">
               <X className="w-4 h-4" /> Batal
             </button>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Cek Riwayat</h2>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">Masukkan nomor HP WhatsApp Anda untuk melihat daftar pesanan yang sedang berjalan.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const phone = (e.target as any).phone.value;
              setCustomerPhone(phone);
              localStorage.setItem('tini_customer_phone', phone);
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700 ml-1">Nomor HP / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <input 
                        name="phone"
                        required
                        type="tel" 
                        className="w-full pl-12 pr-4 py-4 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none text-xl font-semibold bg-white/50 transition-all"
                        placeholder="Contoh: 0812345678"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full py-5 text-xl">
                  Lanjutkan <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark text-white' : 'bg-transparent'}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-blue-700/80 backdrop-blur-xl border-r border-white/20">
          <div className="flex flex-1 flex-col overflow-y-auto pt-8 pb-4">
            <div className="flex flex-shrink-0 items-center px-6 gap-4 text-white">
              <div className="bg-white p-2 rounded-xl shadow-lg transform rotate-6">
                <WashingMachine className="w-7 h-7 text-blue-700" />
              </div>
              <div>
                  <span className="font-black text-xl uppercase tracking-widest block leading-none">IBU TINI</span>
                  <span className="text-[10px] text-blue-100 font-medium tracking-[0.2em] uppercase">Laundry & Care</span>
              </div>
            </div>
            <nav className="mt-12 flex-1 space-y-3 px-3">
              {role === 'ADMIN' ? (
                <>
                  <SidebarLink icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                  <SidebarLink icon={ClipboardList} label="Daftar Order" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                  <SidebarLink icon={PlusCircle} label="Input Pesanan" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
                </>
              ) : (
                <>
                  <SidebarLink icon={PlusCircle} label="Buat Order" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
                  <SidebarLink icon={History} label="Riwayat Saya" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                </>
              )}
            </nav>
          </div>
          <div className="flex flex-shrink-0 bg-blue-800/60 p-5 flex-col gap-4 backdrop-blur-md">
            {role === 'CUSTOMER' && (
              <button 
                onClick={() => {
                  setCustomerPhone('');
                  localStorage.removeItem('tini_customer_phone');
                }} 
                className="flex items-center gap-3 text-white/80 hover:text-white font-bold text-xs transition-colors"
              >
                <User className="w-4 h-4" /> Ganti Nomor HP
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-100 hover:text-white font-black text-xs transition-colors uppercase tracking-wider">
              <LogOut className="w-4 h-4" /> Keluar Sistem
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-40 bg-white/40 backdrop-blur-2xl border-b border-white/40 px-6 py-5 flex items-center justify-between">
          <div className="md:hidden flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                <WashingMachine className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg text-blue-800 tracking-tight">IBU TINI</span>
          </div>
          <h2 className="hidden md:block text-2xl font-black text-gray-800 tracking-tight">
            {role === 'ADMIN' ? 'Control Panel Admin' : 'Pesanan Anda'}
          </h2>
          <div className="flex items-center gap-5">
            {role === 'CUSTOMER' && (
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-blue-50/60 backdrop-blur-md text-blue-700 rounded-2xl text-sm font-bold border border-blue-100 shadow-sm">
                <Phone className="w-4 h-4" /> {customerPhone}
              </div>
            )}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-white/40 hover:bg-white/80 transition-all rounded-xl shadow-sm border border-white/60">
              {isDarkMode ? <Sun className="w-5 h-5 text-orange-500" /> : <Moon className="w-5 h-5 text-blue-600" />}
            </button>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
                {role === 'ADMIN' ? 'A' : 'P'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-32">
          {activeTab === 'dashboard' && role === 'ADMIN' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Omzet (Bulan Ini)" value={formatIDR(stats.omzet)} icon={TrendingUp} color="blue" />
                <StatCard label="Order Selesai" value={stats.completed} icon={CheckCircle2} color="green" />
                <StatCard label="Dalam Proses" value={stats.process} icon={Clock} color="orange" />
                <StatCard label="Total Nota" value={orders.length} icon={Package} color="purple" />
              </div>
              
              <Card className="h-[450px] border-white/80">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">Laporan Pendapatan Mingguan</h3>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white/40 px-3 py-1.5 rounded-lg border border-white/60">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div> Sektor Cuci
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(0,0,0,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${val/1000}k`} tick={{fontSize: 11, fontWeight: 600, fill: '#94a3b8'}} />
                    <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)'}}
                        formatter={(val: number) => [formatIDR(val), 'Pendapatan']} 
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {activeTab === 'add' && (
            <div className="animate-fade-in">
                <OrderForm role={role} prefilledPhone={customerPhone} onAdd={addOrder} />
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="relative w-full md:w-full max-w-lg group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder={role === 'ADMIN' ? "Cari Pelanggan, No Nota, atau HP..." : "Masukkan No Nota Anda..."}
                    className="w-full pl-12 pr-6 py-4 border border-white/60 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none shadow-sm bg-white/50 backdrop-blur-md transition-all text-gray-800 placeholder-gray-400 font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                   <StatusFilter label="Semua Status" active={true} count={filteredOrders.length} />
                </div>
              </div>

              {role === 'CUSTOMER' && filteredOrders.length > 0 && (
                <div className="bg-blue-600/10 backdrop-blur-md border border-blue-600/20 p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-900/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                        <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Informasi Pengguna</p>
                        <p className="text-lg font-bold text-blue-900 leading-none mt-1">{customerPhone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-blue-600/60 uppercase">Ditemukan</p>
                      <p className="text-xl font-black text-blue-600">{filteredOrders.length} Nota</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    isAdmin={role === 'ADMIN'} 
                    onUpdateStatus={updateOrderStatus}
                  />
                ))}
                {filteredOrders.length === 0 && (
                  <div className="col-span-full py-32 text-center bg-white/30 backdrop-blur-sm rounded-3xl border border-dashed border-blue-200/50">
                    <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-12 h-12 text-blue-300" />
                    </div>
                    <h3 className="text-2xl font-black text-blue-900/40 uppercase tracking-tighter">
                      Data Kosong
                    </h3>
                    <p className="text-gray-500 mt-2 font-medium">Belum ada pesanan yang terdaftar.</p>
                    <Button variant="outline" className="mt-8 px-8" onClick={() => setActiveTab('add')}>
                      Buat Pesanan Sekarang
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating WA Button for Customer */}
      <a 
        href={`https://wa.me/6285695014434?text=${encodeURIComponent(whatsappOrderTemplate)}`}
        target="_blank" 
        className="whatsapp-float group"
      >
        <div className="whatsapp-pulse"></div>
        <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
        <span className="wa-label">Tanya Status via WA</span>
      </a>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 flex justify-around items-center px-4 shadow-2xl shadow-blue-900/10 z-[100]">
        {role === 'ADMIN' && (
            <MobileNavButton icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        )}
        <MobileNavButton icon={History} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
        <div className="relative -top-6">
            <button 
                onClick={() => setActiveTab('add')}
                className={`p-4 rounded-full shadow-xl transition-all ${activeTab === 'add' ? 'bg-blue-600 text-white scale-110 rotate-90 shadow-blue-300' : 'bg-white text-blue-600 shadow-gray-200'}`}
            >
                <PlusCircle className="w-8 h-8" />
            </button>
        </div>
        <MobileNavButton icon={Settings} active={false} onClick={() => {}} />
        <MobileNavButton icon={LogOut} active={false} onClick={handleLogout} />
      </div>
    </div>
  );
}

// --- Sub-components ---

function SidebarLink({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
        active 
          ? 'bg-white text-blue-700 font-black shadow-xl shadow-blue-900/10 scale-[1.02]' 
          : 'text-blue-100 hover:bg-white/10 font-bold'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'animate-pulse' : ''}`} />
      <span className="tracking-tight">{label}</span>
    </button>
  );
}

function MobileNavButton({ icon: Icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'text-blue-700 bg-blue-50/50' : 'text-gray-400'}`}>
      <Icon className={`w-6 h-6 ${active ? 'stroke-[3px]' : ''}`} />
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors = {
    blue: 'from-blue-600 to-blue-400 shadow-blue-200',
    green: 'from-green-600 to-green-400 shadow-green-100',
    orange: 'from-orange-600 to-orange-400 shadow-orange-100',
    purple: 'from-purple-600 to-purple-400 shadow-purple-100'
  };
  return (
    <Card className="flex flex-col gap-3 border-none shadow-xl shadow-blue-900/5 hover:scale-[1.03] transition-transform cursor-pointer overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color as keyof typeof colors]} opacity-[0.03] rounded-bl-[100px]`}></div>
      <div className={`p-3 w-fit rounded-xl bg-gradient-to-br ${colors[color as keyof typeof colors]} text-white shadow-lg`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-tight">{label}</p>
        <p className="text-xl md:text-2xl font-black text-gray-800 tracking-tighter mt-1">{value}</p>
      </div>
    </Card>
  );
}

function StatusFilter({ label, active, count }: any) {
  return (
    <button className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-black transition-all border shadow-sm ${active ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200' : 'bg-white/50 backdrop-blur-md text-gray-600 border-white/60'}`}>
      <span className="whitespace-nowrap uppercase tracking-widest text-[10px]">{label}</span>
      <span className={`px-2 py-0.5 rounded-lg text-[10px] ${active ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}`}>
        {count}
      </span>
    </button>
  );
}

function OrderForm({ role, prefilledPhone, onAdd }: { role: Role, prefilledPhone: string, onAdd: (o: Order, n: boolean) => void }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: prefilledPhone || '',
    customerAddress: '',
    weight: 0,
    serviceType: 'Cuci Setrika' as ServiceType,
    specialRequest: '',
    deliveryMethod: 'Ambil Sendiri' as any
  });

  useEffect(() => {
    if (prefilledPhone) {
      setFormData(prev => ({ ...prev, customerPhone: prefilledPhone }));
    }
  }, [prefilledPhone]);

  const total = formData.weight * SERVICE_PRICES[formData.serviceType];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder: Order = {
      id: Date.now().toString(),
      notaNumber: generateNotaNumber(),
      ...formData,
      totalPrice: total,
      status: 'Baru',
      createdAt: new Date().toISOString(),
      estimatedFinishDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    onAdd(newOrder, true);

    const waMessage = `Halo 👋 Terima kasih Kak 🙏
Laundry atas nama ${newOrder.customerName} sudah kami terima.
No Nota: ${newOrder.notaNumber}
Layanan: ${newOrder.serviceType}
Berat/Jumlah: ${newOrder.weight}
Total: ${formatIDR(newOrder.totalPrice)}
Estimasi selesai: 2 hari.
Cek status di portal Laundry Ibu Tini ya 😊`;

    sendWhatsAppMessage(newOrder.customerPhone, waMessage);
    
    setFormData({
      customerName: '',
      customerPhone: prefilledPhone || '',
      customerAddress: '',
      weight: 0,
      serviceType: 'Cuci Setrika',
      specialRequest: '',
      deliveryMethod: 'Ambil Sendiri'
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-blue-100/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="flex items-center gap-4 mb-10 relative">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl shadow-lg shadow-blue-200 text-white transform rotate-3">
            <WashingMachine className="w-7 h-7" />
          </div>
          <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Input Pesanan Baru</h3>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">Formulir Pendaftaran Pelanggan</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nama Lengkap</label>
              <input 
                required
                type="text" 
                className="w-full px-5 py-4 bg-white/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold text-gray-800"
                placeholder="Contoh: Budi Santoso"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">No WhatsApp</label>
              <input 
                required
                type="tel" 
                className="w-full px-5 py-4 bg-white/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold text-gray-800"
                placeholder="Contoh: 08123456789"
                value={formData.customerPhone}
                readOnly={!!prefilledPhone && role === 'CUSTOMER'}
                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Alamat Penjemputan</label>
            <textarea 
              required
              rows={2}
              className="w-full px-5 py-4 bg-white/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold text-gray-800 resize-none"
              placeholder="Contoh: Perumahan Melati Indah Blok C5 No. 12"
              value={formData.customerAddress}
              onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Berat / Qty</label>
              <div className="relative">
                <input 
                    required
                    type="number" 
                    min="0.1"
                    step="0.1"
                    className="w-full pl-5 pr-12 py-4 bg-white/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-black text-gray-800 text-xl"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">Kg/Pc</span>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Jenis Layanan</label>
              <select 
                className="w-full px-5 py-4 bg-white/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold text-gray-800 appearance-none shadow-sm cursor-pointer"
                value={formData.serviceType}
                onChange={(e) => setFormData({...formData, serviceType: e.target.value as ServiceType})}
              >
                <option value="Cuci Setrika">Cuci & Setrika (Rp 5.000)</option>
                <option value="Cuci Lipat">Cuci & Lipat (Rp 4.000)</option>
                <option value="Setrika">Hanya Setrika (Rp 4.000)</option>
                <option value="Express">Express 1 Hari (Rp 10.000)</option>
                <option value="Handuk">Satuan Handuk (Rp 2.000)</option>
                <option value="Sprei 1 Set">Sprei 1 Set (Rp 3.000)</option>
                <option value="Bed Cover">Bed Cover (Rp 30.000)</option>
                <option value="Hordeng 1 Set">Hordeng 1 Set (Rp 25.000)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Logistik</label>
              <div className="flex gap-3">
                {['Ambil Sendiri', 'Antar/Jemput'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({...formData, deliveryMethod: m as any})}
                    className={`flex-1 py-4 px-3 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${formData.deliveryMethod === m ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200' : 'border-blue-50 bg-white/50 text-blue-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Catatan</label>
              <input 
                type="text" 
                className="w-full px-5 py-4 bg-white/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold text-gray-800"
                placeholder="Pakaian sensitif, noda minyak, dll"
                value={formData.specialRequest}
                onChange={(e) => setFormData({...formData, specialRequest: e.target.value})}
              />
            </div>
          </div>

          <div className="mt-10 p-6 bg-gradient-to-br from-blue-50 to-white rounded-3xl flex flex-col md:flex-row items-center justify-between border border-blue-100 shadow-inner gap-6">
            <div className="text-center md:text-left">
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mb-1">Total Pembayaran</p>
              <p className="text-4xl font-black text-blue-700 tracking-tighter">{formatIDR(total)}</p>
            </div>
            <Button type="submit" disabled={total <= 0} className="w-full md:w-auto px-12 py-5 text-xl rounded-2xl">
              Daftarkan Nota <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function OrderCard({ order, isAdmin, onUpdateStatus }: any) {
  
  const generatePDF = async () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 160] 
    });

    const margin = 5;
    const pageWidth = 80;
    let y = 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAUNDRY IBU TINI", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Solusi Bersih, Wangi & Rapi", pageWidth / 2, y, { align: "center" });
    y += 4;
    doc.text("WA: 0856-9501-4434", pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.text("--------------------------------------------------", pageWidth / 2, y, { align: "center" });
    y += 8;

    const drawLine = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, pageWidth - margin, y, { align: "right" });
      y += 6;
    };

    drawLine("No Nota:", order.notaNumber);
    drawLine("Tanggal:", new Date(order.createdAt).toLocaleDateString('id-ID'));
    drawLine("Nama:", order.customerName);
    drawLine("HP:", order.customerPhone);
    y += 4;
    doc.text("--------------------------------------------------", pageWidth / 2, y, { align: "center" });
    y += 8;
    drawLine("Layanan:", order.serviceType);
    drawLine("Berat/Qty:", `${order.weight} unit`);
    drawLine("Harga Satuan:", formatIDR(SERVICE_PRICES[order.serviceType as ServiceType]));
    y += 4;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    drawLine("TOTAL:", formatIDR(order.totalPrice));
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    drawLine("Estimasi:", new Date(order.estimatedFinishDate).toLocaleDateString('id-ID'));
    y += 12;
    doc.setFont("helvetica", "italic");
    doc.text("Terima kasih sudah mempercayakan", pageWidth / 2, y, { align: "center" });
    y += 4;
    doc.text("pakaian Anda pada kami 🙏", pageWidth / 2, y, { align: "center" });

    doc.save(`Nota_TINI_${order.notaNumber}.pdf`);
  };

  const handleFinishNotify = () => {
    const msg = `Halo Kak 👋
Kabar baik! Laundry atas nama ${order.customerName} sudah SELESAI & BERSIH ✅
No Nota: ${order.notaNumber}
Total: ${formatIDR(order.totalPrice)}
Silakan diambil atau hubungi kami untuk pengantaran ke alamat ya 🚚😊`;
    sendWhatsAppMessage(order.customerPhone, msg);
    onUpdateStatus(order.id, 'Selesai');
  };

  const statusColors = {
    'Baru': 'bg-blue-600 shadow-blue-200',
    'Proses': 'bg-orange-500 shadow-orange-200',
    'Selesai': 'bg-green-600 shadow-green-200'
  };

  return (
    <Card className="hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative group overflow-hidden border-white/80">
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.05] -mr-16 -mt-16 rounded-full ${statusColors[order.status as OrderStatus]}`}></div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.3em] mb-1">{order.notaNumber}</p>
          <h4 className="text-xl font-black text-gray-800 tracking-tighter leading-none">{order.customerName}</h4>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg ${statusColors[order.status as OrderStatus]}`}>
          {order.status}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shadow-sm border border-blue-100/50">
            <Package className="w-4 h-4" />
          </div>
          <p className="text-sm font-bold text-gray-600 tracking-tight">{order.serviceType} <span className="text-blue-500">({order.weight} pcs/kg)</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg text-orange-600 shadow-sm border border-orange-100/50">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-sm font-bold text-gray-600 tracking-tight">Ambil: <span className="text-orange-600">{new Date(order.estimatedFinishDate).toLocaleDateString('id-ID')}</span></p>
        </div>
        {order.specialRequest && (
            <div className="mt-2 p-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Catatan</p>
                <p className="text-xs font-medium text-gray-600 italic">"{order.specialRequest}"</p>
            </div>
        )}
      </div>

      <div className="pt-6 border-t border-white/60 flex items-center justify-between mb-6">
        <div className="flex flex-col">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Tagihan</p>
            <p className="text-2xl font-black text-blue-700 tracking-tighter">{formatIDR(order.totalPrice)}</p>
        </div>
        <div className="p-3 bg-white/40 rounded-2xl border border-white/60 shadow-sm">
            <FileText className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={generatePDF}
          className="flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-gray-800 py-3 rounded-2xl transition-all font-bold text-xs border border-white/80 shadow-sm"
        >
          <Printer className="w-4 h-4" /> CETAK NOTA
        </button>

        {isAdmin ? (
          <>
            {order.status === 'Baru' && (
              <button 
                onClick={() => onUpdateStatus(order.id, 'Proses')}
                className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100"
              >
                PROSES
              </button>
            )}
            {order.status === 'Proses' && (
              <button 
                onClick={handleFinishNotify}
                className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100"
              >
                SELESAI
              </button>
            )}
            {order.status === 'Selesai' && (
              <div className="flex items-center justify-center gap-2 text-green-600 font-black text-xs bg-green-50/50 rounded-2xl border border-green-200">
                <CheckCircle2 className="w-4 h-4" /> LUNAS
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center bg-blue-50/30 rounded-2xl border border-blue-100 px-2 py-1">
            <p className="text-[8px] font-black text-blue-400 uppercase tracking-tighter text-center">Tunjukkan Nota Ini Saat Pengambilan</p>
          </div>
        )}
      </div>
    </Card>
  );
}
