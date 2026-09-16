import { test, expect, Page } from '@playwright/test';

const AUTH_URL = 'http://localhost:4002';
const DASHBOARD_URL = 'http://localhost:4000';

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

test.describe('Generated: Dashboard Discovered Routes & Views', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('should navigate to Root Dashboard (/) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to users (/users) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/users`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should perform full-cycle create user mutation on /users', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/users`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const newBtn = page.locator('button:has-text("New"), p-button[label="New"], button:has(.pi-plus)').first();
        await expect(newBtn).toBeVisible({ timeout: 10000 });
        await newBtn.click();

        const nameField = page.locator('#name');
        await expect(nameField).toBeVisible({ timeout: 10000 });

        const timestamp = Date.now();
        const testName = `Gen User ${timestamp}`;
        const testEmail = `gen.user.${timestamp}@example.com`;

        await nameField.fill(testName);
        await page.locator('#email').fill(testEmail);

        const passField = page.locator('#password input, input#password');
        if (await passField.isVisible()) {
            await passField.fill('Password123!');
        }

        const saveBtn = page.locator('.p-dialog button:has-text("Save"), p-button[label="Save"] button').first();
        await expect(saveBtn).toBeVisible({ timeout: 5000 });
        await saveBtn.click();

        // Hard assertion: Dialog must dismiss
        await expect(nameField).toBeHidden({ timeout: 10000 });

        // Hard assertion: Created user must appear in the datatable
        const createdRow = page.locator(`tbody tr:has-text("${testName}")`).first();
        await expect(createdRow).toBeVisible({ timeout: 10000 });

        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/documentation (/archive/documentation) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/documentation`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/crud (/archive/crud) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/crud`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/empty (/archive/empty) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/empty`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/button (/archive/uikit/button) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/button`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/charts (/archive/uikit/charts) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/charts`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/table (/archive/uikit/table) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/table`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/formlayout (/archive/uikit/formlayout) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/formlayout`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/input (/archive/uikit/input) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/input`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/list (/archive/uikit/list) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/list`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/message (/archive/uikit/message) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/message`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/panel (/archive/uikit/panel) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/panel`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    test('should navigate to archive/uikit/overlay (/archive/uikit/overlay) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(`${DASHBOARD_URL}/archive/uikit/overlay`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });
});
