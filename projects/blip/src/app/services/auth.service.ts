import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user?: User;
    accessToken?: string;
    refreshToken?: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT, { optional: true });

  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserFromStorage();
    }
  }

  private loadUserFromStorage() {
    try {
      const stored = localStorage.getItem('user') || localStorage.getItem('currentUser');
      if (stored) {
        this.currentUser.set(JSON.parse(stored));
        return;
      }
      const cookie = this.getCookie('user_session');
      if (cookie) {
        this.currentUser.set(JSON.parse(cookie));
      }
    } catch (e) {
      console.error('[AuthService] Gagal membaca session user dari storage:', e);
    }
  }

  getCookie(name: string): string | null {
    if (!this.document || typeof this.document.cookie === 'undefined') return null;
    const match = this.document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (res.success && res.data?.user) {
            const user = res.data.user;
            this.currentUser.set(user);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('user', JSON.stringify(user));
              const userStr = encodeURIComponent(JSON.stringify(user));
              if (this.document) {
                const domainAttr = environment.cookieDomain ? `; domain=${environment.cookieDomain}` : '';
                this.document.cookie = `user_session=${userStr}; path=/; max-age=604800; SameSite=Lax${domainAttr}`;
              }
            }
          }
        })
      );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
        next: () => this.handleLogoutCleanup(),
        error: () => this.handleLogoutCleanup(),
      });
    }
  }

  private handleLogoutCleanup() {
    this.currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      if (this.document) {
        const domainAttr = environment.cookieDomain ? `; domain=${environment.cookieDomain}` : '';
        this.document.cookie = `user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;${domainAttr}`;
        this.document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        this.document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;${domainAttr}`;
        this.document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        if (this.document.location) {
          this.document.location.href = `${environment.appUrls.auth}/login`;
        }
      }
    }
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    return !!(this.currentUser() || localStorage.getItem('user') || this.getCookie('user_session'));
  }
}
