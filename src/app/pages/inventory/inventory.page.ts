import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonList,
  IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonCard,
  IonCardContent, IonRefresher, IonRefresherContent, IonBadge,
  ModalController, ToastController, AlertController, IonSegment,
  IonSegmentButton, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonButton, IonButtons, IonMenuButton, IonProgressBar, IonChip, IonGrid,
  IonRow, IonCol, IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, cubeOutline, chevronForwardOutline, warningOutline,
  createOutline, trashOutline, swapVerticalOutline, trendingUpOutline,
  trendingDownOutline, filterOutline, timeOutline, listOutline,
  gridOutline, cashOutline, alertCircleOutline, checkmarkCircleOutline, homeOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';
import { InventoryMovement } from '../../models/inventory-movement.model';
import { ProductFormComponent } from './product-form/product-form.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonTitle, IonToolbar,
    IonSearchbar, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon,
    IonCard, IonCardContent, IonRefresher, IonRefresherContent, IonBadge,
    IonSegment, IonSegmentButton, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonButton, IonButtons, IonMenuButton, IonProgressBar, IonChip, IonGrid, IonRow, IonCol,
    IonSkeletonText
  ]
})
export class InventoryPage implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm = '';
  loading = false;
  
  // Filtros y vistas
  filterType: 'all' | 'low' | 'empty' = 'all';
  viewMode: 'list' | 'cards' = 'cards';
  
  // Estadísticas
  totalProducts = 0;
  lowStockCount = 0;
  emptyStockCount = 0;
  totalInventoryValue = 0;
  totalSaleValue = 0;
  
  // Permisos del usuario
  canEdit = false;
  canDelete = false;
  canManageInventory = false;
  userRole = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({homeOutline,cubeOutline,warningOutline,cashOutline,trendingUpOutline,alertCircleOutline,addOutline,swapVerticalOutline,createOutline,trashOutline,chevronForwardOutline,trendingDownOutline,filterOutline,timeOutline,listOutline,gridOutline,checkmarkCircleOutline});
  }

  ngOnInit() {
    this.checkPermissions();
    this.loadProducts();
  }

  checkPermissions() {
    const user = this.authService.getCurrentUser();
    this.userRole = user?.rol || '';
    
    // Todos pueden agregar y editar productos
    // Solo Admin puede eliminar
    // Admin y Cajero pueden gestionar movimientos de inventario
    this.canEdit = true;
    this.canDelete = this.userRole === 'Admin';
    this.canManageInventory = this.userRole === 'Admin' || this.userRole === 'Cajero';
  }

  loadProducts(event?: any) {
    this.loading = true;
    this.apiService.getProducts().subscribe({
      next: (data) => {
        // Backend ya envía la estructura correcta con todos los campos
        this.products = data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          nombreProducto: item.nombre,  // Alias para compatibilidad
          descripcion: item.descripcion || '',
          precioCosto: item.precioCosto || 0,
          precioVenta: item.precioVenta || 0,
          cantidad: item.cantidad || 0,
          sku: item.sku || '',
          minStockAlert: item.minStockAlert || 5,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }));
        this.applyFilters();
        this.calculateStatistics();
        this.loading = false;
        if (event) event.target.complete();
      },
      error: async () => {
        await this.showToast('Error al cargar inventario', 'danger');
        this.loading = false;
        if (event) event.target.complete();
      }
    });
  }

  applyFilters() {
    let filtered = [...this.products];
    
    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombreProducto?.toLowerCase().includes(term) ||
        p.descripcion?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
      );
    }
    
    // Filtro por tipo
    switch (this.filterType) {
      case 'low':
        filtered = filtered.filter(p => this.isLowStock(p) && (p.cantidad || 0) > 0);
        break;
      case 'empty':
        filtered = filtered.filter(p => (p.cantidad || 0) === 0);
        break;
      // 'all' no filtra
    }
    
    this.filteredProducts = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  onViewModeChange() {
    // Solo cambio de vista, no necesita lógica adicional
  }

  calculateStatistics() {
    this.totalProducts = this.products.length;
    this.lowStockCount = this.products.filter(p => this.isLowStock(p) && (p.cantidad || 0) > 0).length;
    this.emptyStockCount = this.products.filter(p => (p.cantidad || 0) === 0).length;
    
    this.totalInventoryValue = this.products.reduce((sum, p) => 
      sum + ((p.cantidad || 0) * (p.precioCosto || 0)), 0
    );
    
    this.totalSaleValue = this.products.reduce((sum, p) => 
      sum + ((p.cantidad || 0) * (p.precioVenta || 0)), 0
    );
  }

  async openProductForm(product?: Product) {
    if (!this.canEdit && !product) {
      await this.showToast('No tienes permisos para crear productos', 'warning');
      return;
    }
    
    if (!this.canEdit && product) {
      await this.showToast('No tienes permisos para editar productos', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: ProductFormComponent,
      componentProps: { product },
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75
    });
    
    modal.onDidDismiss().then(result => {
      if (result.data?.reload) {
        this.loadProducts();
      }
    });
    
    await modal.present();
  }

  async openInventoryMovement(product: Product) {
    if (!this.canManageInventory) {
      await this.showToast('No tienes permisos para gestionar inventario', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Movimiento de Inventario',
      subHeader: product.nombreProducto,
      message: `Stock actual: ${product.cantidad}`,
      inputs: [
        {
          name: 'tipo',
          type: 'radio',
          label: 'Ingreso',
          value: 'ingreso',
          checked: true
        },
        {
          name: 'tipo',
          type: 'radio',
          label: 'Salida',
          value: 'salida'
        },
        {
          name: 'tipo',
          type: 'radio',
          label: 'Ajuste',
          value: 'ajuste'
        },
        {
          name: 'cantidad',
          type: 'number',
          placeholder: 'Cantidad',
          min: 1
        },
        {
          name: 'motivo',
          type: 'textarea',
          placeholder: 'Motivo del movimiento (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Registrar',
          handler: (data) => {
            this.processInventoryMovement(product, data);
          }
        }
      ]
    });

    await alert.present();
  }

  async processInventoryMovement(product: Product, data: any) {
    const cantidad = parseInt(data.cantidad);
    const tipo = data.tipo;
    const motivo = data.motivo || '';

    // Validaciones
    if (!cantidad || cantidad <= 0) {
      await this.showToast('La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    if (tipo === 'salida' && cantidad > (product.cantidad || 0)) {
      await this.showToast('Stock insuficiente para esta salida', 'danger');
      return;
    }

    // Registrar movimiento
    this.apiService.moveInventory({
      productoId: product.id!,
      tipo,
      cantidad,
      motivo
    }).subscribe({
      next: async () => {
        await this.showToast('Movimiento registrado exitosamente', 'success');
        this.loadProducts();
      },
      error: async () => {
        await this.showToast('Error al registrar movimiento', 'danger');
      }
    });
  }

  async viewProductDetails(product: Product) {
    const margen = this.calculateMargin(product);
    const stockStatus = this.getStockStatus(product);
    const inventoryValue = (product.cantidad || 0) * (product.precioCosto || 0);
    const saleValue = (product.cantidad || 0) * (product.precioVenta || 0);

    const buttons: any[] = [
      {
        text: 'Cerrar',
        role: 'cancel'
      }
    ];

    if (this.canManageInventory) {
      buttons.unshift({
        text: 'Movimiento',
        icon: 'swap-vertical-outline',
        handler: () => {
          this.openInventoryMovement(product);
        }
      });
    }

    if (this.canEdit) {
      buttons.unshift({
        text: 'Editar',
        icon: 'create-outline',
        handler: () => {
          this.openProductForm(product);
        }
      });
    }

    if (this.canDelete) {
      buttons.unshift({
        text: 'Eliminar',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => {
          this.deleteProduct(product);
        }
      });
    }

    const alert = await this.alertController.create({
      header: product.nombreProducto,
      subHeader: `SKU: ${product.sku || 'N/A'}`,
      message: `
        <div style="text-align: left;">
          <p><strong>Descripción:</strong><br>${product.descripcion || 'N/A'}</p>
          <hr>
          <p><strong>Precio Costo:</strong> $${(product.precioCosto || 0).toFixed(2)}</p>
          <p><strong>Precio Venta:</strong> $${(product.precioVenta || 0).toFixed(2)}</p>
          <p><strong>Margen:</strong> <span style="color: ${margen >= 0 ? 'green' : 'red'};">${margen.toFixed(2)}%</span></p>
          <hr>
          <p><strong>Stock Actual:</strong> <span style="color: ${stockStatus.color};">${product.cantidad}</span></p>
          <p><strong>Alerta Mínima:</strong> ${product.minStockAlert || 0}</p>
          <p><strong>Estado:</strong> <span style="color: ${stockStatus.color};">${stockStatus.text}</span></p>
          <hr>
          <p><strong>Valor Inventario:</strong> $${inventoryValue.toFixed(2)}</p>
          <p><strong>Valor Venta Potencial:</strong> $${saleValue.toFixed(2)}</p>
        </div>
      `,
      buttons
    });

    await alert.present();
  }

  async deleteProduct(product: Product) {
    if ((product.cantidad || 0) > 0) {
      const confirm = await this.alertController.create({
        header: 'Confirmar Eliminación',
        message: `El producto "${product.nombreProducto}" tiene ${product.cantidad} unidades en stock. ¿Estás seguro de eliminarlo?`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Eliminar',
            role: 'destructive',
            handler: () => {
              this.confirmDelete(product);
            }
          }
        ]
      });
      await confirm.present();
    } else {
      this.confirmDelete(product);
    }
  }

  confirmDelete(product: Product) {
    this.apiService.deleteProduct(product.id!).subscribe({
      next: async () => {
        await this.showToast('Producto eliminado exitosamente', 'success');
        this.loadProducts();
      },
      error: async () => {
        await this.showToast('Error al eliminar producto', 'danger');
      }
    });
  }

  isLowStock(product: Product): boolean {
    const minAlert = product.minStockAlert || 5;
    return (product.cantidad || 0) <= minAlert && (product.cantidad || 0) > 0;
  }

  isEmptyStock(product: Product): boolean {
    return (product.cantidad || 0) === 0;
  }

  getStockStatus(product: Product): { text: string; color: string; icon: string } {
    if (this.isEmptyStock(product)) {
      return { text: 'Sin Stock', color: 'danger', icon: 'alert-circle-outline' };
    }
    if (this.isLowStock(product)) {
      return { text: 'Stock Bajo', color: 'warning', icon: 'warning-outline' };
    }
    return { text: 'Stock Normal', color: 'success', icon: 'checkmark-circle-outline' };
  }

  getStockPercentage(product: Product): number {
    const minAlert = product.minStockAlert || 5;
    const maxStock = minAlert * 3; // Asumimos que el stock óptimo es 3 veces el mínimo
    const percentage = ((product.cantidad || 0) / maxStock) * 100;
    return Math.min(percentage, 100);
  }

  getProgressColor(product: Product): string {
    if (this.isEmptyStock(product)) return 'danger';
    if (this.isLowStock(product)) return 'warning';
    return 'success';
  }

  calculateMargin(product: Product): number {
    const costo = product.precioCosto || 0;
    const venta = product.precioVenta || 0;
    if (costo === 0) return 0;
    return ((venta - costo) / costo) * 100;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
