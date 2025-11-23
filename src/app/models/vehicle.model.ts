export interface Vehicle {
  id?: number;
  marca?: string;
  modelo?: string;
  anio?: string;
  placas?: string;
  vin?: string;  // Ahora el backend lo soporta
  ClienteId?: number;  // Sequelize usa mayúscula
  Cliente?: any;  // Para el include de Sequelize
  createdAt?: string;
  updatedAt?: string;
}
