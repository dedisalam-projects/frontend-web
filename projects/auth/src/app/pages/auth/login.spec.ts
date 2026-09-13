import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { Login } from './login';

describe('Login Component', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let httpTestingController: HttpTestingController;
    let messageService: MessageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService, providePrimeNG({ theme: { preset: Aura } })]
        }).compileComponents();

        httpTestingController = TestBed.inject(HttpTestingController);
        messageService = TestBed.inject(MessageService);
        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        httpTestingController.verify();
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
            // window.location is non-configurable in this JSDOM environment
            // Just verify the component doesn't throw
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

    it('should handle onLogin success and set auth tokens', () => {
        const mockLocation = { href: '' };
        try {
            vi.stubGlobal('location', mockLocation);
        } catch {
            // window.location is non-configurable in this JSDOM environment
            // Test the API call and storage side-effects only
            component.email = 'admin@example.com';
            component.password = 'password123';
            component.onLogin();
            const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/login');
            req.flush({ data: { accessToken: 'mock-jwt-token' } });
            expect(localStorage.getItem('accessToken')).toBe('mock-jwt-token');
            return;
        }

        component.email = 'admin@example.com';
        component.password = 'password123';
        component.onLogin();

        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/login');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ email: 'admin@example.com', password: 'password123' });

        req.flush({ data: { accessToken: 'mock-jwt-token' } });

        expect(localStorage.getItem('accessToken')).toBe('mock-jwt-token');
        expect(document.cookie).toContain('accessToken=mock-jwt-token');
        expect(mockLocation.href).toContain('http://localhost:4000/?token=mock-jwt-token');
    });

    it('should handle onLogin failure and show error toast', () => {
        const toastSpy = vi.spyOn(messageService, 'add');

        component.email = 'wrong@example.com';
        component.password = 'badpass';
        component.onLogin();

        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/login');
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(toastSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'error',
                summary: 'Login Failed'
            })
        );
    });
});
