import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { LayoutService, LayoutConfig } from './layout.service';

describe('LayoutService', () => {
    let service: LayoutService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                LayoutService,
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        });
        service = TestBed.inject(LayoutService);
    });

    it('should be created with default configuration', () => {
        expect(service).toBeTruthy();
        const config = service.layoutConfig();
        expect(config.preset).toBe('Aura');
        expect(config.primary).toBe('emerald');
        expect(config.darkTheme).toBe(false);
        expect(config.menuMode).toBe('static');
        expect(service.isDarkTheme()).toBe(false);
        expect(service.theme()).toBe('dark');
        expect(service.getPrimary()).toBe('emerald');
        expect(service.getSurface()).toBeNull();
        expect(service.isOverlay()).toBe(false);
        expect(service.isSidebarActive()).toBe(false);
    });

    it('should compute theme and isDarkTheme properly', () => {
        service.layoutConfig.update((c) => ({ ...c, darkTheme: true }));
        expect(service.isDarkTheme()).toBe(true);
        expect(service.theme()).toBe('light');

        service.layoutConfig.update((c) => ({ ...c, darkTheme: false }));
        expect(service.isDarkTheme()).toBe(false);
        expect(service.theme()).toBe('dark');
    });

    it('should compute isSidebarActive properly', () => {
        expect(service.isSidebarActive()).toBe(false);
        service.layoutState.update((s) => ({ ...s, overlayMenuActive: true }));
        expect(service.isSidebarActive()).toBe(true);
        service.layoutState.update((s) => ({ ...s, overlayMenuActive: false, mobileMenuActive: true }));
        expect(service.isSidebarActive()).toBe(true);
    });

    it('should compute isOverlay properly', () => {
        expect(service.isOverlay()).toBe(false);
        service.layoutConfig.update((c) => ({ ...c, menuMode: 'overlay' }));
        expect(service.isOverlay()).toBe(true);
    });

    it('should toggle config sidebar visibility', () => {
        expect(service.layoutState().configSidebarVisible).toBe(false);
        service.showConfigSidebar();
        expect(service.layoutState().configSidebarVisible).toBe(true);
        service.hideConfigSidebar();
        expect(service.layoutState().configSidebarVisible).toBe(false);
    });

    it('should toggle menu on desktop', () => {
        vi.spyOn(service, 'isDesktop').mockReturnValue(true);
        expect(service.layoutState().staticMenuDesktopInactive).toBe(false);
        service.onMenuToggle();
        expect(service.layoutState().staticMenuDesktopInactive).toBe(true);
        service.onMenuToggle();
        expect(service.layoutState().staticMenuDesktopInactive).toBe(false);
    });

    it('should toggle menu on mobile', () => {
        vi.spyOn(service, 'isDesktop').mockReturnValue(false);
        expect(service.layoutState().mobileMenuActive).toBe(false);
        service.onMenuToggle();
        expect(service.layoutState().mobileMenuActive).toBe(true);
        service.onMenuToggle();
        expect(service.layoutState().mobileMenuActive).toBe(false);
    });

    it('should toggle menu in overlay mode', () => {
        service.layoutConfig.update((c) => ({ ...c, menuMode: 'overlay' }));
        vi.spyOn(service, 'isDesktop').mockReturnValue(true);
        expect(service.layoutState().overlayMenuActive).toBe(false);
        service.onMenuToggle();
        expect(service.layoutState().overlayMenuActive).toBe(true);
    });

    it('should apply and remove app-dark class in toggleDarkMode', () => {
        service.toggleDarkMode({ darkTheme: true } as LayoutConfig);
        expect(document.documentElement.classList.contains('app-dark')).toBe(true);

        service.toggleDarkMode({ darkTheme: false } as LayoutConfig);
        expect(document.documentElement.classList.contains('app-dark')).toBe(false);
    });

    it('should handle dark mode with document.startViewTransition if supported', () => {
        const startViewTransitionMock = vi.fn((cb: () => void) => cb());
        (document as any).startViewTransition = startViewTransitionMock;

        (service as any).handleDarkModeTransition({ darkTheme: true } as LayoutConfig);
        expect(startViewTransitionMock).toHaveBeenCalled();
        delete (document as any).startViewTransition;
    });

    it('should calculate isDesktop and isMobile based on window.innerWidth in browser', () => {
        const originalWidth = window.innerWidth;
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
        expect(service.isDesktop()).toBe(true);
        expect(service.isMobile()).toBe(false);

        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
        expect(service.isDesktop()).toBe(false);
        expect(service.isMobile()).toBe(true);

        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalWidth });
    });

    it('should return early on server platform for browser-only methods', () => {
        service.platformId = 'server';
        expect((service as any).handleDarkModeTransition({} as LayoutConfig)).toBeUndefined();
        expect((service as any).startViewTransition({} as LayoutConfig)).toBeUndefined();
        expect(service.toggleDarkMode({} as LayoutConfig)).toBeUndefined();
        expect(service.isDesktop()).toBe(true);
    });
});
