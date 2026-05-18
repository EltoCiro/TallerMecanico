export interface User {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  rol: 'Administrador' | 'Mecánico' | 'Cajero';
  telefono?: string;
  twoFAEnabled?: boolean;
  twoFASecret?: string;
}

export interface LoginResponse {
  message: string;
  token?: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: 'Administrador' | 'Mecánico' | 'Cajero';
    twoFAEnabled: boolean;
  };
  requiresTwoFA?: boolean;
}
