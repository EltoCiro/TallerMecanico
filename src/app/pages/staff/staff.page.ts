import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem,
  IonLabel, IonFab, IonFabButton, IonIcon, IonCard, IonCardContent,
  IonRefresher, IonRefresherContent, IonInput, IonButton, IonSelect,
  IonSelectOption, IonCardHeader, IonCardTitle, IonSegment, IonSegmentButton,
  IonSearchbar, IonChip, IonBadge, IonGrid, IonRow, IonCol, IonButtons,
  IonMenuButton,
  ModalController, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, personOutline, saveOutline, trashOutline, peopleOutline,
  createOutline, closeOutline, searchOutline, timeOutline, briefcaseOutline,
  statsChartOutline, calendarOutline, lockClosedOutline, trophyOutline,
  checkmarkCircleOutline, mailOutline, shieldCheckmarkOutline, constructOutline, cashOutline, informationCircleOutline, homeOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Staff } from '../../models/staff.model';
import { User } from '../../models/user.model';

interface Productivity {
  mechanicId: number;
  mechanicName: string;
  completedOrders: number;
  avgRating?: number;
  totalHours?: number;
}

@Component({
  selector: 'app-staff',
  templateUrl: './staff.page.html',
  styleUrls: ['./staff.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonCard,
    IonCardContent, IonRefresher, IonRefresherContent, IonInput, IonButton,
    IonSelect, IonSelectOption, IonCardHeader, IonCardTitle, IonSegment,
    IonSegmentButton, IonSearchbar, IonChip, IonBadge, IonGrid, IonRow,
    IonCol, IonButtons, IonMenuButton
  ]
})
export class StaffPage implements OnInit {
  // Datos
  staff: Staff[] = [];
  filteredStaff: Staff[] = [];
  users: User[] = [];
  filteredUsers: User[] = [];
  productivity: Productivity[] = [];

  // Vista y formularios
  currentView: 'staff' | 'users' = 'staff';
  showForm = false;
  isEditing = false;
  searchTerm = '';

  // Formulario de Staff
  formData: Staff = {
    id: undefined,
    nombre: '',
    especialidad: '',
    horario: ''
  };

  // Formulario de Usuario
  userFormData: User = {
    id: undefined,
    nombre: '',
    email: '',
    password: '',
    rol: 'Mecánico'
  };

  // Especialidades predefinidas
  especialidades = [
    'Mecánica General',
    'Electricidad Automotriz',
    'Motor',
    'Transmisión',
    'Frenos',
    'Suspensión',
    'Aire Acondicionado',
    'Carrocería y Pintura',
    'Diagnóstico Electrónico',
    'Alineación y Balanceo'
  ];

  // Horarios predefinidos
  horarios = [
    'Lunes a Viernes 8:00-17:00',
    'Lunes a Viernes 9:00-18:00',
    'Lunes a Sábado 8:00-14:00',
    'Turno Matutino 7:00-15:00',
    'Turno Vespertino 15:00-23:00',
    'Tiempo Completo',
    'Medio Tiempo'
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({homeOutline,peopleOutline,shieldCheckmarkOutline,personOutline,briefcaseOutline,timeOutline,saveOutline,closeOutline,checkmarkCircleOutline,trophyOutline,createOutline,trashOutline,mailOutline,lockClosedOutline,constructOutline,cashOutline,informationCircleOutline,addOutline,searchOutline,statsChartOutline,calendarOutline});
  }

  ngOnInit() {
    this.loadStaff();
    this.loadUsers();
    this.loadProductivity();
  }

  // ==================== PERMISOS ====================
  isAdmin(): boolean {
    return this.authService.getCurrentUser()?.rol === 'Administrador';
  }

  canEdit(): boolean {
    return this.isAdmin();
  }

  canDelete(): boolean {
    return this.isAdmin();
  }

  // ==================== SEGMENTO ====================
  segmentChanged(event: any) {
    this.currentView = event.detail.value;
    this.showForm = false;
    this.searchTerm = '';
    this.resetForms();
  }

  // ==================== CARGA DE DATOS ====================
  loadStaff(event?: any) {
    this.apiService.getStaff().subscribe({
      next: (data) => {
        this.staff = data || [];
        this.filteredStaff = [...this.staff];
        if (event) event.target.complete();
      },
      error: async (error) => {
        console.error('Error al cargar staff:', error);
        await this.showToast('Error al cargar personal', 'danger');
        if (event) event.target.complete();
      }
    });
  }

  loadUsers(event?: any) {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users = data || [];
        this.filteredUsers = [...this.users];
        if (event) event.target.complete();
      },
      error: async (error) => {
        console.error('Error al cargar usuarios:', error);
        await this.showToast('Error al cargar usuarios', 'danger');
        if (event) event.target.complete();
      }
    });
  }

  loadProductivity() {
    this.apiService.getProductivity().subscribe({
      next: (data) => {
        this.productivity = data || [];
      },
      error: (error) => {
        console.error('Error al cargar productividad:', error);
      }
    });
  }

  refreshData(event?: any) {
    if (this.currentView === 'staff') {
      this.loadStaff(event);
      this.loadProductivity();
    } else {
      this.loadUsers(event);
    }
  }

  // ==================== BÚSQUEDA ====================
  onSearch(event: any) {
    const term = event.target.value?.toLowerCase() || '';
    this.searchTerm = term;

    if (this.currentView === 'staff') {
      if (!term) {
        this.filteredStaff = [...this.staff];
      } else {
        this.filteredStaff = this.staff.filter(s =>
          s.nombre?.toLowerCase().includes(term) ||
          s.especialidad?.toLowerCase().includes(term)
        );
      }
    } else {
      if (!term) {
        this.filteredUsers = [...this.users];
      } else {
        this.filteredUsers = this.users.filter(u =>
          u.nombre?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.rol?.toLowerCase().includes(term)
        );
      }
    }
  }

  // ==================== FORMULARIOS ====================
  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForms();
    }
  }

  resetForms() {
    this.isEditing = false;
    this.formData = {
      id: undefined,
      nombre: '',
      especialidad: '',
      horario: ''
    };
    this.userFormData = {
      id: undefined,
      nombre: '',
      email: '',
      password: '',
      rol: 'Mecánico'
    };
  }

  // ==================== STAFF CRUD ====================
  async saveStaff() {
    if (!this.formData.nombre?.trim()) {
      await this.showToast('El nombre es requerido', 'warning');
      return;
    }

    if (this.isEditing && this.formData.id) {
      this.updateStaffMember();
    } else {
      this.createStaffMember();
    }
  }

  createStaffMember() {
    this.apiService.createStaff(this.formData).subscribe({
      next: async () => {
        await this.showToast('Personal creado exitosamente', 'success');
        this.toggleForm();
        this.loadStaff();
      },
      error: async (error) => {
        console.error('Error al crear staff:', error);
        await this.showToast('Error al crear personal', 'danger');
      }
    });
  }

  updateStaffMember() {
    if (!this.formData.id) return;

    this.apiService.updateStaff(this.formData.id, this.formData).subscribe({
      next: async () => {
        await this.showToast('Personal actualizado exitosamente', 'success');
        this.toggleForm();
        this.loadStaff();
      },
      error: async (error) => {
        console.error('Error al actualizar staff:', error);
        await this.showToast('Error al actualizar personal', 'danger');
      }
    });
  }

  editStaff(member: Staff) {
    this.formData = { ...member };
    this.isEditing = true;
    this.showForm = true;
  }

  async deleteStaff(member: Staff) {
    if (!this.canDelete()) {
      await this.showToast('No tienes permisos para eliminar', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar a ${member.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (member.id) {
              this.apiService.deleteStaff(member.id).subscribe({
                next: async () => {
                  await this.showToast('Personal eliminado exitosamente', 'success');
                  this.loadStaff();
                },
                error: async (error) => {
                  console.error('Error al eliminar staff:', error);
                  await this.showToast('Error al eliminar personal', 'danger');
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // ==================== USUARIOS CRUD ====================
  async saveUser() {
    if (!this.userFormData.nombre?.trim() || !this.userFormData.email?.trim()) {
      await this.showToast('Nombre y email son requeridos', 'warning');
      return;
    }

    if (this.isEditing && this.userFormData.id) {
      this.updateUserAccount();
    } else {
      if (!this.userFormData.password) {
        await this.showToast('La contraseña es requerida', 'warning');
        return;
      }
      this.createUserAccount();
    }
  }

  createUserAccount() {
    const userData: { nombre: string; email: string; password: string; rol?: string } = {
      nombre: this.userFormData.nombre,
      email: this.userFormData.email,
      password: this.userFormData.password || '',
      rol: this.userFormData.rol || 'mecanico'
    };

    this.apiService.register(userData).subscribe({
      next: async (response) => {
        console.log('Usuario creado:', response);
        await this.showToast('Usuario creado exitosamente', 'success');
        this.toggleForm();
        // Recargar inmediatamente la lista de usuarios
        await this.loadUsers();
      },
      error: async (error) => {
        console.error('Error al crear usuario:', error);
        const errorMsg = error.error?.error || 'Error al crear usuario';
        await this.showToast(errorMsg, 'danger');
      }
    });
  }

  updateUserAccount() {
    if (!this.userFormData.id) return;

    const updateData: Partial<User> = {
      nombre: this.userFormData.nombre,
      email: this.userFormData.email,
      rol: this.userFormData.rol
    };

    this.apiService.updateUser(this.userFormData.id, updateData).subscribe({
      next: async () => {
        await this.showToast('Usuario actualizado exitosamente', 'success');
        this.toggleForm();
        this.loadUsers();
      },
      error: async (error) => {
        console.error('Error al actualizar usuario:', error);
        await this.showToast('Error al actualizar usuario', 'danger');
      }
    });
  }

  editUser(user: User) {
    this.userFormData = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      password: '' // No mostramos la contraseña
    };
    this.isEditing = true;
    this.showForm = true;
  }

  async deleteUser(user: User) {
    if (!this.canDelete()) {
      await this.showToast('No tienes permisos para eliminar', 'warning');
      return;
    }

    // Verificar que no sea el último administrador
    const adminCount = this.users.filter(u => u.rol === 'Administrador').length;
    if (user.rol === 'Administrador' && adminCount <= 1) {
      await this.showToast('No se puede eliminar el último administrador', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar al usuario ${user.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (user.id) {
              this.apiService.deleteUser(user.id).subscribe({
                next: async () => {
                  await this.showToast('Usuario eliminado exitosamente', 'success');
                  this.loadUsers();
                },
                error: async (error) => {
                  console.error('Error al eliminar usuario:', error);
                  await this.showToast('Error al eliminar usuario', 'danger');
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // ==================== DETALLES Y MÉTRICAS ====================
  async viewStaffDetails(member: Staff) {
    const prod = this.getProductivityForStaff(member);
    
    const alert = await this.alertController.create({
      header: member.nombre || 'Sin nombre',
      message: `
        <div style="text-align: left;">
          <p><strong>Especialidad:</strong> ${member.especialidad || 'No especificada'}</p>
          <p><strong>Horario:</strong> ${member.horario || 'No especificado'}</p>
          ${prod ? `
            <hr>
            <p><strong>📊 Productividad:</strong></p>
            <p>Órdenes completadas: ${prod.completedOrders}</p>
            ${prod.avgRating ? `<p>Rating promedio: ${prod.avgRating.toFixed(1)} ⭐</p>` : ''}
            ${prod.totalHours ? `<p>Horas trabajadas: ${prod.totalHours}h</p>` : ''}
          ` : ''}
        </div>
      `,
      buttons: [
        { text: 'Cerrar', role: 'cancel' },
        ...(this.canEdit() ? [{
          text: 'Editar',
          handler: () => {
            this.editStaff(member);
          }
        }] : [])
      ]
    });
    await alert.present();
  }

  async viewUserDetails(user: User) {
    const alert = await this.alertController.create({
      header: user.nombre,
      message: `
        <div style="text-align: left;">
          <p><strong>📧 Email:</strong> ${user.email}</p>
          <p><strong>🔐 Rol:</strong> ${user.rol}</p>
          <p><strong>🆔 ID:</strong> ${user.id}</p>
        </div>
      `,
      buttons: [
        { text: 'Cerrar', role: 'cancel' },
        ...(this.canEdit() ? [{
          text: 'Editar',
          handler: () => {
            this.editUser(user);
          }
        }] : [])
      ]
    });
    await alert.present();
  }

  getProductivityForStaff(member: Staff): Productivity | undefined {
    return this.productivity.find(p => p.mechanicId === member.id);
  }

  getRoleColor(rol: string): string {
    switch (rol) {
      case 'Administrador': return 'danger';
      case 'Mecánico': return 'primary';
      case 'Cajero': return 'success';
      default: return 'medium';
    }
  }

  getRoleIcon(rol: string): string {
    switch (rol) {
      case 'Administrador': return 'shield-checkmark-outline';
      case 'Mecánico': return 'construct-outline';
      case 'Cajero': return 'cash-outline';
      default: return 'person-outline';
    }
  }

  // ==================== UTILIDADES ====================
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
