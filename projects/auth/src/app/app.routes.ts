import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'auth', loadChildren: () => import('./pages/auth/auth.routes') },
    { path: '', loadChildren: () => import('./pages/auth/auth.routes') }
];
