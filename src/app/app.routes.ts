import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        title: 'Cikloni',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'product/:slug',
        title: 'Cikloni',
        loadComponent: () => import('./pages/product/product').then((m) => m.ProductPage),
      },
      {
        path: 'cart',
        title: 'Cikloni',
        loadComponent: () => import('./pages/cart/cart').then((m) => m.CartPage),
      },
      {
        path: 'checkout',
        title: 'Cikloni',
        loadComponent: () => import('./pages/checkout/checkout').then((m) => m.CheckoutPage),
      },
      {
        path: 'order/:orderNumber',
        title: 'Cikloni',
        loadComponent: () => import('./pages/order/order').then((m) => m.OrderPage),
      },
      {
        path: 'calculator',
        title: 'Cikloni',
        loadComponent: () => import('./pages/calculator/calculator').then((m) => m.CalculatorPage),
      },
    ],
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
