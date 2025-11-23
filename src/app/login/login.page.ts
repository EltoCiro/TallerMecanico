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
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, personOutline, lockClosedOutline, settingsOutline } from 'ionicons/icons';
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
    IonSpinner
  ]
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  loading = false;
  showConfig = false;
  apiUrl = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ logInOutline, personOutline, lockClosedOutline, settingsOutline });
  }

  ngOnInit() {
    this.apiUrl = this.apiService.getApiUrl();
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
        
        // El backend devuelve { id, nombre, rol } directamente
        this.authService.login(response);
        
        await this.showToast('Bienvenido ' + response.nombre, 'success');
        
        // Navegar a tabs/home
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
}
