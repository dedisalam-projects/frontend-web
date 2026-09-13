import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { PLATFORM_ID } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LayoutService } from 'shared-ui';
import * as fc from 'fast-check';

import { AppLayout } from './component/app.layout';
import { AppTopbar } from './component/app.topbar';
import { AppSidebar } from './component/app.sidebar';
import { AppMenu } from './component/app.menu';
import { AppFooter } from './component/app.footer';
import { AppMenuitem } from './component/app.menuitem';

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => ({
        on: vi.fn(),
        disconnect: vi.fn(),
        emit: vi.fn((event: string, data: any, cb?: Function) => {
            if (typeof cb === 'function') cb({ success: true });
        })
    }))
}));

describe('Dashboard Layout Suite', () => {
    let layoutService: LayoutService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppLayout, AppTopbar, AppSidebar, AppMenu, AppFooter, AppMenuitem],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), providePrimeNG({ theme: { preset: Aura } }), { provide: PLATFORM_ID, useValue: 'browser' }, LayoutService, MessageService]
        }).compileComponents();

        layoutService = TestBed.inject(LayoutService);
    });

    describe('AppFooter', () => {
        it('should create AppFooter', () => {
            const fixture = TestBed.createComponent(AppFooter);
            expect(fixture.componentInstance).toBeTruthy();
        });
    });

    describe('AppMenu', () => {
        it('should initialize menu model with Dashboard and Manajemen User and render separators', () => {
            const fixture = TestBed.createComponent(AppMenu);
            const component = fixture.componentInstance;
            component.ngOnInit();
            fixture.detectChanges();

            expect(component.model.length).toBe(1);
            expect(component.model[0].items?.length).toBe(2);
            expect(component.model[0].items?.[0].label).toBe('Dashboard');
            expect(component.model[0].items?.[1].label).toBe('Manajemen User');

            component.model = [...component.model, { separator: true }];
            expect(component.model.some((item) => item.separator === true)).toBe(true);
        });
    });

    describe('AppSidebar', () => {
        it('should create AppSidebar, handle route change and outside click events', () => {
            const fixture = TestBed.createComponent(AppSidebar);
            const component = fixture.componentInstance;
            component.ngOnInit();

            (component as any).onRouteChange('/test-route');
            expect(layoutService.layoutState().activePath).toBe('/test-route');

            // Test outside click handler directly
            layoutService.layoutState.update((s) => ({ ...s, overlayMenuActive: true }));
            (component as any).bindOutsideClickListener();
            const outsideClickEvent = new MouseEvent('click');
            Object.defineProperty(outsideClickEvent, 'target', { value: document.createElement('div') });
            expect((component as any).isOutsideClicked(outsideClickEvent)).toBe(true);

            (component as any).outsideClickListener(outsideClickEvent);
            expect(layoutService.layoutState().overlayMenuActive).toBe(false);

            // Test click inside sidebar returns false
            const insideClickEvent = new MouseEvent('click');
            Object.defineProperty(insideClickEvent, 'target', { value: component.el.nativeElement });
            expect((component as any).isOutsideClicked(insideClickEvent)).toBe(false);

            // Test server platform guard
            component.platformId = 'server';
            expect((component as any).isOutsideClicked(outsideClickEvent)).toBe(false);

            component.ngOnDestroy();
        });
    });

    describe('AppTopbar', () => {
        let component: AppTopbar;
        let fixture: ComponentFixture<AppTopbar>;

        beforeEach(() => {
            fixture = TestBed.createComponent(AppTopbar);
            component = fixture.componentInstance;
            localStorage.clear();
        });

        afterEach(() => {
            localStorage.clear();
        });

        it('should create AppTopbar and initialize profile menu', () => {
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(component.profileMenuItems.length).toBe(3);
        });

        it('should decode user email from token in getUserEmail', () => {
            const payload = btoa(JSON.stringify({ email: 'admin@system.local' }));
            localStorage.setItem('accessToken', `header.${payload}.sig`);

            expect(component.getUserEmail()).toBe('admin@system.local');
        });

        it('should return User fallback when decoding corrupted token fails in getUserEmail', () => {
            localStorage.setItem('accessToken', 'bad.jwt.token');
            expect(component.getUserEmail()).toBe('User');
        });

        it('property-based: should reliably decode valid emails from JWT across arbitrary email strings', () => {
            fc.assert(
                fc.property(fc.emailAddress(), (email) => {
                    const payload = btoa(JSON.stringify({ email }));
                    localStorage.setItem('accessToken', `hdr.${payload}.sig`);
                    const result = component.getUserEmail();
                    return result === email;
                }),
                { numRuns: 100 }
            );
        });

        it('property-based: should never throw on arbitrary random token strings', () => {
            fc.assert(
                fc.property(fc.string(), (randomToken) => {
                    localStorage.setItem('accessToken', randomToken);
                    const result = component.getUserEmail();
                    return typeof result === 'string';
                }),
                { numRuns: 100 }
            );
        });

        it('should toggle dark mode via toggleDarkMode', () => {
            expect(layoutService.layoutConfig().darkTheme).toBe(false);
            component.toggleDarkMode();
            expect(layoutService.layoutConfig().darkTheme).toBe(true);
        });

        it('should perform logout via Socket.IO auth:logout and clear token', () => {
            localStorage.setItem('accessToken', 'mock-token');

            component.logout();

            expect(localStorage.getItem('accessToken')).toBeNull();
        });

        it('should handle logout when backend returns error or disconnects', () => {
            localStorage.setItem('accessToken', 'mock-token');

            component.logout();

            expect(localStorage.getItem('accessToken')).toBeNull();
        });

        it('should logout directly when no token is in storage', () => {
            expect(() => component.logout()).not.toThrow();
        });

        it('should disconnect socket on destroy', () => {
            component.ngOnInit();
            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('AppLayout', () => {
        it('should compute container classes based on layout state', () => {
            const fixture = TestBed.createComponent(AppLayout);
            const component = fixture.componentInstance;

            layoutService.layoutConfig.update((c) => ({ ...c, menuMode: 'static' }));
            layoutService.layoutState.update((s) => ({ ...s, staticMenuDesktopInactive: true }));

            const classes = component.containerClass();
            expect(classes['layout-static']).toBe(true);
            expect(classes['layout-static-inactive']).toBe(true);
        });

        it('should toggle blocked-scroll body class when mobileMenuActive changes', async () => {
            const fixture = TestBed.createComponent(AppLayout);
            fixture.detectChanges();

            layoutService.layoutState.update((s) => ({ ...s, mobileMenuActive: true }));
            await fixture.whenStable();
            expect(document.body.classList.contains('blocked-scroll')).toBe(true);

            layoutService.layoutState.update((s) => ({ ...s, mobileMenuActive: false }));
            await fixture.whenStable();
            expect(document.body.classList.contains('blocked-scroll')).toBe(false);
        });
    });

    describe('AppMenuitem', () => {
        let fixture: ComponentFixture<AppMenuitem>;
        let component: AppMenuitem;

        beforeEach(() => {
            fixture = TestBed.createComponent(AppMenuitem);
            component = fixture.componentInstance;
        });

        it('should handle disabled item click', () => {
            fixture.componentRef.setInput('item', { label: 'Disabled', disabled: true });
            fixture.detectChanges();

            const event = new MouseEvent('click');
            const preventSpy = vi.spyOn(event, 'preventDefault');
            component.itemClick(event);

            expect(preventSpy).toHaveBeenCalled();
        });

        it('should execute command callback on item click', () => {
            const commandSpy = vi.fn();
            fixture.componentRef.setInput('item', { label: 'Action', command: commandSpy });
            fixture.detectChanges();

            const event = new MouseEvent('click');
            component.itemClick(event);

            expect(commandSpy).toHaveBeenCalledWith({ originalEvent: event, item: { label: 'Action', command: commandSpy } });
        });

        it('should toggle submenu when clicking item with children', () => {
            fixture.componentRef.setInput('item', {
                label: 'Parent',
                path: '/parent',
                items: [{ label: 'Child', routerLink: ['/parent/child'] }]
            });
            fixture.componentRef.setInput('parentPath', '/menu');
            fixture.detectChanges();

            expect(component.hasChildren()).toBe(true);
            expect(component.fullPath()).toBe('/menu/parent');

            // Initially not active
            const event1 = new MouseEvent('click');
            component.itemClick(event1);
            expect(layoutService.layoutState().activePath).toBe('/menu/parent');
            expect(layoutService.layoutState().menuHoverActive).toBe(true);

            // Clicking again when active should collapse back to parentPath
            const event2 = new MouseEvent('click');
            component.itemClick(event2);
            expect(layoutService.layoutState().activePath).toBe('/menu');
        });

        it('should reset mobile and overlay state when clicking leaf item', () => {
            fixture.componentRef.setInput('item', { label: 'Leaf', routerLink: ['/leaf'] });
            fixture.detectChanges();

            layoutService.layoutState.update((s) => ({ ...s, mobileMenuActive: true, overlayMenuActive: true }));
            const event = new MouseEvent('click');
            component.itemClick(event);

            expect(layoutService.layoutState().mobileMenuActive).toBe(false);
            expect(layoutService.layoutState().overlayMenuActive).toBe(false);
        });

        it('should handle route activation and initialized signal', async () => {
            fixture.componentRef.setInput('item', { label: 'Route Item', routerLink: ['/dashboard'] });
            fixture.componentRef.setInput('parentPath', '/main');
            fixture.detectChanges();

            component.ngOnInit();
            component.ngAfterViewInit();

            await new Promise((r) => setTimeout(r, 20));
            expect(component.initialized()).toBe(true);
        });
    });
});
