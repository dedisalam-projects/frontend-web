import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface User {
    id?: string;
    _id?: string;
    email?: string;
    name?: string;
    role?: string;
    isActive?: boolean;
    createdAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code?: string;
        message?: string;
        details?: any;
    };
    meta?: {
        timestamp?: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private platformId = inject(PLATFORM_ID);
    private socket: Socket | null = null;

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.initSocket();
        }
    }

    getToken(): string | null {
        if (typeof window === 'undefined') return null;

        // 1. Check localStorage first
        const localToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (localToken && this.isTokenValid(localToken)) {
            return localToken;
        }

        // 2. Fallback to cookie (crucial for cross-port login from :4002 to :4000)
        const cookieToken = this.getCookie('accessToken');
        if (cookieToken && this.isTokenValid(cookieToken)) {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('accessToken', cookieToken);
            }
            return cookieToken;
        }

        return null;
    }

    private getCookie(name: string): string | null {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return match ? decodeURIComponent(match[3]) : null;
    }

    private isTokenValid(token: string | null): boolean {
        if (!token) return false;
        try {
            const parts = token.split('.');
            if (parts.length < 2) return false;
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    private initSocket(): Socket | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        if (!this.socket) {
            const token = this.getToken();
            this.socket = io(`${environment.socketUrl}/users`, {
                transports: ['websocket', 'polling'],
                auth: { token },
                withCredentials: true,
                autoConnect: true
            });

            this.socket.on('connect', () => {
                this.socket?.emit('admin:join', {});
            });
        }
        return this.socket;
    }

    getSocket(): Socket | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        if (!this.socket) {
            return this.initSocket();
        }
        return this.socket;
    }

    private async ensureConnected(socket: Socket, timeoutMs = 4000): Promise<void> {
        if (socket.connected) return;

        // Ensure fresh token is attached before connecting
        const token = this.getToken();
        if (socket.auth && typeof socket.auth === 'object') {
            (socket.auth as any).token = token;
        }

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Connection timeout waiting for backend socket gateway'));
            }, timeoutMs);

            socket.once('connect', () => {
                clearTimeout(timer);
                resolve();
            });

            socket.once('connect_error', (err) => {
                clearTimeout(timer);
                reject(err);
            });

            socket.connect();
        });
    }

    private async emitAck<T>(event: string, payload: any, timeoutMs = 8000): Promise<ApiResponse<T>> {
        const socket = this.getSocket();
        if (!socket) {
            return {
                success: false,
                error: { code: 'SSR_GUARD', message: 'Socket is unavailable in non-browser platform' }
            };
        }

        const currentToken = this.getToken();
        if (socket.auth && typeof socket.auth === 'object') {
            (socket.auth as any).token = currentToken;
        }

        try {
            await this.ensureConnected(socket, 4000);
        } catch (err: any) {
            return {
                success: false,
                error: { code: 'CONNECTION_ERROR', message: err?.message || 'Failed to establish socket connection to gateway' }
            };
        }

        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                resolve({
                    success: false,
                    error: { code: 'TIMEOUT', message: `Timeout waiting for ack on ${event}` }
                });
            }, timeoutMs);

            socket.emit(event, payload, (response: ApiResponse<T>) => {
                clearTimeout(timer);
                if (!response) {
                    resolve({
                        success: false,
                        error: { code: 'EMPTY_RESPONSE', message: 'Empty response received from user gateway' }
                    });
                    return;
                }
                resolve(response);
            });
        });
    }

    async getUsers(): Promise<User[]> {
        const res = await this.emitAck<any>('admin:users:list', { page: 1, limit: 100 });
        if (res.success) {
            if (!res.data) {
                return [];
            }
            if (Array.isArray(res.data)) {
                return res.data;
            }
            if (Array.isArray(res.data.users)) {
                return res.data.users;
            }
            if (Array.isArray(res.data.items)) {
                return res.data.items;
            }
            if (Array.isArray(res.data.data)) {
                return res.data.data;
            }
            return [];
        }
        throw new Error(res.error?.message || 'Gagal memuat data user dari server');
    }

    async createUser(user: { name: string; email: string; password?: string; role: string; isActive?: boolean }): Promise<User> {
        const payload = {
            name: user.name,
            email: user.email,
            password: user.password || 'DefaultPassword123!',
            role: user.role || 'user',
            isActive: user.isActive !== undefined ? user.isActive : true
        };

        const res = await this.emitAck<any>('admin:users:create', payload);
        if (res.success && res.data) {
            const created = res.data.user || res.data;
            return {
                id: created.id || created._id || `usr_${Date.now()}`,
                name: created.name || user.name,
                email: created.email || user.email,
                role: created.role || user.role,
                isActive: created.isActive !== undefined ? created.isActive : user.isActive !== undefined ? user.isActive : true,
                createdAt: created.createdAt || new Date().toISOString()
            };
        }
        throw new Error(res.error?.message || 'Gagal membuat user baru di server');
    }

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        const res = await this.emitAck<any>('admin:users:update', { id, ...data });
        if (res.success && res.data) {
            const updated = res.data.user || res.data;
            return { id, ...data, ...updated };
        }
        throw new Error(res.error?.message || `Gagal memperbarui user ${id} di server`);
    }

    async deleteUser(id: string): Promise<boolean> {
        const res = await this.emitAck<any>('admin:users:delete', { userId: id });
        if (res.success) {
            return true;
        }
        throw new Error(res.error?.message || `Gagal menghapus user ${id} dari server`);
    }

    async deleteUsers(ids: string[]): Promise<boolean> {
        for (const id of ids) {
            await this.deleteUser(id);
        }
        return true;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
