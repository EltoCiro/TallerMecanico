import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
  IonChip,
  IonText,
  ModalController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  saveOutline, 
  addCircleOutline, 
  trashOutline,
  hammerOutline,
  cubeOutline
} from 'ionicons/icons';
import { ApiService } from '../../../services/api.service';
import { Budget, BudgetItem } from '../../../models/budget.model';
import { Client } from '../../../models/client.model';
import { Vehicle } from '../../../models/vehicle.model';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-budget-form',
  templateUrl: './budget-form.component.html',
  styleUrls: ['./budget-form.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
    IonChip,
    IonText
  ]
})
export class BudgetFormComponent implements OnInit {
  @Input() budget?: Budget;

  // Datos del presupuesto
  selectedClientId?: number;
  selectedVehicleId?: number;
  descripcion: string = '';
  items: BudgetItem[] = [];
  descuentoTipo: 'monto' | 'porcentaje' = 'monto';
  descuentoValor: number = 0;

  // Catálogos
  clients: Client[] = [];
  vehicles: Vehicle[] = [];
  allVehicles: Vehicle[] = [];
  products: Product[] = [];

  // Cálculos
  subtotal: number = 0;
  impuesto: number = 0;
  descuento: number = 0;
  total: number = 0;
  impuestoTasa: number = 0.16; // 16%

  // UI
  isEditMode = false;
  loading = false;

  // Nuevo item
  newItem: BudgetItem = this.createEmptyItem();

  constructor(
    private apiService: ApiService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ 
      closeOutline, 
      saveOutline, 
      addCircleOutline, 
      trashOutline,
      hammerOutline,
      cubeOutline
    });
  }

  ngOnInit() {
    this.loadCatalogs();
    
    if (this.budget) {
      this.isEditMode = true;
      this.loadBudgetData();
    }
  }

  loadCatalogs() {
    // Cargar clientes
    this.apiService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });

    // Cargar todos los vehículos
    this.apiService.getVehicles().subscribe({
      next: (data) => {
        this.allVehicles = data;
      },
      error: (error) => {
        console.error('Error al cargar vehículos:', error);
      }
    });

    // Cargar productos
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  loadBudgetData() {
    if (!this.budget) return;

    this.selectedClientId = this.budget.ClienteId;
    this.selectedVehicleId = this.budget.VehiculoId;
    this.descripcion = this.budget.descripcion || '';
    
    // Cargar items
    if (this.budget.items && this.budget.items.length > 0) {
      this.items = this.budget.items.map(item => ({ ...item }));
    } else if (this.budget.itemsJson) {
      try {
        this.items = JSON.parse(this.budget.itemsJson);
      } catch (e) {
        this.items = [];
      }
    }

    // Calcular descuento
    if (this.budget.descuento) {
      this.descuentoValor = this.budget.descuento;
      this.descuentoTipo = 'monto';
    }

    // Filtrar vehículos y recalcular
    this.onClientChange();
    this.calculateTotals();
  }

  onClientChange() {
    // Filtrar vehículos del cliente seleccionado
    if (this.selectedClientId) {
      this.vehicles = this.allVehicles.filter(
        v => v.ClienteId === this.selectedClientId
      );
      
      // Si el vehículo seleccionado no pertenece al cliente, limpiar selección
      if (this.selectedVehicleId) {
        const vehicleExists = this.vehicles.find(v => v.id === this.selectedVehicleId);
        if (!vehicleExists) {
          this.selectedVehicleId = undefined;
        }
      }
    } else {
      this.vehicles = [];
      this.selectedVehicleId = undefined;
    }
  }

  onClientChangeEvent(event: any) {
    const value = event.detail.value;
    this.selectedClientId = value;
    this.onClientChange();
  }

  onVehicleChangeEvent(event: any) {
    const value = event.detail.value;
    this.selectedVehicleId = value;
  }

  createEmptyItem(): BudgetItem {
    return {
      id: this.generateItemId(),
      descripcion: '',
      cantidad: 1,
      unitPrice: 0,
      tipo: 'mano_obra'
    };
  }

  generateItemId(): string {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  onNewItemTypeChange() {
    // Limpiar datos cuando cambia el tipo
    this.newItem.descripcion = '';
    this.newItem.unitPrice = 0;
    this.newItem.productId = undefined;
  }

  onProductSelect(event: any) {
    const productId = event.detail.value;
    const product = this.products.find(p => p.id === productId);
    
    if (product) {
      this.newItem.descripcion = product.nombreProducto || '';
      this.newItem.unitPrice = product.precioVenta || 0;
      this.newItem.productId = product.id;
    }
  }

  addItem() {
    // Validaciones
    if (!this.newItem.descripcion || this.newItem.descripcion.trim() === '') {
      this.showToast('Ingresa una descripción para el item', 'warning');
      return;
    }

    if (this.newItem.cantidad <= 0) {
      this.showToast('La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    if (this.newItem.unitPrice <= 0) {
      this.showToast('El precio unitario debe ser mayor a 0', 'warning');
      return;
    }

    // Agregar item a la lista
    this.items.push({ ...this.newItem });
    
    // Limpiar formulario
    this.newItem = this.createEmptyItem();
    
    // Recalcular totales
    this.calculateTotals();
    
    this.showToast('Item agregado correctamente', 'success');
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
    this.calculateTotals();
    this.showToast('Item eliminado', 'success');
  }

  getItemSubtotal(item: BudgetItem): number {
    return item.cantidad * item.unitPrice;
  }

  onItemQuantityChange(item: BudgetItem) {
    if (item.cantidad < 0) item.cantidad = 0;
    this.calculateTotals();
  }

  onItemPriceChange(item: BudgetItem) {
    if (item.unitPrice < 0) item.unitPrice = 0;
    this.calculateTotals();
  }

  calculateTotals() {
    // Calcular subtotal
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + (item.cantidad * item.unitPrice);
    }, 0);

    // Calcular descuento
    if (this.descuentoTipo === 'porcentaje') {
      this.descuento = this.subtotal * (this.descuentoValor / 100);
    } else {
      this.descuento = this.descuentoValor;
    }

    // Validar que el descuento no sea mayor al subtotal
    if (this.descuento > this.subtotal) {
      this.descuento = this.subtotal;
      this.descuentoValor = this.subtotal;
    }

    // Calcular impuesto sobre (subtotal - descuento)
    const baseImponible = this.subtotal - this.descuento;
    this.impuesto = baseImponible * this.impuestoTasa;

    // Calcular total
    this.total = baseImponible + this.impuesto;
  }

  onDescuentoChange() {
    if (this.descuentoValor < 0) {
      this.descuentoValor = 0;
    }
    this.calculateTotals();
  }

  async saveBudget() {
    // Validaciones
    if (!this.selectedClientId) {
      await this.showToast('Selecciona un cliente', 'warning');
      return;
    }

    if (!this.selectedVehicleId) {
      await this.showToast('Selecciona un vehículo', 'warning');
      return;
    }

    if (this.items.length === 0) {
      await this.showToast('Agrega al menos un item al presupuesto', 'warning');
      return;
    }

    this.loading = true;

    const budgetData: Budget = {
      ClienteId: this.selectedClientId,
      VehiculoId: this.selectedVehicleId,
      descripcion: this.descripcion,
      itemsJson: JSON.stringify(this.items),
      items: this.items,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      descuento: this.descuento,
      total: this.total,
      estado: this.budget?.estado || 'pendiente'
    };

    const request = this.isEditMode && this.budget?.id
      ? this.apiService.updateBudget(this.budget.id, budgetData)
      : this.apiService.createBudget(budgetData);

    request.subscribe({
      next: async () => {
        await this.showToast(
          this.isEditMode ? 'Presupuesto actualizado correctamente' : 'Presupuesto creado correctamente',
          'success'
        );
        this.loading = false;
        this.closeModal(true);
      },
      error: async (error) => {
        console.error('Error al guardar presupuesto:', error);
        await this.showToast('Error al guardar el presupuesto', 'danger');
        this.loading = false;
      }
    });
  }

  async confirmCancel() {
    if (this.items.length > 0 || this.descripcion) {
      const alert = await this.alertController.create({
        header: 'Confirmar',
        message: '¿Deseas salir sin guardar los cambios?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Salir',
            role: 'destructive',
            handler: () => {
              this.closeModal(false);
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.closeModal(false);
    }
  }

  closeModal(reload: boolean) {
    this.modalController.dismiss({ reload });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
