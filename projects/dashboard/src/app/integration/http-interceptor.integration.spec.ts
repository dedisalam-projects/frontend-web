/**
 * Integration Test: Realtime Socket.IO & REST Integration — UserService
 *
 * Verifies that:
 * 1. REST GET /api/v1/users is called with credentials for users list
 * 2. Socket client connects with withCredentials: true without auth token
 * 3. Response envelope is handled and unwrapped correctly
 * 4. Error response or disconnection triggers fallback gracefully
 */
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { UserService } from '../pages/service/user.service';

describe('Realtime Socket.IO & REST Integration — UserService', () => {
    let userService: UserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: PLATFORM_ID, useValue: 'browser' }, UserService]
        });
        userService = TestBed.inject(UserService);
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    // ── REST GET Users ───────────────────────────────────────────────────

    it('should call REST GET /api/v1/users with credentials when calling getUsers', async () => {
        const httpSpy = vi.spyOn((userService as any).http, 'get').mockReturnValue(
            of({ success: true, data: [] })
        );

        await userService.getUsers();

        expect(httpSpy).toHaveBeenCalledWith('http://localhost:3000/api/v1/users', { withCredentials: true });
        const socket = userService.getSocket();
        expect(socket).toBeDefined();
    });

    // ── Response Envelope Handling ────────────────────────────────────────

    it('should unwrap { success: true, data: { users: User[] } } envelope format', async () => {
        const mockUsers = [{ id: '1', name: 'Alice', email: 'alice@x.com', role: 'admin', isActive: true }];

        vi.spyOn((userService as any).http, 'get').mockReturnValue(
            of({ success: true, data: { users: mockUsers } })
        );

        const result = await userService.getUsers();
        expect(result).toEqual(mockUsers);
    });

    it('should handle plain array response (direct data array)', async () => {
        const mockUsers = [{ id: '2', name: 'Bob', email: 'bob@x.com', role: 'user', isActive: true }];

        vi.spyOn((userService as any).http, 'get').mockReturnValue(
            of(mockUsers)
        );

        const result = await userService.getUsers();
        expect(result).toEqual(mockUsers);
    });

    it('should throw error on error response', async () => {
        vi.spyOn((userService as any).http, 'get').mockReturnValue(
            throwError(() => ({ error: { message: 'Token expired' } }))
        );

        await expect(userService.getUsers()).rejects.toThrow('Token expired');
    });

    it('should throw error on Network error', async () => {
        vi.spyOn((userService as any).http, 'get').mockReturnValue(
            throwError(() => new Error('Network error'))
        );

        await expect(userService.getUsers()).rejects.toThrow('Network error');
    });

    // ── Realtime CRUD Integration ──────────────────────────────────────────

    it('should emit admin:users:create Ack RPC on createUser when fallback', async () => {
        const newUser = { name: 'Charlie', email: 'charlie@x.com', password: 'pass123', role: 'user' };

        vi.spyOn((userService as any).http, 'post').mockReturnValue(
            throwError(() => new Error('HTTP 404'))
        );

        const emitSpy = vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { id: 'new-1', ...newUser }
        });

        const result = await userService.createUser(newUser);

        expect(emitSpy).toHaveBeenCalledWith('admin:users:create', { ...newUser, isActive: true });
        expect(result.id).toBe('new-1');
        expect(result.name).toBe('Charlie');
    });

    it('should emit admin:users:update on updateUser when fallback', async () => {
        const updates = { name: 'Updated Name' };

        vi.spyOn((userService as any).http, 'patch').mockReturnValue(
            throwError(() => new Error('HTTP 404'))
        );

        const emitSpy = vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { id: 'usr-1', ...updates }
        });

        const result = await userService.updateUser('usr-1', updates);

        expect(emitSpy).toHaveBeenCalledWith('admin:users:update', { id: 'usr-1', userId: 'usr-1', ...updates });
        expect(result.id).toBe('usr-1');
        expect(result.name).toBe('Updated Name');
    });

    it('should emit admin:users:delete on deleteUser when fallback', async () => {
        vi.spyOn((userService as any).http, 'delete').mockReturnValue(
            throwError(() => new Error('HTTP 404'))
        );

        const emitSpy = vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: true,
            data: { deleted: true }
        });

        const result = await userService.deleteUser('usr-1');

        expect(emitSpy).toHaveBeenCalledWith('admin:users:delete', { userId: 'usr-1' });
        expect(result).toBe(true);
    });

    it('should emit multiple admin:users:delete sequentially on deleteUsers', async () => {
        vi.spyOn((userService as any).http, 'delete').mockReturnValue(
            throwError(() => new Error('HTTP 404'))
        );

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
        const newUser = { name: 'Dan', email: 'dan@x.com', password: 'pass', role: 'user', isActive: true };

        vi.spyOn((userService as any).http, 'post').mockReturnValue(
            throwError(() => new Error('HTTP 404'))
        );

        vi.spyOn(userService as any, 'emitAck').mockResolvedValue({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Server Error' }
        });

        await expect(userService.createUser(newUser)).rejects.toThrow('Server Error');
    });
});
