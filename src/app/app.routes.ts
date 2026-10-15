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
        path: 'calculator',
        title: 'Cikloni',
        loadComponent: () => import('./pages/calculator/calculator').then((m) => m.CalculatorPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
