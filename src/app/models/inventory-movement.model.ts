import { Product } from './product.model';

export interface InventoryMovement {
  id?: number;
  tipo: 'ingreso' | 'salida' | 'ajuste';
  cantidad: number;
  motivo?: string;
  ProductId?: number;
  Product?: Product;
  createdAt?: string;
  updatedAt?: string;
}
