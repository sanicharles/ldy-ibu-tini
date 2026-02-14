
/**
 * SKEMA SQL UNTUK SUPABASE (Salin & Jalankan di SQL Editor Supabase):
 * 
 * -- Tabel Pesanan
 * CREATE TABLE orders (
 *   id TEXT PRIMARY KEY,
 *   "notaNumber" TEXT NOT NULL,
 *   "customerName" TEXT NOT NULL,
 *   "customerPhone" TEXT NOT NULL,
 *   "customerAddress" TEXT NOT NULL,
 *   weight FLOAT8 NOT NULL,
 *   "serviceType" TEXT NOT NULL,
 *   "totalPrice" NUMERIC NOT NULL,
 *   status TEXT NOT NULL,
 *   "createdAt" TIMESTAMPTZ DEFAULT now(),
 *   "estimatedFinishDate" TIMESTAMPTZ,
 *   "specialRequest" TEXT,
 *   "deliveryMethod" TEXT NOT NULL
 * );
 * 
 * -- Tabel Profil Pelanggan
 * CREATE TABLE customers (
 *   phone TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   address TEXT NOT NULL,
 *   "lastSeen" TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- Aktifkan fitur Realtime untuk tabel ini
 * alter publication supabase_realtime add table orders;
 * alter publication supabase_realtime add table customers;
 */

import { supabase } from './supabase';
import { Order } from './types';

export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const generateNotaNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `TINI-${year}${month}-${random}`;
};

export const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    playTone(880, audioCtx.currentTime, 0.5);
    playTone(1108.73, audioCtx.currentTime + 0.1, 0.5);
  } catch (e) {
    console.warn("Audio Context blocked.");
  }
};

export const sendWhatsAppMessage = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const showPushNotification = async (title: string, body: string) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png' });
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png' });
    }
  }
};

// --- SUPABASE DATABASE OPERATIONS ---

export const fetchOrdersFromSupabase = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Supabase fetch error:", err);
    return [];
  }
};

export const upsertOrderToSupabase = async (order: Order): Promise<boolean> => {
  try {
    const cleanOrder = JSON.parse(JSON.stringify(order));
    const { error } = await supabase
      .from('orders')
      .upsert(cleanOrder);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase upsert order error:", err);
    return false;
  }
};

export const deleteOrderFromSupabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase delete error:", err);
    return false;
  }
};

export const fetchCustomerFromSupabase = async (phone: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for no rows found
    return data;
  } catch (err) {
    console.error("Supabase fetch customer error:", err);
    return null;
  }
};

export const upsertCustomerToSupabase = async (phone: string, name: string, address: string) => {
  try {
    const { error } = await supabase
      .from('customers')
      .upsert({ 
        phone, 
        name, 
        address, 
        lastSeen: new Date().toISOString() 
      });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase upsert customer error:", err);
    return false;
  }
};
