import { Client } from './client.model';
import { Vehicle } from './vehicle.model';

export interface BudgetItem {
  id?: string;
  descripcion: string;
  cantidad: number;
  unitPrice: number;
  tipo: 'mano_obra' | 'producto';
  productId?: number;
}

export interface BudgetItem {
  id?: string;
  descripcion: string;
  cantidad: number;
  unitPrice: number;
  tipo: 'mano_obra' | 'producto';
  productId?: number;
}

export interface Budget {
  id?: number;
  descripcion?: string;
  items?: BudgetItem[];  // Frontend usa esto
  itemsJson?: string;  // Backend lo almacena así
  subtotal?: number;
  impuesto?: number;
  descuento?: number;
  total?: number;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
  ClienteId?: number;  // Sequelize usa mayúscula
  VehiculoId?: number;  // Sequelize usa mayúscula
  Cliente?: any;
  Vehiculo?: any;
  createdAt?: string;
  updatedAt?: string;
}
