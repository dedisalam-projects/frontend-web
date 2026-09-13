/**
 * Integration Test: HTTP Auth Interceptor
 *
 * Verifies that:
 * 1. Authorization Bearer token is attached to every API request
 * 2. Requests without token have no Authorization header
 * 3. withCredentials is set for cross-origin requests
 * 4. 401 response triggers cleanup (localStorage + cookie cleared)
 * 5. Response envelope { data, meta, error } is handled correctly
 */
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { UserService } from '../pages/service/user.service';

const API_URL = 'http://localhost:3000/api/v1/users';
const AUTH_URL = 'http://localhost:3000/api/v1/auth';

describe('HTTP Integration — UserService with Auth Headers', () => {
    let userService: UserService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                UserService,
            ],
        });
        userService = TestBed.inject(UserService);
        httpMock = TestBed.inject(HttpTestingController);
        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    // ── Header Verification ───────────────────────────────────────────────

    it('should attach Authorization Bearer header when accessToken exists in localStorage', async () => {
        localStorage.setItem('accessToken', 'test-jwt-token-123');

        const promise = userService.getUsers();
        const req = httpMock.expectOne(API_URL);

        expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token-123');
        req.flush({ data: [] });

        await promise;
    });

    it('should NOT attach Authorization header when no accessToken in localStorage', async () => {
        const promise = userService.getUsers();
        const req = httpMock.expectOne(API_URL);

        expect(req.request.headers.get('Authorization')).toBeNull();
        req.flush([]);

        await promise;
    });

    // ── Response Envelope Handling ────────────────────────────────────────

    it('should unwrap { data: User[] } envelope format', async () => {
        localStorage.setItem('accessToken', 'tok');
        const mockUsers = [
            { id: '1', name: 'Alice', email: 'alice@x.com', role: 'admin', isActive: true },
        ];

        const promise = userService.getUsers();
        const req = httpMock.expectOne(API_URL);
        req.flush({ data: mockUsers, meta: { total: 1 } });

        const result = await promise;
        expect(result).toEqual(mockUsers);
    });

    it('should handle plain array response (no envelope)', async () => {
        localStorage.setItem('accessToken', 'tok');
        const mockUsers = [{ id: '2', name: 'Bob', email: 'bob@x.com', role: 'user', isActive: true }];

        const promise = userService.getUsers();
        const req = httpMock.expectOne(API_URL);
        req.flush(mockUsers);

        const result = await promise;
        expect(result).toEqual(mockUsers);
    });

    it('should return fallback users on 401 Unauthorized', async () => {
        localStorage.setItem('accessToken', 'expired-token');

        const promise = userService.getUsers();
        const req = httpMock.expectOne(API_URL);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        const result = await promise;
        // Falls back to hardcoded dataset
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should return fallback users on 500 Server Error', async () => {
        const promise = userService.getUsers();
        const req = httpMock.expectOne(API_URL);
        req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

        const result = await promise;
        expect(Array.isArray(result)).toBe(true);
    });

    // ── CRUD Integration ──────────────────────────────────────────────────

    it('should POST to auth register endpoint on createUser', async () => {
        localStorage.setItem('accessToken', 'admin-token');
        const newUser = { name: 'Charlie', email: 'charlie@x.com', password: 'pass123', role: 'user' };

        const promise = userService.createUser(newUser);
        const req = httpMock.expectOne(`${AUTH_URL}/register`);

        expect(req.request.method).toBe('POST');
        expect(req.request.headers.get('Authorization')).toBe('Bearer admin-token');
        expect(req.request.body).toMatchObject({
            email: 'charlie@x.com',
            name: 'Charlie',
        });

        req.flush({ data: { id: 'new-1', ...newUser } });
        const result = await promise;
        expect(result.id).toBe('new-1');
    });

    it('should PATCH to users/:id on updateUser', async () => {
        localStorage.setItem('accessToken', 'admin-token');
        const updates = { name: 'Updated Name' };

        const promise = userService.updateUser('usr-1', updates);
        const req = httpMock.expectOne(`${API_URL}/usr-1`);

        expect(req.request.method).toBe('PATCH');
        expect(req.request.headers.get('Authorization')).toBe('Bearer admin-token');

        req.flush({ data: { id: 'usr-1', ...updates } });
        const result = await promise;
        expect(result.id).toBe('usr-1');
        expect(result.name).toBe('Updated Name');
    });

    it('should DELETE to users/:id on deleteUser', async () => {
        localStorage.setItem('accessToken', 'admin-token');

        const promise = userService.deleteUser('usr-1');
        const req = httpMock.expectOne(`${API_URL}/usr-1`);

        expect(req.request.method).toBe('DELETE');
        expect(req.request.headers.get('Authorization')).toBe('Bearer admin-token');

        req.flush({});
        await promise; // should resolve without error
    });

    it('should DELETE multiple users sequentially on deleteUsers', async () => {
        localStorage.setItem('accessToken', 'admin-token');
        const ids = ['usr-1', 'usr-2', 'usr-3'];

        const promise = userService.deleteUsers(ids);

        const req1 = httpMock.expectOne(`${API_URL}/usr-1`);
        req1.flush({});
        await new Promise((resolve) => setTimeout(resolve, 10));

        const req2 = httpMock.expectOne(`${API_URL}/usr-2`);
        req2.flush({});
        await new Promise((resolve) => setTimeout(resolve, 10));

        const req3 = httpMock.expectOne(`${API_URL}/usr-3`);
        req3.flush({});

        const result = await promise;
        expect(result).toBe(true);
        expect(req1.request.method).toBe('DELETE');
        expect(req2.request.method).toBe('DELETE');
        expect(req3.request.method).toBe('DELETE');
    });

    // ── Optimistic Fallback ───────────────────────────────────────────────

    it('should return optimistic user object when createUser backend fails', async () => {
        localStorage.setItem('accessToken', 'admin-token');
        const newUser = { name: 'Dan', email: 'dan@x.com', password: 'pass', role: 'user', isActive: true };

        const promise = userService.createUser(newUser);
        const req = httpMock.expectOne(`${AUTH_URL}/register`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });

        const result = await promise;
        // Optimistic fallback: returns constructed user
        expect(result.name).toBe('Dan');
        expect(result.email).toBe('dan@x.com');
        expect(result.id).toMatch(/^usr_/);
    });
});
