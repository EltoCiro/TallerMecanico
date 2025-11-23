import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehiclesPage } from './vehicles.page';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('VehiclesPage', () => {
  let component: VehiclesPage;
  let fixture: ComponentFixture<VehiclesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiclesPage],
      providers: [
        ApiService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehiclesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty vehicles array', () => {
    expect(component.vehicles).toEqual([]);
  });

  it('should initialize with cards view mode', () => {
    expect(component.viewMode).toBe('cards');
  });

  it('should validate required fields', () => {
    component.selectedVehicle = {
      marca: '',
      modelo: '',
      anio: undefined,
      ClienteId: undefined
    };

    const isValid = component.validateForm();
    expect(isValid).toBe(false);
    expect(component.validationErrors['marca']).toBeDefined();
    expect(component.validationErrors['modelo']).toBeDefined();
    expect(component.validationErrors['anio']).toBeDefined();
    expect(component.validationErrors['ClientId']).toBeDefined();
  });

  it('should validate year range', () => {
    component.selectedVehicle = {
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: '1800',
      ClienteId: 1
    };

    const isValid = component.validateForm();
    expect(isValid).toBe(false);
    expect(component.validationErrors['anio']).toContain('1900');

    component.selectedVehicle.anio = '2030';
    const isValid2 = component.validateForm();
    expect(isValid2).toBe(false);
    expect(component.validationErrors['anio']).toContain('2026');
  });

  it('should pass validation with valid data', () => {
    component.selectedVehicle = {
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: '2023',
      ClienteId: 1
    };

    const isValid = component.validateForm();
    expect(isValid).toBe(true);
    expect(Object.keys(component.validationErrors).length).toBe(0);
  });

  it('should filter vehicles by search term', () => {
    component.vehicles = [
      { id: 1, marca: 'Toyota', modelo: 'Corolla', anio: '2023', ClienteId: 1 },
      { id: 2, marca: 'Ford', modelo: 'F-150', anio: '2022', ClienteId: 2 },
      { id: 3, marca: 'Chevrolet', modelo: 'Silverado', anio: '2021', ClienteId: 3 }
    ];

    component.searchTerm = 'toyota';
    component.filterVehicles();
    expect(component.filteredVehicles.length).toBe(1);
    expect(component.filteredVehicles[0].marca).toBe('Toyota');

    component.searchTerm = '';
    component.filterVehicles();
    expect(component.filteredVehicles.length).toBe(3);
  });

  it('should filter vehicles by client', () => {
    component.vehicles = [
      { id: 1, marca: 'Toyota', modelo: 'Corolla', anio: '2023', ClienteId: 1 },
      { id: 2, marca: 'Ford', modelo: 'F-150', anio: '2022', ClienteId: 2 },
      { id: 3, marca: 'Chevrolet', modelo: 'Silverado', anio: '2021', ClienteId: 1 }
    ];

    component.selectedClientFilter = 1;
    component.filterVehicles();
    expect(component.filteredVehicles.length).toBe(2);

    component.selectedClientFilter = null;
    component.filterVehicles();
    expect(component.filteredVehicles.length).toBe(3);
  });

  it('should check permissions correctly', () => {
    const authService = TestBed.inject(AuthService);
    
    spyOn(authService, 'getCurrentUser').and.returnValue({ id: 1, rol: 'Admin' } as any);
    component.checkPermissions();
    expect(component.canEdit).toBe(true);

    (authService.getCurrentUser as jasmine.Spy).and.returnValue({ id: 1, rol: 'Cajero' } as any);
    component.checkPermissions();
    expect(component.canEdit).toBe(true);

    (authService.getCurrentUser as jasmine.Spy).and.returnValue({ id: 1, rol: 'Mecánico' } as any);
    component.checkPermissions();
    expect(component.canEdit).toBe(false);
  });

  it('should get client name from map', () => {
    component.clientMap.set(1, { id: 1, nombre: 'Juan Pérez', telefono: '555-1234' });
    
    const name = component.getClientName(1);
    expect(name).toBe('Juan Pérez');

    const unknownName = component.getClientName(999);
    expect(unknownName).toBe('Cliente desconocido');

    const noClientName = component.getClientName(undefined);
    expect(noClientName).toBe('Sin cliente');
  });

  it('should get service count from map', () => {
    component.serviceCountMap.set(1, 5);
    
    const count = component.getServiceCount(1);
    expect(count).toBe(5);

    const noCount = component.getServiceCount(999);
    expect(noCount).toBe(0);

    const undefinedCount = component.getServiceCount(undefined);
    expect(undefinedCount).toBe(0);
  });

  it('should open create modal', () => {
    component.canEdit = true;
    component.openCreateModal();
    
    expect(component.isModalOpen).toBe(true);
    expect(component.modalMode).toBe('create');
    expect(component.selectedVehicle.marca).toBe('');
  });

  it('should open edit modal', () => {
    component.canEdit = true;
    const vehicle = { id: 1, marca: 'Toyota', modelo: 'Corolla', anio: '2023', ClienteId: 1 };
    
    component.openEditModal(vehicle);
    
    expect(component.isModalOpen).toBe(true);
    expect(component.modalMode).toBe('edit');
    expect(component.selectedVehicle.marca).toBe('Toyota');
  });

  it('should close modal', () => {
    component.isModalOpen = true;
    component.selectedVehicle = { marca: 'Test', modelo: 'Test', anio: '2023', ClienteId: 1 };
    
    component.closeModal();
    
    expect(component.isModalOpen).toBe(false);
    expect(component.selectedVehicle.marca).toBe('');
  });
});
