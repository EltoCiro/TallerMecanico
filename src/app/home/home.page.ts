import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent, IonText } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { addIcons } from 'ionicons';
import { 
  logOutOutline, 
  peopleOutline, 
  carOutline, 
  documentTextOutline, 
  constructOutline,
  cubeOutline,
  cashOutline,
  personOutline,
  statsChartOutline,
  settingsOutline,
  calendarOutline,
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  arrowForwardOutline,
  refreshOutline,
  trendingUpOutline,
  walletOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonButton, 
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonRefresher,
    IonRefresherContent,
    IonText
  ],
})
export class HomePage implements OnInit {
  userName: string = '';
  userRole: string = '';
  currentDate: string = '';

  // Estadísticas generales
  stats = {
    clients: 0,
    vehicles: 0,
    orders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    products: 0,
    lowStock: 0,
    totalSales: 0,
    todaySales: 0,
    monthSales: 0,
    pendingBudgets: 0,
    customersToday: 0
  };

  // Estadísticas específicas por rol
  mechanicStats = {
    assignedOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0
  };

  productivity: any[] = [];
  topMechanics: any[] = [];
  loading = false;

  // Módulos de navegación completos
  quickActions = [
    {
      title: 'Clientes',
      icon: 'people-outline',
      color: 'primary',
      route: '/tabs/clients',
      roles: ['Administrador', 'Cajero']
    },
    {
      title: 'Vehículos',
      icon: 'car-outline',
      color: 'success',
      route: '/tabs/vehicles',
      roles: ['Administrador', 'Cajero', 'Mecánico']
    },
    {
      title: 'Presupuestos',
      icon: 'document-text-outline',
      color: 'warning',
      route: '/tabs/budgets',
      roles: ['Administrador', 'Cajero']
    },
    {
      title: 'Órdenes de Servicio',
      icon: 'construct-outline',
      color: 'danger',
      route: '/tabs/service-orders',
      roles: ['Administrador', 'Mecánico', 'Cajero']
    },
    {
      title: 'Inventario',
      icon: 'cube-outline',
      color: 'tertiary',
      route: '/tabs/inventory',
      roles: ['Administrador']
    },
    {
      title: 'Personal',
      icon: 'person-outline',
      color: 'primary',
      route: '/tabs/staff',
      roles: ['Administrador']
    },
    {
      title: 'Ventas',
      icon: 'cash-outline',
      color: 'success',
      route: '/tabs/sales',
      roles: ['Administrador', 'Cajero']
    },
    {
      title: 'Reportes',
      icon: 'stats-chart-outline',
      color: 'warning',
      route: '/tabs/reports',
      roles: ['Administrador']
    },
    {
      title: 'Configuración',
      icon: 'settings-outline',
      color: 'danger',
      route: '/tabs/settings',
      roles: ['Administrador']
    }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {
    addIcons({ 
      logOutOutline, 
      peopleOutline, 
      carOutline, 
      documentTextOutline, 
      constructOutline,
      cubeOutline,
      cashOutline,
      personOutline,
      statsChartOutline,
      settingsOutline,
      calendarOutline,
      timeOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      arrowForwardOutline,
      refreshOutline,
      trendingUpOutline,
      walletOutline
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.nombre;
      this.userRole = user.rol;
    }
    this.updateDate();
    this.loadStats();
  }

  updateDate() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    this.currentDate = now.toLocaleDateString('es-ES', options);
  }

  loadStats(event?: any) {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();

    Promise.all([
      this.apiService.getClients().toPromise(),
      this.apiService.getVehicles().toPromise(),
      this.apiService.getServiceOrders().toPromise(),
      this.apiService.getProducts().toPromise(),
      this.apiService.getBudgets().toPromise(),
      this.userRole === 'Administrador' ? this.apiService.getProductivity().toPromise() : Promise.resolve([]),
      this.userRole === 'Administrador' || this.userRole === 'Cajero' ? this.apiService.getSales().toPromise() : Promise.resolve([])
    ]).then(([clients, vehicles, orders, products, budgets, productivity, sales]) => {
      // Estadísticas generales
      this.stats.clients = clients?.length || 0;
      this.stats.vehicles = vehicles?.length || 0;
      this.stats.orders = orders?.length || 0;
      this.stats.pendingOrders = orders?.filter((o: any) => o.estatus === 'pendiente').length || 0;
      this.stats.inProgressOrders = orders?.filter((o: any) => o.estatus === 'en_proceso').length || 0;
      this.stats.completedOrders = orders?.filter((o: any) => o.estatus === 'completada').length || 0;
      this.stats.products = products?.length || 0;
      this.stats.lowStock = products?.filter((p: any) => p.cantidad <= (p.minStockAlert || 5)).length || 0;
      this.stats.pendingBudgets = budgets?.filter((b: any) => b.estatus === 'pendiente').length || 0;
      
      // Estadísticas específicas para Mecánico
      if (this.userRole === 'Mecánico' && currentUser) {
        const userId = currentUser.id;
        const mechanicOrders = orders?.filter((o: any) => 
          o.assignedMechanicIds?.includes(userId)
        ) || [];
        
        this.mechanicStats.assignedOrders = mechanicOrders.length;
        this.mechanicStats.completedOrders = mechanicOrders.filter((o: any) => o.estatus === 'completada').length;
        this.mechanicStats.pendingOrders = mechanicOrders.filter((o: any) => o.estatus === 'pendiente').length;
        this.mechanicStats.inProgressOrders = mechanicOrders.filter((o: any) => o.estatus === 'en_proceso').length;
      }
      
      // Productividad de mecánicos (solo Administrador)
      if (Array.isArray(productivity)) {
        this.productivity = productivity;
        this.topMechanics = productivity.sort((a: any, b: any) => b.completadas - a.completadas).slice(0, 3);
      }
      
      // Estadísticas de ventas (Administrador y Cajero)
      if (Array.isArray(sales)) {
        // Calcular total de ventas
        this.stats.totalSales = sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
        
        // Ventas de hoy
        const today = new Date().toISOString().split('T')[0];
        this.stats.todaySales = sales
          .filter((s: any) => {
            if (!s.fecha) return false;
            const saleDate = new Date(s.fecha).toISOString().split('T')[0];
            return saleDate === today;
          })
          .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
        
        // Ventas del mes
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        this.stats.monthSales = sales
          .filter((s: any) => {
            if (!s.fecha) return false;
            const saleDate = new Date(s.fecha);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
          })
          .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
        
        // Clientes atendidos hoy
        const todayCustomers = new Set(
          sales
            .filter((s: any) => {
              if (!s.fecha) return false;
              const saleDate = new Date(s.fecha).toISOString().split('T')[0];
              return saleDate === today;
            })
            .map((s: any) => s.ClientId)
            .filter((id: any) => id !== null && id !== undefined)
        );
        this.stats.customersToday = todayCustomers.size;
      }
      
      this.loading = false;
      if (event) {
        event.target.complete();
      }
    }).catch(error => {
      console.error('Error cargando estadísticas:', error);
      this.loading = false;
      if (event) {
        event.target.complete();
      }
    });
  }

  canAccessAction(roles: string[]): boolean {
    return roles.includes(this.userRole);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
