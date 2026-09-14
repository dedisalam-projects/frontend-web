import { Component, computed, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-floating-configurator',
    imports: [CommonModule, ButtonModule, StyleClassModule, AppConfigurator],
    host: {
        '[class.fixed]': 'float()',
        '[class.top-8]': 'float()',
        '[class.right-8]': 'float()',
        '[class.z-50]': 'float()'
    },
    template: `
        <div class="flex gap-4 items-center" [class.fixed]="float()" [class.top-8]="float()" [class.right-8]="float()" [class.z-50]="float()" style="min-width: 80px; min-height: 36px;">
            <p-button type="button" (onClick)="toggleDarkMode()" [rounded]="true" [icon]="isDarkTheme() ? 'pi pi-moon' : 'pi pi-sun'" severity="secondary" ariaLabel="Toggle Dark Mode" />
            <div class="relative">
                <p-button
                    icon="pi pi-palette"
                    pStyleClass="@next"
                    enterFromClass="hidden"
                    enterActiveClass="animate-scalein"
                    leaveToClass="hidden"
                    leaveActiveClass="animate-fadeout"
                    [hideOnOutsideClick]="true"
                    type="button"
                    rounded
                    ariaLabel="Color Scheme"
                />
                <app-configurator />
            </div>
        </div>
    `
})
export class AppFloatingConfigurator {
    LayoutService = inject(LayoutService);

    float = input<boolean>(true);

    isDarkTheme = computed(() => this.LayoutService.layoutConfig().darkTheme);

    toggleDarkMode() {
        this.LayoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}
