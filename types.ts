
export type OrderStatus = 'Baru' | 'Proses' | 'Selesai';

export type ServiceType = string;

export interface Service {
  id: string;
  name: string;
  price: number;
}

export const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Cuci Setrika', price: 6000 },
  { id: '2', name: 'Cuci Lipat', price: 5000 },
  { id: '3', name: 'Setrika', price: 5000 },
  { id: '4', name: 'Express', price: 10000 },
  { id: '5', name: 'Handuk', price: 2000 },
  { id: '6', name: 'Sprei 1 Set', price: 3000 },
  { id: '7', name: 'Bed Cover', price: 30000 },
  { id: '8', name: 'Hordeng 1 Set', price: 25000 },
];

export interface Order {
  id: string;
  notaNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  weight: number;
  serviceType: ServiceType;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  estimatedFinishDate: string;
  specialRequest?: string;
  deliveryMethod: 'Antar/Jemput' | 'Ambil Sendiri';
  paymentStatus: 'Belum Bayar' | 'Lunas';
}

export type Role = 'ADMIN' | 'CUSTOMER';
