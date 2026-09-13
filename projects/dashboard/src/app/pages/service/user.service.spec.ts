import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService, User } from './user.service';
import * as fc from 'fast-check';

describe('UserService', () => {
    let service: UserService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UserService, provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(UserService);
        httpTestingController = TestBed.inject(HttpTestingController);
        localStorage.clear();
    });

    afterEach(() => {
        httpTestingController.verify();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch users successfully from backend', async () => {
        localStorage.setItem('accessToken', 'test-token');
        const mockUsers: User[] = [{ id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', isActive: true }];

        const promise = service.getUsers();

        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/users');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
        req.flush({ data: mockUsers });

        const result = await promise;
        expect(result).toEqual(mockUsers);
    });

    it('should handle direct array response and non-array response in getUsers', async () => {
        const directPromise = service.getUsers();
        const req1 = httpTestingController.expectOne('http://localhost:3000/api/v1/users');
        req1.flush([{ id: '9', name: 'Direct', email: 'd@d.com', role: 'user', isActive: true }]);
        const res1 = await directPromise;
        expect(res1.length).toBe(1);

        const emptyPromise = service.getUsers();
        const req2 = httpTestingController.expectOne('http://localhost:3000/api/v1/users');
        req2.flush({ status: 'unknown_format' });
        const res2 = await emptyPromise;
        expect(res2).toEqual([]);
    });

    it('should fallback to mock dataset when getUsers backend fails', async () => {
        const promise = service.getUsers();

        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/users');
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        const result = await promise;
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].name).toBe('Super Admin');
    });

    it('should createUser via API register and return created user', async () => {
        const newUser = {
            name: 'Bob',
            email: 'bob@example.com',
            password: 'Password123!',
            role: 'user',
            isActive: true
        };

        const promise = service.createUser(newUser);

        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/register');
        expect(req.request.method).toBe('POST');
        req.flush({ data: { id: 'usr-999', ...newUser } });

        const result = await promise;
        expect(result.id).toBe('usr-999');
        expect(result.name).toBe('Bob');
    });

    it('should handle createUser fallback when API register fails', async () => {
        const newUser = {
            name: 'Charlie',
            email: 'charlie@example.com',
            role: 'user'
        };

        const promise = service.createUser(newUser);

        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/register');
        req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

        const result = await promise;
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Charlie');
    });

    it('should updateUser via API and fallback on error', async () => {
        // Success case
        const updatePromise1 = service.updateUser('1', { name: 'Updated' });
        const req1 = httpTestingController.expectOne('http://localhost:3000/api/v1/users/1');
        expect(req1.request.method).toBe('PATCH');
        req1.flush({ data: { id: '1', name: 'Updated' } });
        const result1 = await updatePromise1;
        expect(result1.name).toBe('Updated');

        // Error fallback case
        const updatePromise2 = service.updateUser('2', { name: 'Fallback' });
        const req2 = httpTestingController.expectOne('http://localhost:3000/api/v1/users/2');
        req2.flush('Error', { status: 500, statusText: 'Error' });
        const result2 = await updatePromise2;
        expect(result2.name).toBe('Fallback');
    });

    it('should deleteUser via API and fallback on error', async () => {
        const deletePromise1 = service.deleteUser('1');
        const req1 = httpTestingController.expectOne('http://localhost:3000/api/v1/users/1');
        expect(req1.request.method).toBe('DELETE');
        req1.flush({ success: true });
        expect(await deletePromise1).toBe(true);

        const deletePromise2 = service.deleteUser('2');
        const req2 = httpTestingController.expectOne('http://localhost:3000/api/v1/users/2');
        req2.flush('Error', { status: 500, statusText: 'Error' });
        expect(await deletePromise2).toBe(true);
    });

    it('should delete multiple users with deleteUsers', async () => {
        const deleteUsersPromise = service.deleteUsers(['1', '2']);

        const req1 = httpTestingController.expectOne('http://localhost:3000/api/v1/users/1');
        req1.flush({ success: true });

        await new Promise((resolve) => setTimeout(resolve, 10));

        const req2 = httpTestingController.expectOne('http://localhost:3000/api/v1/users/2');
        req2.flush({ success: true });

        expect(await deleteUsersPromise).toBe(true);
    });

    describe('Property-Based Invariants (fast-check)', () => {
        it('property: createUser always returns an object with valid id and matching input fields on fallback', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }),
                        email: fc.emailAddress(),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        role: fc.constantFrom('admin', 'user', 'manager')
                    }),
                    async (inputUser) => {
                        const promise = service.createUser(inputUser);
                        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/register');
                        req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
                        const result = await promise;

                        expect(typeof result.id).toBe('string');
                        expect(result.id!.length).toBeGreaterThan(0);
                        expect(result.name).toBe(inputUser.name);
                        expect(result.email).toBe(inputUser.email);
                        expect(result.role).toBe(inputUser.role);
                    }
                ),
                { numRuns: 20 }
            );
        });

        it('property: updateUser fallback preserves updated fields and id across arbitrary names and roles', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        role: fc.constantFrom('admin', 'user', 'manager')
                    }),
                    async (id, updates) => {
                        const promise = service.updateUser(id, updates);
                        const req = httpTestingController.expectOne(`http://localhost:3000/api/v1/users/${id}`);
                        req.flush('Offline', { status: 503, statusText: 'Unavailable' });
                        const result = await promise;

                        expect(result.id).toBe(id);
                        expect(result.name).toBe(updates.name);
                        expect(result.role).toBe(updates.role);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });
});
