import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Injector, runInInjectionContext, PLATFORM_ID } from '@angular/core';
import { authGuard, isTokenValid, getCookie } from './auth.guard';
import { environment } from '../../environments/environment';

describe('authGuard', () => {
  let routerSpy: { navigate: any };
  let mockLoc: { href: string; pathname: string };
  let mockHistory: { replaceState: ReturnType<typeof vi.fn> };
  let mockDoc: any;

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };
    mockLoc = { href: 'http://127.0.0.1:4300/generate-pdf/traveloka', pathname: '/generate-pdf/traveloka' };
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
      },
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: DOCUMENT, useValue: mockDoc },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    localStorage.clear();
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  });

  afterEach(() => {
    localStorage.clear();
    environment.cookieDomain = '';
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  });

  it('should redirect to dedicated auth frontend if unauthenticated', () => {
    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(false);
    expect(mockLoc.href).toContain('/login?redirect=');
  });

  it('should handle cookieDomain when unauthenticated', () => {
    environment.cookieDomain = '.dedisalam.my.id';
    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(false);
    expect(mockLoc.href).toContain('/login?redirect=');
  });

  it('should handle unauthenticated without document or location', () => {
    const isolatedInjector = Injector.create({
      providers: [
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });

    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = runInInjectionContext(isolatedInjector, () => authGuard(route, state));
    expect(result).toBe(false);

    // Document without location
    const docNoLocation = new Proxy(document, {
      get(target: any, prop: string | symbol) {
        if (prop === 'location') return null;
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      },
    });

    const isolatedInjector2 = Injector.create({
      providers: [
        { provide: DOCUMENT, useValue: docNoLocation },
      ],
      parent: TestBed.inject(Injector),
    });
    const result2 = runInInjectionContext(isolatedInjector2, () => authGuard(route, state));
    expect(result2).toBe(false);
  });

  it('should allow navigation if valid urlToken is provided', () => {
    const validExp = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: validExp }));
    const token = `${header}.${payload}.sig`;

    const route: any = { queryParams: { token } };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
    expect(mockHistory.replaceState).toHaveBeenCalled();

    // With document but without defaultView
    const docNoView = new Proxy(document, {
      get(target: any, prop: string | symbol) {
        if (prop === 'defaultView') return null;
        if (prop === 'location') return mockLoc;
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      },
    });
    const isolatedInjector = Injector.create({
      providers: [
        { provide: DOCUMENT, useValue: docNoView },
      ],
      parent: TestBed.inject(Injector),
    });
    const result2 = runInInjectionContext(isolatedInjector, () => authGuard(route, state));
    expect(result2).toBe(true);

    // With document as null
    const docNullInjector = Injector.create({
      providers: [
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });
    const result3 = runInInjectionContext(docNullInjector, () => authGuard(route, state));
    expect(result3).toBe(true);
  });

  it('should allow navigation if valid cookieToken exists', () => {
    const validExp = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: validExp }));
    const token = `${header}.${payload}.sig`;

    document.cookie = `accessToken=${token}; path=/;`;

    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
  });

  it('should allow navigation if user_session cookie exists', () => {
    document.cookie = 'user_session=adminSession123; path=/;';

    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
  });

  it('should allow navigation if user or currentUser exists in localStorage', () => {
    // Test 'user'
    localStorage.setItem('user', JSON.stringify({ email: 'admin@dedisalam.my.id' }));
    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    let result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);

    // Test 'currentUser' fallback
    localStorage.removeItem('user');
    localStorage.setItem('currentUser', JSON.stringify({ email: 'admin@dedisalam.my.id' }));
    result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
  });

  it('should return true on server platform (SSR fallback)', () => {
    const isolatedInjector = Injector.create({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
      parent: TestBed.inject(Injector),
    });

    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = runInInjectionContext(isolatedInjector, () => authGuard(route, state));
    expect(result).toBe(true);
  });

  it('should validate JWT token edge cases', () => {
    const validExp = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: validExp }));
    const token = `${header}.${payload}.signature`;

    expect(isTokenValid(token)).toBe(true);

    // Token without exp claim
    const payloadNoExp = btoa(JSON.stringify({ user: 'admin' }));
    const tokenNoExp = `${header}.${payloadNoExp}.sig`;
    expect(isTokenValid(tokenNoExp)).toBe(true);

    // Expired token
    const expiredExp = Math.floor(Date.now() / 1000) - 3600;
    const expiredPayload = btoa(JSON.stringify({ exp: expiredExp }));
    const expiredToken = `${header}.${expiredPayload}.sig`;
    expect(isTokenValid(expiredToken)).toBe(false);

    // Invalid / null tokens
    expect(isTokenValid(null)).toBe(false);
    expect(isTokenValid(undefined)).toBe(false);
    expect(isTokenValid('')).toBe(false);
    expect(isTokenValid('not.a.valid.jwt.string')).toBe(false);
  });

  it('should handle getCookie edge cases', () => {
    expect(getCookie(null, 'test')).toBeNull();
    expect(getCookie(undefined, 'test')).toBeNull();
    expect(getCookie({} as any, 'test')).toBeNull();

    const mockCookieDoc: any = { cookie: 'foo=bar; user_session=testSession; abc=123' };
    expect(getCookie(mockCookieDoc, 'user_session')).toBe('testSession');
    expect(getCookie(mockCookieDoc, 'nonexistent')).toBeNull();
  });
});
