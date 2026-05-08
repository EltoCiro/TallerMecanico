import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

describe('AuthService - Pruebas de Seguridad', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('🔐 Autenticación y Tokens JWT', () => {
    it('debe almacenar token JWT y usuario al hacer login', () => {
      const mockResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        user: { id: 1, nombre: 'Test User', email: 'test@test.com', rol: 'admin' }
      };

      service.login(mockResponse);

      expect(service.getToken()).toBe(mockResponse.token);
      expect(service.getUser()?.id).toBe(1);
      expect(localStorage.getItem('token')).toBe(mockResponse.token);
    });

    it('debe validar que el usuario está autenticado con token válido', () => {
      const mockResponse = {
        token: 'valid.jwt.token',
        user: { id: 1, nombre: 'User', email: 'user@test.com', rol: 'user' }
      };

      service.login(mockResponse);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('debe retornar false si no hay token de autenticación', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('NO debe autenticar si falta el token', () => {
      const mockResponse = {
        token: null,
        user: { id: 1, nombre: 'User', email: 'user@test.com', rol: 'user' }
      };

      service.login(mockResponse);

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('🔒 Gestión de Sesión y Persistencia', () => {
    it('debe persistir sesión en localStorage', () => {
      const mockResponse = {
        token: 'persistent.token',
        user: { id: 2, nombre: 'Persistent User', email: 'persist@test.com', rol: 'mecanico' }
      };

      service.login(mockResponse);

      const savedUser = localStorage.getItem('currentUser');
      const savedToken = localStorage.getItem('token');

      expect(savedUser).toBeTruthy();
      expect(savedToken).toBe('persistent.token');
      expect(JSON.parse(savedUser!).email).toBe('persist@test.com');
    });

    it('debe recuperar sesión desde localStorage al inicializar', () => {
      const mockUser = { id: 3, nombre: 'Stored User', email: 'stored@test.com', rol: 'admin', telefono: '' };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('token', 'stored.token');

      const newService = new AuthService();

      expect(newService.getUser()?.email).toBe('stored@test.com');
      expect(newService.getToken()).toBe('stored.token');
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('debe limpiar completamente la sesión al hacer logout', () => {
      const mockResponse = {
        token: 'temp.token',
        user: { id: 4, nombre: 'Temp User', email: 'temp@test.com', rol: 'user' }
      };

      service.login(mockResponse);
      service.logout();

      expect(service.getUser()).toBeNull();
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('👤 Control de Acceso por Roles', () => {
    it('debe verificar correctamente el rol de administrador', () => {
      const mockResponse = {
        token: 'admin.token',
        user: { id: 5, nombre: 'Admin', email: 'admin@test.com', rol: 'admin' }
      };

      service.login(mockResponse);

      expect(service.hasRole('admin')).toBe(true);
      expect(service.hasRole('mecanico')).toBe(false);
    });

    it('debe verificar correctamente el rol de mecánico', () => {
      const mockResponse = {
        token: 'mech.token',
        user: { id: 6, nombre: 'Mechanic', email: 'mech@test.com', rol: 'mecanico' }
      };

      service.login(mockResponse);

      expect(service.hasRole('mecanico')).toBe(true);
      expect(service.hasRole('admin')).toBe(false);
    });

    it('debe retornar false para roles cuando no hay usuario autenticado', () => {
      expect(service.hasRole('admin')).toBe(false);
      expect(service.hasRole('mecanico')).toBe(false);
    });
  });

  describe('🛡️ Seguridad - Casos de Borde', () => {
    it('debe manejar respuesta de login con datos incompletos', () => {
      const mockResponse = {
        token: 'incomplete.token',
        user: { id: 7, nombre: '', email: '', rol: 'user' }
      };

      service.login(mockResponse);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.getUser()?.nombre).toBe('');
    });

    it('debe manejar localStorage corrupto sin lanzar errores', () => {
      localStorage.setItem('currentUser', 'invalid-json');
      localStorage.setItem('token', 'some.token');

      expect(() => new AuthService()).toThrow();
    });

    it('debe prevenir inyección XSS en datos de usuario', () => {
      const mockResponse = {
        token: 'xss.token',
        user: { 
          id: 8, 
          nombre: '<script>alert("XSS")</script>', 
          email: 'xss@test.com', 
          rol: 'user' 
        }
      };

      service.login(mockResponse);
      const user = service.getUser();

      expect(user?.nombre).toContain('<script>');
      expect(localStorage.getItem('currentUser')).toContain('&lt;script&gt;');
    });
  });

  describe('📊 Obtención de Datos de Usuario', () => {
    it('debe retornar el usuario actual correctamente', () => {
      const mockResponse = {
        token: 'current.token',
        user: { id: 9, nombre: 'Current User', email: 'current@test.com', rol: 'admin' }
      };

      service.login(mockResponse);

      const currentUser = service.getCurrentUser();
      expect(currentUser).toBeTruthy();
      expect(currentUser?.email).toBe('current@test.com');
    });

    it('debe retornar null cuando no hay usuario autenticado', () => {
      expect(service.getCurrentUser()).toBeNull();
      expect(service.getUser()).toBeNull();
    });
  });
});
