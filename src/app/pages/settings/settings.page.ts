import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonList,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonText,
  IonSelect, IonSelectOption, IonButtons, IonMenuButton,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, personOutline, logOutOutline, linkOutline, saveOutline, shieldCheckmarkOutline, checkmarkCircle, closeCircle, closeCircleOutline, checkmark, copyOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
    IonLabel, IonInput, IonButton, IonIcon, IonText, IonSelect, IonSelectOption,
    IonButtons, IonMenuButton
  ]
})
export class SettingsPage implements OnInit {
  currentUser: any;
  apiUrl = '';

  // 2FA
  show2FASetup = false;
  loading = false;
  qrCodeImageUrl: string | null = null;
  manualEntry: string | null = null;
  setupTokenCode = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ settingsOutline, personOutline, logOutOutline, linkOutline, saveOutline, shieldCheckmarkOutline, checkmarkCircle, closeCircle, closeCircleOutline, checkmark, copyOutline });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.apiUrl = this.apiService.getApiUrl();
  }

  saveApiUrl() {
    if (this.apiUrl) {
      this.apiService.setApiUrl(this.apiUrl);
      this.showToast('URL de API guardada', 'success');
    }
  }

  // Iniciar configuración de 2FA
  async start2FASetup() {
    this.loading = true;
    this.apiService.setup2FA().subscribe({
      next: async (response) => {
        console.log('2FA setup:', response);
        this.loading = false;
        this.qrCodeImageUrl = response.qrCode;
        this.manualEntry = response.manualEntry;
        this.show2FASetup = true;
        await this.showToast('Escanea el código QR con Google Authenticator', 'info');
      },
      error: async (error) => {
        console.error('Setup 2FA error:', error);
        this.loading = false;
        await this.showToast('Error: ' + (error.error?.error || 'Error'), 'danger');
      }
    });
  }

  // Verificar y activar 2FA
  async verify2FA() {
    if (!this.setupTokenCode || this.setupTokenCode.length !== 6) {
      await this.showToast('Ingresa un código válido de 6 dígitos', 'warning');
      return;
    }

    if (!this.manualEntry) {
      await this.showToast('Falta el secreto para verificar', 'danger');
      return;
    }

    this.loading = true;
    this.apiService.verify2FA(this.manualEntry, this.setupTokenCode).subscribe({
      next: async (response) => {
        console.log('2FA verified:', response);
        this.loading = false;
        this.show2FASetup = false;
        this.qrCodeImageUrl = null;
        this.manualEntry = null;
        this.setupTokenCode = '';
        this.currentUser = this.authService.getCurrentUser();
        await this.showToast('2FA activado exitosamente', 'success');
      },
      error: async (error) => {
        console.error('Verify 2FA error:', error);
        this.loading = false;
        await this.showToast('Código incorrecto: ' + (error.error?.error || 'Error'), 'danger');
      }
    });
  }

  // Cancelar setup de 2FA
  cancel2FASetup() {
    this.show2FASetup = false;
    this.qrCodeImageUrl = null;
    this.manualEntry = null;
    this.setupTokenCode = '';
  }

  // Desactivar 2FA
  async disable2FA() {
    const alert = await this.alertController.create({
      header: 'Desactivar 2FA',
      message: '¿Estás seguro de desactivar la autenticación de dos factores?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          handler: () => {
            this.loading = true;
            this.apiService.disable2FA().subscribe({
              next: async (response) => {
                this.loading = false;
                this.currentUser = this.authService.getCurrentUser();
                await this.showToast('2FA desactivado', 'success');
              },
              error: async (error) => {
                this.loading = false;
                console.error('Error disabling 2FA:', error);
                this.showToast('Error al desactivar 2FA', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message, duration: 2000, color, position: 'bottom'
    });
    await toast.present();
  }

  // Copiar código al portapapeles
  async copyToClipboard(text: string | null) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      await this.showToast('Código copiado al portapapeles', 'success');
    } catch (err) {
      console.error('Error copying:', err);
      await this.showToast('Error al copiar', 'danger');
    }
  }
}
