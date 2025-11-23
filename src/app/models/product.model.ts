export interface Product {
  id?: number;
  nombre?: string;  // Backend usa 'nombre'
  nombreProducto?: string;  // Alias para compatibilidad
  descripcion?: string;
  precioCosto?: number;
  precioVenta?: number;
  cantidad?: number;
  sku?: string;
  minStockAlert?: number;
  createdAt?: string;
  updatedAt?: string;
}
