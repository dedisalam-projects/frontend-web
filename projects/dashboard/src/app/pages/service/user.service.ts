import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/users`;
    private socket: Socket | null = null;

    constructor() {
        this.initSocket();
    }

    private initSocket(): Socket | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        if (!this.socket) {
            const s = io(`${environment.socketUrl}/users`, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
                autoConnect: true
            });

            s.on('connect', () => {
                s.emit('admin:join', {});
            });
            this.socket = s;
        }
        return this.socket;
    }

    getSocket(): Socket | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        return this.socket || this.initSocket();
    }

    private async ensureConnected(socket: Socket, timeoutMs = 4000): Promise<void> {
        if (socket.connected) return;

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
        try {
            const res = await firstValueFrom(
                this.http.get<any>(this.apiUrl, {
                    withCredentials: true
                })
            );
            if (Array.isArray(res)) return res;
            const payload = res?.data ?? res;
            if (Array.isArray(payload)) return payload;
            if (payload && typeof payload === 'object') {
                if (Array.isArray(payload.users)) return payload.users;
                if (Array.isArray(payload.items)) return payload.items;
                if (Array.isArray(payload.data)) return payload.data;
            }
            return [];
        } catch (err: any) {
            const message = err?.error?.message || err?.error?.error?.message || err?.message || 'Gagal memuat data user dari server';
            throw new Error(message);
        }
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
        if (res?.success && res.data) {
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
        const errorMsg =
            res?.error?.message ||
            (typeof res?.error === 'string' ? res.error : null) ||
            (res as any)?.message ||
            'Gagal membuat user baru di server';
        throw new Error(errorMsg);
    }

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        const effectiveId = id || (data as any)?._id || (data as any)?.id || '';
        const res = await this.emitAck<any>('admin:users:update', { id: effectiveId, userId: effectiveId, ...data });
        if (res?.success && res.data) {
            const updated = res.data.user || res.data;
            return { id: effectiveId, ...data, ...updated };
        }
        throw new Error(res?.error?.message || `Gagal memperbarui user ${effectiveId} di server`);
    }

    async deleteUser(id: string): Promise<boolean> {
        const res = await this.emitAck<any>('admin:users:delete', { userId: id });
        if (res.success) {
            return true;
        }
        throw new Error(res.error?.message || `Gagal menghapus user ${id} dari server`);
    }

    async deleteUsers(ids: string[]): Promise<boolean> {
        if (!ids || ids.length === 0) return true;
        const res = await this.emitAck<any>('admin:users:deleteMany', { userIds: ids });
        if (res.success) {
            return true;
        }
        throw new Error(res.error?.message || `Gagal menghapus user secara massal dari server`);
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
