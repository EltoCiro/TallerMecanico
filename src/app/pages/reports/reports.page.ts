import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonList,
  IonItem, IonLabel, IonText, IonButton, IonIcon, IonGrid,
  IonRow, IonCol, IonSegment, IonSegmentButton, IonSelect,
  IonSelectOption, IonRefresher, IonRefresherContent,
  IonChip, IonBadge, IonNote, IonSkeletonText, IonButtons,
  IonInput, IonMenuButton, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline, statsChartOutline, downloadOutline,
  cashOutline, cartOutline, constructOutline, cubeOutline,
  peopleOutline, trendingUpOutline, trendingDownOutline,
  timeOutline, checkmarkCircleOutline, clipboardOutline,
  calendarOutline, printOutline, documentOutline, refreshOutline,
  filterOutline, closeOutline, gridOutline, alertCircleOutline,
  warningOutline, trophyOutline, starOutline, pieChartOutline,
  settingsOutline, hourglassOutline, pauseCircleOutline,
  checkmarkDoneOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';
import { Client } from '../../models/client.model';
import { Budget } from '../../models/budget.model';
import { ServiceOrder } from '../../models/service-order.model';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  imports: [
    CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
    IonLabel, IonText, IonButton, IonIcon, IonGrid, IonRow, IonCol,
    IonSegment, IonSegmentButton, IonSelect, IonSelectOption,
    IonRefresher, IonRefresherContent, IonChip, IonBadge, IonNote,
    IonSkeletonText, IonButtons, IonInput, IonMenuButton
  ]
})
export class ReportsPage implements OnInit {
  selectedReport: string = 'ventas';
  selectedPeriod: string = 'mes';
  loading = false;
  currentUser: any;

  // Filtros de fecha
  dateFrom: string = '';
  dateTo: string = '';

  // Datos de reportes
  ventasData: any[] = [];
  serviciosData: any[] = [];
  inventarioData: any[] = [];
  productividadData: any[] = [];
  financierosData: any = {
    ingresos: 0,
    costos: 0,
    ganancia: 0,
    margen: 0
  };

  // Nuevas propiedades para el reporte mejorado
  topProducts: Product[] = [];
  topClients: Client[] = [];
  lowStockProducts: Product[] = [];

  budgetStats = {
    pendientes: 0,
    aprobados: 0,
    rechazados: 0
  };

  orderStats = {
    pendientes: 0,
    enProceso: 0,
    suspendidas: 0,
    completadas: 0
  };

  // Estadísticas generales
  stats = {
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    serviciosCompletados: 0,
    serviciosPendientes: 0,
    valorInventario: 0,
    totalClients: 0,
    totalBudgets: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({
      documentTextOutline, statsChartOutline, downloadOutline,
      cashOutline, cartOutline, constructOutline, cubeOutline,
      peopleOutline, trendingUpOutline, trendingDownOutline,
      timeOutline, checkmarkCircleOutline, clipboardOutline,
      calendarOutline, printOutline, documentOutline, refreshOutline,
      filterOutline, closeOutline, gridOutline, alertCircleOutline,
      warningOutline, trophyOutline, starOutline, pieChartOutline,
      settingsOutline, hourglassOutline, pauseCircleOutline,
      checkmarkDoneOutline
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeDates();
    this.loadStats();
  }

  initializeDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.dateFrom = firstDay.toISOString().split('T')[0];
    this.dateTo = today.toISOString().split('T')[0];
  }

  applyDateFilter() {
    if (!this.dateFrom || !this.dateTo) {
      this.showToast('Por favor selecciona ambas fechas', 'warning');
      return;
    }

    if (new Date(this.dateFrom) > new Date(this.dateTo)) {
      this.showToast('La fecha inicial no puede ser mayor a la final', 'warning');
      return;
    }

    this.loadStats();
    this.showToast('Filtro aplicado correctamente', 'success');
  }

  clearDateFilter() {
    this.initializeDates();
    this.loadStats();
    this.showToast('Filtro eliminado', 'success');
  }

  async loadStats(event?: any) {
    this.loading = true;

    try {
      await Promise.all([
        this.loadGeneralStats(),
        this.loadTopProducts(),
        this.loadTopClients(),
        this.loadLowStockProducts(),
        this.loadBudgetStats(),
        this.loadOrderStats()
      ]);
    } catch (error) {
      await this.showToast('Error al cargar reportes', 'danger');
      console.error('Error loading reports:', error);
    } finally {
      this.loading = false;
      if (event) event?.target?.complete();
    }
  }

  async loadGeneralStats() {
    // Cargar clientes
    this.apiService.getClients().subscribe({
      next: (data) => {
        this.stats.totalClients = data.length;
      }
    });

    // Cargar presupuestos
    this.apiService.getBudgets().subscribe({
      next: (data) => {
        this.stats.totalBudgets = data.length;
      }
    });

    // Cargar órdenes
    this.apiService.getServiceOrders().subscribe({
      next: (data) => {
        this.stats.totalOrders = data.length;
        this.stats.serviciosCompletados = data.filter(o => o.estatus === 'completada').length;
        this.stats.serviciosPendientes = data.filter(o => o.estatus === 'pendiente' || o.estatus === 'en_proceso').length;
      }
    });

    // Cargar productos
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.stats.totalProducts = data.length;
        this.stats.valorInventario = data.reduce((sum, p) => sum + ((p.cantidad || 0) * (p.precioCosto || 0)), 0);
      }
    });

    // Cargar ventas con filtro de fechas
    this.apiService.getSales(this.dateFrom, this.dateTo).subscribe({
      next: (data: any) => {
        // La API devuelve directamente un array de ventas
        const ventas = Array.isArray(data) ? data : [];
        this.stats.totalSales = ventas.length;
        this.stats.totalRevenue = ventas.reduce((sum: number, v: any) => sum + (v.total || 0), 0);
      },
      error: (error) => {
        console.error('Error al cargar ventas:', error);
        this.stats.totalSales = 0;
        this.stats.totalRevenue = 0;
      }
    });
  }

  async loadTopProducts() {
    this.apiService.getTopProducts(this.dateFrom, this.dateTo).subscribe({
      next: (products) => {
        this.topProducts = products.map((p: any) => ({
          id: p.productId,
          nombreProducto: p.nombre,
          sku: p.productId,
          cantidad: p.cantidadVendida,
          ingresoTotal: p.ingresoTotal
        }));
      },
      error: (error) => {
        console.error('Error al cargar productos más vendidos:', error);
        this.topProducts = [];
      }
    });
  }

  async loadTopClients() {
    this.apiService.getTopClients(this.dateFrom, this.dateTo).subscribe({
      next: (clients) => {
        this.topClients = clients.map((c: any) => ({
          id: c.clientId,
          nombre: c.nombre,
          telefono: c.telefono,
          correo: c.correo,
          totalServicios: c.totalServicios,
          totalGastado: c.totalGastado
        }));
      },
      error: (error) => {
        console.error('Error al cargar clientes frecuentes:', error);
        this.topClients = [];
      }
    });
  }

  async loadLowStockProducts() {
    this.apiService.getProducts().subscribe({
      next: (products) => {
        this.lowStockProducts = products.filter(p =>
          (p.cantidad || 0) <= (p.minStockAlert || 5)
        ).sort((a, b) => (a.cantidad || 0) - (b.cantidad || 0));
      }
    });
  }

  async loadBudgetStats() {
    this.apiService.getBudgets().subscribe({
      next: (budgets) => {
        this.budgetStats = {
          pendientes: budgets.filter(b => b.estado === 'pendiente').length,
          aprobados: budgets.filter(b => b.estado === 'aprobado').length,
          rechazados: budgets.filter(b => b.estado === 'rechazado').length
        };
      }
    });
  }

  async loadOrderStats() {
    this.apiService.getServiceOrders().subscribe({
      next: (orders) => {
        this.orderStats = {
          pendientes: orders.filter(o => o.estatus === 'pendiente').length,
          enProceso: orders.filter(o => o.estatus === 'en_proceso').length,
          suspendidas: 0, // No hay estado suspendida en el modelo actual
          completadas: orders.filter(o => o.estatus === 'completada').length
        };
      }
    });
  }

  // Métodos de exportación
  exportToPDF() {
    this.showToast('Exportación a PDF disponible próximamente', 'warning');
  }

  exportToExcel() {
    this.showToast('Exportación a Excel disponible próximamente', 'warning');
  }

  printReport() {
    window.print();
  }

  getClientServices(client: any): number {
    return client.totalServicios || 0;
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
