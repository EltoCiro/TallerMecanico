import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, addCircleOutline, trashOutline } from 'ionicons/icons';
import { ApiService } from '../../../services/api.service';
import { Client } from '../../../models/client.model';
import { Vehicle } from '../../../models/vehicle.model';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonText
  ]
})
export class ClientFormComponent implements OnInit {
  @Input() client?: Client;

  formData: Client = {
    nombre: '',
    telefono: '',
    correo: ''
  };

  vehicles: Vehicle[] = [];

  constructor(
    private modalController: ModalController,
    private apiService: ApiService,
    private toastController: ToastController
  ) {
    addIcons({ closeOutline, saveOutline, addCircleOutline, trashOutline });
  }

  ngOnInit() {
    if (this.client) {
      this.formData = { ...this.client };
      this.vehicles = this.client.Vehicles || [];
    }
  }

  addVehicle() {
    this.vehicles.push({
      marca: '',
      modelo: '',
      anio: new Date().getFullYear().toString(),
      placas: ''
    });
  }

  removeVehicle(index: number) {
    this.vehicles.splice(index, 1);
  }

  async save() {
    if (!this.formData.nombre) {
      await this.showToast('El nombre del cliente es requerido', 'warning');
      return;
    }

    this.apiService.createClient(this.formData).subscribe({
      next: async (client) => {
        // Guardar vehículos
        for (const vehicle of this.vehicles) {
          if (vehicle.marca && vehicle.modelo) {
            vehicle.ClienteId = client.id;
            await this.apiService.createVehicle(vehicle).toPromise();
          }
        }
        await this.showToast('Cliente guardado correctamente', 'success');
        this.dismiss(true);
      },
      error: async (error) => {
        await this.showToast('Error al guardar cliente', 'danger');
      }
    });
  }

  dismiss(reload = false) {
    this.modalController.dismiss({ reload });
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
