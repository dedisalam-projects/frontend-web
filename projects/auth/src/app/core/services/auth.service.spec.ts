import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(), AuthService]
        });
        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should POST /auth/login with credentials and withCredentials: true', async () => {
        const credentials = { email: 'admin@example.com', password: 'password123' };
        const mockResponse = {
            success: true,
            data: {
                accessToken: 'jwt.token.here',
                refreshToken: 'refresh.token.here',
                user: { id: 'usr-1', email: 'admin@example.com', role: 'admin' }
            },
            message: 'Login successful'
        };

        const loginPromise = service.login(credentials);

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
        expect(req.request.method).toBe('POST');
        expect(req.request.withCredentials).toBe(true);
        expect(req.request.body).toEqual(credentials);
        req.flush(mockResponse);

        const res = await loginPromise;
        expect(res.success).toBe(true);
        expect(res.data?.accessToken).toBe('jwt.token.here');
        expect(res.data?.user?.email).toBe('admin@example.com');
    });

    it('should handle login error gracefully', async () => {
        const credentials = { email: 'wrong@example.com', password: 'bad' };

        const loginPromise = service.login(credentials);

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
        req.flush(
            { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
            { status: 401, statusText: 'Unauthorized' }
        );

        const res = await loginPromise;
        expect(res.success).toBe(false);
        expect(res.error?.code).toBe('UNAUTHORIZED');
        expect(res.error?.message).toContain('Invalid email or password');
    });

    it('should POST /auth/register with payload and withCredentials: true', async () => {
        const payload = { email: 'new@example.com', password: 'password123', name: 'New User', role: 'user' };
        const mockResponse = {
            success: true,
            data: { user: { id: 'usr-2', email: 'new@example.com', name: 'New User', role: 'user' } },
            message: 'User registered successfully'
        };

        const registerPromise = service.register(payload);

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
        expect(req.request.method).toBe('POST');
        expect(req.request.withCredentials).toBe(true);
        expect(req.request.body).toEqual(payload);
        req.flush(mockResponse);

        const res = await registerPromise;
        expect(res.success).toBe(true);
        expect(res.data?.user?.email).toBe('new@example.com');
    });

    it('should handle register error gracefully', async () => {
        const payload = { email: 'existing@example.com', password: 'password123', name: 'Existing' };

        const registerPromise = service.register(payload);

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
        req.flush(
            { error: { code: 'CONFLICT', message: 'User already exists' } },
            { status: 409, statusText: 'Conflict' }
        );

        const res = await registerPromise;
        expect(res.success).toBe(false);
        expect(res.error?.code).toBe('CONFLICT');
    });

    it('should POST /auth/refresh with withCredentials: true', async () => {
        const mockResponse = {
            success: true,
            data: { accessToken: 'new.jwt.token', refreshToken: 'new.refresh.token' },
            message: 'Token refreshed successfully'
        };

        const refreshPromise = service.refresh();

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
        expect(req.request.method).toBe('POST');
        expect(req.request.withCredentials).toBe(true);
        req.flush(mockResponse);

        const res = await refreshPromise;
        expect(res.success).toBe(true);
        expect(res.data?.accessToken).toBe('new.jwt.token');
    });

    it('should handle refresh error gracefully', async () => {
        const refreshPromise = service.refresh();

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
        req.flush(
            { error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } },
            { status: 401, statusText: 'Unauthorized' }
        );

        const res = await refreshPromise;
        expect(res.success).toBe(false);
        expect(res.error?.code).toBe('UNAUTHORIZED');
    });

    it('should POST /auth/logout with withCredentials: true', async () => {
        const mockResponse = {
            success: true,
            message: 'Logged out successfully'
        };

        const logoutPromise = service.logout();

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
        expect(req.request.method).toBe('POST');
        expect(req.request.withCredentials).toBe(true);
        req.flush(mockResponse);

        const res = await logoutPromise;
        expect(res.success).toBe(true);
    });

    it('should handle logout error gracefully', async () => {
        const logoutPromise = service.logout();

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
        req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });

        const res = await logoutPromise;
        expect(res.success).toBe(false);
        expect(res.error?.code).toBe('LOGOUT_ERROR');
    });
});
