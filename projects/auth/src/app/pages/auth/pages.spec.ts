import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { Access } from './access';
import { Error } from './error';
import { routes } from '../../app.routes';
import authRoutes from './auth.routes';

describe('Auth Pages & Routes', () => {
    describe('Access Component', () => {
        let component: Access;
        let fixture: ComponentFixture<Access>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [Access],
                providers: [provideRouter([]), providePrimeNG({ theme: { preset: Aura } })]
            }).compileComponents();

            fixture = TestBed.createComponent(Access);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create Access component', () => {
            expect(component).toBeTruthy();
            const el = fixture.nativeElement as HTMLElement;
            expect(el.querySelector('h1')?.textContent).toContain('Access Denied');
        });
    });

    describe('Error Component', () => {
        let component: Error;
        let fixture: ComponentFixture<Error>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [Error],
                providers: [provideRouter([]), providePrimeNG({ theme: { preset: Aura } })]
            }).compileComponents();

            fixture = TestBed.createComponent(Error);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create Error component', () => {
            expect(component).toBeTruthy();
            const el = fixture.nativeElement as HTMLElement;
            expect(el.querySelector('h1')?.textContent).toContain('Error Occured');
        });
    });

    describe('Routes Configuration', () => {
        it('should define app routes with redirect to login', async () => {
            expect(routes.length).toBe(2);
            expect(routes[1].redirectTo).toBe('auth/login');

            const loaded = await (routes[0].loadChildren as any)();
            expect(loaded).toBeTruthy();
        });

        it('should define auth child routes', () => {
            expect(authRoutes.length).toBe(3);
            const loginRoute = authRoutes.find((r) => r.path === 'login');
            expect(loginRoute).toBeTruthy();
            expect(loginRoute?.canActivate?.length).toBeGreaterThan(0);
        });
    });
});
