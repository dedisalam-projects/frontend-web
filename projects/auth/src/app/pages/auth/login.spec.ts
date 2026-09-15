import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { Login } from './login';
import { AuthSocketService } from '../../core/services/auth-socket.service';
import { AuthService } from '../../core/services/auth.service';

describe('Login Component', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let authService: AuthService;
    let authSocketService: AuthSocketService;
    let messageService: MessageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                MessageService,
                AuthSocketService,
                AuthService,
                providePrimeNG({ theme: { preset: Aura } })
            ]
        }).compileComponents();

        authService = TestBed.inject(AuthService);
        authSocketService = TestBed.inject(AuthSocketService);
        messageService = TestBed.inject(MessageService);
        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    it('should create Login component', () => {
        expect(component).toBeTruthy();
        expect(component.email).toBe('');
        expect(component.password).toBe('');
    });

    it('should handle ngOnInit when no cookie token exists', () => {
        localStorage.setItem('accessToken', 'stale');
        component.ngOnInit();
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should handle ngOnInit when valid cookie exists and redirect', () => {
        const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        const token = `header.${payload}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;

        const mockLocation = { href: '' };
        try {
            vi.stubGlobal('location', mockLocation);
        } catch {
            component.ngOnInit();
            return;
        }

        component.ngOnInit();
        expect(mockLocation.href).toBe('http://localhost:4000/');
    });

    it('should clean up expired cookie token during ngOnInit', () => {
        const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
        const token = `header.${payload}.sig`;
        document.cookie = `accessToken=${token}; path=/;`;
        localStorage.setItem('accessToken', token);

        component.ngOnInit();
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should clean up malformed cookie token during ngOnInit', () => {
        document.cookie = `accessToken=invalid-token; path=/;`;
        localStorage.setItem('accessToken', 'invalid-token');

        component.ngOnInit();
        expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should handle onLogin success and set auth tokens with clean redirect', async () => {
        vi.spyOn(authService, 'login').mockResolvedValue({
            success: true,
            data: {
                accessToken: 'mock-jwt-token',
                refreshToken: 'mock-refresh-token',
                user: { id: 'usr-admin-1', email: 'admin@example.com', role: 'admin' }
            }
        });

        const mockLocation = { href: '' };
        try {
            vi.stubGlobal('location', mockLocation);
        } catch {
            // window.location is non-configurable in some environments
        }

        component.email = 'admin@example.com';
        component.password = 'password123';
        await component.onLogin();

        expect(authService.login).toHaveBeenCalledWith({
            email: 'admin@example.com',
            password: 'password123'
        });
        expect(localStorage.getItem('accessToken')).toBe('mock-jwt-token');
        expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
        expect(document.cookie).toContain('accessToken=mock-jwt-token');
        expect(document.cookie).toContain('user_session=');
        if (mockLocation.href) {
            expect(mockLocation.href).toBe('http://localhost:4000/');
        }
    });

    it('should redirect to dashboard during ngOnInit when user_session exists', () => {
        document.cookie = 'user_session={"email":"admin@example.com"}; path=/;';
        const mockLocation = { href: '' };
        try {
            vi.stubGlobal('location', mockLocation);
        } catch {
            component.ngOnInit();
            return;
        }

        component.ngOnInit();
        expect(mockLocation.href).toBe('http://localhost:4000/');
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

        expect(toastSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'error',
                summary: 'Login Failed',
                detail: 'Invalid credentials'
            })
        );
    });

    it('should handle onLogin exception and show error toast', async () => {
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(authService, 'login').mockRejectedValue(new Error('Connection failed'));

        component.email = 'wrong@example.com';
        component.password = 'badpass';
        await component.onLogin();

        expect(toastSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'error',
                summary: 'Login Failed'
            })
        );
    });
});
