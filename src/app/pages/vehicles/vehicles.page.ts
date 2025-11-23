import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonIcon,
  IonBadge,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSkeletonText,
  IonText,
  IonNote,
  AlertController,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  search,
  car,
  person,
  trash,
  create,
  list,
  calendar,
  card,
  close,
  save,
  construct,
  time, call } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Vehicle } from '../../models/vehicle.model';
import { Client } from '../../models/client.model';
import { ServiceOrder } from '../../models/service-order.model';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.page.html',
  styleUrls: ['./vehicles.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonIcon,
    IonBadge,
    IonFab,
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSkeletonText,
    IonText,
    IonNote
  ]
})
export class VehiclesPage implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  clients: Client[] = [];
  searchTerm: string = '';
  viewMode: 'list' | 'cards' = 'cards';
  isLoading: boolean = false;
  selectedClientFilter: number | null = null;

  // Modal
  isModalOpen: boolean = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedVehicle: Vehicle = this.getEmptyVehicle();

  // Validación
  validationErrors: { [key: string]: string } = {};

  // Permisos
  canEdit: boolean = false;

  // Mapa de clientes para búsqueda rápida
  clientMap: Map<number, Client> = new Map();

  // Mapa de servicios por vehículo
  serviceCountMap: Map<number, number> = new Map();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController
  ) {
    addIcons({card,list,car,add,calendar,construct,person,call,time,create,trash,close,save,search});
  }

  ngOnInit() {
    this.checkPermissions();
    this.loadData();
  }

  checkPermissions() {
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.rol === 'Administrador' || user?.rol === 'Cajero';
  }

  async loadData() {
    this.isLoading = true;
    try {
      // Cargar vehículos y clientes en paralelo
      const [vehicles, clients] = await Promise.all([
        this.apiService.getVehicles().toPromise(),
        this.apiService.getClients().toPromise()
      ]);

      this.vehicles = vehicles || [];
      this.clients = clients || [];

      // Crear mapa de clientes
      this.clientMap.clear();
      this.clients.forEach(client => {
        if (client.id) {
          this.clientMap.set(client.id, client);
        }
      });

      // Cargar conteo de servicios
      await this.loadServiceCounts();

      this.filterVehicles();
    } catch (error) {
      console.error('Error loading data:', error);
      await this.showToast('Error al cargar los datos', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async loadServiceCounts() {
    try {
      const orders = await this.apiService.getServiceOrders().toPromise();
      this.serviceCountMap.clear();

      orders?.forEach((order: ServiceOrder) => {
        if (order.VehiculoId) {
          const count = this.serviceCountMap.get(order.VehiculoId) || 0;
          this.serviceCountMap.set(order.VehiculoId, count + 1);
        }
      });
    } catch (error) {
      console.error('Error loading service counts:', error);
    }
  }

  filterVehicles() {
    let filtered = [...this.vehicles];

    // Filtrar por cliente
    if (this.selectedClientFilter) {
      filtered = filtered.filter(v => v.ClienteId === this.selectedClientFilter);
    }

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(vehicle => {
        const client = this.getClientName(vehicle.ClienteId);
        return (
          vehicle.marca?.toLowerCase().includes(term) ||
          vehicle.modelo?.toLowerCase().includes(term) ||
          vehicle.placas?.toLowerCase().includes(term) ||
          vehicle.vin?.toLowerCase().includes(term) ||
          client.toLowerCase().includes(term)
        );
      });
    }

    this.filteredVehicles = filtered;
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.filterVehicles();
  }

  onClientFilterChange(event: any) {
    this.selectedClientFilter = event.detail.value;
    this.filterVehicles();
  }

  onViewModeChange(event: any) {
    this.viewMode = event.detail.value;
  }

  async handleRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  async openCreateModal() {
    if (!this.canEdit) {
      await this.showToast('No tienes permisos para crear vehículos', 'warning');
      return;
    }
    
    // Asegurar que tenemos los clientes cargados
    if (this.clients.length === 0) {
      try {
        const clients = await this.apiService.getClients().toPromise();
        this.clients = clients || [];
      } catch (error) {
        console.error('Error loading clients:', error);
        await this.showToast('Error al cargar clientes', 'danger');
        return;
      }
    }
    
    this.modalMode = 'create';
    this.selectedVehicle = this.getEmptyVehicle();
    this.validationErrors = {};
    this.isModalOpen = true;
  }

  openEditModal(vehicle: Vehicle) {
    if (!this.canEdit) {
      this.showToast('No tienes permisos para editar vehículos', 'warning');
      return;
    }
    this.modalMode = 'edit';
    this.selectedVehicle = { ...vehicle };
    this.validationErrors = {};
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedVehicle = this.getEmptyVehicle();
    this.validationErrors = {};
  }

  onClientSelected(event: any) {
    const value = event.detail.value;
    // Asegurar que se asigne correctamente
    this.selectedVehicle.ClienteId = value;
  }

  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    if (!this.selectedVehicle.marca?.trim()) {
      this.validationErrors['marca'] = 'La marca es obligatoria';
      isValid = false;
    }

    if (!this.selectedVehicle.modelo?.trim()) {
      this.validationErrors['modelo'] = 'El modelo es obligatorio';
      isValid = false;
    }

    if (!this.selectedVehicle.anio) {
      this.validationErrors['anio'] = 'El año es obligatorio';
      isValid = false;
    } else {
      const anioNum = parseInt(this.selectedVehicle.anio);
      if (isNaN(anioNum) || anioNum < 1900 || anioNum > 2026) {
        this.validationErrors['anio'] = 'El año debe estar entre 1900 y 2026';
        isValid = false;
      }
    }

    if (!this.selectedVehicle.ClienteId) {
      this.validationErrors['ClienteId'] = 'Debes seleccionar un cliente';
      isValid = false;
    }

    return isValid;
  }

  async saveVehicle() {
    if (!this.validateForm()) {
      await this.showToast('Por favor corrige los errores en el formulario', 'warning');
      return;
    }

    try {
      if (this.modalMode === 'create') {
        await this.apiService.createVehicle(this.selectedVehicle).toPromise();
        await this.showToast('Vehículo creado exitosamente', 'success');
      } else {
        await this.apiService.updateVehicle(this.selectedVehicle.id!, this.selectedVehicle).toPromise();
        await this.showToast('Vehículo actualizado exitosamente', 'success');
      }

      this.closeModal();
      await this.loadData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      await this.showToast('Error al guardar el vehículo', 'danger');
    }
  }

  async confirmDelete(vehicle: Vehicle) {
    if (!this.canEdit) {
      await this.showToast('No tienes permisos para eliminar vehículos', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el vehículo ${vehicle.marca} ${vehicle.modelo}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteVehicle(vehicle.id!);
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteVehicle(id: number) {
    try {
      await this.apiService.deleteVehicle(id).toPromise();
      await this.showToast('Vehículo eliminado exitosamente', 'success');
      await this.loadData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      await this.showToast('Error al eliminar el vehículo', 'danger');
    }
  }

  async viewServiceHistory(vehicle: Vehicle) {
    try {
      const allOrders = await this.apiService.getServiceOrders().toPromise();
      const vehicleOrders = allOrders?.filter(order => order.VehiculoId === vehicle.id) || [];

      if (vehicleOrders.length === 0) {
        await this.showToast('Este vehículo no tiene servicios registrados', 'warning');
        return;
      }

      // Mostrar historial en un alert
      const message = vehicleOrders.map((order, index) => {
        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
        const status = this.getStatusLabel(order.estatus || 'pendiente');
        return `${index + 1}. ${date} - ${status} - $${order.total || 0}`;
      }).join('\n');

      const alert = await this.alertController.create({
        header: `Historial de Servicios`,
        subHeader: `${vehicle.marca} ${vehicle.modelo} (${vehicle.placas || 'Sin placas'})`,
        message: message,
        buttons: ['Cerrar']
      });

      await alert.present();
    } catch (error) {
      console.error('Error loading service history:', error);
      await this.showToast('Error al cargar el historial de servicios', 'danger');
    }
  }

  getClientName(clientId?: number): string {
    if (!clientId) return 'Sin cliente';
    const client = this.clientMap.get(clientId);
    return client?.nombre || 'Cliente desconocido';
  }

  getClientPhone(clientId?: number): string {
    if (!clientId) return '';
    const client = this.clientMap.get(clientId);
    return client?.telefono || 'Sin teléfono';
  }

  getServiceCount(vehicleId?: number): number {
    if (!vehicleId) return 0;
    return this.serviceCountMap.get(vehicleId) || 0;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En Proceso',
      'completada': 'Completada'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pendiente': 'warning',
      'en_proceso': 'primary',
      'completada': 'success'
    };
    return colors[status] || 'medium';
  }

  private getEmptyVehicle(): Vehicle {
    return {
      marca: '',
      modelo: '',
      anio: new Date().getFullYear().toString(),
      placas: '',
      vin: '',
      ClienteId: undefined
    };
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
