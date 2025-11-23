import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  constructor() {
    this.loadUser();
  }

  // Ahora el backend usa JWT
  login(response: any): void {
    // El backend devuelve { token, user: { id, nombre, email, rol }}
    this.token = response.token;
    this.currentUser = {
      id: response.user.id,
      nombre: response.user.nombre,
      email: response.user.email,
      rol: response.user.rol,
      telefono: ''
    } as User;
    if (this.token) {
      localStorage.setItem('token', this.token);
    }
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
  }

  getUser(): User | null {
    return this.currentUser;
  }

  logout(): void {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.token !== null;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.rol === role;
  }

  private loadUser(): void {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      this.currentUser = JSON.parse(savedUser);
      this.token = savedToken;
    }
  }
}
