import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutService } from 'shared-ui';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <div class="layout-topbar">
      <div class="layout-topbar-logo-container">
        <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()" aria-label="Menu">
          <i class="pi pi-bars"></i>
        </button>
        <a class="layout-topbar-logo flex items-center gap-2" routerLink="/">
          <i class="pi pi-file-pdf text-2xl text-primary-600"></i>
          <span class="font-bold text-xl tracking-tight text-surface-900 dark:text-surface-0">BLIP STUDIO</span>
        </a>
      </div>

      <div class="layout-topbar-actions">
        <div class="layout-config-menu flex items-center gap-2">
          <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()" aria-label="Toggle Dark Mode">
            <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
          </button>

          <!-- USER PROFILE BADGE & LOGOUT -->
          <div class="flex items-center gap-2 pl-2 border-l border-surface-200 dark:border-surface-800">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-100">
              <i class="pi pi-user text-green-600 dark:text-green-400"></i>
              <span class="text-xs font-semibold">{{ getUserEmail() }}</span>
            </div>
            <button
              type="button"
              class="layout-topbar-action text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              (click)="logout()"
              title="Keluar (Logout)"
              aria-label="Logout"
            >
              <i class="pi pi-sign-out"></i>
            </button>
          </div>

          <a href="https://dash.dedisalam.my.id" class="layout-topbar-action" title="Kembali ke Dashboard Utama">
            <i class="pi pi-arrow-up-right"></i>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class AppTopbar {
  layoutService = inject(LayoutService);
  authService = inject(AuthService);

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme,
    }));
  }

  getUserEmail(): string {
    const user = this.authService.currentUser();
    if (user?.email) return user.email;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) return JSON.parse(stored).email;
      }
    } catch {}
    return 'admin@dedisalam.my.id';
  }

  logout() {
    this.authService.logout();
  }
}

