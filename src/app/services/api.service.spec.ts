import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Client } from '../models/client.model';
import { Vehicle } from '../models/vehicle.model';
import { Product } from '../models/product.model';

describe('ApiService - Pruebas de Funcionalidad y Seguridad', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  const apiUrl = 'http://localhost:3000';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, AuthService]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('🔐 Autenticación y Headers de Seguridad', () => {
    it('debe incluir token JWT en headers de peticiones autenticadas', () => {
      const mockResponse = {
        token: 'test.jwt.token',
        user: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'admin' }
      };
      authService.login(mockResponse);

      service.getClients().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/clientes`);
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test.jwt.token');
      req.flush([]);
    });

    it('debe enviar peticiones sin Authorization header cuando no hay token', () => {
      service.getClients().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/clientes`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush([]);
    });

    it('debe incluir Content-Type application/json en todas las peticiones', () => {
      service.getClients().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/clientes`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush([]);
    });
  });

  describe('🔑 Autenticación - Login y Registro', () => {
    it('debe realizar login con credenciales correctas', () => {
      const credentials = { email: 'user@test.com', password: 'password123' };
      const mockResponse = {
        token: 'login.token',
        user: { id: 1, nombre: 'User', email: 'user@test.com', rol: 'user' }
      };

      service.login(credentials.email, credentials.password).subscribe(response => {
        expect(response.token).toBe('login.token');
        expect(response.user.email).toBe('user@test.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('debe registrar nuevo usuario correctamente', () => {
      const newUser = {
        nombre: 'New User',
        email: 'new@test.com',
        password: 'secure123',
        rol: 'mecanico'
      };

      authService.login({
        token: 'admin.token',
        user: { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin' }
      });

      service.register(newUser).subscribe(response => {
        expect(response.email).toBe('new@test.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/usuarios`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      req.flush({ id: 2, ...newUser });
    });
  });

  describe('🔐 Autenticación 2FA (Two-Factor Authentication)', () => {
    beforeEach(() => {
      authService.login({
        token: 'auth.token',
        user: { id: 1, nombre: 'User', email: 'user@test.com', rol: 'admin' }
      });
    });

    it('debe configurar 2FA y retornar QR code', () => {
      const mockResponse = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
      };

      service.setup2FA().subscribe(response => {
        expect(response.secret).toBeTruthy();
        expect(response.qrCode).toContain('data:image');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/setup-2fa`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toContain('Bearer');
      req.flush(mockResponse);
    });

    it('debe verificar código 2FA correctamente', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123456';

      service.verify2FA(secret, token).subscribe(response => {
        expect(response.verified).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify-2fa`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ secret, token });
      req.flush({ verified: true });
    });

    it('debe realizar login con 2FA', () => {
      const userId = 1;
      const token = '654321';

      service.login2FA(userId, token).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login-2fa`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId, token });
      req.flush({ success: true, token: 'new.jwt.token' });
    });

    it('debe desactivar 2FA correctamente', () => {
      service.disable2FA().subscribe(response => {
        expect(response.disabled).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/disable-2fa`);
      expect(req.request.method).toBe('POST');
      req.flush({ disabled: true });
    });
  });

  describe('👥 CRUD de Clientes', () => {
    beforeEach(() => {
      authService.login({
        token: 'crud.token',
        user: { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin' }
      });
    });

    it('debe obtener lista de clientes', () => {
      const mockClients: Client[] = [
        { id: 1, nombre: 'Cliente 1', correo: 'c1@test.com', telefono: '1234567890', direccion: 'Dir 1' },
        { id: 2, nombre: 'Cliente 2', correo: 'c2@test.com', telefono: '0987654321', direccion: 'Dir 2' }
      ];

      service.getClients().subscribe(clients => {
        expect(clients.length).toBe(2);
        expect(clients[0].nombre).toBe('Cliente 1');
      });

      const req = httpMock.expectOne(`${apiUrl}/clientes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClients);
    });

    it('debe crear nuevo cliente', () => {
      const newClient: Client = {
        nombre: 'Nuevo Cliente',
        correo: 'nuevo@test.com',
        telefono: '5555555555',
        direccion: 'Nueva Dirección'
      };

      service.createClient(newClient).subscribe(client => {
        expect(client.id).toBe(3);
        expect(client.nombre).toBe('Nuevo Cliente');
      });

      const req = httpMock.expectOne(`${apiUrl}/clientes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newClient);
      req.flush({ id: 3, ...newClient });
    });

    it('debe actualizar cliente existente', () => {
      const clientId = 1;
      const updates = { telefono: '9999999999' };

      service.updateClient(clientId, updates).subscribe(client => {
        expect(client.telefono).toBe('9999999999');
      });

      const req = httpMock.expectOne(`${apiUrl}/clientes/${clientId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ id: clientId, ...updates });
    });

    it('debe eliminar cliente', () => {
      const clientId = 1;

      service.deleteClient(clientId).subscribe(response => {
        expect(response.deleted).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/clientes/${clientId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ deleted: true });
    });
  });

  describe('🚗 CRUD de Vehículos', () => {
    beforeEach(() => {
      authService.login({
        token: 'vehicle.token',
        user: { id: 1, nombre: 'Mechanic', email: 'mech@test.com', rol: 'mecanico' }
      });
    });

    it('debe crear vehículo con clienteId correcto', () => {
      const newVehicle: any = {
        ClienteId: 1,
        marca: 'Toyota',
        modelo: 'Corolla',
        anio: '2020',
        placas: 'ABC123',
        vin: '1HGBH41JXMN109186'
      };

      service.createVehicle(newVehicle).subscribe(vehicle => {
        expect(vehicle.marca).toBe('Toyota');
      });

      const req = httpMock.expectOne(`${apiUrl}/vehiculos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.clienteId).toBe(1);
      expect(req.request.body.marca).toBe('Toyota');
      req.flush({ id: 1, ...newVehicle });
    });

    it('debe obtener lista de vehículos', () => {
      const mockVehicles: Vehicle[] = [
        { id: 1, ClienteId: 1, marca: 'Honda', modelo: 'Civic', anio: '2019', placas: 'XYZ789', vin: 'VIN123' }
      ];

      service.getVehicles().subscribe(vehicles => {
        expect(vehicles.length).toBe(1);
        expect(vehicles[0].marca).toBe('Honda');
      });

      const req = httpMock.expectOne(`${apiUrl}/vehiculos`);
      expect(req.request.method).toBe('GET');
      req.flush(mockVehicles);
    });
  });

  describe('📦 Gestión de Productos e Inventario', () => {
    beforeEach(() => {
      authService.login({
        token: 'inventory.token',
        user: { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin' }
      });
    });

    it('debe buscar productos con query string', () => {
      const searchQuery = 'filtro';
      const mockProducts: Product[] = [
        { id: 1, nombre: 'Filtro de Aceite', descripcion: 'Filtro', precioVenta: 150, cantidad: 20 }
      ];

      service.getProducts(searchQuery).subscribe(products => {
        expect(products.length).toBe(1);
        expect(products[0].nombre).toContain('Filtro');
      });

      const req = httpMock.expectOne(`${apiUrl}/productos?q=${searchQuery}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    it('debe registrar movimiento de inventario', () => {
      const movement = {
        productoId: 1,
        tipo: 'ingreso' as 'ingreso' | 'salida' | 'ajuste',
        cantidad: 10,
        motivo: 'Compra de stock'
      };

      service.moveInventory(movement).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/movimientos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(movement);
      req.flush({ success: true });
    });

    it('debe obtener historial de movimientos', () => {
      service.getInventoryMovements().subscribe(movements => {
        expect(movements.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/movimientos`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, tipo: 'ingreso', cantidad: 5 }]);
    });
  });

  describe('📊 Reportes y Análisis', () => {
    beforeEach(() => {
      authService.login({
        token: 'reports.token',
        user: { id: 1, nombre: 'Manager', email: 'manager@test.com', rol: 'admin' }
      });
    });

    it('debe obtener productos con stock bajo', () => {
      const threshold = 5;

      service.getInventoryLowStock(threshold).subscribe(products => {
        expect(products.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/inventory-low?threshold=${threshold}`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, nombre: 'Producto Bajo', cantidad: 3 }]);
    });

    it('debe obtener resumen de ventas con rango de fechas', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      service.getSalesSummary(startDate, endDate).subscribe(summary => {
        expect(summary).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/sales-summary?startDate=${startDate}&endDate=${endDate}`);
      expect(req.request.method).toBe('GET');
      req.flush([{ total: 10000, count: 50 }]);
    });

    it('debe obtener productividad del personal', () => {
      service.getProductivity().subscribe(productivity => {
        expect(productivity).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/productivity`);
      expect(req.request.method).toBe('GET');
      req.flush([{ staffId: 1, ordersCompleted: 25 }]);
    });
  });

  describe('⚙️ Configuración de API URL', () => {
    it('debe obtener URL del API', () => {
      const url = service.getApiUrl();
      expect(url).toBeTruthy();
      expect(url).toContain('http');
    });

    it('debe actualizar y persistir URL del API', () => {
      const newUrl = 'https://api.production.com';

      service.setApiUrl(newUrl);

      expect(service.getApiUrl()).toBe(newUrl);
      expect(localStorage.getItem('apiUrl')).toBe(newUrl);
    });

    it('debe cargar URL desde localStorage al inicializar', () => {
      const savedUrl = 'https://api.saved.com';
      localStorage.setItem('apiUrl', savedUrl);

      service.loadApiUrl();

      expect(service.getApiUrl()).toBe(savedUrl);
    });
  });

  describe('🛡️ Manejo de Errores y Casos de Borde', () => {
    beforeEach(() => {
      authService.login({
        token: 'error.token',
        user: { id: 1, nombre: 'User', email: 'user@test.com', rol: 'user' }
      });
    });

    it('debe manejar error 401 Unauthorized', () => {
      service.getClients().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/clientes`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('debe manejar error 404 Not Found', () => {
      service.getClient(999).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/clientes/999`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });

    it('debe manejar error de red', () => {
      service.getClients().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.error.type).toBe('error');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/clientes`);
      req.error(new ErrorEvent('Network error'));
    });
  });
});
