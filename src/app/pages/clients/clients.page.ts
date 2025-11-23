import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonModal,
  IonInput,
  IonTextarea,
  IonSegment,
  IonSegmentButton,
  IonChip,
  IonNote,
  IonSkeletonText,
  IonGrid,
  IonRow,
  IonCol,
  IonAccordionGroup,
  IonAccordion,
  IonText,
  IonSpinner,
  IonMenuButton,
  ModalController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  callOutline,
  mailOutline,
  carOutline,
  chevronForwardOutline,
  createOutline,
  trashOutline,
  closeOutline,
  saveOutline,
  listOutline,
  gridOutline,
  personOutline,
  locationOutline,
  timeOutline,
  documentTextOutline,
  cashOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  syncOutline, homeOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Client } from '../../models/client.model';
import { Vehicle } from '../../models/vehicle.model';
import { ServiceOrder } from '../../models/service-order.model';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonModal,
    IonInput,
    IonTextarea,
    IonSegment,
    IonSegmentButton,
    IonChip,
    IonNote,
    IonSkeletonText,
    IonGrid,
    IonRow,
    IonCol,
    IonAccordionGroup,
    IonAccordion,
    IonText,
    IonSpinner,
    IonMenuButton
  ],
  standalone: true
})
export class ClientsPage implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm = '';
  viewMode: 'list' | 'cards' = 'list';
  isLoading = true;
  maxYear = new Date().getFullYear() + 1;

  // Modal states
  isClientModalOpen = false;
  isVehicleModalOpen = false;
  isDetailModalOpen = false;
  isHistoryModalOpen = false;

  // Forms
  clientForm!: FormGroup;
  vehicleForm!: FormGroup;

  // Current selections
  selectedClient: Client | null = null;
  selectedVehicle: Vehicle | null = null;
  serviceHistory: ServiceOrder[] = [];
  loadingHistory = false;

  // Permissions
  canEdit = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({homeOutline,listOutline,gridOutline,personOutline,addOutline,callOutline,mailOutline,locationOutline,carOutline,createOutline,trashOutline,closeOutline,saveOutline,documentTextOutline,timeOutline,cashOutline,chevronForwardOutline,checkmarkCircleOutline,hourglassOutline,syncOutline});
  }

  ngOnInit() {
    this.checkPermissions();
    this.initializeForms();
    this.loadClients();
  }

  checkPermissions() {
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.rol === 'Administrador' || user?.rol === 'Cajero';
  }

  initializeForms() {
    this.clientForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      telefono: [''],
      correo: ['', Validators.email],
      direccion: ['']
    });

    this.vehicleForm = this.formBuilder.group({
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      anio: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      placas: [''],
      vin: ['']
    });
  }

  loadClients(event?: any) {
    this.isLoading = true;
    this.apiService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = data;
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: async (error) => {
        console.error('Error loading clients:', error);
        await this.showToast('Error al cargar clientes', 'danger');
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  filterClients() {
    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.nombre.toLowerCase().includes(term) ||
      client.telefono?.toLowerCase().includes(term) ||
      client.correo?.toLowerCase().includes(term) ||
      client.direccion?.toLowerCase().includes(term)
    );
  }

  changeViewMode(mode: 'list' | 'cards') {
    this.viewMode = mode;
  }

  // ==================== CLIENT CRUD ====================

  openCreateClientModal() {
    if (!this.canEdit) {
      this.showToast('No tienes permisos para realizar esta acción', 'warning');
      return;
    }
    this.selectedClient = null;
    this.clientForm.reset();
    this.isClientModalOpen = true;
  }

  openEditClientModal(client: Client) {
    if (!this.canEdit) {
      this.showToast('No tienes permisos para realizar esta acción', 'warning');
      return;
    }
    this.selectedClient = client;
    this.clientForm.patchValue({
      nombre: client.nombre,
      telefono: client.telefono || '',
      correo: client.correo || '',
      direccion: client.direccion || ''
    });
    this.isClientModalOpen = true;
  }

  closeClientModal() {
    this.isClientModalOpen = false;
    this.selectedClient = null;
    this.clientForm.reset();
  }

  async saveClient() {
    if (this.clientForm.invalid) {
      await this.showToast('Por favor completa los campos requeridos', 'warning');
      return;
    }

    const clientData: Client = this.clientForm.value;

    if (this.selectedClient?.id) {
      // Update
      this.apiService.updateClient(this.selectedClient.id, clientData).subscribe({
        next: async () => {
          await this.showToast('Cliente actualizado exitosamente', 'success');
          this.closeClientModal();
          this.loadClients();
        },
        error: async (error) => {
          console.error('Error updating client:', error);
          await this.showToast('Error al actualizar cliente', 'danger');
        }
      });
    } else {
      // Create
      this.apiService.createClient(clientData).subscribe({
        next: async () => {
          await this.showToast('Cliente creado exitosamente', 'success');
          this.closeClientModal();
          this.loadClients();
        },
        error: async (error) => {
          console.error('Error creating client:', error);
          await this.showToast('Error al crear cliente', 'danger');
        }
      });
    }
  }

  async confirmDeleteClient(client: Client, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (!this.canEdit) {
      await this.showToast('No tienes permisos para realizar esta acción', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar al cliente <strong>${client.nombre}</strong>?${
        client.Vehicles && client.Vehicles.length > 0
          ? `<br><br><ion-text color="warning">⚠️ Este cliente tiene ${client.Vehicles.length} vehículo(s) registrado(s).</ion-text>`
          : ''
      }`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteClient(client);
          }
        }
      ]
    });

    await alert.present();
  }

  deleteClient(client: Client) {
    if (!client.id) return;

    this.apiService.deleteClient(client.id).subscribe({
      next: async () => {
        await this.showToast('Cliente eliminado exitosamente', 'success');
        this.loadClients();
      },
      error: async (error) => {
        console.error('Error deleting client:', error);
        await this.showToast('Error al eliminar cliente', 'danger');
      }
    });
  }

  // ==================== VEHICLE MANAGEMENT ====================

  openAddVehicleModal(client: Client) {
    if (!this.canEdit) {
      this.showToast('No tienes permisos para realizar esta acción', 'warning');
      return;
    }
    this.selectedClient = client;
    this.selectedVehicle = null;
    this.vehicleForm.reset({ anio: new Date().getFullYear() });
    this.isVehicleModalOpen = true;
  }

  openEditVehicleModal(client: Client, vehicle: Vehicle) {
    if (!this.canEdit) {
      this.showToast('No tienes permisos para realizar esta acción', 'warning');
      return;
    }
    this.selectedClient = client;
    this.selectedVehicle = vehicle;
    this.vehicleForm.patchValue({
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      anio: vehicle.anio || new Date().getFullYear().toString(),
      placas: vehicle.placas || ''
    });
    this.isVehicleModalOpen = true;
  }

  closeVehicleModal() {
    this.isVehicleModalOpen = false;
    this.selectedClient = null;
    this.selectedVehicle = null;
    this.vehicleForm.reset();
  }

  async saveVehicle() {
    if (this.vehicleForm.invalid || !this.selectedClient?.id) {
      await this.showToast('Por favor completa los campos requeridos', 'warning');
      return;
    }

    const vehicleData: Vehicle = {
      ...this.vehicleForm.value,
      ClientId: this.selectedClient.id
    };

    if (this.selectedVehicle?.id) {
      // Update
      this.apiService.updateVehicle(this.selectedVehicle.id, vehicleData).subscribe({
        next: async () => {
          await this.showToast('Vehículo actualizado exitosamente', 'success');
          this.closeVehicleModal();
          this.loadClients();
        },
        error: async (error) => {
          console.error('Error updating vehicle:', error);
          await this.showToast('Error al actualizar vehículo', 'danger');
        }
      });
    } else {
      // Create
      this.apiService.createVehicle(vehicleData).subscribe({
        next: async () => {
          await this.showToast('Vehículo agregado exitosamente', 'success');
          this.closeVehicleModal();
          this.loadClients();
        },
        error: async (error) => {
          console.error('Error creating vehicle:', error);
          await this.showToast('Error al agregar vehículo', 'danger');
        }
      });
    }
  }

  async confirmDeleteVehicle(client: Client, vehicle: Vehicle) {
    if (!this.canEdit) {
      await this.showToast('No tienes permisos para realizar esta acción', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Eliminar el vehículo <strong>${vehicle.marca} ${vehicle.modelo}</strong> (${vehicle.placas})?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteVehicle(vehicle);
          }
        }
      ]
    });

    await alert.present();
  }

  deleteVehicle(vehicle: Vehicle) {
    if (!vehicle.id) return;

    this.apiService.deleteVehicle(vehicle.id).subscribe({
      next: async () => {
        await this.showToast('Vehículo eliminado exitosamente', 'success');
        this.loadClients();
      },
      error: async (error) => {
        console.error('Error deleting vehicle:', error);
        await this.showToast('Error al eliminar vehículo', 'danger');
      }
    });
  }

  // ==================== CLIENT DETAILS & HISTORY ====================

  openClientDetails(client: Client) {
    this.selectedClient = client;
    this.isDetailModalOpen = true;
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedClient = null;
  }

  openServiceHistory(client: Client) {
    this.selectedClient = client;
    this.loadServiceHistory(client);
    this.isHistoryModalOpen = true;
  }

  closeHistoryModal() {
    this.isHistoryModalOpen = false;
    this.selectedClient = null;
    this.serviceHistory = [];
  }

  loadServiceHistory(client: Client) {
    if (!client.id) return;

    this.loadingHistory = true;
    this.apiService.getServiceOrders().subscribe({
      next: (orders) => {
        this.serviceHistory = orders.filter(order => order.ClienteId === client.id);
        this.loadingHistory = false;
      },
      error: async (error) => {
        console.error('Error loading service history:', error);
        await this.showToast('Error al cargar historial de servicios', 'danger');
        this.loadingHistory = false;
      }
    });
  }

  getServicesByVehicle(vehicleId?: number): ServiceOrder[] {
    if (!vehicleId) return [];
    return this.serviceHistory.filter(order => order.VehiculoId === vehicleId);
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'completada':
        return 'success';
      case 'en_proceso':
        return 'warning';
      case 'pendiente':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'completada':
        return 'checkmark-circle-outline';
      case 'en_proceso':
        return 'sync-outline';
      case 'pendiente':
        return 'hourglass-outline';
      default:
        return 'hourglass-outline';
    }
  }

  getStatusText(status?: string): string {
    switch (status) {
      case 'completada':
        return 'Completada';
      case 'en_proceso':
        return 'En Proceso';
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'N/A';
    }
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount?: number): string {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  getTotalServicesAmount(): number {
    return this.serviceHistory.reduce((sum, s) => sum + (s.total || 0), 0);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
