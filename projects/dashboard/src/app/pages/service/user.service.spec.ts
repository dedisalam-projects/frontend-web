import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { UserService, User } from './user.service';
import * as fc from 'fast-check';

describe('UserService', () => {
    let service: UserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                UserService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        });
        service = TestBed.inject(UserService);
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should be created and eagerly initialize socket in browser platform', () => {
        expect(service).toBeTruthy();
        expect((service as any).socket).not.toBeNull();
    });

    it('should NOT initialize socket in server (SSR) platform and return null from getSocket', () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                UserService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: PLATFORM_ID, useValue: 'server' }
            ]
        });
        const serverService = TestBed.inject(UserService);
        expect((serverService as any).socket).toBeNull();
        expect(serverService.getSocket()).toBeNull();
        expect((serverService as any).initSocket()).toBeNull();
    });

    it('should return cached socket or lazily reinitialize if socket was cleared', () => {
        const socket1 = service.getSocket();
        expect(service.getSocket()).toBe(socket1);

        (service as any).socket = null;
        const socket2 = service.getSocket();
        expect(socket2).not.toBeNull();

        // Calling initSocket when socket already exists should return existing socket
        const socket3 = (service as any).initSocket();
        expect(socket3).toBe(socket2);
    });

    it('should initialize socket with proper transports, credentials, and setup admin:join on connect', () => {
        const socket = service.getSocket();
        expect(socket).toBeTruthy();
        expect((socket as any).io?.opts?.transports).toEqual(['websocket', 'polling']);
        expect((socket as any).io?.opts?.withCredentials).toBe(true);
        expect((socket as any).io?.opts?.autoConnect).toBe(true);
        expect((socket as any).nsp).toBe('/users');

        const connectListeners = (socket as any).listeners('connect');
        expect(connectListeners.length).toBeGreaterThan(0);
        const emitSpy = vi.spyOn(socket!, 'emit');
        connectListeners[0]();
        expect(emitSpy).toHaveBeenCalledWith('admin:join', {});
    });

    describe('ensureConnected', () => {
        it('should resolve immediately if socket is already connected', async () => {
            const mockSocket = { connected: true } as any;
            await expect((service as any).ensureConnected(mockSocket)).resolves.toBeUndefined();
        });

        it('should connect, clearTimeout, and resolve when connect event fires', async () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
            let connectCb: (() => void) | undefined;
            const mockSocket = {
                connected: false,
                once: vi.fn((event, cb) => {
                    if (event === 'connect') connectCb = cb;
                }),
                connect: vi.fn(() => {
                    if (connectCb) connectCb();
                })
            } as any;

            await expect((service as any).ensureConnected(mockSocket, 1000)).resolves.toBeUndefined();
            expect(mockSocket.connect).toHaveBeenCalled();
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it('should reject and clearTimeout when connect_error event fires', async () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
            let errorCb: ((err: any) => void) | undefined;
            const mockSocket = {
                connected: false,
                once: vi.fn((event, cb) => {
                    if (event === 'connect_error') errorCb = cb;
                }),
                connect: vi.fn(() => {
                    if (errorCb) errorCb(new Error('Gateway down'));
                })
            } as any;

            await expect((service as any).ensureConnected(mockSocket, 1000)).rejects.toThrow('Gateway down');
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it('should reject with timeout error when connection does not establish within timeoutMs', async () => {
            const mockSocket = {
                connected: false,
                once: vi.fn(),
                connect: vi.fn()
            } as any;

            await expect((service as any).ensureConnected(mockSocket, 15)).rejects.toThrow(
                'Connection timeout waiting for backend socket gateway'
            );
        });
    });

    describe('emitAck', () => {
        it('should return SSR_GUARD error when socket is unavailable', async () => {
            vi.spyOn(service, 'getSocket').mockReturnValue(null);
            const res = await (service as any).emitAck('test:event', {});
            expect(res).toEqual({
                success: false,
                error: { code: 'SSR_GUARD', message: 'Socket is unavailable in non-browser platform' }
            });
        });

        it('should return CONNECTION_ERROR with error message when connection fails', async () => {
            vi.spyOn(service, 'getSocket').mockReturnValue({ connected: false } as any);
            vi.spyOn(service as any, 'ensureConnected').mockRejectedValueOnce(new Error('Refused'));

            const res = await (service as any).emitAck('test:event', {});
            expect(res).toEqual({
                success: false,
                error: { code: 'CONNECTION_ERROR', message: 'Refused' }
            });
        });

        it('should return CONNECTION_ERROR fallback message when error has no message', async () => {
            vi.spyOn(service, 'getSocket').mockReturnValue({ connected: false } as any);
            vi.spyOn(service as any, 'ensureConnected').mockRejectedValueOnce({});

            const res = await (service as any).emitAck('test:event', {});
            expect(res).toEqual({
                success: false,
                error: { code: 'CONNECTION_ERROR', message: 'Failed to establish socket connection to gateway' }
            });
        });

        it('should handle ensureConnected throwing null without crashing in emitAck', async () => {
            vi.spyOn(service, 'getSocket').mockReturnValue({ connected: false } as any);
            vi.spyOn(service as any, 'ensureConnected').mockRejectedValueOnce(null);

            const res = await (service as any).emitAck('test:event', {});
            expect(res).toEqual({
                success: false,
                error: { code: 'CONNECTION_ERROR', message: 'Failed to establish socket connection to gateway' }
            });
        });

        it('should return TIMEOUT error with exact event name when ack times out', async () => {
            const mockSocket = {
                connected: true,
                emit: vi.fn() // no callback invocation
            } as any;
            vi.spyOn(service, 'getSocket').mockReturnValue(mockSocket);

            const res = await (service as any).emitAck('admin:users:test', {}, 15);
            expect(res).toEqual({
                success: false,
                error: { code: 'TIMEOUT', message: 'Timeout waiting for ack on admin:users:test' }
            });
        });

        it('should return EMPTY_RESPONSE error when gateway returns falsy response', async () => {
            const mockSocket = {
                connected: true,
                emit: vi.fn((event, payload, cb) => cb(null))
            } as any;
            vi.spyOn(service, 'getSocket').mockReturnValue(mockSocket);

            const res = await (service as any).emitAck('admin:users:test', {});
            expect(res).toEqual({
                success: false,
                error: { code: 'EMPTY_RESPONSE', message: 'Empty response received from user gateway' }
            });
        });

        it('should clearTimeout and return valid gateway response when ack succeeds', async () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
            const expectedResponse = { success: true, data: { status: 'ok' } };
            const mockSocket = {
                connected: true,
                emit: vi.fn((event, payload, cb) => cb(expectedResponse))
            } as any;
            vi.spyOn(service, 'getSocket').mockReturnValue(mockSocket);

            const res = await (service as any).emitAck('admin:users:test', {});
            expect(res).toEqual(expectedResponse);
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });
    });

    describe('getUsers', () => {
        it('should fetch users from REST GET /api/v1/users with credentials', async () => {
            const mockUsers: User[] = [{ id: '1', name: 'Alice', email: 'alice@test.com', role: 'admin' }];
            const httpGetSpy = vi.spyOn((service as any).http, 'get').mockReturnValue(
                of({ success: true, data: { users: mockUsers } })
            );

            const res = await service.getUsers();
            expect(httpGetSpy).toHaveBeenCalledWith('http://localhost:3000/api/v1/users', { withCredentials: true });
            expect(res).toEqual(mockUsers);
        });

        it('should parse various response data payload shapes and direct arrays', async () => {
            const httpSpy = vi.spyOn((service as any).http, 'get');

            // 1. Direct array
            httpSpy.mockReturnValueOnce(of([{ id: 'a1' }]));
            expect((await service.getUsers())).toEqual([{ id: 'a1' }]);

            // 2. res.success && res.data array
            httpSpy.mockReturnValueOnce(of({ success: true, data: [{ id: 'a2' }] }));
            expect((await service.getUsers())).toEqual([{ id: 'a2' }]);

            // 3. res.success && res.data.users
            httpSpy.mockReturnValueOnce(of({ success: true, data: { users: [{ id: 'a3' }] } }));
            expect((await service.getUsers())).toEqual([{ id: 'a3' }]);

            // 4. res.success && res.data.items
            httpSpy.mockReturnValueOnce(of({ success: true, data: { items: [{ id: 'a4' }] } }));
            expect((await service.getUsers())).toEqual([{ id: 'a4' }]);

            // 5. res.success && res.data.data
            httpSpy.mockReturnValueOnce(of({ success: true, data: { data: [{ id: 'a5' }] } }));
            expect((await service.getUsers())).toEqual([{ id: 'a5' }]);

            // 6. res.data array without res.success
            httpSpy.mockReturnValueOnce(of({ data: [{ id: 'a6' }] }));
            expect((await service.getUsers())).toEqual([{ id: 'a6' }]);

            // 7. res.users array without res.success
            httpSpy.mockReturnValueOnce(of({ users: [{ id: 'a7' }] }));
            expect((await service.getUsers())).toEqual([{ id: 'a7' }]);

            // 8. res.success && res.data object with no arrays inside
            httpSpy.mockReturnValueOnce(of({ success: true, data: { other: 'none' } }));
            expect((await service.getUsers())).toEqual([]);

            // 9. Empty or unparseable object returns empty array
            httpSpy.mockReturnValueOnce(of({ success: true, data: null }));
            expect((await service.getUsers())).toEqual([]);
        });

        it('should extract error message across various error shapes and fallback gracefully', async () => {
            const httpSpy = vi.spyOn((service as any).http, 'get');

            // 1. err.error.message
            httpSpy.mockReturnValueOnce(throwError(() => ({ error: { message: 'First error' } })));
            await expect(service.getUsers()).rejects.toThrow('First error');

            // 2. err.error.error.message
            httpSpy.mockReturnValueOnce(throwError(() => ({ error: { error: { message: 'Nested error' } } })));
            await expect(service.getUsers()).rejects.toThrow('Nested error');

            // 3. err.message
            httpSpy.mockReturnValueOnce(throwError(() => new Error('Direct exception')));
            await expect(service.getUsers()).rejects.toThrow('Direct exception');

            // 4. Fallback string
            httpSpy.mockReturnValueOnce(throwError(() => ({})));
            await expect(service.getUsers()).rejects.toThrow('Gagal memuat data user dari server');

            // 5. Null error and null error.error handling
            httpSpy.mockReturnValueOnce(throwError(() => null));
            await expect(service.getUsers()).rejects.toThrow('Gagal memuat data user dari server');

            httpSpy.mockReturnValueOnce(throwError(() => ({ error: null })));
            await expect(service.getUsers()).rejects.toThrow('Gagal memuat data user dari server');
        });
    });

    describe('createUser', () => {
        it('should populate default password, default role, and default isActive: true when omitted', async () => {
            const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
                success: true,
                data: {
                    user: { id: 'usr-10', name: 'User Ten', email: 'ten@test.com', role: 'user', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' }
                }
            });

            const result = await service.createUser({ name: 'User Ten', email: 'ten@test.com', role: '' });
            expect(emitSpy).toHaveBeenCalledWith('admin:users:create', {
                name: 'User Ten',
                email: 'ten@test.com',
                password: 'DefaultPassword123!',
                role: 'user',
                isActive: true
            });
            expect(result.id).toBe('usr-10');
            expect(result.name).toBe('User Ten');
        });

        it('should honor custom password, custom role, and isActive: false', async () => {
            const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
                success: true,
                data: {
                    _id: 'usr-20',
                    isActive: false
                }
            });

            const result = await service.createUser({
                name: 'User 20',
                email: 'twenty@test.com',
                password: 'MySecretPassword123!',
                role: 'admin',
                isActive: false
            });

            expect(emitSpy).toHaveBeenCalledWith('admin:users:create', {
                name: 'User 20',
                email: 'twenty@test.com',
                password: 'MySecretPassword123!',
                role: 'admin',
                isActive: false
            });
            expect(result.id).toBe('usr-20');
            expect(result.role).toBe('admin');
            expect(result.isActive).toBe(false);
            expect(result.name).toBe('User 20');
            expect(result.email).toBe('twenty@test.com');
            expect(result.createdAt).toBeTruthy();
        });

        it('should generate fallback usr_ id and ISO createdAt when backend response omits them', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValue({
                success: true,
                data: {}
            });

            const result = await service.createUser({
                name: 'Fallback User',
                email: 'fb@test.com',
                role: 'manager'
            });

            expect(result.id).toMatch(/^usr_\d+/);
            expect(result.name).toBe('Fallback User');
            expect(result.email).toBe('fb@test.com');
            expect(result.role).toBe('manager');
            expect(result.isActive).toBe(true);
            expect(result.createdAt).toBeTruthy();
        });

        it('should fallback to user.isActive when created.isActive is undefined', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: true,
                data: { user: { name: 'Fallback Active User' } }
            });
            const result = await service.createUser({
                name: 'Fallback Active User',
                email: 'fall@test.com',
                role: 'user',
                isActive: false
            });
            expect(result.isActive).toBe(false);
        });

        it('should honor created.isActive: false when user.isActive is true', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: true,
                data: { user: { isActive: false, createdAt: '2026-01-01T00:00:00.000Z' } }
            });
            const result = await service.createUser({ name: 'A', email: 'a@a.com', role: 'user', isActive: true });
            expect(result.isActive).toBe(false);
            expect(typeof result.createdAt).toBe('string');
            expect(result.createdAt).not.toBe(true);
        });

        it('should throw error when backend returns success: false even if data field is present in createUser', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                data: { user: { name: 'Ignored' } },
                error: { message: 'Creation rejected' }
            });
            await expect(service.createUser({ name: 'A', email: 'a@a.com', role: 'user' })).rejects.toThrow('Creation rejected');
        });

        it('should fallback to res.message when res.error is non-string object without message', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                error: {},
                message: 'Top-level message'
            } as any);
            await expect(service.createUser({ name: 'A', email: 'a@a.com', role: 'user' })).rejects.toThrow('Top-level message');
        });

        it('should handle null response from emitAck in createUser', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce(null);
            await expect(service.createUser({ name: 'A', email: 'a@a.com', role: 'user' })).rejects.toThrow('Gagal membuat user baru di server');
        });

        it('should handle failure with res.error.message, string res.error, res.message, and default fallback', async () => {
            // 1. res.error.message
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                error: { message: 'Email duplicate' }
            });
            await expect(service.createUser({ name: 'A', email: 'a@a.com', role: 'user' })).rejects.toThrow('Email duplicate');

            // 2. res.error as string
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                error: 'Direct string error'
            });
            await expect(service.createUser({ name: 'A', email: 'a@a.com', role: 'user' })).rejects.toThrow('Direct string error');

            // 3. res.message
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                message: 'Top-level message'
            } as any);
            await expect(service.createUser({ name: 'A', email: 'a@a.com', role: 'user' })).rejects.toThrow('Top-level message');

            // 4. Default fallback error
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false
            });
            await expect(service.createUser({ name: 'A', email: 'a@a.com', role: 'user' })).rejects.toThrow('Gagal membuat user baru di server');
        });
    });

    describe('updateUser', () => {
        it('should send effectiveId from id parameter and return updated user with res.data.user', async () => {
            const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
                success: true,
                data: { user: { name: 'Updated Name', role: 'admin' } }
            });

            const result = await service.updateUser('usr_1', { name: 'Updated Name' });
            expect(emitSpy).toHaveBeenCalledWith('admin:users:update', {
                id: 'usr_1',
                userId: 'usr_1',
                name: 'Updated Name'
            });
            expect(result.id).toBe('usr_1');
            expect(result.name).toBe('Updated Name');
            expect(result.role).toBe('admin');
        });

        it('should fallback effectiveId to data._id or data.id when id parameter is empty string', async () => {
            const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
                success: true,
                data: { name: 'Updated Via _id' }
            });

            const result1 = await service.updateUser('', { _id: 'usr_from_data', name: 'Updated Via _id' } as any);
            expect(emitSpy).toHaveBeenCalledWith('admin:users:update', {
                id: 'usr_from_data',
                userId: 'usr_from_data',
                _id: 'usr_from_data',
                name: 'Updated Via _id'
            });
            expect(result1.id).toBe('usr_from_data');

            const result2 = await service.updateUser('', { id: 'usr_id_data', name: 'Updated' } as any);
            expect(result2.id).toBe('usr_id_data');

            const result3 = await service.updateUser('', { name: 'CompletelyEmptyId' });
            expect(result3.id).toBe('');
        });

        it('should handle null data argument safely in updateUser', async () => {
            const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: true,
                data: { user: { name: 'Updated' } }
            });
            const result = await service.updateUser('usr_1', null as any);
            expect(result.id).toBe('usr_1');
            expect(emitSpy).toHaveBeenCalledWith('admin:users:update', { id: 'usr_1', userId: 'usr_1' });
        });

        it('should throw error when backend returns success: false even if data is present in updateUser', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                data: { user: { name: 'Ignored' } },
                error: { message: 'Update rejected' }
            });
            await expect(service.updateUser('u1', { name: 'X' })).rejects.toThrow('Update rejected');
        });

        it('should throw res.error.message or fallback error message on update failure', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                error: { message: 'Permission denied' }
            });
            await expect(service.updateUser('usr_1', { name: 'X' })).rejects.toThrow('Permission denied');

            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false
            });
            await expect(service.updateUser('usr_99', { name: 'X' })).rejects.toThrow('Gagal memperbarui user usr_99 di server');
        });
    });

    describe('deleteUser', () => {
        it('should emit admin:users:delete with userId and return true on success', async () => {
            const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
                success: true,
                data: { deleted: true }
            });

            const result = await service.deleteUser('usr_123');
            expect(emitSpy).toHaveBeenCalledWith('admin:users:delete', { userId: 'usr_123' });
            expect(result).toBe(true);
        });

        it('should throw res.error.message or fallback error message on delete failure', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                error: { message: 'Cannot delete superadmin' }
            });
            await expect(service.deleteUser('usr_super')).rejects.toThrow('Cannot delete superadmin');

            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false
            });
            await expect(service.deleteUser('usr_404')).rejects.toThrow('Gagal menghapus user usr_404 dari server');
        });
    });

    describe('deleteUsers', () => {
        it('should return true immediately without emitting when ids array is empty or undefined', async () => {
            const emitSpy = vi.spyOn(service as any, 'emitAck');

            expect(await service.deleteUsers([])).toBe(true);
            expect(await service.deleteUsers(null as any)).toBe(true);
            expect(await service.deleteUsers(undefined as any)).toBe(true);
            expect(emitSpy).not.toHaveBeenCalled();
        });

        it('should emit admin:users:deleteMany with userIds and return true on success', async () => {
            const emitSpy = vi.spyOn(service as any, 'emitAck').mockResolvedValue({
                success: true,
                data: { deletedCount: 3 }
            });

            const result = await service.deleteUsers(['u1', 'u2', 'u3']);
            expect(emitSpy).toHaveBeenCalledWith('admin:users:deleteMany', { userIds: ['u1', 'u2', 'u3'] });
            expect(result).toBe(true);
        });

        it('should throw res.error.message or fallback error message on batch delete failure', async () => {
            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false,
                error: { message: 'Batch deletion locked' }
            });
            await expect(service.deleteUsers(['u1'])).rejects.toThrow('Batch deletion locked');

            vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                success: false
            });
            await expect(service.deleteUsers(['u1'])).rejects.toThrow('Gagal menghapus user secara massal dari server');
        });
    });

    describe('disconnect', () => {
        it('should disconnect socket and reset reference when socket is present', () => {
            const socket = service.getSocket();
            const disconnectSpy = vi.spyOn(socket as any, 'disconnect');

            service.disconnect();
            expect(disconnectSpy).toHaveBeenCalled();
            expect((service as any).socket).toBeNull();

            // Calling again when already null should be a no-op
            expect(() => service.disconnect()).not.toThrow();
        });
    });

    describe('Property-Based Invariants (fast-check)', () => {
        it('property: createUser always rejects with error when backend returns failure', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        email: fc.emailAddress(),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        role: fc.constantFrom('admin', 'user', 'manager')
                    }),
                    async (inputUser) => {
                        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                            success: false,
                            error: { message: 'Server failure' }
                        });
                        await expect(service.createUser(inputUser)).rejects.toThrow('Server failure');
                    }
                ),
                { numRuns: 20 }
            );
        });

        it('property: updateUser always rejects with error when backend returns failure', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        role: fc.constantFrom('admin', 'user')
                    }),
                    async (id, updates) => {
                        vi.spyOn(service as any, 'emitAck').mockResolvedValueOnce({
                            success: false,
                            error: { message: 'Update failure' }
                        });
                        await expect(service.updateUser(id, updates)).rejects.toThrow('Update failure');
                    }
                ),
                { numRuns: 20 }
            );
        });
    });
});
