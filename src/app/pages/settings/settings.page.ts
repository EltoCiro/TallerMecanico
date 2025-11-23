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
import { settingsOutline, personOutline, logOutOutline, linkOutline, saveOutline, personAddOutline } from 'ionicons/icons';
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

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ settingsOutline, personOutline, logOutOutline, linkOutline, saveOutline });
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
}
