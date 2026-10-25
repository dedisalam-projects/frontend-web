import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Users } from './app/pages/users/users';
import { Indogrosir } from './app/pages/indogrosir/indogrosir';
import { IndogrosirDetail } from './app/pages/indogrosir/indogrosir-detail';
import { Products } from './app/pages/products/products';
import { Branches } from './app/pages/branches/branches';
import { Categories } from './app/pages/categories/categories';
import { Brands } from './app/pages/brands/brands';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/guards/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'users', component: Users },
            { path: 'indogrosir', component: Indogrosir },
            { path: 'indogrosir/:id', component: IndogrosirDetail },
            { path: 'products', component: Products },
            { path: 'branches', component: Branches },
            { path: 'categories', component: Categories },
            { path: 'brands', component: Brands },
            { path: 'pages/users', redirectTo: 'users', pathMatch: 'full' },
            { path: 'pages/indogrosir', redirectTo: 'indogrosir', pathMatch: 'full' },
            { path: 'pages/products', redirectTo: 'products', pathMatch: 'full' },
            { path: 'pages/branches', redirectTo: 'branches', pathMatch: 'full' },
            { path: 'pages/categories', redirectTo: 'categories', pathMatch: 'full' },
            { path: 'pages/brands', redirectTo: 'brands', pathMatch: 'full' },
            { path: 'archive', loadChildren: () => import('./app/pages/archive/archive.routes') }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
