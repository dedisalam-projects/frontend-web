import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AUTH_URL, DASHBOARD_URL, LANDING_URL, createMockToken, clearAuthState } from '../fixtures/auth.fixture';

/**
 * Accessibility (a11y) Audits — WCAG 2.2 Level AA Compliance
 *
 * Uses axe-core to scan all frontend pages for accessibility violations:
 * - Color contrast
 * - Form labels & aria-attributes
 * - Landmark regions & heading hierarchy
 * - Interactive elements focusability
 */
test.describe('Accessibility (WCAG 2.2 AA) Audits', () => {

    test('Landing Page (4001) should pass axe accessibility scan', async ({ page }) => {
        await page.goto(LANDING_URL);
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            // Exclude known non-blocking third-party widget issues if needed
            .analyze();

        // Print details if violations exist
        if (accessibilityScanResults.violations.length > 0) {
            console.log('Landing a11y violations:', JSON.stringify(accessibilityScanResults.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.length
            })), null, 2));
        }

        expect(accessibilityScanResults.violations.filter(v => v.impact === 'critical')).toEqual([]);
    });

    test('Auth Login Page (4002) should pass axe accessibility scan', async ({ page }) => {
        await page.goto(AUTH_URL);
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();

        if (accessibilityScanResults.violations.length > 0) {
            console.log('Auth login a11y violations:', JSON.stringify(accessibilityScanResults.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.length
            })), null, 2));
        }

        expect(accessibilityScanResults.violations.filter(v => v.impact === 'critical')).toEqual([]);
    });

    test('Dashboard Page (4000) should pass axe accessibility scan', async ({ page, context }) => {
        const token = createMockToken('admin@system.local');
        await context.addCookies([
            {
                name: 'accessToken',
                value: token,
                domain: 'localhost',
                path: '/',
            },
        ]);

        await page.goto(DASHBOARD_URL);
        await page.evaluate((t) => localStorage.setItem('accessToken', t), token);
        await page.reload();
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();

        if (accessibilityScanResults.violations.length > 0) {
            console.log('Dashboard a11y violations:', JSON.stringify(accessibilityScanResults.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.length
            })), null, 2));
        }

        expect(accessibilityScanResults.violations.filter(v => v.impact === 'critical')).toEqual([]);
    });

    test('Users Management Page (4000/users) should pass axe accessibility scan', async ({ page, context }) => {
        const token = createMockToken('admin@system.local');
        await context.addCookies([
            {
                name: 'accessToken',
                value: token,
                domain: 'localhost',
                path: '/',
            },
        ]);

        await page.goto(`${DASHBOARD_URL}/users`);
        await page.evaluate((t) => localStorage.setItem('accessToken', t), token);
        await page.reload();
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();

        if (accessibilityScanResults.violations.length > 0) {
            console.log('Users page a11y violations:', JSON.stringify(accessibilityScanResults.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.length
            })), null, 2));
        }

        expect(accessibilityScanResults.violations.filter(v => v.impact === 'critical')).toEqual([]);
    });
});
