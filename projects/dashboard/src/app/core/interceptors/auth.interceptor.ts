import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const http = inject(HttpClient);

    let authReq = req;
    if (req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api/')) {
        authReq = req.clone({
            withCredentials: true
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (
                error.status === 401 &&
                !req.url.includes('/auth/login') &&
                !req.url.includes('/auth/refresh')
            ) {
                return http.post<any>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
                    switchMap(() => next(authReq)),
                    catchError((refreshErr) => {
                        if (typeof document !== 'undefined') {
                            const domainAttr = environment.cookieDomain ? `; domain=${environment.cookieDomain}` : '';
                            document.cookie = `user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;${domainAttr}`;
                            document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
                            document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;${domainAttr}`;
                            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
                        }
                        if (typeof localStorage !== 'undefined') {
                            localStorage.removeItem('user');
                            localStorage.removeItem('currentUser');
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                        }
                        if (typeof window !== 'undefined') {
                            window.location.href = `${environment.appUrls.auth}/login`;
                        }
                        return throwError(() => refreshErr);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
