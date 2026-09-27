import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, isTokenValid, getCookie } from './auth.guard';

describe('authGuard', () => {
  let routerSpy: { navigate: any };

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerSpy }],
    });
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should redirect to /login if unauthenticated', () => {
    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/generate-pdf/traveloka' },
    });
  });

  it('should allow navigation if user exists in localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ email: 'admin@dedisalam.my.id' }));
    const route: any = { queryParams: {} };
    const state: any = { url: '/generate-pdf/traveloka' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should validate valid unexpired JWT token', () => {
    const validExp = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: validExp }));
    const token = `${header}.${payload}.signature`;

    expect(isTokenValid(token)).toBe(true);
  });

  it('should invalidate expired JWT token', () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: expiredExp }));
    const token = `${header}.${payload}.signature`;

    expect(isTokenValid(token)).toBe(false);
  });

  it('should extract cookie properly', () => {
    const mockDoc: any = { cookie: 'foo=bar; user_session=testSession; abc=123' };
    expect(getCookie(mockDoc, 'user_session')).toBe('testSession');
    expect(getCookie(mockDoc, 'nonexistent')).toBeNull();
  });
});
