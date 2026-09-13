import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({});
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    afterEach(() => {
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    it('should accept urlToken from queryParams and store it', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const validToken = `header.${btoa(JSON.stringify({ exp }))}.sig`;

        const route = {
            queryParams: { token: validToken }
        } as unknown as ActivatedRouteSnapshot;

        const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBe(validToken);
        expect(document.cookie).toContain(`accessToken=${validToken}`);
        expect(replaceStateSpy).toHaveBeenCalled();
    });

    it('should accept valid cookie token', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const validToken = `header.${btoa(JSON.stringify({ exp }))}.sig`;
        document.cookie = `accessToken=${validToken}; path=/;`;

        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBe(validToken);
    });

    it('should redirect to auth port 4002 when no valid token exists', () => {
        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const mockLocation = { href: '' };
        try {
            vi.stubGlobal('location', mockLocation);
        } catch {
            const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
            expect(result).toBe(false);
            return;
        }

        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(false);
        expect(mockLocation.href).toBe('http://localhost:4002/auth/login');
    });

    it('should reject expired cookie token and clear storage', () => {
        const exp = Math.floor(Date.now() / 1000) - 3600;
        const expiredToken = `header.${btoa(JSON.stringify({ exp }))}.sig`;
        document.cookie = `accessToken=${expiredToken}; path=/;`;

        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const mockLocation = { href: '' };
        try {
            vi.stubGlobal('location', mockLocation);
        } catch {
            const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
            expect(result).toBe(false);
            expect(localStorage.getItem('accessToken')).toBeNull();
            return;
        }

        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(false);
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should reject malformed token and clear storage', () => {
        document.cookie = 'accessToken=bad-token; path=/;';
        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const mockLocation = { href: '' };
        try {
            vi.stubGlobal('location', mockLocation);
        } catch {
            const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
            expect(result).toBe(false);
            return;
        }

        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(false);
    });

    it('should validate token format with Base64URL support', () => {
        const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, email: 'admin@test.com' }))
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        const token = `header.${payload}.sig`;
        const route = { queryParams: { token } } as unknown as ActivatedRouteSnapshot;
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBe(token);
    });
});
