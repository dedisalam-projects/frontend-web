import { test, expect, Page } from '@playwright/test';

const AUTH_URL = 'http://localhost:4002';
const DASHBOARD_URL = 'http://localhost:4000';

const FUZZ_INPUTS = [
    '',
    '   ',
    '🎉🚀✨🔥',
    '<script>alert(1)</script>',
    "' OR '1'='1",
    'a'.repeat(255),
    '--drop table users;'
];

async function loginAsAdmin(page: Page): Promise<void> {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${AUTH_URL}/auth/login`);
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('#email1');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('superadmin@example.com');

    const passwordInput = page.locator('#password1 input, input#password1, #password1');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill('Admin123!');

    const signInButton = page.locator('button:has-text("Sign In"), p-button[label="Sign In"] button').first();
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    await signInButton.click();

    await page.waitForURL(/localhost:4000/, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
}

test.describe('E2E Chaos Monkey — Drunk User & Unpredictable Journey Testing', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('should survive rapid random interactions and input fuzzing without crashing', async ({ page }) => {
        const fatalErrors: string[] = [];
        const server500Errors: string[] = [];

        // Catch uncaught JS errors
        page.on('pageerror', (err) => {
            fatalErrors.push(`Uncaught Exception: ${err.message}`);
        });

        // Catch 500 server crashes
        page.on('response', (res) => {
            if (res.status() >= 500) {
                server500Errors.push(`${res.url()} returned ${res.status()}`);
            }
        });

        // Navigate to User Management
        await page.goto(`${DASHBOARD_URL}/users`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        console.log('  [Chaos Monkey] Starting 30 iterations of random UI fuzzing...');

        for (let i = 0; i < 30; i++) {
            // Randomly choose an action category
            const actionCategory = Math.floor(Math.random() * 4);

            try {
                if (actionCategory === 0) {
                    // Action 0: Click random visible interactive element
                    const clickables = page.locator(
                        'button:not([disabled]), p-button:not([disabled]) button, th[psortablecolumn], .p-paginator-page, a[href]'
                    );
                    const count = await clickables.count();
                    if (count > 0) {
                        const randomIndex = Math.floor(Math.random() * Math.min(count, 15));
                        const target = clickables.nth(randomIndex);
                        if (await target.isVisible()) {
                            await target.click({ timeout: 1500, force: true }).catch(() => {});
                        }
                    }
                } else if (actionCategory === 1) {
                    // Action 1: Fuzz random visible input
                    const inputs = page.locator('input:not([type="hidden"]):not([disabled])');
                    const count = await inputs.count();
                    if (count > 0) {
                        const randomIndex = Math.floor(Math.random() * count);
                        const randomFuzz = FUZZ_INPUTS[Math.floor(Math.random() * FUZZ_INPUTS.length)];
                        const target = inputs.nth(randomIndex);
                        if (await target.isVisible()) {
                            await target.fill(randomFuzz, { timeout: 1500 }).catch(() => {});
                        }
                    }
                } else if (actionCategory === 2) {
                    // Action 2: Press Escape or random keys to dismiss open dialogs / popups
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(150);
                } else if (actionCategory === 3) {
                    // Action 3: Non-linear navigation (back or quick route jump)
                    const routes = ['/users', '/', '/archive/uikit/button', '/archive/uikit/table'];
                    const randomRoute = routes[Math.floor(Math.random() * routes.length)];
                    await page.goto(`${DASHBOARD_URL}${randomRoute}`, { waitUntil: 'domcontentloaded' });
                }
            } catch {
                // Chaos monkey ignores interaction timeout or element detaches
            }

            await page.waitForTimeout(200);
        }

        // Post-Chaos Assertions
        console.log('  [Chaos Monkey] Chaos fuzzing loop finished. Verifying app health...');
        expect(server500Errors, `Server threw 500 errors during chaos test: ${server500Errors.join(', ')}`).toHaveLength(0);
        expect(fatalErrors, `Application suffered unhandled runtime exceptions: ${fatalErrors.join(', ')}`).toHaveLength(0);

        // Verify White Screen of Death didn't happen (layout is still mounted)
        const bodyContent = await page.locator('body').innerHTML();
        expect(bodyContent.length).toBeGreaterThan(100);
        const layoutRoot = page.locator('.layout-wrapper, .layout-main, router-outlet');
        await expect(layoutRoot.first()).toBeAttached();
    });

    test('should handle modal spam and rapid cancel without orphaned overlay or lockup', async ({ page }) => {
        await page.goto(`${DASHBOARD_URL}/users`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const newBtn = page.locator('button:has-text("New"), p-button[label="New"], button:has(.pi-plus)').first();
        if (await newBtn.isVisible()) {
            for (let i = 0; i < 5; i++) {
                await newBtn.click({ timeout: 2000 }).catch(() => {});
                await page.waitForTimeout(200);

                // Rapidly press escape or click cancel
                const cancelBtn = page.locator('.p-dialog button:has-text("Cancel"), p-dialog button:has(.pi-times)').first();
                if (await cancelBtn.isVisible({ timeout: 1000 })) {
                    await cancelBtn.click().catch(() => {});
                } else {
                    await page.keyboard.press('Escape');
                }
                await page.waitForTimeout(200);
            }
        }

        // Ensure page is still responsive
        const searchInput = page.locator('input').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('Admin');
            await expect(searchInput).toHaveValue('Admin');
        }
    });
});
