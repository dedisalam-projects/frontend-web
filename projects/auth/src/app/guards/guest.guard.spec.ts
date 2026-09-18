import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { Router } from '@angular/router';
import { guestGuard, isTokenValid, getCookie } from './guest.guard';
import { environment } from '../../environments/environment';
import { PLATFORM_ID, Injector, runInInjectionContext } from '@angular/core';
import { DOCUMENT } from '@angular/common';

// ── Helpers ──────────────────────────────────────────────────────────────
function makeCookieToken(exp: number): string {
    const payload = btoa(JSON.stringify({ exp }));
    return `header.${payload}.sig`;
}

// ── Original deterministic tests ──────────────────────────────────────────
describe('guestGuard', () => {
    let mockLoc = { href: '' };
    let mockDoc: any;

    beforeEach(() => {
        mockLoc = { href: '' };
        mockDoc = new Proxy(document, {
            get(target: any, prop: string | symbol) {
                if (prop === 'location') return mockLoc;
                if (prop === 'defaultView') return { location: mockLoc };
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
        vi.unstubAllGlobals();
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    it('should return false and redirect when user_session cookie exists', () => {
        document.cookie = 'user_session={"email":"test@example.com"}; path=/;';
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should return true when no accessToken cookie exists and clean legacy storage without setting cookies', () => {
        localStorage.setItem('accessToken', 'stale');
        localStorage.setItem('currentUser', 'stale-user');
        localStorage.setItem('user', 'stale-user-profile');
        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(cookieSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined document in getCookie without crashing', () => {
        const dummyDoc = new Proxy(mockDoc, {
            get(target, prop) {
                if (prop === 'cookie') return undefined;
                return target[prop];
            }
        });
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: dummyDoc }
            ]
        });
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
    });

    it('should return false without throwing when document has no location and user_session exists', () => {
        const docWithoutLoc = { cookie: 'user_session={"email":"test@example.com"}; path=/;' } as any;
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: docWithoutLoc }
            ]
        });
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
    });

    it('should return false and redirect when valid accessToken cookie exists', () => {
        const validPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        const token = `header.${validPayload}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;

        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should return false without throwing when document has no location and valid accessToken exists', () => {
        const validPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        const docWithoutLoc = { cookie: `accessToken=header.${validPayload}.sig; path=/;` } as any;
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: docWithoutLoc }
            ]
        });
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
    });

    it('should treat token with exp exactly equal to Date.now() as valid (not expired)', () => {
        const fixedNow = 1700000000000;
        vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
        const token = makeCookieToken(fixedNow / 1000);
        document.cookie = `accessToken=${token}; path=/;`;
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should correctly parse base64url tokens with - and _', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const payloadStr = JSON.stringify({ exp, custom: '>>>???///+++' });
        const base64 = btoa(payloadStr).replace(/\+/g, '-').replace(/\//g, '_');
        const token = `header.${base64}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;

        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should handle valid token with exactly 2 parts', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const base64 = btoa(JSON.stringify({ exp }));
        const token = `header.${base64}`;
        document.cookie = `accessToken=${token}; path=/;`;
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should return true and clear storage when expired accessToken cookie exists', () => {
        const expiredPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
        const token = `header.${expiredPayload}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;

        localStorage.setItem('accessToken', 'stale');
        localStorage.setItem('currentUser', 'stale-user');
        localStorage.setItem('user', 'stale-user-profile');

        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        
        expect(cookieSpy).toHaveBeenCalledTimes(2);
        expect(cookieSpy.mock.calls[0][0]).toBe('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
        expect(cookieSpy.mock.calls[0][0]).not.toContain('Stryker was here!');
        expect(cookieSpy.mock.calls[1][0]).toBe('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
    });


    it('should clear cookies with domain when cookieDomain is configured', () => {
        const origDomain = environment.cookieDomain;
        environment.cookieDomain = 'test.domain';
        const expiredPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
        document.cookie = `accessToken=header.${expiredPayload}.sig; path=/;`;

        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
        expect(cookieSpy).toHaveBeenCalledWith('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;; domain=test.domain');
        environment.cookieDomain = origDomain;
    });

    it('should return true when no accessToken is present (null cookie)', () => {
        vi.spyOn(document, 'cookie', 'get').mockReturnValue('someOtherCookie=123');
        const canActivate = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(canActivate).toBe(true);
    });

    it('should return true and not redirect when on server (SSR) even if user_session exists', () => {
        mockDoc.cookie = 'user_session={"email":"test@example.com"}; path=/;';
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'server' },
                { provide: DOCUMENT, useValue: mockDoc }
            ]
        });
        const canActivate = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(canActivate).toBe(true);
        expect(mockLoc.href).toBe('');
    });

    it('should handle guestGuard when DOCUMENT provider is omitted from injector', () => {
        const isolatedInjector = Injector.create({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        });
        expect(() => runInInjectionContext(isolatedInjector, () => guestGuard({} as any, {} as any))).not.toThrow();
    });

    it('should return true when malformed accessToken cookie exists', () => {
        document.cookie = `accessToken=invalid.token; path=/;`;
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
    });

    it('should return true when token payload is not valid base64 or JSON', () => {
        document.cookie = 'accessToken=header.notvalidbase64.sig; path=/;';
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
    });

    it('should return false and allow redirect if token has no exp field', () => {
        const payload = btoa(JSON.stringify({ user: 'test' }));
        const token = `header.${payload}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;

        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false); // Valid token redirects to dashboard
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should return true and allow access if token is malformed with < 2 parts', () => {
        document.cookie = `accessToken=onlyonepart; path=/;`;
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
    });

    it('should correctly parse cookie with exact Regex boundary matching', () => {
        document.cookie = 'otherCookie=123; path=/;';
        document.cookie = 'accessToken=mock.token.val; path=/;';
        document.cookie = 'anotherCookie=456; path=/;';

        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
    });

    describe('isTokenValid & getCookie helpers', () => {
        it('should validate tokens and handle various formats and edge cases', () => {
            expect(isTokenValid('')).toBe(false);
            expect(isTokenValid('singlepart')).toBe(false);
            expect(isTokenValid('header.notbase64.sig')).toBe(false);
            expect(isTokenValid('header.bm90LWpzb24=.sig')).toBe(false); // 'not-json'

            const futureSec = Math.floor(Date.now() / 1000) + 100;
            expect(isTokenValid(makeCookieToken(futureSec))).toBe(true);

            const pastSec = Math.floor(Date.now() / 1000) - 100;
            expect(isTokenValid(makeCookieToken(pastSec))).toBe(false);

            const noExpPayload = btoa(JSON.stringify({ user: 'dedi' }));
            expect(isTokenValid(`header.${noExpPayload}.sig`)).toBe(true);
        });

        it('should extract cookies correctly with getCookie', () => {
            expect(getCookie(null, 'test')).toBeNull();
            expect(getCookie({} as any, 'test')).toBeNull();
            const doc = { cookie: 'foo=bar; token=xyz123; other=abc' } as Document;
            expect(getCookie(doc, 'token')).toBe('xyz123');
            expect(getCookie(doc, 'missing')).toBeNull();
        });
    });
});

// ── Property-Based Tests (fast-check) ────────────────────────────────────
describe('guestGuard — property-based (fast-check)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: document }
            ]
        });
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    it('PROPERTY: any expired token (exp in the past) should always allow access (return true)', () => {
        const nowSec = Math.floor(Date.now() / 1000);
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: nowSec - 1 }), // exp is always in the past
                (exp) => {
                    document.cookie = `accessToken=${makeCookieToken(exp)}; path=/;`;
                    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
                    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
                    return result === true;
                }
            ),
            { numRuns: 50 }
        );
    });

    it('PROPERTY: any valid token (exp in the future) should block access (return false)', () => {
        const nowSec = Math.floor(Date.now() / 1000);
        fc.assert(
            fc.property(
                fc.integer({ min: nowSec + 60, max: nowSec + 86400 }), // exp is future
                (exp) => {
                    document.cookie = `accessToken=${makeCookieToken(exp)}; path=/;`;
                    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
                    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
                    return result === false;
                }
            ),
            { numRuns: 50 }
        );
    });

    it('PROPERTY: any string that is not a valid JWT should allow access (return true)', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }).filter((s) => !s.includes('.') || s.split('.').length !== 3),
                (malformed) => {
                    document.cookie = `accessToken=${encodeURIComponent(malformed)}; path=/;`;
                    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
                    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
                    return result === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('PROPERTY: guard always returns a boolean (never throws)', () => {
        fc.assert(
            fc.property(fc.option(fc.string({ minLength: 0, maxLength: 200 })), (tokenValue) => {
                if (tokenValue !== null) {
                    document.cookie = `accessToken=${encodeURIComponent(tokenValue)}; path=/;`;
                }
                let result: boolean | undefined;
                let threw = false;
                try {
                    result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any)) as boolean;
                } catch {
                    threw = true;
                }
                document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
                return !threw && typeof result === 'boolean';
            }),
            { numRuns: 200 }
        );
    });
});
