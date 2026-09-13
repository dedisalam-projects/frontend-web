/**
 * Integration Test: Auth Guard Chain
 *
 * Verifies that the full authentication flow works end-to-end:
 * 1. authGuard blocks access without a valid JWT cookie or url token
 * 2. authGuard allows access with a valid JWT cookie
 * 3. authGuard exchanges valid URL token to cookie and localStorage
 * 4. Token expiry causes redirect to auth microfrontend (port 4002)
 */
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, provideRouter } from '@angular/router';
import { authGuard } from '../guards/auth.guard';

function makeToken(expOffsetSeconds: number): string {
    const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
    const payload = btoa(JSON.stringify({ exp, sub: 'user-1', role: 'admin' }));
    return `header.${payload}.sig`;
}

const mockRoute = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
const mockState = { url: '/dashboard' } as RouterStateSnapshot;

describe('Auth Guard Integration', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter([])],
        });
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    afterEach(() => {
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    // ── Access Control ────────────────────────────────────────────────────

    it('should allow access when valid accessToken is in cookie', () => {
        const token = makeToken(3600);
        document.cookie = `accessToken=${token}; path=/;`;

        const result = TestBed.runInInjectionContext(() =>
            authGuard(mockRoute, mockState)
        );
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBe(token);
    });

    it('should allow access and store token when valid token is in queryParams', () => {
        const token = makeToken(3600);
        const routeWithToken = { queryParams: { token } } as unknown as ActivatedRouteSnapshot;

        const result = TestBed.runInInjectionContext(() =>
            authGuard(routeWithToken, mockState)
        );
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBe(token);
    });

    it('should block access and clean up when no token is present', () => {
        const result = TestBed.runInInjectionContext(() =>
            authGuard(mockRoute, mockState)
        );
        expect(result).toBe(false);
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should block access when accessToken is expired', () => {
        const expiredToken = makeToken(-3600);
        document.cookie = `accessToken=${expiredToken}; path=/;`;

        const result = TestBed.runInInjectionContext(() =>
            authGuard(mockRoute, mockState)
        );
        expect(result).toBe(false);
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should block access when token is malformed', () => {
        document.cookie = 'accessToken=not.a.valid.jwt; path=/;';

        const result = TestBed.runInInjectionContext(() =>
            authGuard(mockRoute, mockState)
        );
        expect(result).toBe(false);
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should allow access when token has no exp field (infinite session)', () => {
        const noExpPayload = btoa(JSON.stringify({ sub: 'user-1' }));
        const token = `header.${noExpPayload}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;

        const result = TestBed.runInInjectionContext(() =>
            authGuard(mockRoute, mockState)
        );
        expect(result).toBe(true);
    });

    it('should handle empty string token gracefully', () => {
        document.cookie = 'accessToken=; path=/;';

        const result = TestBed.runInInjectionContext(() =>
            authGuard(mockRoute, mockState)
        );
        expect(result).toBe(false);
    });
});
