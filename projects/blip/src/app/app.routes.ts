import { Routes } from '@angular/router';
import { AppLayout } from './layout/app.layout';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DocumentPageComponent } from './pages/document/document-page.component';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent, title: 'Dashboard - Blip PDF Studio' },
      {
        path: 'generate-pdf/gojek',
        component: DocumentPageComponent,
        data: { provider: 'gojek' },
        title: 'Gojek Receipts - Blip PDF Studio',
      },
      {
        path: 'generate-pdf/traveloka',
        component: DocumentPageComponent,
        data: { provider: 'traveloka' },
        title: 'Traveloka Receipts - Blip PDF Studio',
      },
      {
        path: 'generate-pdf/indrive',
        component: DocumentPageComponent,
        data: { provider: 'indrive' },
        title: 'inDrive Receipts - Blip PDF Studio',
      },
      {
        path: 'generate-pdf/jackal',
        component: DocumentPageComponent,
        data: { provider: 'jackal' },
        title: 'Jackal Holidays - Blip PDF Studio',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
