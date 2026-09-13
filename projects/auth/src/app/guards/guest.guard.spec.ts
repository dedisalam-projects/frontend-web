import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { guestGuard } from './guest.guard';

// ── Helpers ──────────────────────────────────────────────────────────────
function makeCookieToken(exp: number): string {
    const payload = btoa(JSON.stringify({ exp }));
    return `header.${payload}.sig`;
}

// ── Original deterministic tests ──────────────────────────────────────────
describe('guestGuard', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({});
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    it('should return true when no accessToken cookie exists', () => {
        localStorage.setItem('accessToken', 'stale');
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should return false and redirect when valid accessToken cookie exists', () => {
        const validPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        const token = `header.${validPayload}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;

        const mockLocation = { href: '' };
        try {
            vi.stubGlobal('location', mockLocation);
        } catch {
            const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
            expect(result).toBe(false);
            return;
        }

        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(false);
        expect(mockLocation.href).toBe('http://localhost:4000/');
    });

    it('should return true and clear storage when expired accessToken cookie exists', () => {
        const expiredPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
        const token = `header.${expiredPayload}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;

        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should return true when malformed accessToken cookie exists', () => {
        document.cookie = `accessToken=invalid.token; path=/;`;
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
    });

    it('should return true in non-browser environment', () => {
        try {
            vi.stubGlobal('window', undefined);
        } catch {
            return;
        }
        const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
        expect(result).toBe(true);
    });
});

// ── Property-Based Tests (fast-check) ────────────────────────────────────
describe('guestGuard — property-based (fast-check)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({});
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
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
