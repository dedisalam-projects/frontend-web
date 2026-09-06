import { CanActivateFn } from '@angular/router';

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
}

function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
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
            localStorage.setItem('accessToken', urlToken);
            document.cookie = `accessToken=${urlToken}; path=/; max-age=604800; SameSite=Lax`;
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
        }

        const cookieToken = getCookie('accessToken');
        if (cookieToken && isTokenValid(cookieToken)) {
            localStorage.setItem('accessToken', cookieToken);
            return true;
        }
        
        // No valid cookie -> Clean up and redirect to auth
        localStorage.removeItem('accessToken');
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';

        // Redirect to auth app
        window.location.href = 'http://localhost:4002/';
        return false;
    }
    return true;
};
