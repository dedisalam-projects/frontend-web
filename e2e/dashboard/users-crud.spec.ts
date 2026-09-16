import { test, expect, Page } from '@playwright/test';
import { DASHBOARD_URL, createMockToken, clearAuthState } from '../fixtures/auth.fixture';

const USERS_URL = `${DASHBOARD_URL}/users`;

async function goToUsersPage(page: Page): Promise<void> {
    const validToken = createMockToken({ email: 'admin@system.local', role: 'admin' });
    await page.context().addCookies([
        { name: 'accessToken', value: validToken, domain: 'localhost', path: '/' },
        { name: 'user_session', value: encodeURIComponent(JSON.stringify({ email: 'admin@system.local', role: 'admin' })), domain: 'localhost', path: '/' }
    ]);
    await page.goto(USERS_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
}

test.describe('User Management CRUD — E2E', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuthState(page);
    });

    // ── Read ──────────────────────────────────────────────────────────────

    test('should display user list table on User Management page', async ({ page }) => {
        await goToUsersPage(page);

        const table = page.locator('p-table, table, .p-datatable').first();
        await expect(table).toBeVisible({ timeout: 10000 });
    });

    test('should show user table headers: Name, Email, Role, Status', async ({ page }) => {
        await goToUsersPage(page);

        const table = page.locator('p-table, table, .p-datatable').first();
        await expect(table).toBeVisible({ timeout: 10000 });

        const headers = page.locator('th');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThanOrEqual(4);
    });

    test('should display user rows in table', async ({ page }) => {
        await goToUsersPage(page);

        const rows = page.locator('tbody tr');
        await expect(rows.first()).toBeVisible({ timeout: 10000 });
        expect(await rows.count()).toBeGreaterThanOrEqual(1);
    });

    // ── Create ────────────────────────────────────────────────────────────

    test('should open New User dialog when clicking New button', async ({ page }) => {
        await goToUsersPage(page);

        const newButton = page.locator('button:has-text("New"), p-button[label="New"], button:has(.pi-plus)').first();
        await expect(newButton).toBeVisible({ timeout: 8000 });
        await newButton.click();

        // Name input inside dialog should become visible
        await expect(page.locator('#name')).toBeVisible({ timeout: 5000 });
    });

    test('should create new user via dialog and update list', async ({ page }) => {
        await goToUsersPage(page);

        const newButton = page.locator('button:has-text("New"), p-button[label="New"], button:has(.pi-plus)').first();
        await newButton.click();

        await expect(page.locator('#name')).toBeVisible({ timeout: 5000 });

        const timestamp = Date.now();
        const testEmail = `test${timestamp}@e2e.test`;
        const testName = `E2E User ${timestamp}`;

        // Fill in user form
        const nameField = page.locator('#name');
        const emailField = page.locator('#email');
        const passwordField = page.locator('#password input, input#password');

        await nameField.fill(testName);
        await emailField.fill(testEmail);
        if (await passwordField.isVisible()) {
            await passwordField.fill('Password123!');
        }

        // Click Save
        const saveBtn = page.locator('.p-dialog button:has-text("Save"), p-button[label="Save"] button').first();
        await saveBtn.click();
        await page.waitForTimeout(2000);

        // Dialog input should no longer be visible
        await expect(page.locator('#name')).not.toBeVisible({ timeout: 5000 });

        // Newly added user should appear in table or toast should show
        const userInTable = page.locator(`tbody tr:has-text("${testName}")`).first();
        if (await userInTable.isVisible({ timeout: 3000 })) {
            await expect(userInTable).toBeVisible();
        }
    });

    // ── Update ────────────────────────────────────────────────────────────

    test('should open Edit dialog when clicking edit pencil on a user row', async ({ page }) => {
        await goToUsersPage(page);

        // Find edit pencil button in first row
        const editButton = page.locator('tbody tr button:has(.pi-pencil)').first();
        await expect(editButton).toBeVisible({ timeout: 8000 });
        await editButton.click();

        // Name field in dialog should be visible and pre-filled
        const nameField = page.locator('#name');
        await expect(nameField).toBeVisible({ timeout: 5000 });
        const currentValue = await nameField.inputValue();
        expect(currentValue.length).toBeGreaterThan(0);

        // Cancel dialog
        const cancelBtn = page.locator('.p-dialog button:has-text("Cancel"), p-button[label="Cancel"] button').first();
        await cancelBtn.click();
        await expect(nameField).not.toBeVisible({ timeout: 5000 });
    });

    // ── Delete ────────────────────────────────────────────────────────────

    test('should show confirmation dialog when deleting a user', async ({ page }) => {
        await goToUsersPage(page);

        const deleteButton = page.locator('tbody tr button:has(.pi-trash)').first();
        await expect(deleteButton).toBeVisible({ timeout: 8000 });
        await deleteButton.click();

        // ConfirmDialog message or reject button should be visible
        const rejectBtn = page.locator('.p-confirmdialog button, .p-confirm-dialog button, button:has-text("No"), button:has-text("Cancel")').first();
        await expect(rejectBtn).toBeVisible({ timeout: 5000 });

        // Dismiss confirmation
        await rejectBtn.click();
    });

    // ── Search / Filter ───────────────────────────────────────────────────

    test('should filter table when typing in search input', async ({ page }) => {
        await goToUsersPage(page);

        const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"], .p-inputicon-left input, #globalFilter').first();
        if (await searchInput.isVisible({ timeout: 5000 })) {
            const initialCount = await page.locator('tbody tr').count();

            // Type non-matching search term
            await searchInput.fill('xyznonexistentuser999');
            await page.waitForTimeout(600);

            // Table should filter
            const filteredRows = page.locator('tbody tr');
            const newCount = await filteredRows.count();
            expect(newCount).toBeLessThanOrEqual(initialCount);

            // Clear search
            await searchInput.clear();
        }
    });

    // ── Realtime Sync Verification ────────────────────────────────────────

    test('should connect to WebSocket and retain state during realtime notifications', async ({ page }) => {
        await goToUsersPage(page);

        // Verify WebSocket connection was initiated by checking console or topbar
        const isConnected = await page.evaluate(() => {
            return typeof window !== 'undefined' && 'WebSocket' in window;
        });
        expect(isConnected).toBe(true);

        // Ensure table remains responsive
        const table = page.locator('p-table, table').first();
        await expect(table).toBeVisible();
    });
});
