import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideZonelessChangeDetection(),
        providePrimeNG({
            theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } },
            license:
                'eyJpZCI6ImVlYzFjMTc4LThhMTktNDQyZi05NDkwLTg2ZTAwMjE5NDAwOCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODg2MTE2MTEsImV4cCI6MTgyMDE0NzYxMX0.qM7ogrIrzgCmUypca2jkecRrPVLS-45OJGgzLhN0yvSAbYois2o8Ma1An0stDkumY9sHK2jorVxOklQGQFXTBw'
        }),
        provideClientHydration()
    ]
};
