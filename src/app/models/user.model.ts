export interface User {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  rol: 'Administrador' | 'Mecánico' | 'Cajero';
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: 'Administrador' | 'Mecánico' | 'Cajero';
  };
}
