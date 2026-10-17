import { Routes } from '@angular/router';
import { adminGuard, adminLoginGuard } from './admin.guards';

/** Lazy-loaded from app.routes, so none of this ships in the customer bundle. Georgian only. */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    title: 'შესვლა · Cikloni ადმინი',
    canActivate: [adminLoginGuard],
    loadComponent: () => import('./login/login').then((m) => m.AdminLoginPage),
  },
  {
    path: '',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () => import('./layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        title: 'მთავარი · Cikloni ადმინი',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'orders',
        title: 'შეკვეთები · Cikloni ადმინი',
        loadComponent: () => import('./orders/orders').then((m) => m.AdminOrdersPage),
      },
      {
        path: 'products',
        title: 'პროდუქტები · Cikloni ადმინი',
        loadComponent: () => import('./products/products').then((m) => m.AdminProductsPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
