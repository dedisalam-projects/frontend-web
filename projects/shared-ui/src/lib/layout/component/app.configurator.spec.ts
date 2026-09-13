import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { PLATFORM_ID } from '@angular/core';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';

describe('AppConfigurator', () => {
    let component: AppConfigurator;
    let fixture: ComponentFixture<AppConfigurator>;
    let layoutService: LayoutService;

    beforeEach(async () => {
        const routerMock = {
            url: '/'
        };

        await TestBed.configureTestingModule({
            imports: [AppConfigurator],
            providers: [LayoutService, providePrimeNG({ theme: { preset: Aura } }), { provide: Router, useValue: routerMock }, { provide: PLATFORM_ID, useValue: 'browser' }]
        }).compileComponents();

        fixture = TestBed.createComponent(AppConfigurator);
        component = fixture.componentInstance;
        layoutService = TestBed.inject(LayoutService);
        fixture.detectChanges();
    });

    it('should create AppConfigurator', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize computed signals with layoutService values', () => {
        expect(component.selectedPrimaryColor()).toBe('emerald');
        expect(component.selectedPreset()).toBe('Aura');
        expect(component.menuMode()).toBe('static');
        expect(component.showMenuModeButton()).toBe(true);
    });

    it('should update preset onPresetChange', () => {
        component.onPresetChange('Lara');
        expect(layoutService.layoutConfig().preset).toBe('Lara');
    });

    it('should update menuMode onMenuModeChange', () => {
        component.onMenuModeChange('overlay');
        expect(layoutService.layoutConfig().menuMode).toBe('overlay');
    });

    it('should update primary color in updateColors', () => {
        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as Event;

        const colorItem = {
            name: 'blue',
            palette: { '500': '#3b82f6' }
        };

        component.updateColors(mockEvent, 'primary', colorItem);
        expect(layoutService.layoutConfig().primary).toBe('blue');
    });

    it('should update surface color in updateColors', () => {
        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as Event;

        const surfaceItem = {
            name: 'slate',
            palette: { '500': '#64748b' }
        };

        component.updateColors(mockEvent, 'surface', surfaceItem);
        expect(layoutService.layoutConfig().surface).toBe('slate');
    });

    it('should handle noir primary color in getPresetExt', () => {
        const mockEvent = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as Event;

        const noirItem = {
            name: 'noir'
        };

        component.updateColors(mockEvent, 'primary', noirItem);
        expect(layoutService.layoutConfig().primary).toBe('noir');

        const presetExt = component.getPresetExt();
        expect(presetExt.semantic.colorScheme.light.primary.color).toBe('{primary.950}');
    });

    it('should handle Nora preset in getPresetExt and preset change with surface palette', () => {
        layoutService.layoutConfig.update((c) => ({ ...c, preset: 'Nora', primary: 'blue', surface: 'slate' }));
        const ext = component.getPresetExt();
        expect(ext.semantic.colorScheme.light.primary.color).toBe('{primary.600}');

        // Test onPresetChange when surface palette exists
        component.onPresetChange('Nora');
        expect(layoutService.layoutConfig().preset).toBe('Nora');
    });

    it('should trigger button clicks in template', () => {
        const buttons = fixture.nativeElement.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
        buttons[0].click();
        fixture.detectChanges();
    });
});
