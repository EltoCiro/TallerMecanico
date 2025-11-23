import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonText,
  IonChip,
  IonBadge,
  IonNote,
  IonAccordion,
  IonAccordionGroup,
  IonToggle,
  IonSearchbar,
  ModalController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  saveOutline, 
  addOutline, 
  trashOutline,
  personOutline,
  carOutline,
  constructOutline,
  timeOutline,
  playOutline,
  pauseOutline,
  stopOutline,
  checkmarkCircleOutline,
  createOutline,
  eyeOutline,
  cashOutline, documentsOutline } from 'ionicons/icons';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ServiceOrder, Actividad } from '../../../models/service-order.model';
import { Budget } from '../../../models/budget.model';
import { User } from '../../../models/user.model';
import { Client } from '../../../models/client.model';
import { Vehicle } from '../../../models/vehicle.model';

@Component({
  selector: 'app-service-order-form',
  templateUrl: './service-order-form.component.html',
  styleUrls: ['./service-order-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonList,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonText,
    IonChip,
    IonBadge,
    IonNote,
    IonAccordion,
    IonAccordionGroup,
    IonToggle,
    IonSearchbar
  ]
})
export class ServiceOrderFormComponent implements OnInit {
  @Input() order?: ServiceOrder;
  @Input() fromBudgetId?: number;
  @Input() viewMode = false;

  formData: ServiceOrder = {
    descripcion: '',
    estatus: 'pendiente',
    notas: '',
    actividades: [],
    assignedMechanicIds: [],
    subtotal: 0,
    impuesto: 0,
    total: 0,
    ClienteId: undefined,
    VehiculoId: undefined
  };

  budgets: Budget[] = [];
  approvedBudgets: Budget[] = [];
  mechanics: User[] = [];
  clients: Client[] = [];
  vehicles: Vehicle[] = [];
  vehiclesByClient: Vehicle[] = [];
  currentUser: User | null = null;
  
  // Nueva actividad temporal
  newActivity: Actividad = {
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    horasEstimadas: 0,
    horasReales: 0,
    estatus: 'pendiente',
    mecanicoId: undefined
  };

  // Control de cronómetros
  timers: { [key: string]: any } = {};
  isCreatingFromBudget = false;

  constructor(
    private modalController: ModalController,
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({closeOutline,saveOutline,documentsOutline,cashOutline,personOutline,carOutline,constructOutline,checkmarkCircleOutline,addOutline,timeOutline,playOutline,trashOutline,eyeOutline,pauseOutline,stopOutline,createOutline});
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadData();
    
    if (this.order) {
      console.log('📋 Orden recibida:', this.order);
      console.log('📋 actividadesJson:', this.order.actividadesJson);
      console.log('📋 actividades directas:', this.order.actividades);
      
      // Parsear actividades correctamente
      let actividades: Actividad[] = [];
      if (this.order.actividadesJson) {
        try {
          actividades = JSON.parse(this.order.actividadesJson);
          console.log('✅ Actividades parseadas desde JSON:', actividades);
        } catch (e) {
          console.error('❌ Error parsing actividades:', e);
          actividades = this.order.actividades || [];
        }
      } else {
        actividades = this.order.actividades || [];
        console.log('✅ Actividades desde array directo:', actividades);
      }

      this.formData = { 
        ...this.order,
        actividades: actividades,
        assignedMechanicIds: this.order.Mechanics?.map(m => m.id).filter((id): id is number => id !== undefined) || []
      };
      
      console.log('📝 FormData inicializado:', this.formData);
      console.log('📝 Actividades en formData:', this.formData.actividades);
      
      // Asegurar que ClienteId y VehiculoId se mantengan
      if (this.order.ClienteId) {
        this.formData.ClienteId = this.order.ClienteId;
      }
      if (this.order.VehiculoId) {
        this.formData.VehiculoId = this.order.VehiculoId;
      }
      
      this.calculateTotals();
      
      // Cargar vehículos del cliente si existe - con delay para asegurar que clients y vehicles estén cargados
      if (this.formData.ClienteId) {
        setTimeout(() => {
          this.onClientChange();
        }, 500);
      }
    }

    // Si viene de un presupuesto aprobado, cargar sus datos
    if (this.fromBudgetId) {
      this.loadFromBudget(this.fromBudgetId);
    }
  }

  loadData() {
    // Cargar presupuestos aprobados
    this.apiService.getBudgets().subscribe({
      next: (data) => {
        this.budgets = data;
        this.approvedBudgets = data.filter(b => b.estado === 'aprobado');
      },
      error: (error) => {
        console.error('Error al cargar presupuestos:', error);
      }
    });
    
    // Cargar mecánicos
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.mechanics = data.filter(u => u.rol === 'Mecánico');
      },
      error: (error) => {
        console.error('Error al cargar mecánicos:', error);
      }
    });

    // Cargar clientes
    this.apiService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });

    // Cargar vehículos
    this.apiService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
      },
      error: (error) => {
        console.error('Error al cargar vehículos:', error);
      }
    });
  }

  loadFromBudget(budgetId: number) {
    this.apiService.getBudget(budgetId).subscribe({
      next: (budget) => {
        this.isCreatingFromBudget = true;
        this.formData.BudgetId = budget.id;
        this.formData.ClienteId = budget.ClienteId;
        this.formData.VehiculoId = budget.VehiculoId;
        this.formData.descripcion = budget.descripcion || '';
        
        // Convertir items del presupuesto a actividades
        const items = budget.itemsJson ? JSON.parse(budget.itemsJson) : budget.items;
        if (items && items.length > 0) {
          this.formData.actividades = items.map((item: any) => ({
            id: this.generateId(),
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.unitPrice,
            horasEstimadas: item.tipo === 'mano_obra' ? item.cantidad : 0,
            horasReales: 0,
            estatus: 'pendiente' as const,
            mecanicoId: undefined
          }));
        }

        this.calculateTotals();
        this.onClientChange();
        this.showToast('Datos cargados desde presupuesto', 'success');
      },
      error: (error) => {
        console.error('Error al cargar presupuesto:', error);
        this.showToast('Error al cargar presupuesto', 'danger');
      }
    });
  }

  onBudgetChange(event: any) {
    const budgetId = event.detail.value;
    if (budgetId) {
      this.loadFromBudget(budgetId);
    }
  }

  onClientChange() {
    if (this.formData.ClienteId) {
      this.vehiclesByClient = this.vehicles.filter(v => v.ClienteId === this.formData.ClienteId);
      
      // Si el vehículo seleccionado no pertenece al cliente, limpiarlo
      if (this.formData.VehiculoId) {
        const vehicleExists = this.vehiclesByClient.find(v => v.id === this.formData.VehiculoId);
        if (!vehicleExists) {
          this.formData.VehiculoId = undefined;
        }
      }
    } else {
      this.vehiclesByClient = [];
      this.formData.VehiculoId = undefined;
    }
  }

  onClientChangeEvent(event: any) {
    const value = event.detail.value;
    this.formData.ClienteId = value;
    this.onClientChange();
  }

  onVehicleChangeEvent(event: any) {
    const value = event.detail.value;
    this.formData.VehiculoId = value;
  }

  async save() {
    console.log('💾 Intentando guardar...');
    console.log('💾 FormData actual:', this.formData);
    console.log('💾 Actividades antes de guardar:', this.formData.actividades);
    
    // Validaciones
    if (!this.formData.descripcion?.trim()) {
      await this.showToast('La descripción es requerida', 'warning');
      return;
    }

    if (!this.formData.ClienteId) {
      await this.showToast('Debe seleccionar un cliente', 'warning');
      return;
    }

    if (!this.formData.VehiculoId) {
      await this.showToast('Debe seleccionar un vehículo', 'warning');
      return;
    }

    if (!this.formData.actividades || this.formData.actividades.length === 0) {
      await this.showToast('Debe agregar al menos una actividad', 'warning');
      return;
    }

    if (!this.formData.assignedMechanicIds || this.formData.assignedMechanicIds.length === 0) {
      await this.showToast('Debe asignar al menos un mecánico', 'warning');
      return;
    }

    // Asegurar que los totales estén calculados
    this.calculateTotals();

    // Convertir actividades a JSON
    const dataToSave = {
      ...this.formData,
      actividadesJson: JSON.stringify(this.formData.actividades)
    };

    console.log('💾 Data a enviar:', dataToSave);
    console.log('💾 actividadesJson:', dataToSave.actividadesJson);

    if (this.order && this.order.id) {
      // Actualizar orden existente
      this.apiService.updateServiceOrder(this.order.id, dataToSave).subscribe({
        next: async () => {
          console.log('✅ Orden actualizada correctamente');
          await this.showToast('Orden actualizada correctamente', 'success');
          this.dismiss(true);
        },
        error: async (error) => {
          console.error('❌ Error al actualizar orden:', error);
          await this.showToast('Error al actualizar orden', 'danger');
        }
      });
    } else {
      // Crear nueva orden
      this.apiService.createServiceOrder(dataToSave).subscribe({
        next: async () => {
          console.log('✅ Orden creada correctamente');
          await this.showToast('Orden creada correctamente', 'success');
          this.dismiss(true);
        },
        error: async (error) => {
          console.error('❌ Error al crear orden:', error);
          await this.showToast('Error al crear orden', 'danger');
        }
      });
    }
  }

  // Gestión de actividades
  addActivity() {
    if (!this.newActivity.descripcion?.trim()) {
      this.showToast('Ingrese la descripción de la actividad', 'warning');
      return;
    }

    if (this.newActivity.cantidad <= 0) {
      this.showToast('La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    if (this.newActivity.precioUnitario <= 0) {
      this.showToast('El precio unitario debe ser mayor a 0', 'warning');
      return;
    }

    this.formData.actividades = this.formData.actividades || [];
    this.formData.actividades.push({
      id: this.generateId(),
      descripcion: this.newActivity.descripcion,
      cantidad: this.newActivity.cantidad,
      precioUnitario: this.newActivity.precioUnitario,
      mecanicoId: this.newActivity.mecanicoId,
      horasEstimadas: this.newActivity.horasEstimadas || 0,
      horasReales: 0,
      estatus: 'pendiente',
      fechaInicio: undefined,
      fechaFin: undefined
    });

    // Resetear formulario de actividad
    this.newActivity = {
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      horasEstimadas: 0,
      horasReales: 0,
      estatus: 'pendiente',
      mecanicoId: undefined
    };

    this.calculateTotals();
  }

  removeActivity(index: number) {
    const alert = this.alertController.create({
      header: 'Confirmar',
      message: '¿Eliminar esta actividad?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.formData.actividades?.splice(index, 1);
            this.calculateTotals();
          }
        }
      ]
    }).then(a => a.present());
  }

  async changeActivityStatus(activity: Actividad, newStatus: 'pendiente' | 'en_proceso' | 'completada') {
    activity.estatus = newStatus;

    if (newStatus === 'en_proceso' && !activity.fechaInicio) {
      activity.fechaInicio = new Date().toISOString();
    } else if (newStatus === 'completada' && !activity.fechaFin) {
      activity.fechaFin = new Date().toISOString();
      
      // Calcular horas reales si hay inicio y fin
      if (activity.fechaInicio) {
        const inicio = new Date(activity.fechaInicio).getTime();
        const fin = new Date(activity.fechaFin).getTime();
        const horasReales = (fin - inicio) / (1000 * 60 * 60);
        activity.horasReales = Math.round(horasReales * 100) / 100;
      }
    }

    await this.showToast(`Actividad marcada como ${this.getActivityStatusLabel(newStatus)}`, 'success');
  }

  startActivity(activity: Actividad) {
    activity.estatus = 'en_proceso';
    activity.fechaInicio = new Date().toISOString();
    this.showToast('Actividad iniciada', 'success');
  }

  completeActivity(activity: Actividad) {
    if (activity.estatus === 'pendiente') {
      this.showToast('Debe iniciar la actividad antes de completarla', 'warning');
      return;
    }

    activity.estatus = 'completada';
    activity.fechaFin = new Date().toISOString();

    // Calcular horas reales
    if (activity.fechaInicio) {
      const inicio = new Date(activity.fechaInicio).getTime();
      const fin = new Date(activity.fechaFin).getTime();
      const horasReales = (fin - inicio) / (1000 * 60 * 60);
      activity.horasReales = Math.round(horasReales * 100) / 100;
    }

    this.showToast('Actividad completada', 'success');
  }

  calculateTotals() {
    const subtotal = (this.formData.actividades || []).reduce((sum, act) => {
      return sum + (act.cantidad * act.precioUnitario);
    }, 0);

    const impuesto = subtotal * 0.16; // 16% de IVA
    const total = subtotal + impuesto;

    this.formData.subtotal = +subtotal.toFixed(2);
    this.formData.impuesto = +impuesto.toFixed(2);
    this.formData.total = +total.toFixed(2);
  }

  getActivityStatusLabel(status?: string): string {
    switch (status) {
      case 'completada': return 'Completada';
      case 'en_proceso': return 'En Proceso';
      case 'pendiente': return 'Pendiente';
      default: return 'Desconocido';
    }
  }

  getActivityStatusColor(status?: string): string {
    switch (status) {
      case 'completada': return 'success';
      case 'en_proceso': return 'warning';
      case 'pendiente': return 'medium';
      default: return 'medium';
    }
  }

  getMechanicName(id?: number): string {
    if (!id) return 'Sin asignar';
    const mechanic = this.mechanics.find(m => m.id === id);
    return mechanic?.nombre || 'Desconocido';
  }

  getClientName(id?: number): string {
    if (!id) return 'Sin seleccionar';
    const client = this.clients.find(c => c.id === id);
    return client?.nombre || 'Desconocido';
  }

  getVehicleInfo(id?: number): string {
    if (!id) return 'Sin seleccionar';
    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) return 'Desconocido';
    return `${vehicle.marca} ${vehicle.modelo} (${vehicle.placas})`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
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

  calculateDuration(start?: string, end?: string): string {
    if (!start || !end) return 'N/A';
    const inicio = new Date(start).getTime();
    const fin = new Date(end).getTime();
    const hours = (fin - inicio) / (1000 * 60 * 60);
    return `${hours.toFixed(2)}h`;
  }

  generateId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  dismiss(reload = false) {
    this.modalController.dismiss({ reload });
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
