import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;
  private pendingTwoFA: { userId: number; requiresTwoFA: boolean } | null = null;

  constructor() {
    this.loadUser();
  }

  // Login exitoso - guardar usuario y token
  login(response: any): void {
    // El backend devuelve { token, user: { id, nombre, email, rol }}
    this.token = response.token;
    this.currentUser = {
      id: response.user.id,
      nombre: response.user.nombre,
      email: response.user.email,
      rol: response.user.rol,
      telefono: '',
      twoFAEnabled: response.user.twoFAEnabled || false
    } as User;
    if (this.token) {
      localStorage.setItem('token', this.token);
    }
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.pendingTwoFA = null;
  }

  // Login con 2FA pendiente
  setPendingTwoFA(userId: number, user: any): void {
    this.pendingTwoFA = { userId, requiresTwoFA: true };
    localStorage.setItem('pendingTwoFA', JSON.stringify({ userId, requiresTwoFA: true }));
    // No guardar token ni usuario aún
  }

  // Verificar si hay 2FA pendiente
  hasPendingTwoFA(): boolean {
    return this.pendingTwoFA?.requiresTwoFA === true;
  }

  getPendingTwoFAUserId(): number | null {
    return this.pendingTwoFA?.userId || null;
  }

  getUser(): User | null {
    return this.currentUser;
  }

  logout(): void {
    this.currentUser = null;
    this.token = null;
    this.pendingTwoFA = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('pendingTwoFA');
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

  isTwoFAEnabled(): boolean {
    return this.currentUser?.twoFAEnabled || false;
  }

  private loadUser(): void {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    const savedPendingTwoFA = localStorage.getItem('pendingTwoFA');
    
    if (savedUser && savedToken) {
      this.currentUser = JSON.parse(savedUser);
      this.token = savedToken;
    }

    if (savedPendingTwoFA) {
      this.pendingTwoFA = JSON.parse(savedPendingTwoFA);
    }
  }
}
