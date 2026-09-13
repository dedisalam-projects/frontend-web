import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { PLATFORM_ID } from '@angular/core';
import { AppFloatingConfigurator } from './app.floatingconfigurator';
import { LayoutService } from '../service/layout.service';

describe('AppFloatingConfigurator', () => {
    let component: AppFloatingConfigurator;
    let fixture: ComponentFixture<AppFloatingConfigurator>;
    let layoutService: LayoutService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppFloatingConfigurator],
            providers: [LayoutService, providePrimeNG({ theme: { preset: Aura } }), { provide: Router, useValue: { url: '/' } }, { provide: PLATFORM_ID, useValue: 'browser' }]
        }).compileComponents();

        fixture = TestBed.createComponent(AppFloatingConfigurator);
        component = fixture.componentInstance;
        layoutService = TestBed.inject(LayoutService);
        fixture.detectChanges();
    });

    it('should create AppFloatingConfigurator', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle dark mode properly', () => {
        expect(component.isDarkTheme()).toBe(false);
        component.toggleDarkMode();
        expect(layoutService.layoutConfig().darkTheme).toBe(true);
        expect(component.isDarkTheme()).toBe(true);
        component.toggleDarkMode();
        expect(layoutService.layoutConfig().darkTheme).toBe(false);
        expect(component.isDarkTheme()).toBe(false);
    });
});
