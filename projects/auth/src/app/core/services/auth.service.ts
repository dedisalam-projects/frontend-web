import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthSuccessData {
    accessToken?: string;
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
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/auth`;

    async login(credentials: { email: string; password: string }): Promise<AuthResponse<AuthSuccessData>> {
        try {
            const res = await firstValueFrom(
                this.http.post<any>(`${this.apiUrl}/login`, credentials, {
                    withCredentials: true
                })
            );
            return res;
        } catch (err: any) {
            const errorObj = err.error?.error || err.error || {};
            return {
                success: false,
                error: {
                    code: errorObj.code || 'UNAUTHORIZED',
                    message: errorObj.message || err.message || 'Login failed. Please check your credentials.'
                }
            };
        }
    }

    async register(payload: { email: string; password: string; name: string; role?: string }): Promise<AuthResponse<AuthSuccessData>> {
        try {
            const res = await firstValueFrom(
                this.http.post<any>(`${this.apiUrl}/register`, payload, {
                    withCredentials: true
                })
            );
            return res;
        } catch (err: any) {
            const errorObj = err.error?.error || err.error || {};
            return {
                success: false,
                error: {
                    code: errorObj.code || 'REGISTRATION_ERROR',
                    message: errorObj.message || err.message || 'Registration failed.'
                }
            };
        }
    }

    async refresh(payload?: { userId?: string; refreshToken?: string }): Promise<AuthResponse<AuthSuccessData>> {
        try {
            const res = await firstValueFrom(
                this.http.post<any>(`${this.apiUrl}/refresh`, payload || {}, {
                    withCredentials: true
                })
            );
            return res;
        } catch (err: any) {
            const errorObj = err.error?.error || err.error || {};
            return {
                success: false,
                error: {
                    code: errorObj.code || 'REFRESH_ERROR',
                    message: errorObj.message || err.message || 'Token refresh failed.'
                }
            };
        }
    }

    async logout(payload: { refreshToken?: string; accessToken?: string; userId?: string } = {}): Promise<AuthResponse<any>> {
        try {
            const res = await firstValueFrom(
                this.http.post<any>(`${this.apiUrl}/logout`, payload, {
                    withCredentials: true
                })
            );
            return res;
        } catch (err: any) {
            return {
                success: false,
                error: {
                    code: 'LOGOUT_ERROR',
                    message: err.message || 'Logout failed.'
                }
            };
        }
    }
}
