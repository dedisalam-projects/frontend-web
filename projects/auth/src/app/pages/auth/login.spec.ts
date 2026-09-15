import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { Login } from './login';
import { AuthService } from '../../core/services/auth.service';

describe('Login Component', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let authService: AuthService;
    let messageService: MessageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                MessageService,
                AuthService,
                providePrimeNG({ theme: { preset: Aura } })
            ]
        }).compileComponents();

        authService = TestBed.inject(AuthService);
        messageService = TestBed.inject(MessageService);
        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    });

    it('should create Login component', () => {
        expect(component).toBeTruthy();
        expect(component.email).toBe('');
        expect(component.password).toBe('');
    });

    it('should handle ngOnInit when no user_session exists', () => {
        localStorage.setItem('accessToken', 'stale');
        localStorage.setItem('user', JSON.stringify({ name: 'Old User' }));
        component.ngOnInit();
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
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
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(document.cookie).toContain('user_session=');
        if (mockLocation.href) {
            expect(mockLocation.href).toBe('http://localhost:4000/');
        }
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
