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
  IonBadge,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  ModalController,
  ToastController,
  AlertController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  documentTextOutline, 
  chevronForwardOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  timeOutline,
  createOutline,
  trashOutline,
  eyeOutline,
  mailOutline,
  downloadOutline,
  ellipsisVerticalOutline,
  filterOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Budget } from '../../models/budget.model';
import { BudgetFormComponent } from './budget-form/budget-form.component';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
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
    IonBadge,
    IonFab,
    IonFabButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonSegment,
    IonSegmentButton,
    IonSkeletonText
  ]
})
export class BudgetsPage implements OnInit {
  budgets: Budget[] = [];
  filteredBudgets: Budget[] = [];
  searchTerm = '';
  statusFilter: string = 'todos';
  loading = true;
  userRole: string = '';
  
  // Permisos
  canEdit = false;
  canDelete = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({ 
      addOutline, 
      documentTextOutline, 
      chevronForwardOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      createOutline,
      trashOutline,
      eyeOutline,
      mailOutline,
      downloadOutline,
      ellipsisVerticalOutline,
      filterOutline
    });
  }

  ngOnInit() {
    this.checkPermissions();
    this.loadBudgets();
  }

  checkPermissions() {
    const user = this.authService.getCurrentUser();
    this.userRole = user?.rol || '';
    
    // Admin y Cajero: CRUD completo
    // Mecánico: Solo lectura
    this.canEdit = this.userRole === 'Administrador' || this.userRole === 'Cajero';
    this.canDelete = this.userRole === 'Administrador' || this.userRole === 'Cajero';
  }

  loadBudgets(event?: any) {
    this.loading = true;
    this.apiService.getBudgets().subscribe({
      next: (data) => {
        // Backend simple: solo tiene descripcion, manoObra, materiales, total, estado, clienteId
        this.budgets = data;
        this.applyFilters();
        this.loading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: async (error) => {
        console.error('Error al cargar presupuestos:', error);
        await this.showToast('Error al cargar presupuestos', 'danger');
        this.loading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  applyFilters() {
    let filtered = [...this.budgets];

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(budget =>
        budget.Cliente?.nombre?.toLowerCase().includes(term) ||
        budget.descripcion?.toLowerCase().includes(term) ||
        (budget.total?.toString() || '').includes(term)
      );
    }

    // Filtro por estatus
    if (this.statusFilter !== 'todos') {
      filtered = filtered.filter(budget => budget.estado === this.statusFilter);
    }

    this.filteredBudgets = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  async openBudgetForm(budget?: Budget) {
    if (!this.canEdit && budget) {
      await this.showToast('No tienes permisos para editar presupuestos', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: BudgetFormComponent,
      componentProps: { budget: budget ? { ...budget } : null }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.reload) {
        this.loadBudgets();
      }
    });

    await modal.present();
  }

  async showBudgetActions(budget: Budget, event: Event) {
    event.stopPropagation();
    
    const buttons: any[] = [
      {
        text: 'Ver Detalles',
        icon: 'eye-outline',
        handler: () => {
          this.viewBudgetDetails(budget);
        }
      }
    ];

    if (this.canEdit) {
      buttons.push({
        text: 'Editar',
        icon: 'create-outline',
        handler: () => {
          this.openBudgetForm(budget);
        }
      });

      // Solo permitir cambio de estatus si no está rechazado
      if (budget.estado !== 'rechazado') {
        buttons.push({
          text: 'Cambiar Estatus',
          icon: 'swap-horizontal-outline',
          handler: () => {
            this.showStatusOptions(budget);
          }
        });
      }

      buttons.push({
        text: 'Generar PDF',
        icon: 'download-outline',
        handler: () => {
          this.generatePDF(budget);
        }
      });

      buttons.push({
        text: 'Enviar por Email',
        icon: 'mail-outline',
        handler: () => {
          this.sendEmail(budget);
        }
      });
    }

    if (this.canDelete) {
      buttons.push({
        text: 'Eliminar',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => {
          this.confirmDelete(budget);
        }
      });
    }

    buttons.push({
      text: 'Cancelar',
      icon: 'close-outline',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: `Presupuesto #${budget.id}`,
      buttons: buttons
    });

    await actionSheet.present();
  }

  async viewBudgetDetails(budget: Budget) {
    const items: any[] = [];
    const itemsHtml = items.length > 0 
      ? items.map(item => `
          <tr>
            <td>${item.descripcion}</td>
            <td>${item.cantidad}</td>
            <td>$${item.unitPrice.toFixed(2)}</td>
            <td>$${(item.cantidad * item.unitPrice).toFixed(2)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" style="text-align: center;">Sin items</td></tr>';

    const alert = await this.alertController.create({
      header: `Presupuesto #${budget.id}`,
      cssClass: 'budget-detail-alert',
      message: `
        <div style="text-align: left;">
          <p><strong>Cliente:</strong> ${budget.Cliente?.nombre || 'N/A'}</p>
          <p><strong>Vehículo:</strong> ${budget.Vehiculo ? `${budget.Vehiculo.marca} ${budget.Vehiculo.modelo} (${budget.Vehiculo.placas})` : 'N/A'}</p>
          <p><strong>Descripción:</strong> ${budget.descripcion || 'N/A'}</p>
          <p><strong>Estatus:</strong> <span style="color: ${this.getStatusColorHex(budget.estado)}">${budget.estado?.toUpperCase()}</span></p>
          
          <h4 style="margin-top: 15px;">Items:</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 5px; text-align: left;">Descripción</th>
                <th style="padding: 5px; text-align: center;">Cant.</th>
                <th style="padding: 5px; text-align: right;">Precio</th>
                <th style="padding: 5px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 15px; padding-top: 10px; border-top: 2px solid #ddd;">
            <p><strong>Subtotal:</strong> $${budget.subtotal?.toFixed(2) || '0.00'}</p>
            <p><strong>Impuesto (16%):</strong> $${budget.impuesto?.toFixed(2) || '0.00'}</p>
            <p><strong>Descuento:</strong> $${budget.descuento?.toFixed(2) || '0.00'}</p>
            <p style="font-size: 16px;"><strong>TOTAL:</strong> $${budget.total?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      `,
      buttons: ['Cerrar']
    });
    await alert.present();
  }

  async showStatusOptions(budget: Budget) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estatus',
      message: budget.estado === 'pendiente' 
        ? 'Si apruebas este presupuesto, se creará automáticamente una orden de servicio.'
        : '¿Deseas cambiar el estatus de este presupuesto?',
      inputs: [
        {
          name: 'status',
          type: 'radio',
          label: 'Pendiente',
          value: 'pendiente',
          checked: budget.estado === 'pendiente'
        },
        {
          name: 'status',
          type: 'radio',
          label: 'Aprobado',
          value: 'aprobado',
          checked: budget.estado === 'aprobado'
        },
        {
          name: 'status',
          type: 'radio',
          label: 'Rechazado',
          value: 'rechazado',
          checked: budget.estado === 'rechazado'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: (data) => {
            if (data) {
              this.updateStatus(budget, data);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  updateStatus(budget: Budget, newStatus: string) {
    if (!budget.id) return;

    // Actualizar el estado visualmente de inmediato
    const oldStatus = budget.estado;
    budget.estado = newStatus as any;
    this.applyFilters();

    this.apiService.updateBudgetStatus(budget.id, newStatus as any).subscribe({
      next: async () => {
        await this.showToast(
          newStatus === 'aprobado' 
            ? 'Presupuesto aprobado. Se ha creado la orden de servicio.' 
            : `Estatus actualizado a ${newStatus}`, 
          'success'
        );
        // Recargar para obtener datos actualizados del servidor
        this.loadBudgets();
      },
      error: async (error) => {
        // Revertir el cambio si falla
        budget.estado = oldStatus;
        this.applyFilters();
        console.error('Error al actualizar estatus:', error);
        await this.showToast('Error al actualizar el estatus', 'danger');
      }
    });
  }

  async confirmDelete(budget: Budget) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el presupuesto #${budget.id}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteBudget(budget);
          }
        }
      ]
    });

    await alert.present();
  }

  deleteBudget(budget: Budget) {
    if (!budget.id) return;

    this.apiService.deleteBudget(budget.id).subscribe({
      next: async () => {
        await this.showToast('Presupuesto eliminado correctamente', 'success');
        this.loadBudgets();
      },
      error: async (error) => {
        console.error('Error al eliminar presupuesto:', error);
        await this.showToast('Error al eliminar el presupuesto', 'danger');
      }
    });
  }

  generatePDF(budget: Budget) {
    // Preparado para implementación futura
    this.showToast('Función de PDF en desarrollo', 'warning');
  }

  sendEmail(budget: Budget) {
    // Preparado para implementación futura
    this.showToast('Función de envío de email en desarrollo', 'warning');
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'aprobado': return 'success';
      case 'rechazado': return 'danger';
      default: return 'warning';
    }
  }

  getStatusColorHex(status?: string): string {
    switch (status) {
      case 'aprobado': return '#2dd36f';
      case 'rechazado': return '#eb445a';
      default: return '#ffc409';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'aprobado': return 'checkmark-circle-outline';
      case 'rechazado': return 'close-circle-outline';
      default: return 'time-outline';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'aprobado': return 'Aprobado';
      case 'rechazado': return 'Rechazado';
      default: return 'Pendiente';
    }
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
