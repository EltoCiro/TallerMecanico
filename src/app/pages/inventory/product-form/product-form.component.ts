import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonItem, IonLabel, IonInput, IonTextarea, IonIcon, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonNote, IonBadge,
  ModalController, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, informationCircleOutline, warningOutline } from 'ionicons/icons';
import { ApiService } from '../../../services/api.service';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonContent, IonItem, IonLabel, IonInput, IonTextarea, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonNote, IonBadge
  ]
})
export class ProductFormComponent implements OnInit {
  @Input() product?: Product;

  formData: any = {
    nombre: '',
    descripcion: '',
    cantidad: 0,
    precioCosto: 0,
    precioVenta: 0,
    sku: '',
    minStockAlert: 5
  };

  isEdit = false;

  constructor(
    private modalController: ModalController,
    private apiService: ApiService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ closeOutline, saveOutline, informationCircleOutline, warningOutline });
  }

  ngOnInit() {
    if (this.product?.id) {
      this.isEdit = true;
      this.formData = {
        id: this.product.id,
        nombre: this.product.nombre || this.product.nombreProducto || '',
        descripcion: this.product.descripcion || '',
        cantidad: this.product.cantidad || 0,
        precioCosto: this.product.precioCosto || 0,
        precioVenta: this.product.precioVenta || 0,
        sku: this.product.sku || '',
        minStockAlert: this.product.minStockAlert || 5
      };
    }
  }

  calculateMargin(): number {
    const costo = this.formData.precioCosto || 0;
    const venta = this.formData.precioVenta || 0;
    if (costo === 0) return 0;
    return ((venta - costo) / costo) * 100;
  }

  async save() {
    // Validaciones
    if (!this.formData.nombre?.trim()) {
      await this.showToast('El nombre del producto es requerido', 'warning');
      return;
    }

    if ((this.formData.precioCosto || 0) <= 0) {
      await this.showToast('El precio de costo debe ser mayor a 0', 'warning');
      return;
    }

    if ((this.formData.precioVenta || 0) <= 0) {
      await this.showToast('El precio de venta debe ser mayor a 0', 'warning');
      return;
    }

    if ((this.formData.cantidad || 0) < 0) {
      await this.showToast('La cantidad no puede ser negativa', 'warning');
      return;
    }

    // Advertencia si precio de venta es menor que costo
    if ((this.formData.precioVenta || 0) < (this.formData.precioCosto || 0)) {
      const confirm = await this.alertController.create({
        header: 'Advertencia',
        message: '⚠️ El precio de venta es menor que el precio de costo. Esto resultará en pérdidas. ¿Deseas continuar?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Continuar',
            handler: () => {
              this.saveProduct();
            }
          }
        ]
      });
      await confirm.present();
      return;
    }

    this.saveProduct();
  }

  private saveProduct() {
    // Asegurar que se envíe 'nombre' al backend
    const productData = {
      nombre: this.formData.nombre,
      descripcion: this.formData.descripcion,
      cantidad: this.formData.cantidad || 0,
      precioCosto: this.formData.precioCosto || 0,
      precioVenta: this.formData.precioVenta || 0,
      sku: this.formData.sku || '',
      minStockAlert: this.formData.minStockAlert || 5
    };

    const operation = this.isEdit
      ? this.apiService.updateProduct(this.formData.id!, productData)
      : this.apiService.createProduct(productData);

    operation.subscribe({
      next: async () => {
        await this.showToast(
          this.isEdit ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
          'success'
        );
        this.dismiss(true);
      },
      error: async (error) => {
        console.error('Error al guardar producto:', error);
        const message = error.error?.error || error.error?.message || 'Error al guardar el producto';
        await this.showToast(message, 'danger');
      }
    });
  }

  dismiss(reload = false) {
    this.modalController.dismiss({ reload });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
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
