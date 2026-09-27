import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutService } from 'shared-ui';

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

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme,
    }));
  }
}
