import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  ToastController,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, personOutline, lockClosedOutline, settingsOutline, closeOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class LoginPage implements OnInit {
  // Login básico
  email = '';
  password = '';
  loading = false;
  showConfig = false;
  apiUrl = '';

  // 2FA
  requiresTwoFactor = false;
  tempUserId: number | null = null;
  twoFactorCode = '';
  showSetup2FA = false;
  qrCodeImageUrl: string | null = null;
  manualEntry: string | null = null;
  setupTokenCode = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ logInOutline, personOutline, lockClosedOutline, settingsOutline, closeOutline, shieldCheckmarkOutline });
  }

  ngOnInit() {
    this.apiUrl = this.apiService.getApiUrl();
  }

  // Enviar código 2FA
  async submit2FA() {
    if (!this.twoFactorCode || this.twoFactorCode.length !== 6) {
      await this.showToast('Ingresa un código válido de 6 dígitos', 'warning');
      return;
    }

    if (!this.tempUserId) {
      await this.showToast('Sesión inválida', 'danger');
      return;
    }

    this.loading = true;
    this.apiService.login2FA(this.tempUserId, this.twoFactorCode).subscribe({
      next: async (response) => {
        console.log('2FA success:', response);
        this.loading = false;
        this.authService.login(response);
        await this.showToast('Autenticación exitosa', 'success');
        await this.router.navigate(['/tabs/home']);
      },
      error: async (error) => {
        console.error('2FA error:', error);
        this.loading = false;
        await this.showToast('Código 2FA incorrecto', 'danger');
      }
    });
  }

  // Configurar 2FA
  async setup2FA() {
    if (!this.authService.isAuthenticated()) {
      await this.showToast('Debes estar autenticado', 'warning');
      return;
    }

    this.loading = true;
    this.apiService.setup2FA().subscribe({
      next: async (response) => {
        console.log('2FA setup:', response);
        this.loading = false;
        this.qrCodeImageUrl = response.qrCode;
        this.manualEntry = response.manualEntry;
        this.showSetup2FA = true;
        await this.showToast('Escanea el código QR con Google Authenticator', 'info');
      },
      error: async (error) => {
        console.error('Setup 2FA error:', error);
        this.loading = false;
        await this.showToast('Error generando 2FA: ' + (error.error?.error || 'Error'), 'danger');
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
        this.showSetup2FA = false;
        this.qrCodeImageUrl = null;
        this.manualEntry = null;
        this.setupTokenCode = '';
        await this.showToast('2FA activado exitosamente', 'success');
      },
      error: async (error) => {
        console.error('Verify 2FA error:', error);
        this.loading = false;
        await this.showToast('Código incorrecto: ' + (error.error?.error || 'Error'), 'danger');
      }
    });
  }

  // Cancelar setup 2FA
  cancel2FASetup() {
    this.showSetup2FA = false;
    this.qrCodeImageUrl = null;
    this.manualEntry = null;
    this.setupTokenCode = '';
  }

  // Cancelar login 2FA
  cancel2FALogin() {
    this.requiresTwoFactor = false;
    this.tempUserId = null;
    this.twoFactorCode = '';
  }

  async login() {
    if (!this.email || !this.password) {
      await this.showToast('Por favor ingresa email y contraseña', 'warning');
      return;
    }

    this.loading = true;
    this.apiService.login(this.email, this.password).subscribe({
      next: async (response) => {
        console.log('Login response:', response);
        this.loading = false;
        
        // Si requiere 2FA
        if (response.requiresTwoFactor) {
          this.requiresTwoFactor = true;
          this.tempUserId = response.userId;
          await this.showToast('Por favor ingresa tu código de 2FA', 'info');
          return;
        }
        
        // Login exitoso sin 2FA
        this.authService.login(response);
        await this.showToast('Bienvenido ' + response.user.nombre, 'success');
        await this.router.navigate(['/tabs/home']);
      },
      error: async (error) => {
        console.error('Login error:', error);
        this.loading = false;
        await this.showToast('Error: ' + (error.error?.error || 'Error de conexión'), 'danger');
      }
    });
  }

  toggleConfig() {
    this.showConfig = !this.showConfig;
  }

  saveApiUrl() {
    if (this.apiUrl) {
      this.apiService.setApiUrl(this.apiUrl);
      this.showToast('URL de API guardada', 'success');
      this.showConfig = false;
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
