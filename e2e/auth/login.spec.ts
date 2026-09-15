import { test, expect } from '@playwright/test';
import { AUTH_URL, TEST_CREDENTIALS, clearAuthState } from '../fixtures/auth.fixture';

const LOGIN_URL = `${AUTH_URL}/auth/login`;

test.describe('Login Flow — Auth Application', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuthState(page);
    });

    // ── Happy Path ────────────────────────────────────────────────────────

    test('should display login form with email and password fields', async ({ page }) => {
        await page.goto(LOGIN_URL);
        await page.waitForLoadState('domcontentloaded');

        await expect(page.locator('#email1')).toBeVisible();
        await expect(page.locator('#password1')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    });

    test('should login successfully with valid credentials via REST and redirect to dashboard', async ({ page }) => {
        await page.route('**/api/v1/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: {
                    'set-cookie': 'accessToken=mock-jwt; Path=/; HttpOnly; SameSite=Lax'
                },
                body: JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: 'usr-admin-1',
                            email: 'superadmin@example.com',
                            role: 'admin'
                        }
                    }
                })
            });
        });

        await page.goto(LOGIN_URL);
        await page.waitForLoadState('domcontentloaded');

        await page.locator('#email1').fill('superadmin@example.com');
        await page.locator('#password1').fill('Admin123!');
        await page.getByRole('button', { name: /sign in|login/i }).click();

        // Verify redirect to dashboard without token in query param
        await page.waitForURL(/localhost:4000/, { timeout: 15000 });
        expect(page.url()).toContain('localhost:4000');
        expect(page.url()).not.toContain('token=');

        // User session should be preserved in cookie
        const cookies = await page.context().cookies();
        const userSession = cookies.find((c) => c.name === 'user_session');
        expect(userSession?.value).toBeTruthy();
    });

    test('should show error toast on invalid credentials', async ({ page }) => {
        await page.route('**/api/v1/auth/login', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Invalid email or password'
                    }
                })
            });
        });

        await page.goto(LOGIN_URL);
        await page.waitForLoadState('domcontentloaded');

        await page.locator('#email1').fill(TEST_CREDENTIALS.invalid.email);
        await page.locator('#password1').fill(TEST_CREDENTIALS.invalid.password);
        await page.getByRole('button', { name: /sign in|login/i }).click();

        // Error toast with 'Login Failed' should be visible
        const toastMessage = page.locator('.p-toast-message, .p-toast-detail, .p-toast-summary').first();
        await expect(toastMessage).toBeVisible({ timeout: 10000 });
        await expect(toastMessage).toContainText(/login failed|invalid/i);
    });

    test('should not redirect when login fails', async ({ page }) => {
        await page.route('**/api/v1/auth/login', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Invalid email or password'
                    }
                })
            });
        });

        await page.goto(LOGIN_URL);
        await page.waitForLoadState('domcontentloaded');

        await page.locator('#email1').fill(TEST_CREDENTIALS.invalid.email);
        await page.locator('#password1').fill(TEST_CREDENTIALS.invalid.password);
        await page.getByRole('button', { name: /sign in|login/i }).click();

        await page.waitForTimeout(2000);
        // Should still be on auth domain
        expect(page.url()).toContain('localhost:4002');
    });

    // ── Form Validation ───────────────────────────────────────────────────

    test('should have submit button and handle empty submission without crashing', async ({ page }) => {
        await page.goto(LOGIN_URL);
        await page.waitForLoadState('domcontentloaded');

        const submitBtn = page.getByRole('button', { name: /sign in|login/i });
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // Should still be on login page
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('localhost:4002');
    });

    // ── Security ─────────────────────────────────────────────────────────

    test('should not expose credentials in URL query params', async ({ page }) => {
        await page.goto(LOGIN_URL);
        await page.waitForLoadState('domcontentloaded');

        await page.locator('#email1').fill('user@test.com');
        await page.locator('#password1').fill('secretpassword123');
        await page.getByRole('button', { name: /sign in|login/i }).click();

        await page.waitForTimeout(2000);

        // Password should never appear in URL
        expect(page.url()).not.toContain('password');
        expect(page.url()).not.toContain('secretpassword123');
    });

    test('should have password field masked with type=password', async ({ page }) => {
        await page.goto(LOGIN_URL);
        await page.waitForLoadState('domcontentloaded');

        const passwordInput = page.locator('#password1');
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });
});
