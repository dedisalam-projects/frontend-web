import { CanActivateFn } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';

export function getCookie(doc: Document | null, name: string): string | null {
    if (!doc || typeof doc.cookie === 'undefined') return null;
    const match = doc.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
}

export function isTokenValid(token: string): boolean {
    try {
        const parts = token.split('.');
        const base64 = (parts[1] || '').replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

export const guestGuard: CanActivateFn = (route, state) => {
    const platformId = inject(PLATFORM_ID);
    const document = inject(DOCUMENT, { optional: true });

    if (isPlatformBrowser(platformId)) {
        const userSession = getCookie(document, 'user_session');
        if (userSession) {
            if (document?.location) {
                document.location.href = `${environment.appUrls.dashboard}/`;
            }
            return false;
        }

        const cookieToken = getCookie(document, 'accessToken');
        if (!cookieToken) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('user');
            return true;
        }

        if (isTokenValid(cookieToken)) {
            if (document?.location) {
                document.location.href = `${environment.appUrls.dashboard}/`;
            }
            return false;
        } else {
            // Expired cookie
            if (document) {
                const domainAttr = environment.cookieDomain ? `; domain=${environment.cookieDomain}` : '';
                document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;${domainAttr}`;
                document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('user');
            return true;
        }
    }
    return true;
};
