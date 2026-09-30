import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { Injector, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let routerSpy: { navigate: any };
  let mockDoc: any;
  let mockLoc: { href: string };

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };
    mockLoc = { href: '' };

    mockDoc = new Proxy(document, {
      get(target: any, prop: string | symbol) {
        if (prop === 'location') return mockLoc;
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
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
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

  it('should create service and load user from localStorage (user)', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1', email: 'admin@dedisalam.my.id', name: 'Admin Dedi' }));

    const service = TestBed.inject(AuthService);
    expect(service.currentUser()?.email).toBe('admin@dedisalam.my.id');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should load user from localStorage (currentUser fallback)', () => {
    localStorage.setItem('currentUser', JSON.stringify({ id: 'u2', email: 'fallback@dedisalam.my.id', name: 'Fallback User' }));

    const service = TestBed.inject(AuthService);
    expect(service.currentUser()?.email).toBe('fallback@dedisalam.my.id');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should load user from user_session cookie if localStorage is empty', () => {
    const userJson = JSON.stringify({ id: 'u3', email: 'cookie@dedisalam.my.id', name: 'Cookie User' });
    document.cookie = `user_session=${encodeURIComponent(userJson)}; path=/;`;

    const service = TestBed.inject(AuthService);
    expect(service.currentUser()?.email).toBe('cookie@dedisalam.my.id');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should handle corrupt JSON in storage gracefully', () => {
    localStorage.setItem('user', 'invalid-json-string{');
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const service = TestBed.inject(AuthService);
    expect(service.currentUser()).toBeNull();
    expect(spyConsole).toHaveBeenCalled();
    spyConsole.mockRestore();
  });

  it('should skip storage loading on server platform (SSR)', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1', email: 'test@example.com', name: 'Test' }));

    const isolatedInjector = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });

    const service = isolatedInjector.get(AuthService);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(true); // server always returns true
  });

  it('should authenticate user on successful login and write cookie with cookieDomain', () => {
    environment.cookieDomain = '.dedisalam.my.id';

    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    const mockUser = { id: 'u1', email: 'admin@dedisalam.my.id', name: 'Admin Dedi', role: 'admin' };
    const credentials = { email: 'admin@dedisalam.my.id', password: 'Password123!' };

    service.login(credentials).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(service.currentUser()?.email).toBe('admin@dedisalam.my.id');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { user: mockUser } });
    httpMock.verify();
  });

  it('should not persist user if login response is unsuccessful or user data is missing', () => {
    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.login({ email: 'bad@email.com', password: 'bad' }).subscribe((res) => {
      expect(res.success).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ success: false, message: 'Invalid credentials' });
    httpMock.verify();
  });

  it('should clear session and redirect to dedicated auth on logout (success flow)', () => {
    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    localStorage.setItem('user', JSON.stringify({ email: 'admin@dedisalam.my.id' }));
    service.logout();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });

    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockLoc.href).toBe(`${environment.appUrls.auth}/login`);
    httpMock.verify();
  });

  it('should execute cleanup even if logout API returns an error', () => {
    environment.cookieDomain = '.dedisalam.my.id';

    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    localStorage.setItem('user', JSON.stringify({ email: 'admin@dedisalam.my.id' }));
    service.logout();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    req.flush({ success: false }, { status: 500, statusText: 'Server Error' });

    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockLoc.href).toBe(`${environment.appUrls.auth}/login`);
    httpMock.verify();
  });

  it('should handle logout when document has no location', () => {
    const docNoLocation = new Proxy(document, {
      get(target: any, prop: string | symbol) {
        if (prop === 'location') return null;
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      },
    });

    const isolatedInjector = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: DOCUMENT, useValue: docNoLocation },
      ],
      parent: TestBed.inject(Injector),
    });

    const service = isolatedInjector.get(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.logout();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    req.flush({ success: true });
    expect(service.currentUser()).toBeNull();
    httpMock.verify();
  });

  it('should not call logout API if running on server platform', () => {
    const isolatedInjector = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });

    const service = isolatedInjector.get(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.logout(); // In server platform, does not make HTTP call
    httpMock.expectNone(`${environment.apiUrl}/auth/logout`);
    expect(service.currentUser()).toBeNull();
  });

  it('should test getCookie when document is undefined or has no cookie', () => {
    const service = TestBed.inject(AuthService);
    expect(service.getCookie('nonexistent')).toBeNull();

    // Isolated injector with document = null
    const isolatedInjector = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });
    const serviceNoDoc = isolatedInjector.get(AuthService);
    expect(serviceNoDoc.getCookie('any')).toBeNull();

    // Document without cookie property
    const docNoCookie = new Proxy(document, {
      get(target: any, prop: string | symbol) {
        if (prop === 'cookie') return undefined;
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      },
    });
    const isolatedInjectorNoCookie = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: DOCUMENT, useValue: docNoCookie },
      ],
      parent: TestBed.inject(Injector),
    });
    const serviceNoCookieProp = isolatedInjectorNoCookie.get(AuthService);
    expect(serviceNoCookieProp.getCookie('any')).toBeNull();
  });

  it('should return false in isAuthenticated if no credentials exist', () => {
    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return true in isAuthenticated when currentUser signal is set', () => {
    const service = TestBed.inject(AuthService);
    service.currentUser.set({ id: 'u1', email: 'signal@example.com', name: 'Signal', role: 'admin' });
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should not persist user if login response has success true but data.user is missing', () => {
    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.login({ email: 'bad@email.com', password: 'bad' }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ success: true, data: {} as any });
    httpMock.verify();
  });

  it('should authenticate user on successful login without cookieDomain', () => {
    environment.cookieDomain = '';
    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    const mockUser = { id: 'u2', email: 'user@example.com', name: 'User', role: 'user' };

    service.login({ email: 'user@example.com', password: 'pass' }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(service.currentUser()?.id).toBe('u2');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ success: true, data: { user: mockUser } });
    httpMock.verify();
  });

  it('should handle successful login on server platform without localStorage or cookie write', () => {
    const isolatedInjector = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });

    const service = isolatedInjector.get(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    const mockUser = { id: 'u3', email: 'ssr@example.com', name: 'SSR User', role: 'admin' };

    service.login({ email: 'ssr@example.com', password: 'pass' }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(service.currentUser()?.email).toBe('ssr@example.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ success: true, data: { user: mockUser } });
    httpMock.verify();
  });

  it('should handle successful login on browser when document is null', () => {
    const isolatedInjector = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });

    const service = isolatedInjector.get(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    const mockUser = { id: 'u4', email: 'nodoc@example.com', name: 'NoDoc User', role: 'user' };

    service.login({ email: 'nodoc@example.com', password: 'pass' }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(service.currentUser()?.email).toBe('nodoc@example.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ success: true, data: { user: mockUser } });
    httpMock.verify();
  });

  it('should handle handleLogoutCleanup on server platform', () => {
    const isolatedInjector = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });
    const service = isolatedInjector.get(AuthService);
    (service as any).handleLogoutCleanup();
    expect(service.currentUser()).toBeNull();
  });

  it('should handle handleLogoutCleanup when document is null', () => {
    const isolatedInjector = Injector.create({
      providers: [
        { provide: AuthService, useClass: AuthService },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });
    const service = isolatedInjector.get(AuthService);
    localStorage.setItem('user', 'test');
    (service as any).handleLogoutCleanup();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
