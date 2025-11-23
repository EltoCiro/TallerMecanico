import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Solo verificar si está autenticado (sin verificar token ya que no usamos JWT)
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si no está autenticado, limpiar datos y redirigir
  authService.logout();
  router.navigate(['/login']);
  return false;
};
