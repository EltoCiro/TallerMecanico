import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonList,
  IonText,
  IonSpinner,
  IonBadge,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  shieldCheckmarkOutline, 
  menuOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-logs',
  templateUrl: './admin-logs.page.html',
  styleUrls: ['./admin-logs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonList,
    IonText,
    IonSpinner,
    IonBadge,
    IonButtons,
    IonMenuButton
  ]
})
export class AdminLogsPage implements OnInit {
  logs: any[] = [];
  summary: any = null;
  loading = false;
  filterAction = '';
  filterUserId = '';
  startDate = '';
  endDate = '';

  actionOptions = [
    { label: 'Todos', value: '' },
    { label: 'Login', value: 'login' },
    { label: 'Logout', value: 'logout' },
    { label: 'Login Fallido', value: 'login_failed' },
    { label: '2FA Habilitado', value: '2fa_enabled' },
    { label: '2FA Deshabilitado', value: '2fa_disabled' },
    { label: 'Usuario Creado', value: 'user_created' }
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({ shieldCheckmarkOutline, menuOutline });
    // Solo permitir acceso a administradores
    if (!this.authService.hasRole('Administrador')) {
      this.presentToast('No tienes permiso para acceder a esta página', 'danger');
    }
  }

  ngOnInit() {
    this.loadLogs();
    this.loadSummary();
  }

  loadLogs() {
    this.loading = true;
    const params: any = {};

    if (this.startDate && this.endDate) {
      params.startDate = this.startDate;
      params.endDate = this.endDate;
    }
    if (this.filterAction) {
      params.action = this.filterAction;
    }
    if (this.filterUserId) {
      params.userId = this.filterUserId;
    }

    this.apiService.getSystemLogs(params).subscribe({
      next: (data) => {
        this.logs = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando logs:', err);
        this.presentToast('Error al cargar los logs', 'danger');
        this.loading = false;
      }
    });
  }

  loadSummary() {
    const params: any = {};
    if (this.startDate && this.endDate) {
      params.startDate = this.startDate;
      params.endDate = this.endDate;
    }

    this.apiService.getLogsSummary(params).subscribe({
      next: (data) => {
        this.summary = data;
      },
      error: (err) => {
        console.error('Error cargando resumen:', err);
      }
    });
  }

  onFilterChange() {
    this.loadLogs();
    this.loadSummary();
  }

  getActionBadgeColor(action: string): string {
    switch (action) {
      case 'login':
        return 'success';
      case 'logout':
        return 'secondary';
      case 'login_failed':
      case 'login_pending_2fa':
        return 'warning';
      case '2fa_enabled':
      case '2fa_disabled':
        return 'primary';
      case 'user_created':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  getActionLabel(action: string): string {
    const option = this.actionOptions.find(o => o.value === action);
    return option ? option.label : action;
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
