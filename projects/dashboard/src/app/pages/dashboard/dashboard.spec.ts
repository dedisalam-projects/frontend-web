import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { PLATFORM_ID } from '@angular/core';
import { LayoutService } from 'shared-ui';

import { Dashboard } from './dashboard';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { NotificationsWidget } from './components/notificationswidget';
import { Notfound } from '../notfound/notfound';
import { AppComponent } from '../../../app.component';
import { appRoutes } from '../../../app.routes';
import { ProductService } from '../service/product.service';

describe('Dashboard & Core Components Suite', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Dashboard, StatsWidget, RecentSalesWidget, BestSellingWidget, RevenueStreamWidget, NotificationsWidget, Notfound, AppComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), providePrimeNG({ theme: { preset: Aura } }), { provide: PLATFORM_ID, useValue: 'browser' }, LayoutService, ProductService]
        }).compileComponents();
    });

    it('should create AppComponent', () => {
        const fixture = TestBed.createComponent(AppComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should create Dashboard page', () => {
        const fixture = TestBed.createComponent(Dashboard);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should create StatsWidget', () => {
        const fixture = TestBed.createComponent(StatsWidget);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should create RecentSalesWidget and load products', async () => {
        const fixture = TestBed.createComponent(RecentSalesWidget);
        const component = fixture.componentInstance;
        component.ngOnInit();
        await fixture.whenStable();
        expect(component.products().length).toBeGreaterThan(0);
    });

    it('should create BestSellingWidget', () => {
        const fixture = TestBed.createComponent(BestSellingWidget);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should create RevenueStreamWidget and initialize chart', async () => {
        const fixture = TestBed.createComponent(RevenueStreamWidget);
        const component = fixture.componentInstance;
        component.initChart();
        expect(component.chartData()).toBeDefined();
        expect(component.chartData().labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);

        // Test server platform return
        component.platformId = 'server';
        component.chartData.set(null);
        component.initChart();
        expect(component.chartData()).toBeNull();

        // Test darkTheme effect trigger
        component.platformId = 'browser';
        const layout = TestBed.inject(LayoutService);
        layout.layoutConfig.update((c) => ({ ...c, darkTheme: true }));
        await new Promise((r) => setTimeout(r, 200));
        expect(component.chartData()).toBeDefined();
    });

    it('should create NotificationsWidget', () => {
        const fixture = TestBed.createComponent(NotificationsWidget);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should create Notfound page', () => {
        const fixture = TestBed.createComponent(Notfound);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should define dashboard routes correctly with auth guard and lazy components', async () => {
        expect(appRoutes.length).toBeGreaterThan(0);
        const rootRoute = appRoutes[0];
        expect(rootRoute.path).toBe('');
        expect(rootRoute.canActivate?.length).toBeGreaterThan(0);
        expect(rootRoute.children?.length).toBe(4);

        const dashboardChild = rootRoute.children?.find((c) => c.path === '');
        const usersChild = rootRoute.children?.find((c) => c.path === 'users');

        if (dashboardChild?.loadComponent) {
            const comp = await (dashboardChild.loadComponent as any)();
            expect(comp).toBeTruthy();
        }
        if (usersChild?.loadComponent) {
            const comp = await (usersChild.loadComponent as any)();
            expect(comp).toBeTruthy();
        }
    });
});
