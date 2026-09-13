import { CanActivateFn } from '@angular/router';

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

export const guestGuard: CanActivateFn = (route, state) => {
    if (typeof window !== 'undefined') {
        const cookieToken = getCookie('accessToken');
        if (!cookieToken) {
            localStorage.removeItem('accessToken');
            return true;
        }
        if (isTokenValid(cookieToken)) {
            window.location.href = 'http://localhost:4000/';
            return false;
        } else {
            // Expired cookie
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            localStorage.removeItem('accessToken');
            return true;
        }
    }
    return true;
};
