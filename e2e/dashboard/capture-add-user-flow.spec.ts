import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_URL = 'http://localhost:4002';
const DASHBOARD_URL = 'http://localhost:4000';

test.describe('Capture Add User Flow — E2E', () => {
    test('login super admin, navigate to user management, add new user, and capture table', async ({ page }) => {
        // Set a desktop viewport for clear table visibility
        await page.setViewportSize({ width: 1920, height: 1080 });

        // ── Step 1: Login Super Admin ──────────────────────────────────────
        console.log('Step 1: Navigating to Auth Login page...');
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
        console.log('Submitting login form as Super Admin...');
        await signInButton.click();

        // Wait for redirect to Dashboard
        await page.waitForURL(/localhost:4000/, { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
        console.log('Successfully logged in and redirected to Dashboard:', page.url());

        // ── Step 2: Navigasi ke Management User ─────────────────────────────
        console.log('Step 2: Navigating to Manajemen User...');
        const userLink = page.locator('a[href*="users"], a:has-text("Manajemen User"), span:has-text("Manajemen User")').first();
        await expect(userLink).toBeVisible({ timeout: 10000 });
        await userLink.click();

        await page.waitForURL(/.*users.*/, { timeout: 10000 });
        await page.waitForLoadState('domcontentloaded');
        console.log('Arrived at User Management page:', page.url());

        // Verify table is loaded
        const userTable = page.locator('p-table, table, .p-datatable').first();
        await expect(userTable).toBeVisible({ timeout: 15000 });

        // ── Step 3: Popup Add New User, Isi dan Submit ─────────────────────
        console.log('Step 3: Opening Add New User dialog...');
        const newButton = page.locator('button:has-text("New"), p-button[label="New"], button:has(.pi-plus)').first();
        await expect(newButton).toBeVisible({ timeout: 10000 });
        await newButton.click();

        const nameInput = page.locator('#name');
        await expect(nameInput).toBeVisible({ timeout: 10000 });

        const timestamp = Date.now();
        const testName = `Capture User ${timestamp}`;
        const testEmail = `capture.user.${timestamp}@example.com`;
        const testPassword = 'Password123!';

        console.log(`Filling user details: Name="${testName}", Email="${testEmail}"...`);
        await nameInput.fill(testName);

        const emailField = page.locator('#email');
        await expect(emailField).toBeVisible({ timeout: 5000 });
        await emailField.fill(testEmail);

        const passField = page.locator('#password input, input#password');
        if (await passField.isVisible({ timeout: 5000 })) {
            await passField.fill(testPassword);
        }

        console.log('Submitting new user form...');
        const saveBtn = page.locator('.p-dialog button:has-text("Save"), p-button[label="Save"] button').first();
        await expect(saveBtn).toBeVisible({ timeout: 5000 });
        await saveBtn.click();

        // Wait for dialog to close
        await expect(nameInput).not.toBeVisible({ timeout: 10000 });
        console.log('Dialog closed successfully.');

        // ── Step 4: Capture Kondisi Table Setelah Submit Form ───────────────
        console.log('Step 4: Waiting for user to appear in table and capturing screenshot...');
        const userRow = page.locator(`tbody tr:has-text("${testName}")`).first();
        await expect(userRow).toBeVisible({ timeout: 15000 });

        // Wait for animations and toast to settle
        await page.waitForTimeout(1500);

        const screenshotPathRoot = path.resolve(process.cwd(), 'capture-table-after-submit.png');
        await page.screenshot({ path: screenshotPathRoot, fullPage: true });
        console.log(`Screenshot saved to root: ${screenshotPathRoot}`);

        // Also save a copy to the brain artifact directory for Walkthrough embed
        const artifactDir = 'C:\\Users\\dedis\\.gemini\\antigravity-ide\\brain\\c4b46940-f7bb-42e4-bc5a-410698524fb5';
        if (fs.existsSync(artifactDir)) {
            const artifactScreenshotPath = path.join(artifactDir, 'capture-table-after-submit.png');
            fs.copyFileSync(screenshotPathRoot, artifactScreenshotPath);
            console.log(`Screenshot copied to artifact directory: ${artifactScreenshotPath}`);
        }

        // Final assertion: verify table contains the added user row EXACTLY ONCE (no duplicates)
        const userRows = page.locator(`tbody tr:has-text("${testName}")`);
        await expect(userRows).toHaveCount(1);
        await expect(userRows.first()).toBeVisible();
    });
});
