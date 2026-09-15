import { CanActivateFn } from '@angular/router';
import { environment } from '../../environments/environment';

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
}

function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return false;
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
    if (typeof window !== 'undefined') {
        const urlToken = route.queryParams['token'];

        if (urlToken && isTokenValid(urlToken)) {
            const domainAttr = environment.cookieDomain ? `; domain=${environment.cookieDomain}` : '';
            localStorage.setItem('accessToken', urlToken);
            document.cookie = `accessToken=${urlToken}; path=/; max-age=604800; SameSite=Lax${domainAttr}`;
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
        }

        const cookieToken = getCookie('accessToken');
        if (cookieToken && isTokenValid(cookieToken)) {
            localStorage.setItem('accessToken', cookieToken);
            return true;
        }

        const userSession = getCookie('user_session');
        if (userSession) {
            return true;
        }

        // No valid session/cookie -> Clean up and redirect to auth
        const domainAttr = environment.cookieDomain ? `; domain=${environment.cookieDomain}` : '';
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;${domainAttr}`;
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = `user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;${domainAttr}`;
        document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';

        // Redirect to auth app login
        window.location.href = `${environment.appUrls.auth}/login`;
        return false;
    }
    return false;
};
