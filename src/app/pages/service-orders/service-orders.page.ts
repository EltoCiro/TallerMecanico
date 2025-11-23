import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonProgressBar,
  IonSkeletonText,
  IonNote,
  ModalController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  clipboardOutline, 
  chevronForwardOutline, 
  checkmarkCircleOutline, 
  timeOutline, 
  constructOutline, 
  createOutline, 
  trashOutline,
  personOutline,
  carOutline,
  calendarOutline,
  cashOutline,
  filterOutline,
  playOutline,
  pauseOutline,
  documentsOutline,
  eyeOutline, swapHorizontalOutline, homeOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ServiceOrder, Actividad } from '../../models/service-order.model';
import { User } from '../../models/user.model';
import { Client } from '../../models/client.model';
import { Vehicle } from '../../models/vehicle.model';
import { ServiceOrderFormComponent } from './service-order-form/service-order-form.component';

@Component({
  selector: 'app-service-orders',
  templateUrl: './service-orders.page.html',
  styleUrls: ['./service-orders.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonFab,
    IonFabButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    IonProgressBar,
    IonSkeletonText,
    IonNote
  ]
})
export class ServiceOrdersPage implements OnInit {
  orders: ServiceOrder[] = [];
  filteredOrders: ServiceOrder[] = [];
  searchTerm = '';
  selectedStatus: string = 'todas';
  isLoading = true;
  currentUser: User | null = null;
  clients: Client[] = [];
  vehicles: Vehicle[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({homeOutline,clipboardOutline,addOutline,documentsOutline,personOutline,carOutline,constructOutline,checkmarkCircleOutline,timeOutline,calendarOutline,swapHorizontalOutline,createOutline,trashOutline,chevronForwardOutline,cashOutline,filterOutline,playOutline,pauseOutline,eyeOutline});
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadOrders();
    this.loadClients();
    this.loadVehicles();
  }

  loadOrders(event?: any) {
    this.isLoading = true;
    this.apiService.getServiceOrders().subscribe({
      next: (data) => {
        // Parsear actividades JSON
        this.orders = data.map(order => ({
          ...order,
          actividades: order.actividadesJson ? JSON.parse(order.actividadesJson) : []
        }));

        // Filtrar órdenes según el rol del usuario
        if (this.currentUser?.rol === 'Mecánico') {
          this.orders = this.orders.filter(order => 
            order.Mechanics?.some(m => m.id === this.currentUser?.id)
          );
        }

        this.applyFilters();
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: async (error) => {
        console.error('Error al cargar órdenes:', error);
        console.error('Error details:', error.error);
        await this.showToast('Error al cargar órdenes. Verifica el backend.', 'danger');
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  loadClients() {
    this.apiService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  loadVehicles() {
    this.apiService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
      },
      error: (error) => {
        console.error('Error al cargar vehículos:', error);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.orders];

    // Filtrar por estatus
    if (this.selectedStatus !== 'todas') {
      filtered = filtered.filter(order => order.estatus === this.selectedStatus);
    }

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const client = this.getClientName(order.ClienteId);
        const vehicle = this.getVehicleInfo(order.VehiculoId);
        const mechanics = this.getMechanicsNames(order);
        
        return (
          order.descripcion?.toLowerCase().includes(term) ||
          client.toLowerCase().includes(term) ||
          vehicle.toLowerCase().includes(term) ||
          mechanics.toLowerCase().includes(term) ||
          order.notas?.toLowerCase().includes(term) ||
          order.id?.toString().includes(term)
        );
      });
    }

    this.filteredOrders = filtered;
  }

  onStatusChange(event: any) {
    this.selectedStatus = event.detail.value;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  async openOrderForm(order?: ServiceOrder, fromBudgetId?: number) {
    const modal = await this.modalController.create({
      component: ServiceOrderFormComponent,
      componentProps: { 
        order,
        fromBudgetId 
      },
      cssClass: 'fullscreen-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.reload) {
        this.loadOrders();
      }
    });

    await modal.present();
  }

  async viewOrderDetails(order: ServiceOrder) {
    // Abrir modal en modo solo lectura
    const modal = await this.modalController.create({
      component: ServiceOrderFormComponent,
      componentProps: { 
        order,
        viewMode: true
      },
      cssClass: 'fullscreen-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.reload) {
        this.loadOrders();
      }
    });

    await modal.present();
  }

  async changeOrderStatus(order: ServiceOrder, event: Event) {
    event.stopPropagation();

    // Validar que tenga actividades
    if (!order.actividades || order.actividades.length === 0) {
      await this.showToast('La orden debe tener al menos una actividad', 'warning');
      return;
    }

    // Si intenta marcar como completada, validar que todas las actividades estén completadas
    const hasIncompleteActivities = order.actividades.some(
      a => a.estatus !== 'completada'
    );

    const alert = await this.alertController.create({
      header: 'Cambiar Estado',
      message: `Orden #${order.id} - ${this.getClientName(order.ClienteId)}`,
      inputs: [
        { 
          type: 'radio', 
          label: 'Pendiente', 
          value: 'pendiente', 
          checked: order.estatus === 'pendiente' 
        },
        { 
          type: 'radio', 
          label: 'En Proceso', 
          value: 'en_proceso', 
          checked: order.estatus === 'en_proceso' 
        },
        { 
          type: 'radio', 
          label: 'Completada', 
          value: 'completada', 
          checked: order.estatus === 'completada',
          disabled: hasIncompleteActivities
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: (newStatus) => {
            if (newStatus && order.id) {
              if (newStatus === 'completada' && hasIncompleteActivities) {
                this.showToast('No se puede completar: hay actividades pendientes', 'warning');
                return false;
              }

              // Actualizar el estado visualmente de inmediato
              const oldStatus = order.estatus;
              order.estatus = newStatus;
              this.applyFilters();

              this.apiService.updateOrderStatus(order.id, newStatus).subscribe({
                next: async () => {
                  await this.showToast('Estado actualizado correctamente', 'success');
                  this.loadOrders();
                },
                error: async (error) => {
                  // Revertir el cambio si falla
                  order.estatus = oldStatus;
                  this.applyFilters();
                  console.error('Error al actualizar estado:', error);
                  await this.showToast('Error al actualizar estado', 'danger');
                }
              });
            }
            return true;
          }
        }
      ]
    });

    if (hasIncompleteActivities) {
      alert.message += '<br><br><ion-text color="warning"><small>⚠️ No se puede marcar como completada: hay actividades pendientes</small></ion-text>';
    }

    await alert.present();
  }

  async deleteOrder(order: ServiceOrder, event: Event) {
    event.stopPropagation();

    // Solo Admin puede eliminar
    if (this.currentUser?.rol !== 'Administrador') {
      await this.showToast('Solo el Administrador puede eliminar órdenes', 'warning');
      return;
    }
    
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar la orden #${order.id} de ${this.getClientName(order.ClienteId)}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (order.id) {
              this.apiService.deleteServiceOrder(order.id).subscribe({
                next: async () => {
                  await this.showToast('Orden eliminada correctamente', 'success');
                  this.loadOrders();
                },
                error: async (error) => {
                  console.error('Error al eliminar orden:', error);
                  await this.showToast('Error al eliminar orden', 'danger');
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  getClientName(clientId?: number): string {
    if (!clientId) return 'Sin cliente';
    const client = this.clients.find(c => c.id === clientId);
    return client?.nombre || 'Desconocido';
  }

  getVehicleInfo(vehicleId?: number): string {
    if (!vehicleId) return 'Sin vehículo';
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return 'Desconocido';
    return `${vehicle.marca} ${vehicle.modelo} - ${vehicle.placas}`;
  }

  getMechanicsNames(order: ServiceOrder): string {
    if (!order.Mechanics || order.Mechanics.length === 0) {
      return 'Sin asignar';
    }
    return order.Mechanics.map(m => m.nombre).join(', ');
  }

  getActivitiesProgress(order: ServiceOrder): number {
    if (!order.actividades || order.actividades.length === 0) return 0;
    
    const completed = order.actividades.filter(a => a.estatus === 'completada').length;
    return completed / order.actividades.length;
  }

  getActivitiesStats(order: ServiceOrder): string {
    if (!order.actividades || order.actividades.length === 0) return '0/0';
    
    const completed = order.actividades.filter(a => a.estatus === 'completada').length;
    return `${completed}/${order.actividades.length}`;
  }

  getTotalHours(order: ServiceOrder): number {
    if (!order.actividades || order.actividades.length === 0) return 0;
    
    return order.actividades.reduce((sum, act) => {
      return sum + (act.horasReales || act.horasEstimadas || 0);
    }, 0);
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'completada': return 'Completada';
      case 'en_proceso': return 'En Proceso';
      case 'pendiente': return 'Pendiente';
      default: return 'Desconocido';
    }
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'completada': return 'success';
      case 'en_proceso': return 'warning';
      case 'pendiente': return 'medium';
      default: return 'medium';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'completada': return 'checkmark-circle-outline';
      case 'en_proceso': return 'construct-outline';
      case 'pendiente': return 'time-outline';
      default: return 'time-outline';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount?: number): string {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  canEdit(): boolean {
    return this.currentUser?.rol === 'Administrador' || 
           this.currentUser?.rol === 'Cajero';
  }

  canDelete(): boolean {
    return this.currentUser?.rol === 'Administrador';
  }

  canChangeStatus(): boolean {
    return this.currentUser?.rol !== undefined;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
