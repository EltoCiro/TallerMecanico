import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, LoginResponse } from '../models/user.model';
import { Client } from '../models/client.model';
import { Vehicle } from '../models/vehicle.model';
import { Budget } from '../models/budget.model';
import { ServiceOrder } from '../models/service-order.model';
import { Staff } from '../models/staff.model';
import { Product } from '../models/product.model';
import { Sale } from '../models/sale.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // URL del API backend
  private apiUrl = 'https://8dg69wvv-3000.usw3.devtunnels.ms';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  // ==================== AUTH ====================
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  register(user: { nombre: string; email: string; password: string; rol?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, user, {
      headers: this.getHeaders()
    });
  }

  // ==================== CLIENTS ====================
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/clientes`, {
      headers: this.getHeaders()
    });
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clientes/${id}`, {
      headers: this.getHeaders()
    });
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clientes`, client, {
      headers: this.getHeaders()
    });
  }

  updateClient(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/clientes/${id}`, client, {
      headers: this.getHeaders()
    });
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clientes/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== VEHICLES ====================
  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehiculos`, {
      headers: this.getHeaders()
    });
  }

  getVehicle(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.apiUrl}/vehiculos/${id}`, {
      headers: this.getHeaders()
    });
  }

  createVehicle(vehicle: Vehicle): Observable<Vehicle> {
    // El backend espera 'clienteId' (lowercase) en el POST
    // Nota: vehicle puede tener ClienteId o ClientId por inconsistencias del form
    const vehicleAny = vehicle as any;
    const clienteId = vehicleAny.ClientId || vehicle.ClienteId;
    
    const payload = {
      clienteId: clienteId,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      anio: vehicle.anio,
      placas: vehicle.placas,
      vin: vehicle.vin
    };
    
    if (!payload.clienteId) {
      console.error('❌ ERROR: clienteId is missing!', payload);
    }
    
    return this.http.post<Vehicle>(`${this.apiUrl}/vehiculos`, payload, {
      headers: this.getHeaders()
    });
  }

  updateVehicle(id: number, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    // El backend espera 'clienteId' (lowercase) en el PUT si se actualiza
    const payload: any = {};
    if (vehicle.ClienteId !== undefined) payload.clienteId = vehicle.ClienteId;
    if (vehicle.marca !== undefined) payload.marca = vehicle.marca;
    if (vehicle.modelo !== undefined) payload.modelo = vehicle.modelo;
    if (vehicle.anio !== undefined) payload.anio = vehicle.anio;
    if (vehicle.placas !== undefined) payload.placas = vehicle.placas;
    if (vehicle.vin !== undefined) payload.vin = vehicle.vin;
    
    return this.http.put<Vehicle>(`${this.apiUrl}/vehiculos/${id}`, payload, {
      headers: this.getHeaders()
    });
  }

  deleteVehicle(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/vehiculos/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== BUDGETS ====================
  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.apiUrl}/presupuestos`, {
      headers: this.getHeaders()
    });
  }

  getBudget(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/presupuestos/${id}`, {
      headers: this.getHeaders()
    });
  }

  createBudget(budget: Budget): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiUrl}/presupuestos`, budget, {
      headers: this.getHeaders()
    });
  }

  updateBudget(id: number, budget: Partial<Budget>): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/presupuestos/${id}`, budget, {
      headers: this.getHeaders()
    });
  }

  deleteBudget(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/presupuestos/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateBudgetStatus(id: number, estado: 'pendiente' | 'aprobado' | 'rechazado'): Observable<any> {
    return this.http.put(`${this.apiUrl}/presupuestos/${id}/status`, { estado }, {
      headers: this.getHeaders()
    });
  }

  // ==================== SERVICE ORDERS ====================
  getServiceOrders(): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/ordenes`, {
      headers: this.getHeaders()
    });
  }

  getServiceOrder(id: number): Observable<ServiceOrder> {
    return this.http.get<ServiceOrder>(`${this.apiUrl}/ordenes/${id}`, {
      headers: this.getHeaders()
    });
  }

  createServiceOrder(order: ServiceOrder): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(`${this.apiUrl}/ordenes`, order, {
      headers: this.getHeaders()
    });
  }

  updateServiceOrder(id: number, order: Partial<ServiceOrder>): Observable<ServiceOrder> {
    return this.http.put<ServiceOrder>(`${this.apiUrl}/ordenes/${id}`, order, {
      headers: this.getHeaders()
    });
  }

  deleteServiceOrder(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ordenes/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateOrderStatus(id: number, estatus: 'pendiente' | 'en_proceso' | 'completada'): Observable<any> {
    return this.http.put(`${this.apiUrl}/ordenes/${id}`, { estatus }, {
      headers: this.getHeaders()
    });
  }

  assignMechanics(orderId: number, mechanicIds: number[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/ordenes/${orderId}`, { assignedMechanicIds: mechanicIds }, {
      headers: this.getHeaders()
    });
  }

  // ==================== STAFF ====================
  getStaff(): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.apiUrl}/staff`, {
      headers: this.getHeaders()
    });
  }

  getStaffMember(id: number): Observable<Staff> {
    return this.http.get<Staff>(`${this.apiUrl}/staff/${id}`, {
      headers: this.getHeaders()
    });
  }

  createStaff(staff: Staff): Observable<Staff> {
    return this.http.post<Staff>(`${this.apiUrl}/staff`, staff, {
      headers: this.getHeaders()
    });
  }

  updateStaff(id: number, staff: Partial<Staff>): Observable<Staff> {
    return this.http.put<Staff>(`${this.apiUrl}/staff/${id}`, staff, {
      headers: this.getHeaders()
    });
  }

  deleteStaff(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/staff/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== PRODUCTS ====================
  getProducts(query?: string): Observable<Product[]> {
    const url = query ? `${this.apiUrl}/productos?q=${query}` : `${this.apiUrl}/productos`;
    return this.http.get<Product[]>(url, {
      headers: this.getHeaders()
    });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/productos/${id}`, {
      headers: this.getHeaders()
    });
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/productos`, product, {
      headers: this.getHeaders()
    });
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/productos/${id}`, product, {
      headers: this.getHeaders()
    });
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/productos/${id}`, {
      headers: this.getHeaders()
    });
  }

  moveInventory(data: { productoId: number; tipo: 'ingreso' | 'salida' | 'ajuste'; cantidad: number; motivo?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/movimientos`, data, {
      headers: this.getHeaders()
    });
  }

  getInventoryMovements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/movimientos`, {
      headers: this.getHeaders()
    });
  }

  // ==================== SALES ====================
  getSales(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/ventas`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any>(url, {
      headers: this.getHeaders()
    });
  }

  createSale(sale: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ventas`, sale, {
      headers: this.getHeaders()
    });
  }

  // ==================== REPORTS ====================
  getInventoryLowStock(threshold: number = 5): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/reports/inventory-low?threshold=${threshold}`, {
      headers: this.getHeaders()
    });
  }

  getSalesSummary(startDate?: string, endDate?: string): Observable<any[]> {
    let url = `${this.apiUrl}/reports/sales-summary`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any[]>(url, {
      headers: this.getHeaders()
    });
  }

  getProductivity(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/productivity`, {
      headers: this.getHeaders()
    });
  }

  // ==================== USERS ====================
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/usuarios`, {
      headers: this.getHeaders()
    });
  }

  updateUser(id: number, user: Partial<User>): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, user, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== CONFIG ====================
  setApiUrl(url: string): void {
    this.apiUrl = url;
    localStorage.setItem('apiUrl', url);
  }

  getApiUrl(): string {
    const savedUrl = localStorage.getItem('apiUrl');
    if (savedUrl) {
      this.apiUrl = savedUrl;
    }
    return this.apiUrl;
  }
}
