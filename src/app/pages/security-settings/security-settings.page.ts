import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addCircleOutline, 
  closeCircleOutline,
  shieldCheckmarkOutline,
  shieldOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-security-settings',
  templateUrl: './security-settings.page.html',
  styleUrls: ['./security-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
    IonButtons,
    IonBackButton
  ]
})
export class SecuritySettingsPage implements OnInit {
  twoFAEnabled = false;
  loading = false;
  qrCode: string | null = null;
  secret: string | null = null;
  showQR = false;
  verificationToken = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ addCircleOutline, closeCircleOutline, shieldCheckmarkOutline, shieldOutline });
  }

  ngOnInit() {
    this.loadTwoFAStatus();
  }

  loadTwoFAStatus() {
    const user = this.authService.getUser();
    if (user && user.id) {
      // Obtener el estado real del backend
      this.apiService.get2FAStatus(user.id).subscribe({
        next: (response) => {
          this.twoFAEnabled = response.twoFAEnabled || false;
          // Actualizar también en el servicio de autenticación
          user.twoFAEnabled = this.twoFAEnabled;
        },
        error: (err) => {
          console.error('Error obteniendo estado de 2FA:', err);
          // Fallback: usar el estado local
          this.twoFAEnabled = user.twoFAEnabled || false;
        }
      });
    }
  }

  async enableTwoFA() {
    const alert = await this.alertController.create({
      header: 'Habilitar 2FA',
      message: 'Se generará un código QR para escanear con Google Authenticator',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: () => {
            this.generateQRCode();
          }
        }
      ]
    });

    await alert.present();
  }

  generateQRCode() {
    this.loading = true;
    this.apiService.enable2FA().subscribe({
      next: (response) => {
        this.secret = response.secret;
        this.qrCode = response.qrCode;
        this.showQR = true;
        this.verificationToken = '';
        this.loading = false;
        this.presentToast('Código QR generado. Escanea con Google Authenticator', 'success');
      },
      error: (err) => {
        console.error('Error generando QR:', err);
        this.presentToast('Error al generar código QR', 'danger');
        this.loading = false;
      }
    });
  }

  async verifyTwoFA() {
    if (!this.verificationToken || this.verificationToken.length !== 6) {
      this.presentToast('Ingresa un token de 6 dígitos', 'warning');
      return;
    }

    if (!this.secret) {
      this.presentToast('Error: no hay secret disponible', 'danger');
      return;
    }

    this.loading = true;
    this.apiService.verify2FASetup(this.secret, this.verificationToken).subscribe({
      next: () => {
        this.showQR = false;
        this.secret = null;
        this.qrCode = null;
        this.verificationToken = '';
        this.loading = false;

        this.presentToast('2FA habilitado correctamente', 'success');
        // Recargar el estado desde el backend
        this.loadTwoFAStatus();
      },
      error: (err) => {
        console.error('Error verificando 2FA:', err);
        this.presentToast('Token incorrecto. Intenta de nuevo.', 'danger');
        this.loading = false;
      }
    });
  }

  async disableTwoFA() {
    const alert = await this.alertController.create({
      header: 'Deshabilitar 2FA',
      message: '¿Estás seguro? Tu cuenta será menos segura.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Deshabilitar',
          role: 'destructive',
          handler: () => {
            this.confirmDisableTwoFA();
          }
        }
      ]
    });

    await alert.present();
  }

  confirmDisableTwoFA() {
    this.loading = true;
    this.apiService.disable2FA().subscribe({
      next: () => {
        this.loading = false;
        this.presentToast('2FA deshabilitado', 'success');
        // Recargar el estado desde el backend
        this.loadTwoFAStatus();
      },
      error: (err) => {
        console.error('Error deshabilitando 2FA:', err);
        this.presentToast('Error al deshabilitar 2FA', 'danger');
        this.loading = false;
      }
    });
  }

  cancelQRSetup() {
    this.showQR = false;
    this.secret = null;
    this.qrCode = null;
    this.verificationToken = '';
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
