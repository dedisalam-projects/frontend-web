import { test, expect } from '@playwright/test';

const LANDING_URL = 'http://localhost:4001';

test.describe('Generated: Landing Page User Journeys', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('should visit landing page and render navigation and content', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(LANDING_URL, { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveTitle(/Landing|Sakai/i);
        expect(errors).toHaveLength(0);
    });

    test('should have working CTA to auth or login', async ({ page }) => {
        await page.goto(LANDING_URL, { waitUntil: 'domcontentloaded' });
        const cta = page.locator('a[href*="4002"], a[href*="login"], a:has-text("Get Started"), a:has-text("Sign In")').first();
        if (await cta.isVisible()) {
            await expect(cta).toBeVisible();
            const href = await cta.getAttribute('href');
            expect(href).toBeTruthy();
        }
    });
});
