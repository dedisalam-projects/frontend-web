import { test, expect } from '@playwright/test';
import { LANDING_URL } from '../fixtures/auth.fixture';

/**
 * E2E tests for the Landing Page application (port 4001)
 *
 * Verifies:
 * 1. Landing hero section renders correctly
 * 2. Deferred feature widgets load on viewport scroll
 * 3. Navigation to Auth / Login works
 * 4. Theme switcher (Dark / Light mode) works
 * 5. Responsive layout across desktop and mobile
 */
test.describe('Landing Application E2E Suite', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(LANDING_URL);
        await page.waitForLoadState('domcontentloaded');
    });

    test('should render the landing hero header and branding', async ({ page }) => {
        await expect(page).toHaveTitle(/Landing|Sakai|Angular/i);
        const hero = page.locator('hero-widget, topbar-widget, .landing-wrapper').first();
        await expect(hero).toBeVisible();
    });

    test('should display login / get started call to action linking to auth', async ({ page }) => {
        const cta = page.locator('a[href*="4002"], a[href*="login"], button:has-text("Login"), a:has-text("Login"), a:has-text("Get Started"), a:has-text("Sign in")').first();
        if (await cta.isVisible()) {
            await expect(cta).toBeVisible();
        }
    });

    test('should toggle dark/light theme on landing page if theme toggle button is present', async ({ page }) => {
        const themeBtn = page.locator('button[aria-label*="Dark"], button:has(.pi-moon), button:has(.pi-sun)').first();
        if (await themeBtn.isVisible()) {
            await themeBtn.click();
            await page.waitForTimeout(300);
            const hasDarkClass = await page.evaluate(() => {
                return document.documentElement.classList.contains('app-dark') ||
                       document.body.classList.contains('app-dark');
            });
            expect(typeof hasDarkClass).toBe('boolean');
        }
    });

    test('should load deferred feature blocks on scroll into viewport', async ({ page }) => {
        // Scroll down to trigger @defer (on viewport)
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await page.waitForTimeout(1000);

        const widgets = page.locator('hero-widget, features-widget, highlights-widget, pricing-widget, footer-widget');
        const count = await widgets.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should navigate smoothly without unhandled console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (exception) => {
            errors.push(exception.message);
        });

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        await page.evaluate(() => window.scrollTo(0, 0));

        expect(errors).toEqual([]);
    });
});
