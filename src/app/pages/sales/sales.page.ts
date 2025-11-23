import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem,
  IonLabel, IonFab, IonFabButton, IonIcon, IonCard, IonCardContent,
  IonRefresher, IonRefresherContent, IonSelect, IonSelectOption,
  IonInput, IonButton, IonText, IonSegment, IonSegmentButton,
  IonSearchbar, IonBadge, IonGrid, IonRow, IonCol, IonButtons,
  IonBackButton, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonDatetime, IonModal, IonChip, IonSkeletonText, IonNote,
  IonMenuButton,
  ToastController, AlertController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, cartOutline, saveOutline, trashOutline, searchOutline,
  receiptOutline, cashOutline, cardOutline, calendarOutline,
  closeCircleOutline, removeCircleOutline, addCircleOutline,
  eyeOutline, personOutline, carOutline, filterOutline,
  printOutline, downloadOutline, calculatorOutline, homeOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Sale, SaleItem } from '../../models/sale.model';
import { Client } from '../../models/client.model';
import { Vehicle } from '../../models/vehicle.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.page.html',
  styleUrls: ['./sales.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem,
    IonLabel, IonFab, IonFabButton, IonIcon, IonCard, IonCardContent,
    IonRefresher, IonRefresherContent, IonSelect, IonSelectOption,
    IonInput, IonButton, IonText, IonSegment, IonSegmentButton,
    IonSearchbar, IonBadge, IonGrid, IonRow, IonCol, IonButtons,
    IonBackButton, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonDatetime, IonModal, IonChip, IonSkeletonText, IonNote,
    IonMenuButton
  ]
})
export class SalesPage implements OnInit {
  // Vista actual
  selectedSegment = 'nueva';

  // Ventas
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  isLoading = false;

  // Formulario Nueva Venta
  showForm = false;
  selectedClientId: number | null = null;
  selectedVehicleId: number | null = null;
  cart: CartItem[] = [];
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' = 'efectivo';
  descuentoTipo: 'monto' | 'porcentaje' = 'monto';
  descuentoValor = 0;

  // Datos auxiliares
  clients: Client[] = [];
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Búsqueda de productos
  searchQuery = '';
  showProductSearch = false;

  // Filtros
  dateFilter: 'hoy' | 'semana' | 'mes' | 'personalizado' = 'mes';
  customStartDate = '';
  customEndDate = '';
  filterClientId: number | null = null;
  filterMetodoPago: string = 'todos';
  searchSaleQuery = '';

  // Estadísticas
  stats = {
    ventasHoy: 0,
    ventasMes: 0,
    totalHoy: 0,
    totalMes: 0,
    ticketPromedio: 0
  };

  // Permisos
  canEdit = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController
  ) {
    addIcons({homeOutline,personOutline,cartOutline,addCircleOutline,removeCircleOutline,trashOutline,calculatorOutline,cashOutline,cardOutline,receiptOutline,saveOutline,filterOutline,calendarOutline,carOutline,eyeOutline,addOutline,searchOutline,closeCircleOutline,printOutline,downloadOutline});
  }

  ngOnInit() {
    this.checkPermissions();
    this.loadClients();
    this.loadProducts();
    this.loadSales();
  }

  checkPermissions() {
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.rol === 'Administrador' || user?.rol === 'Cajero';
  }

  // ==================== CARGA DE DATOS ====================

  loadSales(event?: any) {
    this.isLoading = true;
    
    console.log('📅 Cargando TODAS las ventas (sin filtro de fecha)');

    // Cargar todas las ventas sin filtro de fecha
    this.apiService.getSales().subscribe({
      next: (data) => {
        console.log('✅ Ventas recibidas:', data);
        this.sales = Array.isArray(data) ? data : [];
        console.log('📊 Total ventas cargadas:', this.sales.length);
        this.applyFilters();
        this.calculateStats();
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: async (error) => {
        console.error('❌ Error loading sales:', error);
        await this.showToast('Error al cargar ventas', 'danger');
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
      error: async (error) => {
        console.error('Error loading clients:', error);
      }
    });
  }

  loadProducts() {
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
      },
      error: async (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  // ==================== GESTIÓN DE CLIENTES Y VEHÍCULOS ====================

  onClientChange() {
    this.selectedVehicleId = null;
    this.filteredVehicles = [];

    if (this.selectedClientId) {
      const client = this.clients.find(c => c.id === this.selectedClientId);
      if (client && client.Vehicles) {
        this.filteredVehicles = client.Vehicles;
      }
    }
  }

  // ==================== CARRITO DE COMPRAS ====================

  searchProducts() {
    if (!this.searchQuery || this.searchQuery.trim().length === 0) {
      this.filteredProducts = this.products;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.nombreProducto?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    );
  }

  addToCart(product: Product) {
    const existingItem = this.cart.find(item => item.productId === product.id);

    if (existingItem) {
      if (existingItem.cantidad >= (product.cantidad || 0)) {
        this.showToast('Stock insuficiente', 'warning');
        return;
      }
      existingItem.cantidad++;
      existingItem.subtotal = existingItem.cantidad * existingItem.unitPrice;
    } else {
      if ((product.cantidad || 0) < 1) {
        this.showToast('Producto sin stock', 'warning');
        return;
      }

      this.cart.push({
        productId: product.id!,
        nombreProducto: product.nombreProducto || '',
        cantidad: 1,
        unitPrice: product.precioVenta || 0,
        stockDisponible: product.cantidad || 0,
        subtotal: product.precioVenta || 0
      });
    }

    this.searchQuery = '';
    this.filteredProducts = this.products;
    this.showProductSearch = false;
  }

  updateCartItemQuantity(item: CartItem, change: number) {
    const newQuantity = item.cantidad + change;

    if (newQuantity < 1) {
      this.removeFromCart(item);
      return;
    }

    if (newQuantity > item.stockDisponible) {
      this.showToast('Stock insuficiente', 'warning');
      return;
    }

    item.cantidad = newQuantity;
    item.subtotal = item.cantidad * item.unitPrice;
  }

  updateCartItemPrice(item: CartItem) {
    if (item.unitPrice < 0) {
      item.unitPrice = 0;
    }
    item.subtotal = item.cantidad * item.unitPrice;
  }

  async removeFromCart(item: CartItem) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Eliminar ${item.nombreProducto} del carrito?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.cart = this.cart.filter(i => i.productId !== item.productId);
          }
        }
      ]
    });
    await alert.present();
  }

  clearCart() {
    this.cart = [];
    this.selectedClientId = null;
    this.selectedVehicleId = null;
    this.metodoPago = 'efectivo';
    this.descuentoValor = 0;
  }

  // ==================== CÁLCULOS ====================

  getSubtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.subtotal, 0);
  }

  getDescuento(): number {
    const subtotal = this.getSubtotal();
    if (this.descuentoTipo === 'porcentaje') {
      return (subtotal * this.descuentoValor) / 100;
    }
    return this.descuentoValor;
  }

  getBaseImponible(): number {
    return this.getSubtotal() - this.getDescuento();
  }

  getImpuesto(): number {
    return this.getBaseImponible() * 0.16;
  }

  getTotal(): number {
    return this.getBaseImponible() + this.getImpuesto();
  }

  // ==================== GUARDAR VENTA ====================

  async saveSale() {
    // Validaciones
    if (this.cart.length === 0) {
      await this.showToast('Agrega al menos un producto al carrito', 'warning');
      return;
    }

    if (this.getTotal() <= 0) {
      await this.showToast('El total debe ser mayor a 0', 'warning');
      return;
    }

    if (this.getDescuento() > this.getSubtotal()) {
      await this.showToast('El descuento no puede ser mayor al subtotal', 'warning');
      return;
    }

    // Confirmación
    const alert = await this.alertController.create({
      header: 'Confirmar Venta',
      message: `
        <p><strong>Total:</strong> $${this.getTotal().toFixed(2)}</p>
        <p><strong>Método de pago:</strong> ${this.metodoPago}</p>
        <p>¿Deseas guardar esta venta?</p>
      `,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: () => {
            this.confirmSave();
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmSave() {
    const saleData: any = {
      clienteId: this.selectedClientId || null,
      vehiculoId: this.selectedVehicleId || null,
      metodoPago: this.metodoPago,
      descuento: this.getDescuento(),
      items: this.cart.map(item => ({
        productId: item.productId,
        cantidad: item.cantidad,
        unitPrice: item.unitPrice,
        nombreProducto: item.nombreProducto
      }))
    };

    this.apiService.createSale(saleData).subscribe({
      next: async (response) => {
        console.log('✅ Venta creada:', response);
        await this.showToast('Venta guardada exitosamente', 'success');
        
        // Limpiar carrito y formulario
        this.cart = [];
        this.selectedClientId = null;
        this.selectedVehicleId = null;
        this.metodoPago = 'efectivo';
        this.descuentoValor = 0;
        this.descuentoTipo = 'monto';
        
        // Cambiar a historial y recargar
        this.selectedSegment = 'historial';
        this.loadSales();
      },
      error: async (error) => {
        console.error('❌ Error saving sale:', error);
        await this.showToast('Error al guardar la venta', 'danger');
      }
    });
  }

  // ==================== FILTROS Y BÚSQUEDA ====================

  getDateRange(): { start: string; end: string } {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (this.dateFilter) {
      case 'hoy':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'semana':
        start.setDate(now.getDate() - 7);
        break;
      case 'mes':
        start.setDate(now.getDate() - 30);
        break;
      case 'personalizado':
        if (this.customStartDate && this.customEndDate) {
          start = new Date(this.customStartDate);
          end = new Date(this.customEndDate);
        }
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  applyFilters() {
    console.log('🔍 Aplicando filtros. Ventas totales:', this.sales.length);
    
    let filtered = [...this.sales];

    // Filtrar por cliente
    if (this.filterClientId) {
      filtered = filtered.filter(s => s.ClientId === this.filterClientId);
    }

    // Filtrar por método de pago
    if (this.filterMetodoPago !== 'todos') {
      filtered = filtered.filter(s => s.metodoPago === this.filterMetodoPago);
    }

    // Búsqueda por texto
    if (this.searchSaleQuery && this.searchSaleQuery.trim().length > 0) {
      const query = this.searchSaleQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.Client?.nombre?.toLowerCase().includes(query) ||
        s.id?.toString().includes(query)
      );
    }

    this.filteredSales = filtered;
    console.log('✅ Ventas filtradas:', this.filteredSales.length);
  }

  onFilterChange() {
    if (this.dateFilter !== 'personalizado') {
      this.loadSales();
    }
  }

  applyCustomDateFilter() {
    if (this.customStartDate && this.customEndDate) {
      this.loadSales();
    }
  }

  calculateStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Ventas de hoy
    const ventasHoy = this.sales.filter(s => {
      const saleDate = new Date(s.fecha || '').toISOString().split('T')[0];
      return saleDate === today;
    });

    // Ventas del mes
    const ventasMes = this.sales.filter(s => {
      const saleDate = new Date(s.fecha || '').toISOString().split('T')[0];
      return saleDate >= startOfMonth;
    });

    this.stats = {
      ventasHoy: ventasHoy.length,
      ventasMes: ventasMes.length,
      totalHoy: ventasHoy.reduce((sum, s) => sum + (s.total || 0), 0),
      totalMes: ventasMes.reduce((sum, s) => sum + (s.total || 0), 0),
      ticketPromedio: ventasMes.length > 0
        ? ventasMes.reduce((sum, s) => sum + (s.total || 0), 0) / ventasMes.length
        : 0
    };
  }

  // ==================== DETALLES DE VENTA ====================

  async viewSaleDetails(sale: Sale) {
    const modal = await this.modalController.create({
      component: SaleDetailsModal,
      componentProps: { sale },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });

    await modal.present();
  }

  // ==================== UTILIDADES ====================

  toggleForm() {
    if (!this.canEdit) {
      this.showToast('No tienes permisos para crear ventas', 'warning');
      return;
    }
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.clearCart();
    }
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    if (this.selectedSegment === 'historial') {
      this.loadSales();
    }
  }

  getMetodoPagoIcon(metodo?: string): string {
    switch (metodo) {
      case 'efectivo': return 'cash-outline';
      case 'tarjeta': return 'card-outline';
      case 'transferencia': return 'receipt-outline';
      default: return 'cash-outline';
    }
  }

  getMetodoPagoColor(metodo?: string): string {
    switch (metodo) {
      case 'efectivo': return 'success';
      case 'tarjeta': return 'primary';
      case 'transferencia': return 'tertiary';
      default: return 'medium';
    }
  }

  formatDate(date?: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

// ==================== INTERFACES AUXILIARES ====================

interface CartItem extends SaleItem {
  nombreProducto: string;
  stockDisponible: number;
  subtotal: number;
}

// ==================== MODAL DE DETALLES ====================

@Component({
  selector: 'app-sale-details-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Detalles de Venta #{{ sale?.id }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Información General</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-icon name="calendar-outline" slot="start"></ion-icon>
              <ion-label>
                <p>Fecha</p>
                <h3>{{ formatDate(sale?.fecha) }}</h3>
              </ion-label>
            </ion-item>

            <ion-item *ngIf="sale?.Client">
              <ion-icon name="person-outline" slot="start"></ion-icon>
              <ion-label>
                <p>Cliente</p>
                <h3>{{ sale?.Client?.nombre }}</h3>
              </ion-label>
            </ion-item>

            <ion-item *ngIf="sale?.Vehicle">
              <ion-icon name="car-outline" slot="start"></ion-icon>
              <ion-label>
                <p>Vehículo</p>
                <h3>{{ sale?.Vehicle?.marca }} {{ sale?.Vehicle?.modelo }}</h3>
                <p>{{ sale?.Vehicle?.placas }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon [name]="getMetodoPagoIcon(sale?.metodoPago)" slot="start"></ion-icon>
              <ion-label>
                <p>Método de Pago</p>
                <h3>{{ getMetodoPagoLabel(sale?.metodoPago) }}</h3>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Productos</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let item of getItems()">
              <ion-label>
                <h3>{{ item.nombreProducto }}</h3>
                <p>{{ item.cantidad }} x \${{ item.unitPrice.toFixed(2) }}</p>
              </ion-label>
              <ion-note slot="end" color="primary">
                \${{ (item.cantidad * item.unitPrice).toFixed(2) }}
              </ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Totales</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-label>Subtotal</ion-label>
              <ion-note slot="end">\${{ sale?.subtotal?.toFixed(2) }}</ion-note>
            </ion-item>

            <ion-item *ngIf="sale && sale.descuento && sale.descuento > 0">
              <ion-label color="danger">Descuento</ion-label>
              <ion-note slot="end" color="danger">-\${{ sale.descuento.toFixed(2) }}</ion-note>
            </ion-item>

            <ion-item>
              <ion-label>Base Imponible</ion-label>
              <ion-note slot="end">\${{ getBaseImponible() }}</ion-note>
            </ion-item>

            <ion-item>
              <ion-label>Impuesto (16%)</ion-label>
              <ion-note slot="end">\${{ sale?.impuesto?.toFixed(2) }}</ion-note>
            </ion-item>

            <ion-item>
              <ion-label><strong>Total</strong></ion-label>
              <ion-note slot="end" color="success">
                <strong>\${{ sale?.total?.toFixed(2) }}</strong>
              </ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <div class="ion-padding">
        <ion-button expand="block" color="primary" (click)="preparePDF()">
          <ion-icon name="download-outline" slot="start"></ion-icon>
          Generar PDF
        </ion-button>

        <ion-button expand="block" color="secondary" (click)="prepareTicket()">
          <ion-icon name="print-outline" slot="start"></ion-icon>
          Reimprimir Ticket
        </ion-button>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonCard, IonCardHeader, IonCardSubtitle, IonCardContent,
    IonList, IonItem, IonLabel, IonNote
  ]
})
export class SaleDetailsModal {
  sale: Sale | null = null;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({
      closeCircleOutline, calendarOutline, personOutline, carOutline,
      cashOutline, cardOutline, receiptOutline, downloadOutline, printOutline
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getItems(): SaleItem[] {
    if (this.sale?.items) {
      return this.sale.items;
    }
    if (this.sale?.itemsJson) {
      try {
        return JSON.parse(this.sale.itemsJson);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  getBaseImponible(): string {
    const base = (this.sale?.subtotal || 0) - (this.sale?.descuento || 0);
    return base.toFixed(2);
  }

  getMetodoPagoIcon(metodo?: string): string {
    switch (metodo) {
      case 'efectivo': return 'cash-outline';
      case 'tarjeta': return 'card-outline';
      case 'transferencia': return 'receipt-outline';
      default: return 'cash-outline';
    }
  }

  getMetodoPagoLabel(metodo?: string): string {
    switch (metodo) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'transferencia': return 'Transferencia';
      default: return 'N/A';
    }
  }

  formatDate(date?: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async preparePDF() {
    const toast = await this.toastController.create({
      message: 'Función de PDF en desarrollo',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
  }

  async prepareTicket() {
    const toast = await this.toastController.create({
      message: 'Función de impresión en desarrollo',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
  }
}
