import { test, expect } from '@playwright/test';

test.describe('Superadmin Live Login Flow', () => {
    test('should successfully authenticate superadmin against live backend and navigate to dashboard', async ({ page }) => {
        // Clear cookies and localStorage
        await page.goto('http://localhost:4002/auth/login');
        await page.evaluate(() => {
            localStorage.clear();
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        });

        await page.goto('http://localhost:4002/auth/login');
        await page.waitForLoadState('domcontentloaded');

        // Fill credentials
        const emailInput = page.locator('#email1');
        const passwordInput = page.locator('#password1');

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();

        await emailInput.fill('superadmin@example.com');
        await passwordInput.fill('Admin123!');

        // Click Sign In
        const signInBtn = page.getByRole('button', { name: /sign in/i });
        await signInBtn.click();

        // Wait for redirect to dashboard
        await page.waitForURL(/localhost:4000/, { timeout: 15000 });
        expect(page.url()).toContain('localhost:4000');

        // Verify token in localStorage and cookies on dashboard origin
        const token = await page.evaluate(() => localStorage.getItem('accessToken'));
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
        expect(token!.length).toBeGreaterThan(20);

        // Verify decoded JWT claims for superadmin
        const payload = JSON.parse(Buffer.from(token!.split('.')[1], 'base64').toString());
        expect(payload.email).toBe('superadmin@example.com');
        expect(payload.role).toBe('super_admin');

        console.log('✅ Superadmin successfully authenticated with claims:', payload);
    });
});
