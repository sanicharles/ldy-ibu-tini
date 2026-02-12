
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
  Activity,
  ArrowUpRight
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
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300',
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
      className={`px-4 py-2 rounded-2xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    className={`bg-white/70 backdrop-blur-md rounded-[2rem] shadow-sm border border-white/50 p-5 md:p-8 transition-all hover:shadow-md ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'info' | 'danger', onClose: () => void }) => (
  <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 z-[100] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-in-right bg-white/90 backdrop-blur-xl ${
    type === 'success' ? 'border-green-100 text-green-800' : 
    type === 'danger' ? 'border-red-100 text-red-800' :
    'border-blue-100 text-blue-800'}`}>
    {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : type === 'danger' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <BellRing className="w-5 h-5 text-blue-500" />}
    <p className="font-bold text-sm flex-1">{message}</p>
    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
  </div>
);

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Ya, Lanjutkan", isDanger = false }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void, confirmLabel?: string, isDanger?: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md animate-fade-in" onClick={onCancel}></div>
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden animate-zoom-in p-8 text-center">
        <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 ${isDanger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed px-4">{message}</p>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onCancel} className="py-4 rounded-2xl font-bold bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all active:scale-95">Batal</button>
          <button onClick={onConfirm} className={`py-4 rounded-2xl font-bold text-white transition-all active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100'}`}>{confirmLabel}</button>
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

      <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center md:p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="bg-white rounded-t-[2.5rem] md:rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-hidden animate-slide-up md:animate-zoom-in max-h-[95vh] flex flex-col">
          <div className={`h-2 ${statusColors[order.status]}`}></div>
          <div className="px-6 py-5 flex justify-between items-center border-b bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black text-white uppercase tracking-wider ${statusColors[order.status]}`}>{order.status}</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.notaNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button 
                  onClick={() => setConfirmData({
                    type: 'delete',
                    title: 'Hapus Pesanan?',
                    msg: `Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus pesanan ${order.notaNumber}?`
                  })}
                  className="p-3 hover:bg-red-50 rounded-2xl transition-all text-slate-400 hover:text-red-500"
                  title="Hapus Order"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            <section className="bg-blue-50/80 rounded-[2rem] p-6 border border-blue-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><UserCircle className="w-20 h-20" /></div>
              <div className="flex items-start gap-5 relative z-10">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                  <UserCircle className="w-10 h-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-black text-slate-900 truncate tracking-tight">{order.customerName}</h3>
                  <a href={`tel:${order.customerPhone}`} className="text-sm font-bold text-blue-600 flex items-center gap-2 mt-1 hover:underline">
                    <Phone className="w-4 h-4" /> {order.customerPhone}
                  </a>
                </div>
              </div>
              <div className="mt-6 flex items-start gap-3 text-sm text-slate-600 font-semibold leading-relaxed">
                <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>{order.customerAddress}</span>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <DetailBox icon={Shirt} label="Layanan" value={order.serviceType} />
              <DetailBox icon={Package} label="Berat/Qty" value={`${order.weight} ${order.serviceType.includes('Cuci') ? 'Kg' : 'Unit'}`} />
              <DetailBox icon={CalendarDays} label="Tanggal" value={new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} />
              <DetailBox icon={Truck} label="Pengiriman" value={order.deliveryMethod} />
            </div>

            {order.specialRequest && (
              <div className="bg-orange-50/50 rounded-[1.5rem] p-5 border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-orange-500" />
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Catatan Khusus</p>
                </div>
                <p className="font-bold text-orange-900 text-sm italic leading-relaxed">"{order.specialRequest}"</p>
              </div>
            )}

            <div className="bg-slate-900 text-white rounded-[2rem] p-7 shadow-xl flex items-center justify-between group overflow-hidden relative">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <Coins className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Bayar</p>
                <p className="text-4xl font-black tracking-tighter">{formatIDR(order.totalPrice)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50 border-t flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={generatePDF} className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95 shadow-sm">
                <Printer className="w-5 h-5" /> NOTA
              </button>
              <button onClick={handleContact} className="flex items-center justify-center gap-3 bg-green-50 text-green-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-green-100 active:scale-95 shadow-sm border border-green-100">
                <MessageCircle className="w-5 h-5" /> WA
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
                  })} className="w-full py-5 text-sm font-black tracking-widest uppercase bg-orange-500 hover:bg-orange-600">
                    MULAI PROSES PENGERJAAN
                  </Button>
                )}
                {order.status === 'Proses' && (
                  <Button onClick={() => setConfirmData({ 
                      type: 'status',
                      status: 'Selesai', 
                      title: 'Selesaikan Order?', 
                      msg: `Kirim notifikasi ke ${order.customerName} bahwa pesanan sudah selesai?` 
                  })} variant="success" className="w-full py-5 text-sm font-black tracking-widest uppercase">
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

function DetailBox({ icon: Icon, label, value }: any) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
         <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className="font-bold text-slate-800 text-sm truncate">{value}</p>
    </div>
  );
}

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
      setActiveTab(savedRole === 'ADMIN' ? 'dashboard' : 'orders');
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
      setActiveTab('orders');
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
    setToast({ message: "Mengirim data ke server...", type: 'info' });

    const success = await upsertOrderToSupabase(newOrder);
    if (success) {
      setToast({ message: `Pesanan ${newOrder.notaNumber} Berhasil Dibuat!`, type: 'success' });
      setActiveTab('orders');
    } else {
      setToast({ message: "Gagal simpan online, pesanan tersimpan lokal.", type: 'info' });
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
        setToast({ message: `Status diperbarui: ${newStatus}`, type: 'success' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    setOrders(prev => prev.filter(o => o.id !== id));
    
    const success = await deleteOrderFromSupabase(id);
    if (success) {
      setToast({ message: `Pesanan ${order.notaNumber} dihapus.`, type: 'danger' });
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
      <div className="fixed inset-0 bg-blue-600 flex items-center justify-center flex-col text-white z-[1000] p-6 text-center">
        <WashingMachine className="w-20 h-20 animate-bounce mb-6" />
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">LAUNDRY IBU TINI</h1>
        <p className="text-blue-100 font-bold opacity-80 uppercase tracking-widest text-[10px]">Professional Management System</p>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col">
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 min-h-screen flex flex-col w-full">
          <div className="flex items-center gap-2 mb-12 md:mb-24 animate-fade-in">
             <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                <WashingMachine className="w-6 h-6" />
             </div>
             <span className="text-xl font-black tracking-tighter text-slate-900">LAUNDRY IBU TINI</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center flex-1">
            <div className="space-y-10 animate-slide-in-left">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 text-blue-600 rounded-full border border-blue-100 font-black text-[10px] uppercase tracking-widest">
                <Sparkles className="w-4 h-4" /> Solusi Cuci Pintar & Modern
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                Cucian <span className="text-blue-600">Bersih</span>,<br />Hidup Tenang.
              </h1>
              
              <p className="text-lg md:text-2xl text-slate-500 font-semibold max-w-xl leading-relaxed">
                Platform laundry digital paling simpel untuk Ibu Tini. Pantau status cucian kapan saja dan di mana saja secara real-time.
              </p>

              <div className="pt-4">
                <button 
                  onClick={() => setShowWelcome(false)}
                  className="w-full sm:w-auto px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2.5rem] font-black text-2xl transition-all shadow-2xl shadow-blue-200 hover:-translate-y-2 active:scale-95 flex items-center justify-center gap-4"
                >
                  Mulai Sekarang <ArrowRight className="w-8 h-8" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-100">
                <WelcomeMetric icon={ZapIcon} label="Express" value="24 Jam" color="blue" />
                <WelcomeMetric icon={ShieldCheck} label="Higienis" value="Anti Bakteri" color="green" />
                <WelcomeMetric icon={Star} label="Kualitas" value="Bintang 5" color="purple" />
              </div>
            </div>

            <div className="relative hidden lg:block animate-scale-in">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/30 rounded-full animate-pulse blur-2xl"></div>
                <div className="absolute inset-0 bg-white rounded-[4rem] shadow-2xl border border-blue-50 rotate-6 overflow-hidden transition-transform duration-700 hover:rotate-0">
                   <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white">
                      <WashingMachine className="w-24 h-24 opacity-20 absolute top-10 right-10 animate-spin-slow" />
                      <Waves className="w-16 h-16 mb-6" />
                      <h3 className="text-3xl font-black">Laundry OS</h3>
                      <p className="opacity-80 font-bold uppercase tracking-widest text-xs mt-2">Enterprise Ready</p>
                   </div>
                   <div className="absolute bottom-0 left-0 w-full h-1/2 p-12 space-y-6">
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full w-4/5 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SINKRONISASI AKTIF</span>
                         <span className="text-xs font-black text-blue-600">CLOUD SECURE</span>
                      </div>
                      <div className="pt-4 flex gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100"></div>
                         <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100"></div>
                         <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100"></div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function WelcomeMetric({ icon: Icon, label, value, color }: any) {
    const colors: any = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', purple: 'bg-purple-50 text-purple-600' };
    return (
      <div className="space-y-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}><Icon className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{label}</p>
          <p className="font-black text-slate-800 text-sm">{value}</p>
        </div>
      </div>
    );
  }

  if (showAdminLogin && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full text-center p-10 md:p-12 animate-scale-in bg-white shadow-2xl">
          <button onClick={() => setShowAdminLogin(false)} className="mb-8 text-sm text-blue-600 font-bold flex items-center gap-2 hover:underline"><X className="w-4 h-4" /> Kembali</button>
          <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-inner"><Lock className="w-10 h-10" /></div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Portal Admin</h2>
          <p className="text-slate-400 font-semibold mb-10">Masukkan PIN 4 digit untuk akses kontrol.</p>
          <form onSubmit={handleAdminLogin} className="space-y-8">
            <input required autoFocus type="password" maxLength={4} className={`w-full px-4 py-6 border rounded-[2rem] text-center text-5xl tracking-[1.5rem] font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all ${adminPinError ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50'}`} placeholder="••••" value={adminPinInput} onChange={(e) => { setAdminPinInput(e.target.value.replace(/\D/g, '')); setAdminPinError(false); }} />
            <Button type="submit" className="w-full py-6 text-xl shadow-blue-100">Buka Akses <Unlock className="w-6 h-6" /></Button>
          </form>
        </Card>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full text-center py-12 px-8 bg-white shadow-2xl">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-blue-100"><WashingMachine className="w-10 h-10" /></div>
          <h2 className="text-3xl font-black text-slate-900 mb-12 tracking-tight">Pilih Akses Masuk</h2>
          <div className="space-y-5">
            <RoleButton onClick={() => handleRoleSelect('ADMIN')} icon={Settings} label="Dashboard Admin" desc="Kontrol & Manajemen Bisnis" color="blue" />
            <RoleButton onClick={() => handleRoleSelect('CUSTOMER')} icon={UserCircle} label="Dashboard Pelanggan" desc="Lacak Cucian & Riwayat" color="white" />
          </div>
        </Card>
      </div>
    );
  }

  function RoleButton({ onClick, icon: Icon, label, desc, color }: any) {
    return (
      <button onClick={onClick} className={`w-full group flex items-center justify-between p-6 rounded-[2rem] transition-all duration-300 hover:scale-[1.02] active:scale-95 ${color === 'blue' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white border-2 border-slate-100 text-slate-900 hover:border-blue-600'}`}>
        <div className="flex items-center gap-5 text-left">
           <div className={`p-3 rounded-2xl ${color === 'blue' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}><Icon className="w-7 h-7" /></div>
           <div>
              <p className="font-black text-lg leading-tight">{label}</p>
              <p className={`text-xs font-bold opacity-60 mt-0.5`}>{desc}</p>
           </div>
        </div>
        <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${color === 'blue' ? 'text-white/50' : 'text-slate-300'}`} />
      </button>
    );
  }

  if (role === 'CUSTOMER' && !customerPhone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full p-10 md:p-12 shadow-2xl bg-white">
          <button onClick={() => setRole(null)} className="mb-8 text-sm text-blue-600 font-black flex items-center gap-2 hover:underline"><X className="w-4 h-4" /> Kembali</button>
          <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mb-8 mx-auto shadow-inner"><SearchCheck className="w-10 h-10" /></div>
          <h2 className="text-3xl font-black text-center mb-2 text-slate-900">Order Tracking</h2>
          <p className="text-center text-slate-400 font-semibold text-sm mb-10 px-4">Lacak pesanan Anda menggunakan nomor WhatsApp yang terdaftar.</p>
          <form onSubmit={(e) => { e.preventDefault(); const p = (e.target as any).phone.value; setCustomerPhone(p); localStorage.setItem('tini_customer_phone', p); initializeSupabase(); }}>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nomor HP WhatsApp</label>
                <input name="phone" required type="tel" className="w-full px-6 py-5 border border-slate-100 bg-slate-50/50 rounded-[1.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-black text-xl text-slate-800" placeholder="08XXXXXXXXXX" />
              </div>
              <Button type="submit" className="w-full py-6 text-xl shadow-blue-100">Tampilkan Dashboard <ArrowRight className="w-6 h-6" /></Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 md:pb-0 ${isDarkMode ? 'dark text-white' : 'bg-transparent'}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} isAdmin={role === 'ADMIN'} onUpdateStatus={updateOrderStatus} onDeleteOrder={handleDeleteOrder} />
      
      {/* Sidebar Desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col">
        <div className="flex flex-1 flex-col bg-slate-900 p-10 text-white m-4 rounded-[3rem] shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex items-center gap-4 mb-16 relative z-10">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <WashingMachine className="w-7 h-7" />
             </div>
             <span className="font-black text-2xl tracking-tighter">IBU TINI</span>
          </div>
          
          <nav className="flex-1 space-y-5 relative z-10">
            {role === 'ADMIN' ? (
              <>
                <SidebarLink icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <SidebarLink icon={ClipboardList} label="Data Pesanan" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                <SidebarLink icon={PlusCircle} label="Tambah Order" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
              </>
            ) : (
              <>
                <SidebarLink icon={Activity} label="Lacak Status" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                <SidebarLink icon={PlusCircle} label="Buat Order" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
              </>
            )}
          </nav>
          
          <div className="mt-auto pt-10 space-y-6 relative z-10">
            {role === 'CUSTOMER' && (
              <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/5 backdrop-blur-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pelanggan</p>
                <p className="font-black truncate text-sm text-blue-400">{customerPhone}</p>
              </div>
            )}
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-red-400 hover:bg-red-400/10"><LogOut className="w-5 h-5" /> Keluar Aplikasi</button>
          </div>
        </div>
      </div>

      <div className="md:pl-72 flex flex-col flex-1">
        {/* Header Responsif */}
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-slate-100 p-6 md:p-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">
              {role === 'ADMIN' ? 'Control Panel' : 'Dashboard Saya'}
            </h2>
            {role === 'CUSTOMER' && <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-2 flex items-center gap-2"><ZapIcon className="w-3.5 h-3.5 pulse" /> Koneksi Real-time Aktif</p>}
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <div className={`hidden sm:flex items-center gap-2.5 px-4 py-2 bg-white border rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${dbStatus === 'live' ? 'border-green-100 text-green-600' : 'border-red-100 text-red-600'}`}>
              <Zap className={`w-3.5 h-3.5 ${dbStatus === 'live' ? 'pulse' : ''}`} />
              <span>{dbStatus === 'live' ? 'Live' : 'Offline'}</span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 bg-white shadow-sm border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
              {isDarkMode ? <Sun className="w-6 h-6 text-orange-500" /> : <Moon className="w-6 h-6 text-blue-600" />}
            </button>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100 shrink-0">{role === 'ADMIN' ? 'A' : 'P'}</div>
          </div>
        </header>

        <main className="p-5 md:p-10 max-w-7xl mx-auto w-full pb-32">
          {activeTab === 'dashboard' && role === 'ADMIN' && (
            <div className="space-y-10 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <StatCard label="Omzet Bulan Ini" value={formatIDR(stats.omzet)} icon={TrendingUp} color="blue" />
                <StatCard label="Selesai" value={stats.completed} icon={CheckCircle2} color="green" />
                <StatCard label="Diproses" value={stats.process} icon={Clock} color="orange" />
                <StatCard label="Total" value={orders.length} icon={Package} color="purple" />
              </div>

              <Card className="h-[450px]">
                <h3 className="text-2xl font-black mb-8 tracking-tight">Tren Pendapatan</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={stats.chartData}>
                    <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${v/1000}k`} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px'}} />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={5} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {activeTab === 'add' && <OrderForm role={role} onAdd={addOrder} prefilledPhone={customerPhone} />}

          {activeTab === 'orders' && (
            <div className="space-y-10 animate-fade-in">
              {role === 'CUSTOMER' && customerStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                  <CustomerMetric bg="bg-blue-600 shadow-blue-100" icon={Package} label="Total Pesanan" value={customerStats.total} sub="Seluruh Riwayat" />
                  <CustomerMetric bg="bg-white border-2 border-orange-100" icon={RefreshCcw} label="Sedang Dicuci" value={customerStats.active} sub="Aktif Sekarang" color="text-orange-500" iconColor="text-orange-400" />
                  <CustomerMetric bg="bg-white border-2 border-green-100" icon={CheckCircle2} label="Sudah Selesai" value={customerStats.done} sub="Siap Diambil" color="text-green-600" iconColor="text-green-400" />
                </div>
              )}

              <div className="flex flex-col xl:flex-row gap-6 justify-between items-center">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" placeholder={role === 'ADMIN' ? "Cari nama atau no nota..." : "Cari pesanan saya..."} className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[2rem] outline-none shadow-sm focus:ring-4 focus:ring-blue-100 transition-all text-lg font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  {role === 'CUSTOMER' && (
                    <button onClick={() => initializeSupabase()} className="p-6 bg-blue-600 rounded-[1.5rem] hover:bg-blue-700 text-white shadow-xl shadow-blue-200 transition-all active:scale-90 group" title="Refresh">
                      <RefreshCcw className={`w-7 h-7 ${dbStatus === 'syncing' ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} role={role} onClick={() => setSelectedOrder(order)} />
                ))}
                
                {filteredOrders.length === 0 && (
                  <div className="col-span-full py-32 text-center animate-zoom-in">
                    <div className="relative w-40 h-40 mx-auto mb-10">
                       <div className="absolute inset-0 bg-blue-100/40 rounded-full blur-3xl animate-pulse"></div>
                       <div className="relative w-full h-full bg-white rounded-[4rem] flex items-center justify-center border shadow-inner">
                          <FilterX className="w-20 h-20 text-blue-100" />
                       </div>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Data Masih Kosong</h3>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto mt-4 leading-relaxed px-6">
                      {role === 'CUSTOMER' ? `Belum ada riwayat pesanan aktif untuk nomor ${customerPhone}.` : 'Tidak ditemukan pesanan dengan kriteria pencarian ini.'}
                    </p>
                    {role === 'CUSTOMER' && (
                      <button onClick={() => setActiveTab('add')} className="mt-12 px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 hover:-translate-y-2 active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto">
                        BUAT ORDER BARU <PlusCircle className="w-8 h-8" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Navigasi Mobile (Bawah) */}
      <div className="md:hidden fixed bottom-8 left-6 right-6 h-20 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-2xl z-50 flex items-center px-6 justify-around">
        <MobileNavItem onClick={() => setActiveTab(role === 'ADMIN' ? 'dashboard' : 'orders')} active={activeTab === (role === 'ADMIN' ? 'dashboard' : 'orders')} icon={role === 'ADMIN' ? LayoutDashboard : Activity} label={role === 'ADMIN' ? 'Home' : 'Lacak'} />
        {role === 'ADMIN' && <MobileNavItem onClick={() => setActiveTab('orders')} active={activeTab === 'orders'} icon={ClipboardList} label="Data" />}
        <MobileNavItem onClick={() => setActiveTab('add')} active={activeTab === 'add'} icon={PlusCircle} label="Tambah" />
        <MobileNavItem onClick={handleLogout} active={false} icon={LogOut} label="Keluar" danger />
      </div>
    </div>
  );
}

function MobileNavItem({ onClick, active, icon: Icon, label, danger }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-blue-600 scale-110' : danger ? 'text-red-400' : 'text-slate-400'}`}>
      <div className={`p-2.5 rounded-2xl ${active ? 'bg-blue-50 shadow-sm shadow-blue-100' : ''}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function CustomerMetric({ bg, icon: Icon, label, value, sub, color = "text-white", iconColor = "text-white/30" }: any) {
  return (
    <div className={`relative group overflow-hidden rounded-[2.5rem] p-10 transition-all hover:-translate-y-2 ${bg}`}>
      <div className={`absolute -right-8 -bottom-8 opacity-10 transition-transform duration-1000 group-hover:scale-125 ${iconColor}`}>
         <Icon className="w-48 h-48" />
      </div>
      <p className={`text-[11px] font-black uppercase tracking-[0.25em] mb-3 opacity-60 ${color}`}>{label}</p>
      <div className="flex items-baseline gap-3">
         <p className={`text-7xl font-black tracking-tighter ${color}`}>{value}</p>
         <span className={`text-sm font-black opacity-40 uppercase ${color}`}>{sub}</span>
      </div>
    </div>
  );
}

function OrderCard({ order, role, onClick }: any) {
  const isSelesai = order.status === 'Selesai';
  const isProses = order.status === 'Proses';
  
  return (
    <Card className="cursor-pointer hover:scale-[1.03] active:scale-95 group relative overflow-hidden flex flex-col min-h-[420px]" onClick={onClick}>
      <div className={`absolute top-0 left-0 right-0 h-2 ${order.status === 'Baru' ? 'bg-blue-500' : isProses ? 'bg-orange-500' : 'bg-green-500'}`}></div>
      
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{order.notaNumber}</p>
             {isProses && <span className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,146,60,0.5)]"></span>}
          </div>
          <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{order.customerName}</h4>
        </div>
        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl transition-transform group-hover:scale-110 ${order.status === 'Baru' ? 'bg-blue-600 shadow-blue-100' : isProses ? 'bg-orange-500 shadow-orange-100' : 'bg-green-600 shadow-green-100'}`}>
          {order.status}
        </div>
      </div>
      
      <div className="mb-10 p-5 bg-slate-50/80 rounded-[2rem] border border-slate-100/50">
        <div className="flex justify-between items-center relative px-3">
          <div className="absolute top-1/2 -translate-y-1/2 left-5 right-5 h-1.5 bg-slate-200 rounded-full z-0"></div>
          <div className={`absolute top-1/2 -translate-y-1/2 left-5 h-1.5 bg-blue-500 rounded-full z-0 transition-all duration-1000 ease-in-out`} style={{ width: order.status === 'Baru' ? '0%' : isProses ? '50%' : 'calc(100% - 40px)' }}></div>
          
          <Step active={true} done={!order.status.includes('Baru')} icon={Package} label="Terima" />
          <Step active={!order.status.includes('Baru')} done={isSelesai} icon={isProses ? RefreshCcw : WashingMachine} label="Cuci" animating={isProses} />
          <Step active={isSelesai} done={isSelesai} icon={isSelesai ? Sparkles : CheckCircle2} label="Selesai" />
        </div>
      </div>

      <div className="flex-1 space-y-5">
        <div className="grid grid-cols-2 gap-4">
           <MiniStat icon={Shirt} val={order.serviceType} label="Tipe" />
           <MiniStat icon={Package} val={`${order.weight} Kg`} label="Berat" />
        </div>
        <div className="flex items-center gap-3 px-1 text-slate-400">
           <Calendar className="w-4 h-4" />
           <span className="text-xs font-bold uppercase tracking-wider">{new Date(order.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-50">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</p>
          <p className="text-3xl font-black text-blue-700 tracking-tighter">{formatIDR(order.totalPrice)}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-45 shadow-sm">
           <ArrowUpRight className="w-7 h-7" />
        </div>
      </div>
    </Card>
  );
}

function Step({ active, done, icon: Icon, label, animating }: any) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center border-4 transition-all duration-500 ${done ? 'bg-blue-500 border-white text-white shadow-xl shadow-blue-100' : active ? 'bg-white border-blue-500 text-blue-500 shadow-md' : 'bg-white border-slate-200 text-slate-300'}`}>
        <Icon className={`w-6 h-6 ${animating ? 'animate-spin' : ''}`} />
      </div>
      <span className={`text-[9px] font-black mt-3 uppercase tracking-wider transition-colors ${active ? 'text-blue-600' : 'text-slate-300'}`}>{label}</span>
    </div>
  );
}

function MiniStat({ icon: Icon, val, label }: any) {
  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-50 flex items-center gap-4 group-hover:bg-blue-50/30 transition-colors">
      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Icon className="w-5 h-5" /></div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-slate-800 truncate leading-tight">{val}</p>
      </div>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-5 px-7 py-5 rounded-[2rem] transition-all duration-300 ${active ? 'bg-white text-blue-700 font-black shadow-xl shadow-blue-500/10 scale-[1.05]' : 'text-blue-100/60 hover:bg-white/10 font-bold hover:translate-x-2 hover:text-white'}`}>
      <Icon className="w-6 h-6" />
      <span className="text-lg tracking-tight">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = { blue: 'bg-blue-600 shadow-blue-100', green: 'bg-green-600 shadow-green-100', orange: 'bg-orange-600 shadow-orange-100', purple: 'bg-purple-600 shadow-purple-100' };
  return (
    <Card className="hover:scale-[1.05] transition-all border-none shadow-sm group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 transition-transform group-hover:rotate-12 ${colors[color]}`}><Icon className="w-7 h-7" /></div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{value}</p>
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
    if (formData.weight <= 0) return;
    
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
    <div className="max-w-4xl mx-auto animate-zoom-in">
      <Card className="p-8 md:p-14 shadow-2xl border-none relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-60 h-60 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-16 relative z-10">
           <div className="w-16 h-16 bg-blue-600 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl shadow-blue-100">
              <PlusCircle className="w-10 h-10" />
           </div>
           <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Registrasi Order</h3>
              <p className="text-base font-bold text-slate-400 mt-1">Lengkapi rincian layanan laundry</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <FormInput label="Nama Lengkap" val={formData.customerName} set={(v:string)=>setFormData({...formData, customerName:v})} ph="Nama Pelanggan" req />
            <FormInput label="Nomor WhatsApp" val={formData.customerPhone} set={(v:string)=>setFormData({...formData, customerPhone:v})} ph="081234..." req />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Penjemputan / Antar</label>
            <textarea required rows={3} className="w-full px-8 py-6 border border-slate-100 bg-slate-50/50 rounded-[2rem] outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700" value={formData.customerAddress} onChange={(e) => setFormData({...formData, customerAddress: e.target.value})} placeholder="Input alamat lengkap..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Layanan Laundry</label>
              <div className="relative">
                <select className="w-full px-8 py-6 border border-slate-100 bg-slate-50/50 rounded-[2rem] outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-black text-blue-600 appearance-none cursor-pointer" value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value as ServiceType})}>
                  {Object.keys(SERVICE_PRICES).map(s => <option key={s} value={s}>{s} • {formatIDR(SERVICE_PRICES[s as ServiceType])}</option>)}
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400"><ChevronRight className="w-6 h-6 rotate-90" /></div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Berat (Kg) / Unit</label>
              <div className="relative">
                 <input required type="number" min="0.1" step="0.1" className="w-full px-8 py-6 border border-slate-100 bg-slate-50/50 rounded-[2rem] outline-none font-black text-4xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-slate-800" value={formData.weight || ''} onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} placeholder="0.0" />
                 <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-slate-300 uppercase tracking-[0.2em] pointer-events-none text-xs">KG / Unit</span>
              </div>
            </div>
          </div>

          <div className="mt-12 p-10 md:p-14 bg-slate-900 rounded-[3rem] flex flex-col lg:flex-row items-center justify-between text-white gap-10 shadow-3xl overflow-hidden relative group">
            <div className="absolute -left-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Coins className="w-60 h-60" /></div>
            <div className="text-center lg:text-left relative z-10">
               <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 mb-3">Estimasi Tagihan Akhir</p>
               <p className="text-7xl font-black tracking-tighter text-blue-400">{formatIDR(total)}</p>
            </div>
            <button 
              type="submit" 
              disabled={total <= 0} 
              className="w-full lg:w-auto px-16 py-7 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-black rounded-[2.5rem] shadow-2xl shadow-blue-500/20 transition-all hover:-translate-y-2 active:scale-95 flex items-center justify-center gap-4 relative z-10"
            >
              KONFIRMASI ORDER <ArrowRight className="w-8 h-8" />
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function FormInput({ label, val, set, ph, req }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input required={req} className="w-full px-8 py-6 border border-slate-100 bg-slate-50/50 rounded-[2rem] outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700 text-lg" value={val} onChange={(e) => set(e.target.value)} placeholder={ph} />
    </div>
  );
}
