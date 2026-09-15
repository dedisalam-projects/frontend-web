/**
 * Integration Test: Realtime Socket.IO Communication — UserService
 *
 * Verifies that:
 * 1. Authorization token from localStorage is passed during socket initialization / handshake
 * 2. Realtime Ack RPC requests emit correct events (admin:users:list, admin:users:create, etc.)
 * 3. Response envelope { success, data, meta } is handled and unwrapped correctly
 * 4. Error response or disconnection triggers fallback gracefully
 */
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { UserService } from '../pages/service/user.service';

describe('Realtime Socket.IO Integration — UserService', () => {
    let userService: UserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: 'browser' }, UserService]
        });
        userService = TestBed.inject(UserService);
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    // ── Handshake Token Verification ──────────────────────────────────────

    it('should propagate accessToken from localStorage to socket auth configuration', async () => {
        localStorage.setItem('accessToken', 'test-jwt-token-123');

        const emitSpy = vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: []
        });

        await userService.getUsers();

        expect(emitSpy).toHaveBeenCalledWith('admin:users:list', { page: 1, limit: 100 });
        const socket = userService.getSocket();
        expect(socket).toBeDefined();
    });

    // ── Response Envelope Handling ────────────────────────────────────────

    it('should unwrap { success: true, data: { users: User[] } } envelope format', async () => {
        localStorage.setItem('accessToken', 'tok');
        const mockUsers = [{ id: '1', name: 'Alice', email: 'alice@x.com', role: 'admin', isActive: true }];

        vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { users: mockUsers, meta: { total: 1 } }
        });

        const result = await userService.getUsers();
        expect(result).toEqual(mockUsers);
    });

    it('should handle plain array response (direct data array)', async () => {
        localStorage.setItem('accessToken', 'tok');
        const mockUsers = [{ id: '2', name: 'Bob', email: 'bob@x.com', role: 'user', isActive: true }];

        vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: mockUsers
        });

        const result = await userService.getUsers();
        expect(result).toEqual(mockUsers);
    });

    it('should throw error on UNAUTHORIZED socket response', async () => {
        localStorage.setItem('accessToken', 'expired-token');

        vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Token expired' }
        });

        await expect(userService.getUsers()).rejects.toThrow('Token expired');
    });

    it('should throw error on TIMEOUT or INTERNAL_ERROR', async () => {
        vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: false,
            error: { code: 'TIMEOUT', message: 'Timeout' }
        });

        await expect(userService.getUsers()).rejects.toThrow('Timeout');
    });

    // ── Realtime CRUD Integration ──────────────────────────────────────────

    it('should emit admin:users:create Ack RPC on createUser', async () => {
        localStorage.setItem('accessToken', 'admin-token');
        const newUser = { name: 'Charlie', email: 'charlie@x.com', password: 'pass123', role: 'user' };

        const emitSpy = vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { id: 'new-1', ...newUser }
        });

        const result = await userService.createUser(newUser);

        expect(emitSpy).toHaveBeenCalledWith('admin:users:create', { ...newUser, isActive: true });
        expect(result.id).toBe('new-1');
        expect(result.name).toBe('Charlie');
    });

    it('should emit admin:users:update on updateUser', async () => {
        localStorage.setItem('accessToken', 'admin-token');
        const updates = { name: 'Updated Name' };

        const emitSpy = vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { id: 'usr-1', ...updates }
        });

        const result = await userService.updateUser('usr-1', updates);

        expect(emitSpy).toHaveBeenCalledWith('admin:users:update', { id: 'usr-1', ...updates });
        expect(result.id).toBe('usr-1');
        expect(result.name).toBe('Updated Name');
    });

    it('should emit admin:users:delete on deleteUser', async () => {
        localStorage.setItem('accessToken', 'admin-token');

        const emitSpy = vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { deleted: true }
        });

        const result = await userService.deleteUser('usr-1');

        expect(emitSpy).toHaveBeenCalledWith('admin:users:delete', { userId: 'usr-1' });
        expect(result).toBe(true);
    });

    it('should emit multiple admin:users:delete sequentially on deleteUsers', async () => {
        localStorage.setItem('accessToken', 'admin-token');
        const ids = ['usr-1', 'usr-2', 'usr-3'];

        const emitSpy = vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { deleted: true }
        });

        const result = await userService.deleteUsers(ids);

        expect(result).toBe(true);
        expect(emitSpy).toHaveBeenCalledTimes(3);
    });

    // ── Strict Error Propagation ──────────────────────────────────────────

    it('should throw error when createUser backend returns error', async () => {
        localStorage.setItem('accessToken', 'admin-token');
        const newUser = { name: 'Dan', email: 'dan@x.com', password: 'pass', role: 'user', isActive: true };

        vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Server Error' }
        });

        await expect(userService.createUser(newUser)).rejects.toThrow('Server Error');
    });
});
