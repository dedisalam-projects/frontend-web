import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';

export function getCookie(doc: Document | null | undefined, name: string): string | null {
  if (!doc || typeof doc.cookie === 'undefined') return null;
  const match = doc.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export function isTokenValid(token: string | null | undefined): boolean {
  try {
    const parts = (token || '').split('.');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const document = inject(DOCUMENT, { optional: true });
  const router = inject(Router);

  if (isPlatformBrowser(platformId)) {
    const urlToken = route.queryParams['token'];
    if (urlToken && isTokenValid(urlToken)) {
      if (document) {
        document.cookie = `accessToken=${urlToken}; path=/; max-age=604800; SameSite=Lax`;
        if (document.defaultView) {
          document.defaultView.history.replaceState({}, document.title, document.defaultView.location.pathname);
        }
      }
      return true;
    }

    const cookieToken = getCookie(document, 'accessToken');
    if (cookieToken && isTokenValid(cookieToken)) {
      return true;
    }

    const userSession = getCookie(document, 'user_session');
    if (userSession) {
      return true;
    }

    const userStorage = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (userStorage) {
      return true;
    }

    // No active session -> Clean up and redirect to dedicated auth frontend
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    if (document) {
      if (environment.cookieDomain) {
        document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;; domain=${environment.cookieDomain}`;
        document.cookie = `user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;; domain=${environment.cookieDomain}`;
      }
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      if (document.location) {
        const redirectParam = encodeURIComponent(document.location.href);
        document.location.href = `${environment.appUrls.auth}/login?redirect=${redirectParam}`;
      }
    }
    return false;
  }
  return true;
};
