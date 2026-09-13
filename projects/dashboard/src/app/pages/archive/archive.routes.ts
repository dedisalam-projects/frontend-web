import { Routes } from '@angular/router';

export default [
    { path: 'uikit', loadChildren: () => import('./uikit/uikit.routes') },
    { path: 'documentation', loadComponent: () => import('./documentation/documentation').then((m) => m.Documentation) },
    { path: 'crud', loadComponent: () => import('./crud/crud').then((m) => m.Crud) },
    { path: 'empty', loadComponent: () => import('./empty/empty').then((m) => m.Empty) }
] as Routes;
