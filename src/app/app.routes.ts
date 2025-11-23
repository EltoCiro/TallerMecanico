import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/clients/clients.page').then((m) => m.ClientsPage),
      },
      {
        path: 'vehicles',
        loadComponent: () => import('./pages/vehicles/vehicles.page').then((m) => m.VehiclesPage),
      },
      {
        path: 'budgets',
        loadComponent: () => import('./pages/budgets/budgets.page').then((m) => m.BudgetsPage),
      },
      {
        path: 'service-orders',
        loadComponent: () => import('./pages/service-orders/service-orders.page').then((m) => m.ServiceOrdersPage),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./pages/inventory/inventory.page').then((m) => m.InventoryPage),
      },
      {
        path: 'staff',
        loadComponent: () => import('./pages/staff/staff.page').then((m) => m.StaffPage),
      },
      {
        path: 'sales',
        loadComponent: () => import('./pages/sales/sales.page').then((m) => m.SalesPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
