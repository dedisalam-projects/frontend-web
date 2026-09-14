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
        });

        afterEach(() => {
            localStorage.clear();
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        });

        it('should create TopbarWidget and handle guest state', () => {
            fixture.detectChanges();
            expect(component).toBeTruthy();
            expect(component.currentUser()).toBeNull();
            expect(component.getUserInitials()).toBe('U');
        });

        it('should detect valid token and populate user profile', () => {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const token = `header.${btoa(JSON.stringify({ name: 'Dedi', email: 'dedi@example.com', role: 'admin', exp }))}.sig`;
            localStorage.setItem('accessToken', token);

            component.checkAuth();
            fixture.detectChanges();

            expect(component.currentUser()?.name).toBe('Dedi');
            expect(component.currentUser()?.email).toBe('dedi@example.com');
            expect(component.getUserInitials()).toBe('D');
            const el = fixture.nativeElement as HTMLElement;
            expect(el.textContent).toContain('Dedi');
        });

        it('should handle error when decoding valid token payload fails', () => {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const token = `header.${btoa(JSON.stringify({ name: 'Dedi', exp }))}.sig`;
            localStorage.setItem('accessToken', token);

            const parseSpy = vi
                .spyOn(JSON, 'parse')
                .mockImplementationOnce(() => ({ exp }))
                .mockImplementationOnce(() => {
                    throw new Error('Corrupt payload');
                });

            component.checkAuth();
            expect(component.currentUser()).toBeNull();
            parseSpy.mockRestore();
        });

        it('should handle token with email only and default initials', () => {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const token = `header.${btoa(JSON.stringify({ email: 'john@example.com', exp }))}.sig`;
            localStorage.setItem('accessToken', token);

            component.checkAuth();
            expect(component.currentUser()?.name).toBe('john');
            expect(component.getUserInitials()).toBe('J');
        });

        it('should handle malformed token gracefully', () => {
            localStorage.setItem('accessToken', 'invalid-jwt-format');
            component.checkAuth();
            expect(component.currentUser()).toBeNull();
        });

        it('should clear token and user state when token is expired', () => {
            const exp = Math.floor(Date.now() / 1000) - 3600;
            const token = `header.${btoa(JSON.stringify({ email: 'expired@test.com', exp }))}.sig`;
            localStorage.setItem('accessToken', token);

            component.checkAuth();
            expect(component.currentUser()).toBeNull();
            expect(localStorage.getItem('accessToken')).toBeNull();
        });

        it('should perform logout and clear auth storage', async () => {
            const reloadMock = vi.fn();
            const originalLocation = window.location;
            const mockLocation = { reload: reloadMock } as any;
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true,
                configurable: true
            });

            const exp = Math.floor(Date.now() / 1000) + 3600;
            const token = `header.${btoa(JSON.stringify({ email: 'test@test.com', exp }))}.sig`;
            localStorage.setItem('accessToken', token);

            component.logout();
            expect(component.currentUser()).toBeNull();
            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(reloadMock).toHaveBeenCalled();

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
                configurable: true
            });
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
