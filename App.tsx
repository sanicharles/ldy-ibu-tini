
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
  Droplets,
  Calendar,
  FilterX,
  Tag,
  Download,
  MapPin,
  Info,
  Truck
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

// Admin PIN as requested
const ADMIN_PIN = "2115";

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

const Card = ({ children, className = "", onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    className={`bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 ${className}`}
    onClick={onClick}
  >
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

// --- Modal Component ---

const OrderModal = ({ order, onClose, isAdmin, onUpdateStatus }: { order: Order | null, onClose: () => void, isAdmin: boolean, onUpdateStatus: (id: string, s: OrderStatus) => void }) => {
  if (!order) return null;

  const generatePDF = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 160] });
    const margin = 5;
    const pageWidth = 80;
    let y = 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAUNDRY IBU TINI", pageWidth / 2, y, { align: "center" });
    y += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
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
    y += 6;
    drawLine("Layanan:", order.serviceType);
    drawLine("Berat/Qty:", `${order.weight} unit`);
    drawLine("TOTAL:", formatIDR(order.totalPrice));
    y += 10;
    doc.text("Terima kasih!", pageWidth / 2, y, { align: "center" });
    doc.save(`Nota_${order.notaNumber}.pdf`);
  };

  const handleFinish = () => {
    const msg = `Halo Kak ${order.customerName} 👋 Laundry Anda sudah SELESAI ✅ Total: ${formatIDR(order.totalPrice)}. Silakan ambil ke outlet Laundry Ibu Tini ya!`;
    sendWhatsAppMessage(order.customerPhone, msg);
    onUpdateStatus(order.id, 'Selesai');
  };

  const handleContact = () => {
    const msg = `Halo Kak ${order.customerName}, ini dari Laundry Ibu Tini mengenai order ${order.notaNumber}.`;
    sendWhatsAppMessage(order.customerPhone, msg);
  };

  const statusColors: any = { 'Baru': 'bg-blue-600', 'Proses': 'bg-orange-500', 'Selesai': 'bg-green-600' };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-zoom-in">
        <div className={`h-2 ${statusColors[order.status]}`}></div>
        <div className="p-6 md:p-8 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] mb-1">{order.notaNumber}</p>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{order.customerName}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Shirt className="w-3 h-3" /> Layanan</p>
              <p className="font-bold text-gray-800">{order.serviceType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Package className="w-3 h-3" /> Berat/Qty</p>
              <p className="font-bold text-gray-800">{order.weight} Unit/Kg</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Tgl Masuk</p>
              <p className="font-bold text-gray-800">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Status</p>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white uppercase ${statusColors[order.status]}`}>{order.status}</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><Phone className="w-4 h-4 text-blue-600" /></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kontak</p>
                <p className="font-bold text-gray-800">{order.customerPhone}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-orange-50 rounded-xl"><MapPin className="w-4 h-4 text-orange-600" /></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat</p>
                <p className="font-medium text-gray-600 text-sm leading-relaxed">{order.customerAddress}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-green-50 rounded-xl"><Truck className="w-4 h-4 text-green-600" /></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pengiriman</p>
                <p className="font-bold text-gray-800">{order.deliveryMethod}</p>
              </div>
            </div>
            {order.specialRequest && (
              <div className="flex gap-3">
                <div className="p-2 bg-purple-50 rounded-xl"><Info className="w-4 h-4 text-purple-600" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catatan Khusus</p>
                  <p className="font-medium text-gray-600 text-sm italic">"{order.specialRequest}"</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between mb-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pembayaran</p>
            <p className="text-2xl font-black text-blue-700">{formatIDR(order.totalPrice)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={generatePDF} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold transition-all hover:bg-gray-50">
              <Printer className="w-4 h-4" /> CETAK NOTA
            </button>
            <button onClick={handleContact} className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-2xl font-bold transition-all hover:bg-green-100">
              <MessageCircle className="w-4 h-4" /> WHATSAPP
            </button>
            {isAdmin && (
              <div className="col-span-2 mt-2">
                {order.status === 'Baru' && (
                  <Button onClick={() => onUpdateStatus(order.id, 'Proses')} className="w-full py-4 bg-orange-500 hover:bg-orange-600">MULAI PROSES PENGERJAAN</Button>
                )}
                {order.status === 'Proses' && (
                  <Button onClick={handleFinish} variant="success" className="w-full py-4">SELESAIKAN & KIRIM NOTIFIKASI</Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [statusFilter, setStatusFilter] = useState<'Semua' | OrderStatus>('Semua');
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'Semua'>('Semua');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Auth state for Admin
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);

  // Persistence and Initial Loading
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
      if (!savedRole) {
        setShowWelcome(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem('tini_orders', JSON.stringify(orders));
  }, [orders]);

  /**
   * REAL-TIME SYNC & NOTIFICATION LOGIC
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tini_orders' && e.newValue) {
        const updatedOrders: Order[] = JSON.parse(e.newValue);
        if (updatedOrders.length > orders.length) {
          const latestOrder = updatedOrders[0];
          if (role === 'ADMIN') {
            playNotificationSound();
            showPushNotification("Order Baru Masuk! 🧺", `${latestOrder.customerName} memesan layanan ${latestOrder.serviceType}.`);
            setToast({ message: `Order baru dari ${latestOrder.customerName} diterima secara real-time!`, type: 'info' });
            setTimeout(() => setToast(null), 6000);
          }
        }
        setOrders(updatedOrders);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [orders, role]);

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
      setToast({ message: `Order ${newOrder.notaNumber} berhasil didaftarkan!`, type: 'success' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const updateOrderStatus = (id: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
    playNotificationSound();
    let body = `Status laundry Anda sekarang: ${newStatus}`;
    if (newStatus === 'Proses') body = `Laundry ${order.customerName} sedang dalam PROSES. 🧺`;
    else if (newStatus === 'Selesai') body = `Laundry ${order.customerName} sudah SELESAI ✅ Total: ${formatIDR(order.totalPrice)}`;
    showPushNotification(`Update Order: ${order.notaNumber}`, body);
    setToast({ message: `Status order ${order.notaNumber} diubah ke ${newStatus}`, type: 'success' });
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
    if (role === 'CUSTOMER' && customerPhone) result = result.filter(o => o.customerPhone === customerPhone);
    if (statusFilter !== 'Semua') result = result.filter(o => o.status === statusFilter);
    if (serviceFilter !== 'Semua') result = result.filter(o => o.serviceType === serviceFilter);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.createdAt) <= end);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => o.customerName.toLowerCase().includes(q) || o.notaNumber.toLowerCase().includes(q));
    }
    return result;
  }, [orders, role, customerPhone, searchQuery, statusFilter, serviceFilter, startDate, endDate]);

  const filterCounts = useMemo(() => {
    let baseOrders = role === 'CUSTOMER' ? orders.filter(o => o.customerPhone === customerPhone) : orders;
    return {
      'Semua': baseOrders.length,
      'Baru': baseOrders.filter(o => o.status === 'Baru').length,
      'Proses': baseOrders.filter(o => o.status === 'Proses').length,
      'Selesai': baseOrders.filter(o => o.status === 'Selesai').length,
    };
  }, [orders, role, customerPhone]);

  const exportToCSV = () => {
    const dataToExport = filteredOrders;
    if (dataToExport.length === 0) {
      setToast({ message: "Tidak ada data untuk diekspor", type: 'info' });
      return;
    }
    const headers = ["No Nota", "Tanggal", "Pelanggan", "Layanan", "Total", "Status"];
    const rows = dataToExport.map(o => [o.notaNumber, new Date(o.createdAt).toLocaleDateString('id-ID'), o.customerName, o.serviceType, o.totalPrice, o.status]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laundry_Data.csv`);
    link.click();
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-blue-600 flex items-center justify-center flex-col text-white z-[1000]">
        <WashingMachine className="w-16 h-16 animate-bounce mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">LAUNDRY IBU TINI</h1>
      </div>
    );
  }

  // --- Premium Welcome View ---
  if (showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-white">
        {/* Decorative background shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-100/30 rounded-full blur-[100px]"></div>

        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10 p-6">
          <div className="space-y-8 text-center md:text-left animate-slide-in-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-full border border-blue-100 font-bold text-xs uppercase tracking-widest shadow-sm">
              <Sparkles className="w-4 h-4" /> Higienis & Terpercaya
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]">
              Solusi <span className="text-blue-600">Bersih</span> <br /> Tanpa Ribet.
            </h1>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-lg mx-auto md:mx-0 font-medium">
              Biarkan Ibu Tini yang menangani tumpukan cucian Anda. Pakaian kembali bersih, wangi, dan rapi seperti baru.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <button 
                onClick={() => setShowWelcome(false)}
                className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-blue-200 active:scale-95"
              >
                Mulai Sekarang <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="https://wa.me/6285695014434" 
                target="_blank"
                className="flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-sm"
              >
                <MessageCircle className="w-6 h-6 text-green-500" /> WhatsApp
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-100 max-w-md mx-auto md:mx-0">
              <div>
                <p className="text-2xl font-black text-blue-600 tracking-tighter">24H</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Express Service</p>
              </div>
              <div className="border-x border-gray-100 px-6">
                <p className="text-2xl font-black text-blue-600 tracking-tighter">Free</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pick & Up*</p>
              </div>
              <div className="pl-2">
                <p className="text-2xl font-black text-blue-600 tracking-tighter">100%</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Puas & Wangi</p>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in flex justify-center items-center">
            <div className="relative w-72 h-72 md:w-[450px] md:h-[450px]">
              <div className="absolute inset-0 border-[1px] border-blue-200/50 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-8 border-[1px] border-dashed border-blue-300/30 rounded-full animate-spin-reverse"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 md:w-80 md:h-80 bg-white rounded-[40px] shadow-2xl flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-500 group overflow-hidden border border-blue-50">
                  <WashingMachine className="w-24 h-24 md:w-40 md:h-40 text-blue-600 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute bottom-0 left-0 w-full h-1/4 bg-blue-600/5 backdrop-blur-md flex items-center justify-center">
                    <Waves className="w-12 h-12 text-blue-200" />
                  </div>
                </div>
              </div>

              <div className="absolute top-10 right-0 p-4 bg-white rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border border-gray-50" style={{animationDuration: '3s'}}>
                <div className="p-2 bg-green-100 rounded-xl"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                <p className="text-xs font-black text-gray-700 leading-none">Pakaian <br/> Higienis</p>
              </div>
              <div className="absolute bottom-20 left-[-20px] p-4 bg-white rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border border-gray-50" style={{animationDuration: '4.5s', animationDelay: '0.8s'}}>
                <div className="p-2 bg-orange-100 rounded-xl"><Clock className="w-5 h-5 text-orange-600" /></div>
                <p className="text-xs font-black text-gray-700 leading-none">Express <br/> Tercepat</p>
              </div>
              <div className="absolute bottom-4 right-10 p-4 bg-white rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border border-gray-50" style={{animationDuration: '5s', animationDelay: '1.2s'}}>
                <div className="p-2 bg-blue-100 rounded-xl"><Droplets className="w-5 h-5 text-blue-600" /></div>
                <p className="text-xs font-black text-gray-700 leading-none">Aroma <br/> Tahan Lama</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showAdminLogin && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-10 animate-fade-in">
          <button onClick={() => setShowAdminLogin(false)} className="mb-6 text-sm text-blue-600 flex items-center gap-1 hover:underline"><X className="w-4 h-4" /> Batal</button>
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600"><Lock className="w-10 h-10" /></div>
          <h2 className="text-2xl font-bold mb-8">Login Portal Admin</h2>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <input required autoFocus type="password" maxLength={4} className={`w-full px-4 py-5 border rounded-2xl text-center text-4xl tracking-[1rem] font-black outline-none ${adminPinError ? 'border-red-500 bg-red-50' : 'border-blue-100'}`} placeholder="••••" value={adminPinInput} onChange={(e) => { setAdminPinInput(e.target.value.replace(/\D/g, '')); setAdminPinError(false); }} />
            <Button type="submit" className="w-full py-4 text-lg">Buka Portal <Unlock className="w-5 h-5" /></Button>
          </form>
        </Card>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center py-10">
          <WashingMachine className="w-12 h-12 text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-10">Pilih Akses Masuk</h2>
          <div className="space-y-4">
            <button onClick={() => handleRoleSelect('ADMIN')} className="w-full flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-xl shadow-blue-100">
              <div className="flex items-center gap-4"><Settings className="w-6 h-6" /><p className="font-bold text-lg">Portal Admin</p></div>
              <ChevronRight />
            </button>
            <button onClick={() => handleRoleSelect('CUSTOMER')} className="w-full flex items-center justify-between p-5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl transition-all hover:bg-blue-50">
              <div className="flex items-center gap-4"><UserCircle className="w-6 h-6" /><p className="font-bold text-lg">Portal Pelanggan</p></div>
              <ChevronRight />
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (role === 'CUSTOMER' && !customerPhone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10">
          <button onClick={() => setRole(null)} className="mb-6 text-sm text-blue-600 flex items-center gap-1 hover:underline"><X className="w-4 h-4" /> Batal</button>
          <h2 className="text-2xl font-bold mb-8">Lacak Pesanan</h2>
          <form onSubmit={(e) => { e.preventDefault(); const p = (e.target as any).phone.value; setCustomerPhone(p); localStorage.setItem('tini_customer_phone', p); }}>
            <div className="space-y-6">
              <input name="phone" required type="tel" className="w-full px-5 py-4 border border-blue-100 rounded-2xl outline-none" placeholder="Nomor HP WhatsApp" />
              <Button type="submit" className="w-full py-4">Lanjutkan <ArrowRight className="w-5 h-5" /></Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark text-white' : 'bg-transparent'}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} isAdmin={role === 'ADMIN'} onUpdateStatus={updateOrderStatus} />
      
      {/* Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-1 flex-col bg-blue-700 p-8 text-white">
          <div className="flex items-center gap-3 mb-12"><WashingMachine className="w-8 h-8" /><span className="font-black text-xl tracking-tighter">IBU TINI</span></div>
          <nav className="flex-1 space-y-4">
            {role === 'ADMIN' ? (
              <>
                <SidebarLink icon={LayoutDashboard} label="Beranda" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <SidebarLink icon={ClipboardList} label="Daftar Order" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                <SidebarLink icon={PlusCircle} label="Tambah Order" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
              </>
            ) : (
              <>
                <SidebarLink icon={PlusCircle} label="Buat Order" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
                <SidebarLink icon={History} label="Riwayat Saya" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
              </>
            )}
          </nav>
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-100 font-bold hover:text-white mt-auto"><LogOut className="w-5 h-5" /> Keluar</button>
        </div>
      </div>

      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">{role === 'ADMIN' ? 'Control Panel Admin' : 'Laundry Anda'}</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-white shadow-sm border rounded-xl">{isDarkMode ? <Sun className="text-orange-500" /> : <Moon className="text-blue-600" />}</button>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">{role === 'ADMIN' ? 'A' : 'P'}</div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-32">
          {activeTab === 'dashboard' && role === 'ADMIN' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Omzet Bulan Ini" value={formatIDR(stats.omzet)} icon={TrendingUp} color="blue" />
                <StatCard label="Order Selesai" value={stats.completed} icon={CheckCircle2} color="green" />
                <StatCard label="Dalam Proses" value={stats.process} icon={Clock} color="orange" />
                <StatCard label="Total Order" value={orders.length} icon={Package} color="purple" />
              </div>
              <Card className="h-[400px]">
                <h3 className="text-xl font-bold mb-6">Laporan Pendapatan Mingguan</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={stats.chartData}>
                    <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${v/1000}k`} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {activeTab === 'add' && <OrderForm role={role} prefilledPhone={customerPhone} onAdd={addOrder} />}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row gap-4 justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder="Cari Pelanggan atau No Nota..." className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  {role === 'ADMIN' && <button onClick={exportToCSV} className="p-4 bg-white border border-gray-100 rounded-2xl text-blue-600 hover:bg-blue-50"><Download /></button>}
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 overflow-x-auto whitespace-nowrap">
                  <Calendar className="w-5 h-5 text-blue-600 ml-2" />
                  <input type="date" className="bg-transparent text-xs font-bold outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <span className="text-gray-400">s/d</span>
                  <input type="date" className="bg-transparent text-xs font-bold outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {['Semua', 'Baru', 'Proses', 'Selesai'].map((s: any) => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${statusFilter === s ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white text-gray-500'}`}>
                    {s} ({filterCounts[s as keyof typeof filterCounts]})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map(order => (
                  <Card key={order.id} className="cursor-pointer hover:scale-[1.02] transition-all border-none bg-white shadow-sm hover:shadow-xl" onClick={() => setSelectedOrder(order)}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase mb-1">{order.notaNumber}</p>
                        <h4 className="text-xl font-bold text-gray-800">{order.customerName}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white uppercase ${order.status === 'Baru' ? 'bg-blue-600' : order.status === 'Proses' ? 'bg-orange-500' : 'bg-green-600'}`}>{order.status}</span>
                    </div>
                    <div className="space-y-2 mb-6">
                      <p className="text-sm font-bold text-gray-500 flex items-center gap-2"><Shirt className="w-4 h-4" /> {order.serviceType}</p>
                      <p className="text-sm font-bold text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <p className="text-xl font-black text-blue-700">{formatIDR(order.totalPrice)}</p>
                      <ChevronRight className="text-gray-300" />
                    </div>
                  </Card>
                ))}
                {filteredOrders.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <FilterX className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Tidak ada pesanan ditemukan</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/80 backdrop-blur-2xl rounded-3xl border flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-2xl ${activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><LayoutDashboard /></button>
        <button onClick={() => setActiveTab('orders')} className={`p-3 rounded-2xl ${activeTab === 'orders' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><ClipboardList /></button>
        <button onClick={() => setActiveTab('add')} className={`p-3 rounded-2xl ${activeTab === 'add' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><PlusCircle /></button>
        <button onClick={handleLogout} className="p-3 text-red-400"><LogOut /></button>
      </div>
    </div>
  );
}

// --- Sidebar Helper ---
function SidebarLink({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${active ? 'bg-white text-blue-700 font-black shadow-xl' : 'text-blue-100 hover:bg-white/10 font-bold'}`}>
      <Icon className="w-5 h-5" /><span>{label}</span>
    </button>
  );
}

// --- Stat Card Helper ---
function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = { blue: 'bg-blue-600', green: 'bg-green-600', orange: 'bg-orange-600', purple: 'bg-purple-600' };
  return (
    <Card className="hover:scale-[1.03] transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 ${colors[color]}`}><Icon className="w-5 h-5" /></div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
    </Card>
  );
}

// --- Order Form Helper ---
function OrderForm({ role, prefilledPhone, onAdd }: any) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: prefilledPhone || '',
    customerAddress: '',
    weight: 0,
    serviceType: 'Cuci Setrika' as ServiceType,
    specialRequest: '',
    deliveryMethod: 'Ambil Sendiri' as any
  });

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
    setFormData({ customerName: '', customerPhone: prefilledPhone || '', customerAddress: '', weight: 0, serviceType: 'Cuci Setrika', specialRequest: '', deliveryMethod: 'Ambil Sendiri' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 md:p-10 shadow-2xl border-none">
        <h3 className="text-2xl font-black mb-10">Pendaftaran Pesanan</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
              <input required className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No WhatsApp</label>
              <input required className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Lengkap</label>
            <textarea required rows={2} className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none" value={formData.customerAddress} onChange={(e) => setFormData({...formData, customerAddress: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Layanan</label>
              <select className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none font-bold" value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value as ServiceType})}>
                {Object.keys(SERVICE_PRICES).map(s => <option key={s} value={s}>{s} ({formatIDR(SERVICE_PRICES[s as ServiceType])})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Berat / Unit</label>
              <input required type="number" min="0" step="0.1" className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none font-black text-xl" value={formData.weight} onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metode Pengiriman</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setFormData({...formData, deliveryMethod: 'Ambil Sendiri'})} className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${formData.deliveryMethod === 'Ambil Sendiri' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}>Ambil Sendiri</button>
              <button type="button" onClick={() => setFormData({...formData, deliveryMethod: 'Antar/Jemput'})} className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${formData.deliveryMethod === 'Antar/Jemput' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}>Antar/Jemput</button>
            </div>
          </div>
          <div className="p-6 bg-blue-600 rounded-3xl flex flex-col md:flex-row items-center justify-between text-white gap-6">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Total Tagihan</p><p className="text-4xl font-black">{formatIDR(total)}</p></div>
            <Button type="submit" disabled={total <= 0} className="bg-white text-blue-600 hover:bg-gray-50 w-full md:w-auto px-10 py-4">DAFTARKAN SEKARANG</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
