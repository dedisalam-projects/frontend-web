import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { UserService, User } from './user.service';
import * as fc from 'fast-check';

describe('UserService', () => {
    let service: UserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UserService, { provide: PLATFORM_ID, useValue: 'browser' }]
        });
        service = TestBed.inject(UserService);
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch users successfully from backend via admin:users:list Ack RPC', async () => {
        localStorage.setItem('accessToken', 'test-token');
        const mockUsers: User[] = [{ id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', isActive: true }];

        const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { users: mockUsers }
        });

        const result = await service.getUsers();

        expect(emitSpy).toHaveBeenCalledWith('admin:users:list', { page: 1, limit: 100 });
        expect(result).toEqual(mockUsers);
    });

    it('should handle direct array response and empty response in getUsers', async () => {
        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
            success: true,
            data: [{ id: '9', name: 'Direct', email: 'd@d.com', role: 'user', isActive: true }]
        });
        const res1 = await service.getUsers();
        expect(res1.length).toBe(1);

        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
            success: true,
            data: null
        });
        const res2 = await service.getUsers();
        expect(res2.length).toBeGreaterThan(0); // Falls back to default dataset
    });

    it('should fallback to mock dataset when getUsers backend fails', async () => {
        vi.spyOn(service as any, 'emitAck').mockResolvedValue({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' }
        });

        const result = await service.getUsers();
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].name).toBe('Super Admin');
    });

    it('should fallback to mock dataset when getUsers throws an exception', async () => {
        vi.spyOn(service as any, 'emitAck').mockRejectedValue(new Error('Network error'));

        const result = await service.getUsers();
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].name).toBe('Super Admin');
    });

    it('should createUser via admin:users:create Ack RPC and return created user', async () => {
        const newUser = {
            name: 'Bob',
            email: 'bob@example.com',
            password: 'Password123!',
            role: 'user',
            isActive: true
        };

        const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { id: 'usr-999', ...newUser }
        });

        const result = await service.createUser(newUser);

        expect(emitSpy).toHaveBeenCalledWith('admin:users:create', newUser);
        expect(result.id).toBe('usr-999');
        expect(result.name).toBe('Bob');
    });

    it('should handle createUser fallback when admin:users:create fails', async () => {
        const newUser = {
            name: 'Charlie',
            email: 'charlie@example.com',
            role: 'user'
        };

        vi.spyOn(service as any, 'emitAck').mockResolvedValue({
            success: false,
            error: { code: 'SERVICE_UNAVAILABLE', message: 'Service Unavailable' }
        });

        const result = await service.createUser(newUser);
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Charlie');
    });

    it('should updateUser via admin:users:update Ack RPC and fallback on error', async () => {
        // Success case
        const emitSpy1 = vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
            success: true,
            data: { id: '1', name: 'Updated' }
        });
        const result1 = await service.updateUser('1', { name: 'Updated' });
        expect(emitSpy1).toHaveBeenCalledWith('admin:users:update', { id: '1', name: 'Updated' });
        expect(result1.name).toBe('Updated');

        // Error fallback case
        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error' }
        });
        const result2 = await service.updateUser('2', { name: 'Fallback' });
        expect(result2.name).toBe('Fallback');
    });

    it('should deleteUser via admin:users:delete Ack RPC and fallback on error', async () => {
        const emitSpy1 = vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
            success: true,
            data: { deleted: true }
        });
        const deleteResult1 = await service.deleteUser('1');
        expect(emitSpy1).toHaveBeenCalledWith('admin:users:delete', { userId: '1' });
        expect(deleteResult1).toBe(true);

        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error' }
        });
        const deleteResult2 = await service.deleteUser('2');
        expect(deleteResult2).toBe(true);
    });

    it('should delete multiple users with deleteUsers', async () => {
        const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { deleted: true }
        });

        const res = await service.deleteUsers(['1', '2']);
        expect(res).toBe(true);
        expect(emitSpy).toHaveBeenCalledTimes(2);
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
                        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                            success: false,
                            error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' }
                        });
                        const result = await service.createUser(inputUser);

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
                        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                            success: false,
                            error: { code: 'OFFLINE', message: 'Unavailable' }
                        });
                        const result = await service.updateUser(id, updates);

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
