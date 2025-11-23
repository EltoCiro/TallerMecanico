import { Vehicle } from './vehicle.model';

export interface Client {
  id?: number;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  Vehicles?: Vehicle[];
  createdAt?: string;
  updatedAt?: string;
}
