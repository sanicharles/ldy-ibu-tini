
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Truck,
  AlertCircle,
  Zap,
  Trash2,
  CalendarDays,
  Coins,
  ShieldCheck,
  ZapIcon,
  Star,
  RefreshCcw,
  SearchCheck,
  Activity
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
  showPushNotification,
  fetchOrdersFromSupabase,
  upsertOrderToSupabase,
  deleteOrderFromSupabase
} from './utils';
import { supabase } from './supabase';

const ADMIN_PIN = "2115";

// --- Shared Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }: any) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200',
    secondary: 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50',
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

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'info' | 'danger', onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-xl border flex items-center gap-3 animate-slide-in-right ${
    type === 'success' ? 'bg-green-50/90 backdrop-blur-md border-green-200 text-green-800' : 
    type === 'danger' ? 'bg-red-50/90 backdrop-blur-md border-red-200 text-red-800' :
    'bg-blue-50/90 backdrop-blur-md border-blue-200 text-blue-800'}`}>
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : type === 'danger' ? <AlertCircle className="w-5 h-5 text-red-600" /> : <BellRing className="w-5 h-5 text-blue-600" />}
    <p className="font-medium text-sm">{message}</p>
    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full"><X className="w-4 h-4" /></button>
  </div>
);

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Ya, Lanjutkan", isDanger = false }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void, confirmLabel?: string, isDanger?: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel}></div>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-zoom-in p-8 text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isDanger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3 rounded-2xl font-bold bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">Batal</button>
          <button onClick={onConfirm} className={`py-3 rounded-2xl font-bold text-white transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

const OrderModal = ({ order, onClose, isAdmin, onUpdateStatus, onDeleteOrder }: { order: Order | null, onClose: () => void, isAdmin: boolean, onUpdateStatus: (id: string, s: OrderStatus) => void, onDeleteOrder: (id: string) => void }) => {
  const [confirmData, setConfirmData] = useState<{ type: 'status' | 'delete', status?: OrderStatus, title: string, msg: string } | null>(null);

  if (!order) return null;

  const generatePDF = () => {
    const jspdfLib = (window as any).jspdf;
    if (!jspdfLib) {
        alert("Library PDF belum siap. Silakan refresh halaman.");
        return;
    }
    const { jsPDF } = jspdfLib;
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

  const handleConfirmAction = () => {
    if (!confirmData) return;
    if (confirmData.type === 'status' && confirmData.status) {
        if (confirmData.status === 'Selesai') {
            const msg = `Halo Kak ${order.customerName} 👋 Laundry Anda sudah SELESAI ✅ Total: ${formatIDR(order.totalPrice)}. Silakan ambil ke outlet Laundry Ibu Tini ya!`;
            sendWhatsAppMessage(order.customerPhone, msg);
        }
        onUpdateStatus(order.id, confirmData.status);
    } else if (confirmData.type === 'delete') {
        onDeleteOrder(order.id);
        onClose();
    }
    setConfirmData(null);
  };

  const handleContact = () => {
    const msg = `Halo Kak ${order.customerName}, ini dari Laundry Ibu Tini mengenai order ${order.notaNumber}.`;
    sendWhatsAppMessage(order.customerPhone, msg);
  };

  const statusColors: any = { 
    'Baru': 'bg-blue-600 shadow-blue-200', 
    'Proses': 'bg-orange-500 shadow-orange-200', 
    'Selesai': 'bg-green-600 shadow-green-200' 
  };

  return (
    <>
      <ConfirmationDialog 
        isOpen={!!confirmData}
        title={confirmData?.title || ''}
        message={confirmData?.msg || ''}
        confirmLabel={confirmData?.type === 'delete' ? "Hapus Sekarang" : "Ya, Lanjutkan"}
        isDanger={confirmData?.type === 'delete'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmData(null)}
      />

      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
          <div className={`h-2 ${statusColors[order.status]}`}></div>
          <div className="px-6 py-4 flex justify-between items-center border-b bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black text-white uppercase ${statusColors[order.status]}`}>{order.status}</span>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.notaNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button 
                  onClick={() => setConfirmData({
                    type: 'delete',
                    title: 'Hapus Pesanan?',
                    msg: `Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus pesanan ${order.notaNumber}?`
                  })}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-500"
                  title="Hapus Order"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <section className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                  <UserCircle className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-gray-800 truncate">{order.customerName}</h3>
                  <p className="text-sm font-bold text-blue-600 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {order.customerPhone}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 font-medium leading-relaxed">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>{order.customerAddress}</span>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                   <Shirt className="w-3 h-3" /> Layanan
                </p>
                <p className="font-bold text-gray-800 text-sm">{order.serviceType}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                   <Package className="w-3 h-3" /> Berat/Qty
                </p>
                <p className="font-bold text-gray-800 text-sm">{order.weight} {order.serviceType.includes('Cuci') ? 'Kg' : 'Unit'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                   <CalendarDays className="w-3 h-3" /> Tanggal
                </p>
                <p className="font-bold text-gray-800 text-sm">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                   <Truck className="w-3 h-3" /> Pengiriman
                </p>
                <p className="font-bold text-gray-800 text-sm">{order.deliveryMethod}</p>
              </div>
            </div>

            {order.specialRequest && (
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-orange-500" />
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Catatan Khusus</p>
                </div>
                <p className="font-bold text-orange-800 text-sm italic">"{order.specialRequest}"</p>
              </div>
            )}

            <div className="bg-gray-800 text-white rounded-2xl p-5 shadow-inner flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Bayar</p>
                <p className="text-3xl font-black tracking-tight">{formatIDR(order.totalPrice)}</p>
              </div>
              <Coins className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={generatePDF} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold transition-all hover:bg-gray-50 shadow-sm active:scale-95">
                <Printer className="w-4 h-4" /> CETAK NOTA
              </button>
              <button onClick={handleContact} className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-2xl font-bold transition-all hover:bg-green-100 shadow-sm shadow-green-100/50 active:scale-95">
                <MessageCircle className="w-4 h-4" /> WHATSAPP
              </button>
            </div>
            
            {isAdmin && (
              <div className="mt-1">
                {order.status === 'Baru' && (
                  <Button onClick={() => setConfirmData({ 
                      type: 'status',
                      status: 'Proses', 
                      title: 'Mulai Pengerjaan?', 
                      msg: `Ubah status ${order.customerName} menjadi 'Proses'?` 
                  })} className="w-full py-4 bg-orange-500 hover:bg-orange-600 font-black tracking-wide">
                    MULAI PROSES PENGERJAAN
                  </Button>
                )}
                {order.status === 'Proses' && (
                  <Button onClick={() => setConfirmData({ 
                      type: 'status',
                      status: 'Selesai', 
                      title: 'Selesaikan Order?', 
                      msg: `Kirim notifikasi ke ${order.customerName} bahwa pesanan sudah selesai?` 
                  })} variant="success" className="w-full py-4 font-black tracking-wide">
                    SELESAIKAN & KIRIM NOTIFIKASI
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'danger' } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dbStatus, setDbStatus] = useState<'offline' | 'syncing' | 'live'>('offline');

  // Auth state for Admin
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);

  // --- Initialize Supabase & Realtime ---
  const initializeSupabase = useCallback(async () => {
    setDbStatus('syncing');
    try {
      const remoteOrders = await fetchOrdersFromSupabase();
      if (remoteOrders.length > 0) {
        setOrders(remoteOrders);
        localStorage.setItem('tini_orders', JSON.stringify(remoteOrders));
      } else {
        const saved = localStorage.getItem('tini_orders');
        if (saved) setOrders(JSON.parse(saved));
      }
      setDbStatus('live');

      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setOrders(prev => [payload.new as Order, ...prev]);
              if (role === 'ADMIN') {
                playNotificationSound();
                setToast({ message: "Order Baru Masuk Real-time! 🧺", type: 'info' });
                setTimeout(() => setToast(null), 5000);
              }
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? (payload.new as Order) : o));
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => prev.filter(o => o.id !== payload.old.id));
              if (selectedOrder?.id === payload.old.id) {
                setSelectedOrder(null);
                setToast({ message: "Pesanan ini telah dihapus oleh Admin.", type: 'info' });
                setTimeout(() => setToast(null), 5000);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Supabase connect failed:", err);
      setDbStatus('offline');
      const saved = localStorage.getItem('tini_orders');
      if (saved) setOrders(JSON.parse(saved));
    }
  }, [role, selectedOrder]);

  useEffect(() => {
    initializeSupabase();
    
    const savedPhone = localStorage.getItem('tini_customer_phone');
    if (savedPhone) setCustomerPhone(savedPhone);

    const savedRole = localStorage.getItem('tini_role');
    if (savedRole) {
      setRole(savedRole as Role);
      setActiveTab(savedRole === 'ADMIN' ? 'dashboard' : 'orders'); // Default to tracking for customer
    }

    setTimeout(() => {
      setShowSplash(false);
      if (!savedRole) setShowWelcome(true);
    }, 2000);
  }, [initializeSupabase]);

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
      setActiveTab('orders'); // Langsung ke pelacakan
    }
  };

  const handleLogout = () => {
    setRole(null);
    setCustomerPhone('');
    localStorage.removeItem('tini_role');
    localStorage.removeItem('tini_customer_phone');
    setShowAdminLogin(false);
    setShowWelcome(true);
  };

  const addOrder = async (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    playNotificationSound();
    setToast({ message: "Mendaftarkan order ke Cloud...", type: 'info' });

    const success = await upsertOrderToSupabase(newOrder);
    if (success) {
      setToast({ message: `Order ${newOrder.notaNumber} Berhasil Terdaftar!`, type: 'success' });
      setActiveTab('orders'); // Setelah order berhasil, pindah ke pelacakan
    } else {
      setToast({ message: "Gagal simpan ke Cloud, tersimpan lokal.", type: 'info' });
    }
    setTimeout(() => setToast(null), 5000);
  };

  const updateOrderStatus = async (id: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    const updatedOrder = { ...order, status: newStatus };
    setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
    if (selectedOrder?.id === id) setSelectedOrder(updatedOrder);

    const success = await upsertOrderToSupabase(updatedOrder);
    if (success) {
        setToast({ message: `Status diperbarui ke ${newStatus}`, type: 'success' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    setOrders(prev => prev.filter(o => o.id !== id));
    
    const success = await deleteOrderFromSupabase(id);
    if (success) {
      setToast({ message: `Pesanan ${order.notaNumber} telah dihapus.`, type: 'danger' });
    } else {
      setToast({ message: "Gagal menghapus dari Cloud.", type: 'danger' });
      initializeSupabase();
    }
    setTimeout(() => setToast(null), 5000);
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

  const customerStats = useMemo(() => {
    if (role !== 'CUSTOMER') return null;
    const myOrders = orders.filter(o => o.customerPhone === customerPhone);
    return {
      total: myOrders.length,
      active: myOrders.filter(o => o.status !== 'Selesai').length,
      done: myOrders.filter(o => o.status === 'Selesai').length,
    };
  }, [orders, role, customerPhone]);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-blue-600 flex items-center justify-center flex-col text-white z-[1000]">
        <WashingMachine className="w-16 h-16 animate-bounce mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">LAUNDRY IBU TINI</h1>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#f0f9ff]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 min-h-screen flex flex-col">
          <div className="flex items-center gap-2 mb-20 animate-fade-in">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <WashingMachine className="w-6 h-6" />
             </div>
             <span className="text-xl font-black tracking-tighter text-gray-900">LAUNDRY IBU TINI</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center flex-1">
            <div className="space-y-10 animate-slide-in-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-full border border-blue-100 font-black text-[10px] uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> Digital Laundry Experience
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-[0.9] tracking-tighter">
                Cucian <span className="text-blue-600">Bersih</span>,<br />Hidup Tenang.
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 font-medium max-w-lg leading-relaxed">
                Manajemen laundry cerdas untuk Ibu Tini. Lacak pesanan secara real-time, cetak nota otomatis, dan layanan WhatsApp terintegrasi.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setShowWelcome(false)}
                  className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-blue-200 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                >
                  Mulai Sekarang <ArrowRight className="w-6 h-6" />
                </button>
                <a 
                  href="https://wa.me/6285695014434"
                  target="_blank"
                  className="px-10 py-5 bg-white border-2 border-gray-100 hover:border-blue-600 text-gray-700 hover:text-blue-600 rounded-[2rem] font-bold text-xl transition-all flex items-center justify-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-500" /> WhatsApp
                </a>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-10 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><ZapIcon className="w-4 h-4" /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Express</p>
                  <p className="font-bold text-gray-800">24 Jam Selesai</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600"><ShieldCheck className="w-4 h-4" /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Higienis</p>
                  <p className="font-bold text-gray-800">Anti Bakteri</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600"><Star className="w-4 h-4" /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Rating</p>
                  <p className="font-bold text-gray-800">Bintang 5</p>
                </div>
              </div>
            </div>

            <div className="relative animate-zoom-in hidden lg:block">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full animate-bounce" style={{animationDuration: '4s'}}></div>
                <div className="absolute bottom-10 left-0 w-24 h-24 bg-blue-100/40 rounded-full animate-bounce" style={{animationDuration: '6s', animationDelay: '1s'}}></div>
                
                <div className="absolute inset-0 bg-white rounded-[3rem] shadow-2xl border border-blue-50 rotate-3 overflow-hidden group hover:rotate-0 transition-transform duration-700">
                   <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-white">
                      <WashingMachine className="w-20 h-20 opacity-20 absolute top-10 right-10 animate-spin-slow" />
                      <Waves className="w-16 h-16 mb-4" />
                      <h3 className="text-3xl font-black">Laundry Pro</h3>
                      <p className="opacity-80">High performance system</p>
                   </div>
                   <div className="absolute bottom-0 left-0 w-full h-1/2 p-10 space-y-4">
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full w-2/3 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-400">SINKRONISASI CLOUD</span>
                         <span className="text-xs font-black text-blue-600">80% AKTIF</span>
                      </div>
                      <div className="pt-4 flex gap-2">
                         <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                         <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                         <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                      </div>
                   </div>
                </div>

                <div className="absolute -top-6 -left-6 w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 -rotate-12">
                   <Droplets className="w-10 h-10" />
                </div>
                <div className="absolute -bottom-6 -right-6 px-6 py-4 bg-white rounded-2xl shadow-xl border border-gray-50 flex items-center gap-3">
                   <div className="p-2 bg-green-100 rounded-xl"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
                      <p className="font-black text-gray-800">READY TO CLEAN</p>
                   </div>
                </div>
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
        <Card className="max-w-md w-full p-10 shadow-2xl">
          <button onClick={() => setRole(null)} className="mb-6 text-sm text-blue-600 flex items-center gap-1 hover:underline"><X className="w-4 h-4" /> Kembali</button>
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 mx-auto"><SearchCheck className="w-8 h-8" /></div>
          <h2 className="text-2xl font-black text-center mb-2">Order</h2>
          <p className="text-center text-gray-500 text-sm mb-8">Masukkan nomor HP WhatsApp yang digunakan saat mendaftar untuk melihat pesanan.</p>
          <form onSubmit={(e) => { e.preventDefault(); const p = (e.target as any).phone.value; setCustomerPhone(p); localStorage.setItem('tini_customer_phone', p); initializeSupabase(); }}>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor HP WhatsApp</label>
                <input name="phone" required type="tel" className="w-full px-5 py-4 border border-blue-100 rounded-2xl outline-none bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-bold" placeholder="Contoh: 081234567890" />
              </div>
              <Button type="submit" className="w-full py-4 text-lg">Lihat Pesanan Saya <ArrowRight className="w-5 h-5" /></Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark text-white' : 'bg-transparent'}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} isAdmin={role === 'ADMIN'} onUpdateStatus={updateOrderStatus} onDeleteOrder={handleDeleteOrder} />
      
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
                <SidebarLink icon={Activity} label="Status Order" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                <SidebarLink icon={PlusCircle} label="Buat Order" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
              </>
            )}
          </nav>
          <div className="mt-auto space-y-4">
            {role === 'CUSTOMER' && (
              <div className="bg-blue-600/50 p-4 rounded-2xl border border-blue-500/30">
                <p className="text-[10px] font-black text-blue-200 uppercase mb-2">Login Sebagai</p>
                <p className="font-bold truncate text-sm">{customerPhone}</p>
              </div>
            )}
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-100 font-bold hover:text-white"><LogOut className="w-5 h-5" /> Keluar</button>
          </div>
        </div>
      </div>

      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              {role === 'ADMIN' ? 'Control Panel Admin' : 'Order Tracking'}
            </h2>
            {role === 'CUSTOMER' && <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Real-time status tracking active</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${dbStatus === 'live' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <Zap className={`w-3 h-3 ${dbStatus === 'live' ? 'pulse' : ''}`} />
              <span className="hidden sm:inline">{dbStatus === 'live' ? 'Live' : 'Offline'}</span>
            </div>
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

          {activeTab === 'add' && <OrderForm role={role} onAdd={addOrder} prefilledPhone={customerPhone} />}

          {activeTab === 'orders' && (
            <div className="space-y-8">
              {role === 'CUSTOMER' && customerStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase opacity-60">Total Pesanan</p>
                    <p className="text-4xl font-black">{customerStats.total}</p>
                  </div>
                  <div className="bg-white rounded-[2rem] p-6 border shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Sedang Dicuci</p>
                    <p className="text-4xl font-black text-orange-500">{customerStats.active}</p>
                  </div>
                  <div className="bg-green-50 rounded-[2rem] p-6 border border-green-100 flex flex-col justify-between">
                    <p className="text-[10px] font-black text-green-600 uppercase">Selesai</p>
                    <p className="text-4xl font-black text-green-700">{customerStats.done}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder={role === 'ADMIN' ? "Cari Pelanggan atau No Nota..." : "Cari di daftar pesanan Anda..."} className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-blue-100 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  {role === 'CUSTOMER' && (
                    <button onClick={() => initializeSupabase()} className="p-4 bg-white border rounded-2xl hover:bg-gray-50 text-blue-600 shadow-sm transition-all active:scale-95" title="Refresh Data">
                      <RefreshCcw className={`w-5 h-5 ${dbStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map(order => (
                  <Card key={order.id} className="cursor-pointer hover:scale-[1.02] transition-all border-none bg-white shadow-sm hover:shadow-xl group" onClick={() => setSelectedOrder(order)}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase mb-1 tracking-widest">{order.notaNumber}</p>
                        <h4 className="text-xl font-bold text-gray-800">{order.customerName}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white uppercase ${order.status === 'Baru' ? 'bg-blue-600' : order.status === 'Proses' ? 'bg-orange-500' : 'bg-green-600'}`}>{order.status}</span>
                    </div>
                    
                    {/* Customer-Specific Progress Stepper */}
                    {role === 'CUSTOMER' && (
                      <div className="mb-6 pt-2">
                        <div className="flex justify-between items-center relative">
                          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-gray-100 z-0"></div>
                          <div className={`absolute top-1/2 -translate-y-1/2 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-1000`} style={{ width: order.status === 'Baru' ? '0%' : order.status === 'Proses' ? '50%' : '100%' }}></div>
                          
                          <div className={`w-6 h-6 rounded-full z-10 flex items-center justify-center border-2 bg-white ${order.status !== 'Baru' ? 'border-blue-500 text-blue-500' : 'border-blue-500 bg-blue-500 text-white'}`}>
                            {order.status === 'Baru' ? <div className="w-2 h-2 bg-white rounded-full"></div> : <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <div className={`w-6 h-6 rounded-full z-10 flex items-center justify-center border-2 bg-white ${order.status === 'Selesai' ? 'border-blue-500 text-blue-500' : order.status === 'Proses' ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-200 text-gray-300'}`}>
                            {order.status === 'Proses' ? <RefreshCcw className="w-3 h-3 animate-spin" /> : order.status === 'Selesai' ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>}
                          </div>
                          <div className={`w-6 h-6 rounded-full z-10 flex items-center justify-center border-2 bg-white ${order.status === 'Selesai' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-gray-300'}`}>
                            {order.status === 'Selesai' ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>}
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-[8px] font-black uppercase text-gray-400">
                          <span>Diterima</span>
                          <span>Diproses</span>
                          <span>Selesai</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mb-6">
                      <p className="text-sm font-bold text-gray-500 flex items-center gap-2"><Shirt className="w-4 h-4 text-blue-300" /> {order.serviceType}</p>
                      <p className="text-sm font-bold text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-300" /> {new Date(order.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <p className="text-xl font-black text-blue-700">{formatIDR(order.totalPrice)}</p>
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                         DETAIL <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Card>
                ))}
                
                {filteredOrders.length === 0 && (
                  <div className="col-span-full py-24 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-gray-200 border">
                      <FilterX className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800">Tidak ada pesanan</h3>
                    <p className="text-gray-400 font-medium max-w-xs mx-auto mt-2">
                      {role === 'CUSTOMER' ? 'Anda belum memiliki riwayat pesanan dengan nomor ini.' : 'Belum ada data pesanan yang sesuai filter.'}
                    </p>
                    {role === 'CUSTOMER' && (
                      <Button onClick={() => setActiveTab('add')} className="mt-8 px-8 py-4 bg-blue-600 rounded-2xl mx-auto">
                        BUAT PESANAN PERTAMA <PlusCircle className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="md:hidden fixed bottom-6 left-6 right-6 h-18 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border shadow-2xl z-50 flex items-center px-4 justify-around">
        <button onClick={() => setActiveTab(role === 'ADMIN' ? 'dashboard' : 'orders')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === (role === 'ADMIN' ? 'dashboard' : 'orders') ? 'text-blue-600' : 'text-gray-400'}`}>
          {role === 'ADMIN' ? <LayoutDashboard /> : <Activity />}
          <span className="text-[10px] font-black uppercase tracking-tighter">{role === 'ADMIN' ? 'Beranda' : 'Lacak'}</span>
        </button>
        {role === 'ADMIN' && (
          <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'orders' ? 'text-blue-600' : 'text-gray-400'}`}>
            <ClipboardList />
            <span className="text-[10px] font-black uppercase tracking-tighter">Daftar</span>
          </button>
        )}
        <button onClick={() => setActiveTab('add')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'add' ? 'text-blue-600' : 'text-gray-400'}`}>
          <PlusCircle />
          <span className="text-[10px] font-black uppercase tracking-tighter">Buat</span>
        </button>
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-400">
          <LogOut />
          <span className="text-[10px] font-black uppercase tracking-tighter">Logout</span>
        </button>
      </div>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${active ? 'bg-white text-blue-700 font-black shadow-xl scale-[1.02]' : 'text-blue-100 hover:bg-white/10 font-bold'}`}>
      <Icon className="w-5 h-5" /><span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = { blue: 'bg-blue-600 shadow-blue-100', green: 'bg-green-600 shadow-green-100', orange: 'bg-orange-600 shadow-orange-100', purple: 'bg-purple-600 shadow-purple-100' };
  return (
    <Card className="hover:scale-[1.03] transition-all border-none shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 ${colors[color]}`}><Icon className="w-5 h-5" /></div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
    </Card>
  );
}

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

  const total = formData.weight * (SERVICE_PRICES[formData.serviceType] || 0);

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
    onAdd(newOrder);
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
              <input required className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none focus:bg-white transition-all font-bold" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} placeholder="Contoh: Budi Santoso" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No WhatsApp</label>
              <input required className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none focus:bg-white transition-all font-bold" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} placeholder="Contoh: 081234567890" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Lengkap</label>
            <textarea required rows={2} className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none focus:bg-white transition-all font-medium" value={formData.customerAddress} onChange={(e) => setFormData({...formData, customerAddress: e.target.value})} placeholder="Masukkan alamat untuk antar/jemput" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Layanan</label>
              <select className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none focus:bg-white transition-all font-bold" value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value as ServiceType})}>
                {Object.keys(SERVICE_PRICES).map(s => <option key={s} value={s}>{s} ({formatIDR(SERVICE_PRICES[s as ServiceType])})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Berat (Kg) / Unit</label>
              <input required type="number" min="0" step="0.1" className="w-full px-5 py-4 border border-blue-50 bg-gray-50/50 rounded-2xl outline-none font-black text-xl focus:bg-white transition-all" value={formData.weight} onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <div className="p-6 bg-blue-600 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between text-white gap-6 shadow-xl shadow-blue-100">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Estimasi Tagihan</p><p className="text-4xl font-black">{formatIDR(total)}</p></div>
            <Button type="submit" disabled={total <= 0} className="bg-white text-blue-600 hover:bg-gray-50 w-full md:w-auto px-10 py-4 text-lg">DAFTARKAN SEKARANG</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
