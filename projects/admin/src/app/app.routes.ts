import { Routes } from '@angular/router';
import { adminGuard, adminLoginGuard } from './admin.guards';

/** Admin app routes (admin.cikloni.ge). Georgian only; every page but login needs an admin. */
export const routes: Routes = [
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
        path: 'orders/:id',
        title: 'შეკვეთა · Cikloni ადმინი',
        loadComponent: () => import('./orders/order-details').then((m) => m.AdminOrderDetailsPage),
      },
      {
        path: 'products',
        title: 'პროდუქტები · Cikloni ადმინი',
        loadComponent: () => import('./products/products').then((m) => m.AdminProductsPage),
      },
      {
        path: 'products/new',
        title: 'ახალი პროდუქტი · Cikloni ადმინი',
        loadComponent: () => import('./products/product-edit').then((m) => m.AdminProductEditPage),
      },
      {
        path: 'products/:id',
        title: 'პროდუქტი · Cikloni ადმინი',
        loadComponent: () => import('./products/product-edit').then((m) => m.AdminProductEditPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
