import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { Landing } from './landing';
import { TopbarWidget } from './components/topbarwidget.component';
import { HeroWidget } from './components/herowidget';
import { FeaturesWidget } from './components/featureswidget';
import { HighlightsWidget } from './components/highlightswidget';
import { PricingWidget } from './components/pricingwidget';
import { FooterWidget } from './components/footerwidget';
import { routes } from '../../app.routes';

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

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TopbarWidget],
                providers: [provideRouter([]), providePrimeNG({ theme: { preset: Aura } })]
            }).compileComponents();

            fixture = TestBed.createComponent(TopbarWidget);
            component = fixture.componentInstance;
            router = TestBed.inject(Router);
            localStorage.clear();
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        });

        afterEach(() => {
            localStorage.clear();
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        });

        it('should create TopbarWidget and handle guest state', () => {
            fixture.detectChanges();
            expect(component).toBeTruthy();
            expect(component.currentUser()).toBeNull();
            expect(component.getUserInitials()).toBe('U');
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

        it('should handle corrupt json in localStorage user gracefully', () => {
            localStorage.setItem('user', '{ invalid json');
            component.checkAuth();
            expect(component.currentUser()).toBeNull();
        });

        it('should handle user with email only and default initials', () => {
            localStorage.setItem('user', JSON.stringify({ email: 'john@example.com' }));

            component.checkAuth();
            expect(component.currentUser()?.name).toBe('john');
            expect(component.getUserInitials()).toBe('J');
        });

        it('should clear user state when no user session or storage exists', () => {
            component.checkAuth();
            expect(component.currentUser()).toBeNull();
        });

        it('should perform logout and clear auth storage', async () => {
            localStorage.setItem('user', JSON.stringify({ email: 'test@test.com' }));
            document.cookie = 'user_session={"name":"test"}; path=/;';

            try {
                vi.spyOn(window.location, 'reload').mockImplementation(() => {});
            } catch {
                // Ignore if reload cannot be spied
            }

            await component.logout();
            expect(component.currentUser()).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
        });
    });

    describe('Landing Widgets', () => {
        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HeroWidget, FeaturesWidget, HighlightsWidget, PricingWidget, FooterWidget],
                providers: [provideRouter([]), providePrimeNG({ theme: { preset: Aura } })]
            }).compileComponents();
        });

        it('should create HeroWidget', () => {
            const fixture = TestBed.createComponent(HeroWidget);
            expect(fixture.componentInstance).toBeTruthy();
        });

        it('should create FeaturesWidget', () => {
            const fixture = TestBed.createComponent(FeaturesWidget);
            expect(fixture.componentInstance).toBeTruthy();
        });

        it('should create HighlightsWidget', () => {
            const fixture = TestBed.createComponent(HighlightsWidget);
            expect(fixture.componentInstance).toBeTruthy();
        });

        it('should create PricingWidget', () => {
            const fixture = TestBed.createComponent(PricingWidget);
            expect(fixture.componentInstance).toBeTruthy();
        });

        it('should create FooterWidget', () => {
            const fixture = TestBed.createComponent(FooterWidget);
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
