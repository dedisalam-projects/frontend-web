import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { PLATFORM_ID, Injector, runInInjectionContext } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Landing } from './landing';
import { TopbarWidget } from './components/topbarwidget.component';
import { HeroWidget } from './components/herowidget';
import { FeaturesWidget } from './components/featureswidget';
import { HighlightsWidget } from './components/highlightswidget';
import { PricingWidget } from './components/pricingwidget';
import { FooterWidget } from './components/footerwidget';
import { routes } from '../../app.routes';
import { environment } from '../../../environments/environment';

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => ({
        on: vi.fn(),
        disconnect: vi.fn(),
        emit: vi.fn((event: string, data: any, cb?: Function) => {
            if (typeof cb === 'function') cb({ success: true });
        })
    }))
}));

describe('Landing Page & Widgets Suite', () => {
    beforeAll(() => {
        class MockIntersectionObserver {
            observe = vi.fn((callback) => {});
            unobserve = vi.fn();
            disconnect = vi.fn();
        }
        Object.defineProperty(window, 'IntersectionObserver', {
            writable: true,
            configurable: true,
            value: MockIntersectionObserver
        });
    });

    describe('Landing Component', () => {
        let component: Landing;
        let fixture: ComponentFixture<Landing>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [Landing],
                providers: [provideRouter([]), providePrimeNG({ theme: { preset: Aura } })]
            }).compileComponents();

            fixture = TestBed.createComponent(Landing);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create Landing component', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('TopbarWidget Component', () => {
        let component: TopbarWidget;
        let fixture: ComponentFixture<TopbarWidget>;
        let router: Router;
        let mockReload: ReturnType<typeof vi.fn>;
        let mockDoc: any;

        beforeEach(async () => {
            mockReload = vi.fn();
            mockDoc = new Proxy(document, {
                get(target: any, prop: string | symbol) {
                    if (prop === 'defaultView') return { location: { reload: mockReload } };
                    const val = target[prop];
                    return typeof val === 'function' ? val.bind(target) : val;
                }
            });

            await TestBed.configureTestingModule({
                imports: [TopbarWidget],
                providers: [
                    provideRouter([]),
                    providePrimeNG({ theme: { preset: Aura } }),
                    { provide: PLATFORM_ID, useValue: 'browser' },
                    { provide: DOCUMENT, useValue: mockDoc }
                ]
            }).compileComponents();

            fixture = TestBed.createComponent(TopbarWidget);
            component = fixture.componentInstance;
            router = TestBed.inject(Router);
            localStorage.clear();
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        });

        afterEach(() => {
            vi.restoreAllMocks();
            vi.unstubAllGlobals();
            localStorage.clear();
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        });

        it('should have correct auth URLs configured', () => {
            expect(component.dashboardUrl).toBe(environment.appUrls.dashboard);
            expect(component.loginUrl).toBe(`${environment.appUrls.auth}/login`);
            expect(component.registerUrl).toBe(`${environment.appUrls.auth}/auth/register`);
        });

        it('should create TopbarWidget and handle guest state', () => {
            fixture.detectChanges();
            expect(component).toBeTruthy();
            expect(component.currentUser()).toBeNull();
            expect(component.getUserInitials()).toBe('U');
        });

        it('should populate auth on ngOnInit', () => {
            document.cookie = `user_session=${encodeURIComponent(JSON.stringify({ name: 'OnInitUser' }))}; path=/;`;
            component.ngOnInit();
            expect(component.currentUser()?.name).toBe('OnInitUser');
        });

        it('should detect user in localStorage and populate user profile', () => {
            const userData = { name: 'Dedi', email: 'dedi@example.com', role: 'admin' };
            localStorage.setItem('user', JSON.stringify(userData));

            component.checkAuth();
            fixture.detectChanges();

            expect(component.currentUser()?.name).toBe('Dedi');
            expect(component.currentUser()?.email).toBe('dedi@example.com');
            expect(component.getUserInitials()).toBe('D');
            const el = fixture.nativeElement as HTMLElement;
            expect(el.textContent).toContain('Dedi');
        });

        it('should detect user_session cookie and populate user profile', () => {
            const sessionData = { name: 'Dedi Cookie', email: 'cookie@example.com', role: 'admin' };
            document.cookie = `user_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/;`;

            component.checkAuth();
            fixture.detectChanges();

            expect(component.currentUser()?.name).toBe('Dedi Cookie');
            expect(component.currentUser()?.email).toBe('cookie@example.com');
            expect(component.getUserInitials()).toBe('D');
            const el = fixture.nativeElement as HTMLElement;
            expect(el.textContent).toContain('Dedi Cookie');
        });

        it('should extract email prefix when user_session has email but no name', () => {
            document.cookie = `user_session=${encodeURIComponent(JSON.stringify({ email: 'prefix@example.com' }))}; path=/;`;
            component.checkAuth();
            expect(component.currentUser()?.name).toBe('prefix');
            expect(component.getUserInitials()).toBe('P');
        });

        it('should fallback to U initials when currentUser has empty name and email', () => {
            component.currentUser.set({ name: '', email: '' });
            expect(component.getUserInitials()).toBe('U');
        });

        it('should fallback to User when user object has no name or email in cookie or localStorage', () => {
            document.cookie = `user_session=${encodeURIComponent(JSON.stringify({}))}; path=/;`;
            component.checkAuth();
            expect(component.currentUser()?.name).toBe('User');
            expect(component.getUserInitials()).toBe('U');

            document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            localStorage.setItem('user', JSON.stringify({}));
            component.checkAuth();
            expect(component.currentUser()?.name).toBe('User');
        });

        it('should fallback to currentUser key in localStorage if user key is missing', () => {
            localStorage.removeItem('user');
            localStorage.setItem('currentUser', JSON.stringify({ name: 'FallbackUser' }));
            component.checkAuth();
            expect(component.currentUser()?.name).toBe('FallbackUser');
        });

        it('should handle corrupt json in localStorage user gracefully', () => {
            localStorage.setItem('user', '{ invalid json');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            component.checkAuth();
            expect(component.currentUser()).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Error decoding user profile from localStorage', expect.any(Error));
        });

        it('should handle user with email only and default initials', () => {
            localStorage.setItem('user', JSON.stringify({ email: 'john@example.com' }));

            component.checkAuth();
            expect(component.currentUser()?.name).toBe('john');
            expect(component.getUserInitials()).toBe('J');
        });

        it('should clear user state when no user session or storage exists without logging errors', () => {
            component.currentUser.set({ name: 'OldUser' });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            component.checkAuth();
            expect(component.currentUser()).toBeNull();
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it('should perform logout with exact fetch parameters and reload', async () => {
            localStorage.setItem('user', JSON.stringify({ email: 'test@test.com' }));
            localStorage.setItem('currentUser', JSON.stringify({ email: 'test@test.com' }));
            document.cookie = 'user_session={"name":"test"}; path=/;';

            const mockFetch = vi.fn().mockResolvedValue({});
            vi.stubGlobal('fetch', mockFetch);
            const cookieSpy = vi.spyOn(document, 'cookie', 'set');
            component.currentUser.set({ name: 'ActiveLoggedInUser' });

            await component.logout();
            expect(component.currentUser()).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
            expect(localStorage.getItem('currentUser')).toBeNull();
            expect(mockFetch).toHaveBeenCalledWith(
                `${environment.apiUrl}/auth/logout`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            expect(mockReload).toHaveBeenCalled();
            expect(cookieSpy).toHaveBeenCalledTimes(2);
            expect(cookieSpy.mock.calls[0][0]).toBe('user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
            expect(cookieSpy.mock.calls[0][0]).not.toContain('Stryker was here!');
            expect(cookieSpy.mock.calls[1][0]).toBe('user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;');
        });

        it('should ignore fetch errors during logout and still clear and reload', async () => {
            const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
            vi.stubGlobal('fetch', mockFetch);
            await expect(component.logout()).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalled();
            expect(mockReload).toHaveBeenCalled();
        });

        it('should handle corrupt json in user_session cookie gracefully', () => {
            document.cookie = `user_session=${encodeURIComponent('{ invalid json')}; path=/;`;
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            component.checkAuth();
            expect(component.currentUser()).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Error decoding user_session cookie', expect.any(Error));
        });

        it('should return early in checkAuth if on server (SSR)', () => {
            (component as any).platformId = 'server';
            document.cookie = `user_session=${encodeURIComponent(JSON.stringify({ name: 'SSR' }))}; path=/;`;
            component.checkAuth();
            expect(component.currentUser()).toBeNull();
        });

        it('should use cookieDomain in logout if environment has it set', async () => {
            const origDomain = environment.cookieDomain;
            environment.cookieDomain = 'example.com';
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}));
            const cookieSpy = vi.spyOn(document, 'cookie', 'set');
            
            await component.logout();
            
            expect(cookieSpy).toHaveBeenCalledWith('user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;; domain=example.com');
            environment.cookieDomain = origDomain;
        });

        it('should handle null document safely without throwing in checkAuth and logout', async () => {
            (component as any).document = null;
            expect(() => component.checkAuth()).not.toThrow();
            await expect(component.logout()).resolves.not.toThrow();
            expect((component as any).getCookie('user_session')).toBeNull();
        });

        it('should return null in getCookie when document.cookie is undefined', () => {
            (component as any).document = { cookie: undefined };
            expect((component as any).getCookie('user_session')).toBeNull();
        });

        it('should instantiate TopbarWidget when DOCUMENT provider is omitted from injector', () => {
            const isolatedInjector = Injector.create({
                providers: [
                    { provide: PLATFORM_ID, useValue: 'browser' }
                ]
            });
            expect(() => runInInjectionContext(isolatedInjector, () => new TopbarWidget(TestBed.inject(Router)))).not.toThrow();
        });

        it('should handle logout when defaultView is undefined without error', async () => {
            (component as any).document = { defaultView: undefined, cookie: '' };
            await expect(component.logout()).resolves.not.toThrow();
        });
    });

    describe('Landing Widgets', () => {
        beforeEach(async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [HeroWidget, FeaturesWidget, HighlightsWidget, PricingWidget, FooterWidget],
                providers: [provideRouter([]), providePrimeNG({ theme: { preset: Aura } })]
            }).compileComponents();
        });

        it('should create HeroWidget', () => {
            const fixture = TestBed.createComponent(HeroWidget);
            fixture.detectChanges();
            expect(fixture.componentInstance).toBeTruthy();
        });

        it('should create FeaturesWidget', () => {
            const fixture = TestBed.createComponent(FeaturesWidget);
            fixture.detectChanges();
            expect(fixture.componentInstance).toBeTruthy();
        });

        it('should create HighlightsWidget', () => {
            const fixture = TestBed.createComponent(HighlightsWidget);
            fixture.detectChanges();
            expect(fixture.componentInstance).toBeTruthy();
        });

        it('should create PricingWidget', () => {
            const fixture = TestBed.createComponent(PricingWidget);
            fixture.detectChanges();
            expect(fixture.componentInstance).toBeTruthy();
        });

        it('should create FooterWidget', () => {
            const fixture = TestBed.createComponent(FooterWidget);
            fixture.detectChanges();
            expect(fixture.componentInstance).toBeTruthy();
        });
    });

    describe('Landing Routes', () => {
        it('should define root route to Landing', () => {
            expect(routes.length).toBeGreaterThan(0);
            expect(routes[0].path).toBe('');
        });
    });
});
