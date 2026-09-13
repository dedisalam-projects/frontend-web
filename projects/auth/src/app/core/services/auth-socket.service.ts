import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface AuthSuccessData {
    accessToken: string;
    refreshToken?: string;
    user?: {
        id?: string;
        _id?: string;
        email?: string;
        name?: string;
        role?: string;
    };
}

export interface AuthResponse<T = AuthSuccessData> {
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
export class AuthSocketService {
    private platformId = inject(PLATFORM_ID);
    private socket: Socket | null = null;

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.initSocket();
        }
    }

    private initSocket(): Socket {
        if (!this.socket) {
            this.socket = io(`${environment.socketUrl}/auth`, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
                autoConnect: true
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

    private emitAck<T>(event: string, payload: any, timeoutMs = 8000): Promise<AuthResponse<T>> {
        return new Promise((resolve) => {
            const socket = this.getSocket();
            if (!socket) {
                return resolve({
                    success: false,
                    error: { code: 'SSR_GUARD', message: 'Socket is disabled in non-browser platform' }
                });
            }

            if (!socket.connected) {
                socket.connect();
            }

            const timer = setTimeout(() => {
                resolve({
                    success: false,
                    error: { code: 'TIMEOUT', message: `Timeout waiting for response from ${event}` }
                });
            }, timeoutMs);

            socket.emit(event, payload, (response: AuthResponse<T>) => {
                clearTimeout(timer);
                if (!response) {
                    resolve({
                        success: false,
                        error: { code: 'EMPTY_RESPONSE', message: 'No response received from authentication gateway' }
                    });
                    return;
                }
                resolve(response);
            });
        });
    }

    async login(credentials: { email: string; password: string }): Promise<AuthResponse<AuthSuccessData>> {
        return this.emitAck<AuthSuccessData>('auth:login', credentials);
    }

    async register(payload: { email: string; password: string; name: string; role?: string }): Promise<AuthResponse<AuthSuccessData>> {
        return this.emitAck<AuthSuccessData>('auth:register', payload);
    }

    async refreshToken(payload: { userId: string; refreshToken: string }): Promise<AuthResponse<AuthSuccessData>> {
        return this.emitAck<AuthSuccessData>('auth:refresh', payload);
    }

    async logout(payload: { refreshToken?: string; accessToken?: string; userId?: string } = {}): Promise<AuthResponse<any>> {
        return this.emitAck<any>('auth:logout', payload);
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
