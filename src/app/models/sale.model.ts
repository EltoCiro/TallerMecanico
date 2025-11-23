import { Client } from './client.model';
import { Vehicle } from './vehicle.model';
import { User } from './user.model';

export interface SaleItem {
  productId: number;
  cantidad: number;
  unitPrice: number;
  nombreProducto?: string;
}

export interface Sale {
  id?: number;
  fecha?: Date | string;
  subtotal?: number;
  impuesto?: number;
  descuento?: number;
  total?: number;
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia';
  items?: SaleItem[];
  itemsJson?: string;
  ClientId?: number;
  VehicleId?: number;
  createdById?: number;
  Client?: Client;
  Vehicle?: Vehicle;
  createdBy?: User;
  createdAt?: string;
  updatedAt?: string;
}
