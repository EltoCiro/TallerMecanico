import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard - Pruebas de Seguridad de Rutas', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate')
          }
        }
      ]
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('🔐 Protección de Rutas Autenticadas', () => {
    it('debe permitir acceso a usuarios autenticados', () => {
      const mockResponse = {
        token: 'valid.token',
        user: { id: 1, nombre: 'Auth User', email: 'auth@test.com', rol: 'admin' }
      };
      authService.login(mockResponse);

      const result = TestBed.runInInjectionContext(() => authGuard());

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('debe bloquear acceso a usuarios no autenticados', () => {
      const result = TestBed.runInInjectionContext(() => authGuard());

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('debe redirigir a login cuando no hay token', () => {
      authService.logout();

      const result = TestBed.runInInjectionContext(() => authGuard());

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('🛡️ Limpieza de Sesión en Acceso No Autorizado', () => {
    it('debe limpiar datos de sesión al bloquear acceso', () => {
      spyOn(authService, 'logout').and.callThrough();

      const result = TestBed.runInInjectionContext(() => authGuard());

      expect(authService.logout).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('debe limpiar localStorage al denegar acceso', () => {
      localStorage.setItem('token', 'invalid.token');
      localStorage.setItem('currentUser', JSON.stringify({ id: 1 }));

      TestBed.runInInjectionContext(() => authGuard());

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('🔒 Validación de Token Expirado', () => {
    it('debe bloquear acceso si el token está presente pero usuario es null', () => {
      localStorage.setItem('token', 'orphan.token');

      const result = TestBed.runInInjectionContext(() => authGuard());

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('📊 Casos de Uso Múltiples', () => {
    it('debe permitir múltiples verificaciones consecutivas para usuario autenticado', () => {
      const mockResponse = {
        token: 'persistent.token',
        user: { id: 2, nombre: 'Persistent', email: 'persist@test.com', rol: 'mecanico' }
      };
      authService.login(mockResponse);

      const result1 = TestBed.runInInjectionContext(() => authGuard());
      const result2 = TestBed.runInInjectionContext(() => authGuard());
      const result3 = TestBed.runInInjectionContext(() => authGuard());

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('debe bloquear después de logout incluso con sesión previa', () => {
      const mockResponse = {
        token: 'temp.token',
        user: { id: 3, nombre: 'Temp', email: 'temp@test.com', rol: 'user' }
      };
      authService.login(mockResponse);

      let result = TestBed.runInInjectionContext(() => authGuard());
      expect(result).toBe(true);

      authService.logout();

      result = TestBed.runInInjectionContext(() => authGuard());
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
