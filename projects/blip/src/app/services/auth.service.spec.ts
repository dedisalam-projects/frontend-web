import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: any };

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate user on successful login and persist session', () => {
    const mockUser = { id: 'u1', email: 'admin@dedisalam.my.id', name: 'Admin Dedi', role: 'admin' };
    const credentials = { email: 'admin@dedisalam.my.id', password: 'Password123!' };

    service.login(credentials).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data?.user?.email).toBe('admin@dedisalam.my.id');
      expect(service.currentUser()?.email).toBe('admin@dedisalam.my.id');
      expect(localStorage.getItem('user')).toBeTruthy();
      expect(service.isAuthenticated()).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({
      success: true,
      data: { user: mockUser },
    });
  });

  it('should clear session and redirect to dedicated auth on logout', () => {
    const mockDoc = { location: { href: '' }, cookie: '' };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: DOCUMENT, useValue: mockDoc },
      ],
    });
    const s = TestBed.inject(AuthService);
    const hMock = TestBed.inject(HttpTestingController);

    localStorage.setItem('user', JSON.stringify({ email: 'admin@dedisalam.my.id' }));

    s.logout();

    const req = hMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });

    expect(s.currentUser()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockDoc.location.href).toBe(`${environment.appUrls.auth}/login`);
  });
});
