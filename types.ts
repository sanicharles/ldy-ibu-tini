
export type OrderStatus = 'Baru' | 'Proses' | 'Selesai';

export type ServiceType = 
  | 'Cuci Setrika' 
  | 'Cuci Lipat' 
  | 'Setrika' 
  | 'Express' 
  | 'Handuk' 
  | 'Sprei 1 Set' 
  | 'Bed Cover' 
  | 'Hordeng 1 Set';

export const SERVICE_PRICES: Record<ServiceType, number> = {
  'Cuci Setrika': 5000,
  'Cuci Lipat': 4000,
  'Setrika': 4000,
  'Express': 10000,
  'Handuk': 2000,
  'Sprei 1 Set': 3000,
  'Bed Cover': 30000,
  'Hordeng 1 Set': 25000,
};

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
}

export type Role = 'ADMIN' | 'CUSTOMER';
