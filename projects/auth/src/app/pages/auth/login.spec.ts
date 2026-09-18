import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { Login } from './login';
import { AuthService } from '../../core/services/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../environments/environment';

describe('Login Component', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let authService: AuthService;
    let messageService: MessageService;
    let mockLoc = { href: '' };
    let mockDoc: any;

    beforeEach(async () => {
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

        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                MessageService,
                AuthService,
                providePrimeNG({ theme: { preset: Aura } }),
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: mockDoc }
            ]
        }).compileComponents();

        authService = TestBed.inject(AuthService);
        messageService = TestBed.inject(MessageService);
        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    it('should create Login component', () => {
        expect(component).toBeTruthy();
        expect(component.email).toBe('');
        expect(component.password).toBe('');
        expect(component.checked).toBe(false);
    });

    it('should handle ngOnInit when no user_session exists and clean all storage and cookies', () => {
        localStorage.setItem('accessToken', 'stale');
        localStorage.setItem('refreshToken', 'stale');
        localStorage.setItem('currentUser', 'stale');
        localStorage.setItem('user', JSON.stringify({ name: 'Old User' }));
        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        component.ngOnInit();
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(cookieSpy).toHaveBeenCalledTimes(2);
        expect(cookieSpy.mock.calls[0][0]).toBe('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
        expect(cookieSpy.mock.calls[0][0]).not.toContain('Stryker was here!');
        expect(cookieSpy.mock.calls[1][0]).toBe('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
    });

    it('should set cookie with domain in ngOnInit when cookieDomain is configured', () => {
        const origDomain = environment.cookieDomain;
        environment.cookieDomain = 'example.com';
        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        component.ngOnInit();
        expect(cookieSpy).toHaveBeenCalledWith('accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;; domain=example.com');
        environment.cookieDomain = origDomain;
    });

    it('should redirect to dashboard during ngOnInit when user_session exists', () => {
        document.cookie = 'user_session={"email":"admin@example.com"}; path=/;';
        component.ngOnInit();
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should handle onLogin success and set user profile with clean redirect', async () => {
        const mockUser = { id: 'usr-admin-1', email: 'admin@example.com', role: 'admin' };
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: true,
            data: {
                accessToken: 'mock-jwt-token',
                refreshToken: 'mock-refresh-token',
                user: mockUser
            }
        });

        component.email = 'admin@example.com';
        component.password = 'password123';
        
        localStorage.setItem('accessToken', 'stale-token');
        localStorage.setItem('refreshToken', 'stale-refresh');
        localStorage.setItem('currentUser', 'stale-user');
        
        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        
        await component.onLogin();

        expect(authService.login).toHaveBeenCalledWith({
            email: 'admin@example.com',
            password: 'password123'
        });
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        
        const userStr = encodeURIComponent(JSON.stringify(mockUser));
        expect(cookieSpy).toHaveBeenCalledWith(`user_session=${userStr}; path=/; max-age=604800; SameSite=Lax`);
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should handle onLogin failure and show error toast', async () => {
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid credentials'
            }
        });

        component.email = 'wrong@example.com';
        component.password = 'badpass';
        await component.onLogin();

        expect(toastSpy).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Invalid credentials',
            life: 3000
        });
    });

    it('should handle onLogin exception and show exact error toast', async () => {
        const toastSpy = vi.spyOn(messageService, 'add');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(authService, 'login').mockRejectedValue(new Error('Connection failed'));

        component.email = 'wrong@example.com';
        component.password = 'badpass';
        await component.onLogin();

        expect(toastSpy).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Invalid email or password. Please try again.',
            life: 3000
        });
        expect(consoleSpy).toHaveBeenCalledWith('Login failed', expect.any(Error));
    });

    it('should handle onLogin success with production and cookieDomain set', async () => {
        const { environment } = await import('../../../environments/environment');
        const origProd = environment.production;
        const origDomain = environment.cookieDomain;
        environment.production = true;
        environment.cookieDomain = 'example.com';

        vi.spyOn(authService, 'login').mockResolvedValue({
            success: true,
            data: { user: { id: 'usr-2', email: 'test2@example.com', role: 'user' }, accessToken: '', refreshToken: '' }
        });

        component.email = 'test2@example.com';
        component.password = 'password123';
        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        await component.onLogin();

        expect(cookieSpy).toHaveBeenCalledWith(expect.stringContaining('Secure'));
        expect(cookieSpy).toHaveBeenCalledWith(expect.stringContaining('domain=example.com'));

        environment.production = origProd;
        environment.cookieDomain = origDomain;
    });

    it('should return early in ngOnInit if on server (SSR)', async () => {
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                MessageService,
                AuthService,
                providePrimeNG({ theme: { preset: Aura } }),
                { provide: PLATFORM_ID, useValue: 'server' }
            ]
        }).compileComponents();
        const fixtureSSR = TestBed.createComponent(Login);
        const compSSR = fixtureSSR.componentInstance;
        
        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        compSSR.ngOnInit();
        
        // Because we are on server, no browser-specific logic like document.cookie should run
        expect(cookieSpy).not.toHaveBeenCalled();
    });

    it('should fallback to default error message if error object lacks message', async () => {
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: false,
            error: {} as any
        });
        await component.onLogin();
        expect(toastSpy).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Invalid email or password. Please try again.',
            life: 3000
        });
    });

    it('should create and run ngOnInit when document is null', () => {
        const comp = TestBed.runInInjectionContext(() => new Login(null as any, null as any));
        (comp as any).document = null;
        (comp as any).platformId = 'browser';
        expect(() => comp.ngOnInit()).not.toThrow();
        expect((comp as any).getCookie('user_session')).toBeNull();
    });

    it('should handle getCookie when document.cookie is undefined', () => {
        const comp = TestBed.runInInjectionContext(() => new Login(null as any, null as any));
        (comp as any).document = { cookie: undefined };
        (comp as any).platformId = 'browser';
        expect(() => comp.ngOnInit()).not.toThrow();
        expect((comp as any).getCookie('user_session')).toBeNull();
    });

    it('should show error toast and not redirect when res.success is true but res.data is null', async () => {
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: true,
            data: null as any
        });
        await component.onLogin();
        expect(mockLoc.href).toBe('');
        expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('should show error toast and not redirect when res.success is false even if res.data is present', async () => {
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: false,
            data: { user: { id: 'usr-1' } } as any,
            error: { message: 'Explicit failure' }
        });
        await component.onLogin();
        expect(mockLoc.href).toBe('');
        expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Explicit failure' }));
    });

    it('should handle onLogin success when user is undefined in res.data', async () => {
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: true,
            data: { user: undefined as any, accessToken: '', refreshToken: '' }
        });
        localStorage.setItem('accessToken', 'stale');
        localStorage.removeItem('user');
        const cookieSpy = vi.spyOn(document, 'cookie', 'set');
        await component.onLogin();
        expect(localStorage.getItem('user')).toBeNull();
        expect(cookieSpy).not.toHaveBeenCalledWith(expect.stringContaining('user_session='));
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(mockLoc.href).toBe('http://localhost:4000/');
    });

    it('should allow instantiating Login when DOCUMENT provider is omitted from injector', async () => {
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                MessageService,
                AuthService,
                providePrimeNG({ theme: { preset: Aura } }),
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        }).compileComponents();
        expect(() => TestBed.createComponent(Login)).not.toThrow();
    });

    it('should return early without error during ngOnInit when user_session exists but document has no location', () => {
        (component as any).document = { cookie: 'user_session={"email":"admin@example.com"};' };
        expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should complete onLogin without error when document has no location', async () => {
        (component as any).document = {
            cookie: '',
            location: undefined
        };
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: true,
            data: {
                user: { id: 'usr-1', email: 'test@example.com' },
                accessToken: '',
                refreshToken: ''
            }
        });
        await expect(component.onLogin()).resolves.not.toThrow();
    });

    it('should complete onLogin without error when document is null', async () => {
        (component as any).document = null;
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: true,
            data: {
                user: { id: 'usr-1', email: 'test@example.com' },
                accessToken: '',
                refreshToken: ''
            }
        });
        await expect(component.onLogin()).resolves.not.toThrow();
    });

    it('should fallback to default error message without calling console.error when res.error is null', async () => {
        const toastSpy = vi.spyOn(messageService, 'add');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: false,
            error: null as any
        });
        await component.onLogin();
        expect(consoleSpy).not.toHaveBeenCalled();
        expect(toastSpy).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Invalid email or password. Please try again.',
            life: 3000
        });
    });
});
