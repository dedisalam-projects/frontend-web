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
        expect(res2.length).toBe(0);
    });

    it('should throw an error when getUsers backend returns failure', async () => {
        vi.spyOn(service as any, 'emitAck').mockResolvedValue({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' }
        });

        await expect(service.getUsers()).rejects.toThrow('Unauthorized');
    });

    it('should propagate error when getUsers throws an exception', async () => {
        vi.spyOn(service as any, 'emitAck').mockRejectedValue(new Error('Network error'));

        await expect(service.getUsers()).rejects.toThrow('Network error');
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

    it('should throw an error when admin:users:create fails', async () => {
        const newUser = {
            name: 'Charlie',
            email: 'charlie@example.com',
            role: 'user'
        };

        vi.spyOn(service as any, 'emitAck').mockResolvedValue({
            success: false,
            error: { code: 'SERVICE_UNAVAILABLE', message: 'Service Unavailable' }
        });

        await expect(service.createUser(newUser)).rejects.toThrow();
    });

    it('should updateUser via admin:users:update Ack RPC and throw on error', async () => {
        // Success case
        const emitSpy1 = vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
            success: true,
            data: { id: '1', name: 'Updated' }
        });
        const result1 = await service.updateUser('1', { name: 'Updated' });
        expect(emitSpy1).toHaveBeenCalledWith('admin:users:update', { id: '1', name: 'Updated' });
        expect(result1.name).toBe('Updated');

        // Error case
        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error' }
        });
        await expect(service.updateUser('2', { name: 'Fallback' })).rejects.toThrow();
    });

    it('should deleteUser via admin:users:delete Ack RPC and throw on error', async () => {
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
        await expect(service.deleteUser('2')).rejects.toThrow();
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
        it('property: createUser always rejects with error when backend fails across arbitrary inputs', async () => {
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
                        await expect(service.createUser(inputUser)).rejects.toThrow();
                    }
                ),
                { numRuns: 20 }
            );
        });

        it('property: updateUser always rejects with error when backend fails across arbitrary ids and updates', async () => {
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
                        await expect(service.updateUser(id, updates)).rejects.toThrow();
                    }
                ),
                { numRuns: 20 }
            );
        });
    });
});
