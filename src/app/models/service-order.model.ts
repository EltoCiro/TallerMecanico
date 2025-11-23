import { Budget } from './budget.model';
import { User } from './user.model';

export interface Actividad {
  id?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  mecanicoId?: number;
  horasEstimadas?: number;
  horasReales?: number;
  fechaInicio?: string;
  fechaFin?: string;
  estatus?: 'pendiente' | 'en_proceso' | 'completada';
}

export interface ServiceOrder {
  id?: number;
  descripcion?: string;
  estatus?: 'pendiente' | 'en_proceso' | 'completada';
  notas?: string;
  actividades?: Actividad[]; // Array de actividades con registro de tiempos
  actividadesJson?: string;
  BudgetId?: number;
  Budget?: Budget;
  Mechanics?: User[]; // Array de mecánicos asignados
  assignedMechanicIds?: number[];
  subtotal?: number;
  impuesto?: number;
  descuento?: number;
  total?: number;
  VehiculoId?: number;  // Backend usa VehiculoId (Sequelize)
  ClienteId?: number;   // Backend usa ClienteId (Sequelize)
  createdAt?: string;
  updatedAt?: string;
}
