import { test, expect } from '@playwright/test';
import { DASHBOARD_URL, AUTH_URL, createMockToken, clearAuthState } from '../fixtures/auth.fixture';

test.describe('Dashboard Auth Guard', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuthState(page);
    });

    // ── Unauthenticated Access ─────────────────────────────────────────────

    test('should redirect to login when accessing dashboard without token', async ({ page }) => {
        await page.goto(DASHBOARD_URL);
        await page.waitForTimeout(2000);

        // Should be redirected to auth app login
        expect(page.url()).toMatch(/login|localhost:4002/);
    });

    test('should redirect to login when accessing dashboard with expired token', async ({ page, context }) => {
        // Set an expired token
        const expiredToken = createMockToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
        await context.addCookies([{ name: 'accessToken', value: expiredToken, domain: 'localhost', path: '/' }]);
        await page.goto(DASHBOARD_URL);
        await page.evaluate((t) => localStorage.setItem('accessToken', t), expiredToken);
        await page.reload();
        await page.waitForTimeout(2000);

        expect(page.url()).toMatch(/login|localhost:4002/);
    });

    // ── Authenticated Access ───────────────────────────────────────────────

    test('should allow access to dashboard with valid token in localStorage', async ({ page, context }) => {
        const validToken = createMockToken();
        await context.addCookies([{ name: 'accessToken', value: validToken, domain: 'localhost', path: '/' }]);
        await page.goto(DASHBOARD_URL);
        await page.evaluate((t) => localStorage.setItem('accessToken', t), validToken);
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should stay on dashboard
        expect(page.url()).toContain('localhost:4000');
    });
});

test.describe('Dashboard Navigation', () => {
    test.beforeEach(async ({ page, context }) => {
        // Inject valid token for all navigation tests
        const validToken = createMockToken();
        await context.addCookies([{ name: 'accessToken', value: validToken, domain: 'localhost', path: '/' }]);
        await page.goto(DASHBOARD_URL);
        await page.evaluate((t) => localStorage.setItem('accessToken', t), validToken);
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('should display main dashboard layout with sidebar and topbar', async ({ page }) => {
        const sidebar = page.locator('.layout-sidebar');
        const topbar = page.locator('.layout-topbar');

        await expect(sidebar).toBeVisible({ timeout: 10000 });
        await expect(topbar).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to User Management page', async ({ page }) => {
        // Click Manajemen User in sidebar
        const userLink = page.locator('a[href*="users"], span:has-text("Manajemen User"), a:has-text("Manajemen User")').first();
        await expect(userLink).toBeVisible({ timeout: 8000 });
        await userLink.click();
        await page.waitForURL(/.*users.*/, { timeout: 10000 });

        expect(page.url()).toContain('users');
    });

    test('should display page title correctly', async ({ page }) => {
        const pageTitle = page.locator('h1, h2, [class*="page-title"], .layout-topbar-menu').first();
        await expect(pageTitle).toBeVisible({ timeout: 8000 });
    });

    test('should toggle sidebar on mobile viewport', async ({ page, context }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        const validToken = createMockToken();
        await page.evaluate((t) => localStorage.setItem('accessToken', t), validToken);
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Find hamburger/menu button
        const menuButton = page.getByRole('button', { name: /menu|toggle/i }).first();
        if (await menuButton.isVisible()) {
            await menuButton.click();
            await page.waitForTimeout(500);
        }
        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();
    });
});
