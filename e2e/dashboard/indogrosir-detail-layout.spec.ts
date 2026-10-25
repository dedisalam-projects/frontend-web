import { test, expect } from '@playwright/test';
import { DASHBOARD_URL, createMockToken, injectAuthToken } from '../fixtures/auth.fixture';

/**
 * D-21 Golden Contract Test Vectors: Indogrosir Detail Layout Standardization
 * Blueprint: D-06-SPEC-FE-LAYOUT-001
 * Target Module: /indogrosir/:code (Indogrosir Branch Detail Profile)
 */

test.describe('D-21 Golden Contract: Indogrosir Detail Layout Standardization E2E', () => {
    test.beforeEach(async ({ context }) => {
        const token = createMockToken({ sub: 'admin@dedisalam.my.id', role: 'admin' });
        await injectAuthToken(context, token, DASHBOARD_URL);
    });

    test('[TV-LAYOUT-01] Eliminasi Card-in-Card: Single Surface with Semantic Dividers', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/indogrosir`);
        await page.waitForLoadState('domcontentloaded');

        // Navigate to first branch detail
        const viewDetailButton = page.locator('button[label="Lihat Detail"], a:has-text("Detail")').first();
        if (await viewDetailButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await viewDetailButton.click();
            await page.waitForLoadState('domcontentloaded');
        } else {
            // Direct route fallback to test branch code
            await page.goto(`${DASHBOARD_URL}/indogrosir/CPG`);
            await page.waitForLoadState('domcontentloaded');
        }

        // 1. Verify Operational Info Container uses semantic grid dividers without nested cards
        const operationalGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-3');
        await expect(operationalGrid).toBeVisible({ timeout: 10000 });
        await expect(operationalGrid).toHaveClass(/divide-y/);
        await expect(operationalGrid).toHaveClass(/md:divide-x/);

        // 2. Verify no nested rounded-xl bordered boxes inside operational info container
        const nestedBoxes = operationalGrid.locator('.rounded-xl.border');
        await expect(nestedBoxes).toHaveCount(0);
    });

    test('[TV-LAYOUT-02] WCAG 2.1 AA Contrast: Hero Storefront Banner Multi-stop Gradient Scrim', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/indogrosir/CPG`);
        await page.waitForLoadState('domcontentloaded');

        // Scrim gradient overlay check
        const scrim = page.locator('.bg-gradient-to-t.from-surface-950');
        await expect(scrim).toBeVisible({ timeout: 10000 });
        await expect(scrim).toHaveClass(/via-surface-950\/75/);
        await expect(scrim).toHaveClass(/to-surface-950\/20/);

        // Header title contrast & style check
        const title = page.locator('h2.text-white');
        await expect(title).toBeVisible();
        await expect(title).toHaveClass(/drop-shadow-sm/);

        // Secondary text high contrast
        const subtitle = page.locator('.text-surface-200');
        await expect(subtitle).toBeVisible();

        // Dark frosted badge for store code
        const codeBadge = page.locator('span:has-text("Kode:")');
        await expect(codeBadge).toHaveClass(/bg-surface-900\/90/);
        await expect(codeBadge).toHaveClass(/text-surface-0/);
    });

    test('[TV-LAYOUT-03] Tipografi & Icon Semantic Tokens: Zero Arbitrary Colors', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/indogrosir/CPG`);
        await page.waitForLoadState('domcontentloaded');

        // Icons in operational sections must strictly use text-primary
        const markerIcon = page.locator('.pi-map-marker.text-primary');
        await expect(markerIcon).toBeVisible({ timeout: 10000 });

        const phoneIcon = page.locator('.pi-phone.text-primary');
        await expect(phoneIcon).toBeVisible();

        const globeIcon = page.locator('.pi-globe.text-primary');
        await expect(globeIcon).toBeVisible();

        // Verify zero arbitrary text-indigo-500
        const indigoElements = page.locator('.text-indigo-500');
        await expect(indigoElements).toHaveCount(0);
    });

    test('[TV-LAYOUT-04] Deduplikasi Data Geografis: Single Canonical Data Rendering', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/indogrosir/CPG`);
        await page.waitForLoadState('domcontentloaded');

        // Kota renders in header metadata
        const heroHeader = page.locator('.absolute.bottom-0');
        await expect(heroHeader.locator('.pi-map-marker')).toBeVisible({ timeout: 10000 });

        // Operational grid section 3 renders Island Name exclusively
        const geoSection = page.locator('.grid.grid-cols-1.md\\:grid-cols-3 > div').nth(2);
        await expect(geoSection).toContainText('Wilayah Kepulauan:');
    });

    test('[TV-LAYOUT-05] Zero Custom CSS & Zero Inline Styles', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/indogrosir/CPG`);
        await page.waitForLoadState('domcontentloaded');

        // Ensure zero inline style attributes on indogrosir-detail elements
        const inlineStyles = page.locator('app-indogrosir-detail [style]');
        await expect(inlineStyles).toHaveCount(0);
    });
});
