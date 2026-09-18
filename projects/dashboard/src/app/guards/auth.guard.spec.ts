import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { PLATFORM_ID, Injector, runInInjectionContext } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as fc from 'fast-check';
import { authGuard, isTokenValid, getCookie } from './auth.guard';
import { environment } from '../../environments/environment';

function makeToken(exp?: number): string {
    const payload = btoa(JSON.stringify(exp !== undefined ? { exp } : { user: 'test' }));
    return `header.${payload}.sig`;
}

describe('authGuard', () => {
    let mockLoc: { href: string; pathname: string };
    let mockHistory: { replaceState: ReturnType<typeof vi.fn> };
    let mockDoc: any;

    beforeEach(() => {
        mockLoc = { href: '', pathname: '/dashboard' };
        mockHistory = { replaceState: vi.fn() };
        mockDoc = new Proxy(document, {
            get(target: any, prop: string | symbol) {
                if (prop === 'location') return mockLoc;
                if (prop === 'defaultView') return { location: mockLoc, history: mockHistory };
                const val = target[prop];
                return typeof val === 'function' ? val.bind(target) : val;
            },
            set(target: any, prop: string | symbol, value: any) {
                if (prop === 'location') {
                    mockLoc.href = value;
                    return true;
                }
                target[prop] = value;
                return true;
            }
        });

        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: mockDoc }
            ]
        });
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    it('should accept valid urlToken from queryParams and store it with cookieDomain if set', () => {
        const origDomain = environment.cookieDomain;
        environment.cookieDomain = 'dedisalam.my.id';
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const validToken = makeToken(exp);
        const route = { queryParams: { token: validToken } } as unknown as ActivatedRouteSnapshot;

        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));

        expect(result).toBe(true);
        expect(cookieSpy).toHaveBeenCalledWith(
            `accessToken=${validToken}; path=/; max-age=604800; SameSite=Lax; domain=dedisalam.my.id`
        );
        expect(mockHistory.replaceState).toHaveBeenCalledWith({}, document.title, '/dashboard');
        environment.cookieDomain = origDomain;
    });

    it('should accept valid urlToken from queryParams without domain if cookieDomain is empty', () => {
        const origDomain = environment.cookieDomain;
        environment.cookieDomain = '';
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const validToken = makeToken(exp);
        const route = { queryParams: { token: validToken } } as unknown as ActivatedRouteSnapshot;

        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));

        expect(result).toBe(true);
        expect(cookieSpy).toHaveBeenCalledWith(
            `accessToken=${validToken}; path=/; max-age=604800; SameSite=Lax`
        );
        environment.cookieDomain = origDomain;
    });

    it('should NOT accept urlToken if it is invalid, but proceed to redirect and clear storage', () => {
        const route = { queryParams: { token: 'invalid.token' } } as unknown as ActivatedRouteSnapshot;
        localStorage.setItem('accessToken', 'old');
        localStorage.setItem('currentUser', 'old');

        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));

        expect(result).toBe(false);
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(mockLoc.href).toBe(`${environment.appUrls.auth}/login`);
    });

    it('should accept valid cookie token', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const validToken = makeToken(exp);
        document.cookie = `accessToken=${validToken}; path=/;`;

        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(true);
    });

    it('should accept valid user_session cookie for multi-subdomain SSO', () => {
        document.cookie = 'user_session={"email":"admin@dedisalam.my.id"}; path=/;';

        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(true);
    });

    it('should redirect to auth login when no valid token or session exists, cleaning up cookies with domain', () => {
        const origDomain = environment.cookieDomain;
        environment.cookieDomain = 'dedisalam.my.id';
        localStorage.setItem('accessToken', 'stale');
        localStorage.setItem('currentUser', 'stale-user');

        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;

        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));

        expect(result).toBe(false);
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(cookieSpy).toHaveBeenCalledTimes(4);
        expect(cookieSpy).toHaveBeenCalledWith('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;; domain=dedisalam.my.id');
        expect(cookieSpy).toHaveBeenCalledWith('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
        expect(cookieSpy).toHaveBeenCalledWith('user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;; domain=dedisalam.my.id');
        expect(cookieSpy).toHaveBeenCalledWith('user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
        expect(mockLoc.href).toBe(`${environment.appUrls.auth}/login`);

        environment.cookieDomain = origDomain;
    });

    it('should clean up cookies without domain when cookieDomain is empty', () => {
        const origDomain = environment.cookieDomain;
        environment.cookieDomain = '';
        localStorage.setItem('accessToken', 'stale');
        localStorage.setItem('currentUser', 'stale-user');

        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;

        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));

        expect(result).toBe(false);
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(cookieSpy).toHaveBeenCalledTimes(2);
        expect(cookieSpy).toHaveBeenCalledWith('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
        expect(cookieSpy).toHaveBeenCalledWith('user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');

        environment.cookieDomain = origDomain;
    });

    it('should reject expired cookie token and clear storage', () => {
        const exp = Math.floor(Date.now() / 1000) - 3600;
        const expiredToken = makeToken(exp);
        document.cookie = `accessToken=${expiredToken}; path=/;`;

        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));

        expect(result).toBe(false);
        expect(mockLoc.href).toBe(`${environment.appUrls.auth}/login`);
    });

    it('should return false in SSR context when platform is server', () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'server' },
                { provide: DOCUMENT, useValue: mockDoc }
            ]
        });

        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(false);
        expect(mockLoc.href).toBe('');
    });

    it('should handle authGuard when DOCUMENT provider is omitted or null', () => {
        const isolatedInjector = Injector.create({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        });
        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        let result: boolean | undefined;
        expect(() => {
            result = runInInjectionContext(isolatedInjector, () => authGuard(route, {} as any));
        }).not.toThrow();
        expect(result).toBe(false);
    });

    it('should handle urlToken when navHistory is absent without throwing', () => {
        const docWithoutHistory = {
            cookie: '',
            title: 'Test',
            defaultView: null,
            location: mockLoc
        } as any;
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: docWithoutHistory }
            ]
        });

        const exp = Math.floor(Date.now() / 1000) + 3600;
        const route = { queryParams: { token: makeToken(exp) } } as unknown as ActivatedRouteSnapshot;
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(true);
    });

    it('should return true and not throw when urlToken is valid but document is null', () => {
        const isolatedInjector = Injector.create({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        });
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const route = { queryParams: { token: makeToken(exp) } } as unknown as ActivatedRouteSnapshot;
        let result: boolean | undefined;
        expect(() => {
            result = runInInjectionContext(isolatedInjector, () => authGuard(route, {} as any));
        }).not.toThrow();
        expect(result).toBe(true);
    });

    it('should handle redirect cleanly when document exists but document.location is null', () => {
        const docWithoutLoc = {
            cookie: '',
            title: 'Test',
            location: null,
            defaultView: null
        } as any;
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: docWithoutLoc }
            ]
        });
        const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
        const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
        expect(result).toBe(false);
    });

    describe('isTokenValid helper', () => {
        it('should return false when second part is empty string', () => {
            expect(isTokenValid('header..sig')).toBe(false);
        });
        it('should return false for falsy or empty token values', () => {
            expect(isTokenValid('')).toBe(false);
            expect(isTokenValid(null)).toBe(false);
            expect(isTokenValid(undefined)).toBe(false);
        });

        it('should return false when token has less than 2 parts', () => {
            expect(isTokenValid('singleparttoken')).toBe(false);
        });

        it('should return true for valid 2-part token', () => {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const payload = btoa(JSON.stringify({ exp }));
            expect(isTokenValid(`header.${payload}`)).toBe(true);
        });

        it('should return false for invalid base64 or non-JSON payloads', () => {
            expect(isTokenValid('header.notbase64.sig')).toBe(false);
            expect(isTokenValid('header.bm90LWpzb24=.sig')).toBe(false);
        });

        it('should correctly handle base64url characters with - and _', () => {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const payloadStr = JSON.stringify({ exp, special: '>>>???///+++' });
            const base64url = btoa(payloadStr).replace(/\+/g, '-').replace(/\//g, '_');
            expect(isTokenValid(`header.${base64url}.sig`)).toBe(true);
        });

        it('should return false if token is expired (exp * 1000 < Date.now())', () => {
            const pastExp = Math.floor(Date.now() / 1000) - 100;
            expect(isTokenValid(makeToken(pastExp))).toBe(false);
        });

        it('should return true if token exp is exactly equal to Date.now() (boundary condition)', () => {
            const fixedNow = 1700000000000;
            vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
            expect(isTokenValid(makeToken(fixedNow / 1000))).toBe(true);
        });

        it('should return true if token has no exp field (valid indefinitely)', () => {
            expect(isTokenValid(makeToken())).toBe(true);
        });
    });

    describe('getCookie helper', () => {
        it('should return null when doc is null, undefined, or doc.cookie is undefined', () => {
            expect(getCookie(null, 'test')).toBeNull();
            expect(getCookie(undefined, 'test')).toBeNull();
            expect(getCookie({} as any, 'test')).toBeNull();
        });

        it('should extract and decode target cookie accurately with regex boundaries', () => {
            const mock = { cookie: 'foo=bar; accessToken=secret%20token; other=123' } as Document;
            expect(getCookie(mock, 'accessToken')).toBe('secret token');
            expect(getCookie(mock, 'foo')).toBe('bar');
            expect(getCookie(mock, 'other')).toBe('123');
            expect(getCookie(mock, 'missing')).toBeNull();
        });
    });

    describe('Property-Based Tests (fast-check)', () => {
        it('PROPERTY: any token with exp in the future is valid, and in the past is invalid', () => {
            const nowSec = Math.floor(Date.now() / 1000);
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: nowSec - 10 }),
                    fc.integer({ min: nowSec + 60, max: nowSec + 86400 }),
                    (pastExp, futureExp) => {
                        const expired = makeToken(pastExp);
                        const active = makeToken(futureExp);
                        return isTokenValid(expired) === false && isTokenValid(active) === true;
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('PROPERTY: guard always returns boolean and never throws with arbitrary query params', () => {
            fc.assert(
                fc.property(
                    fc.option(fc.string({ minLength: 0, maxLength: 200 })),
                    (tokenVal) => {
                        const route = {
                            queryParams: tokenVal !== null ? { token: tokenVal } : {}
                        } as unknown as ActivatedRouteSnapshot;
                        let res: any;
                        let threw = false;
                        try {
                            res = TestBed.runInInjectionContext(() => authGuard(route, {} as any));
                        } catch {
                            threw = true;
                        }
                        return !threw && typeof res === 'boolean';
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
