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
        path: 'shop',
        title: 'Cikloni',
        loadComponent: () => import('./pages/shop/shop').then((m) => m.ShopPage),
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
      {
        path: 'delivery',
        title: 'Cikloni',
        loadComponent: () => import('./pages/delivery/delivery').then((m) => m.DeliveryPage),
      },
      {
        path: 'returns',
        title: 'Cikloni',
        loadComponent: () => import('./pages/returns/returns').then((m) => m.ReturnsPage),
      },
      {
        path: 'privacy',
        title: 'Cikloni',
        loadComponent: () => import('./pages/privacy/privacy').then((m) => m.PrivacyPage),
      },
      {
        path: 'terms',
        title: 'Cikloni',
        loadComponent: () => import('./pages/terms/terms').then((m) => m.TermsPage),
      },
      {
        path: 'contact',
        title: 'Cikloni',
        loadComponent: () => import('./pages/contact/contact').then((m) => m.ContactPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
