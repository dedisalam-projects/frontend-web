import { Page, BrowserContext } from '@playwright/test';

export const AUTH_URL = 'http://localhost:4002';
export const DASHBOARD_URL = 'http://localhost:4000';
export const LANDING_URL = 'http://localhost:4001';
export const API_URL = 'http://localhost:3000';

export const TEST_CREDENTIALS = {
    admin: { email: 'admin@company.local', password: 'password123' },
    user: { email: 'john.doe@company.com', password: 'password123' },
    invalid: { email: 'wrong@email.com', password: 'wrongpassword' }
} as const;

/**
 * Perform login via the Auth UI and return the access token.
 * Navigates to the auth app, fills credentials, submits, waits for redirect.
 */
export async function loginViaUI(page: Page, credentials = TEST_CREDENTIALS.admin): Promise<string> {
    await page.goto(`${AUTH_URL}/auth/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#email1').fill(credentials.email);
    await page.locator('#password1').fill(credentials.password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for redirect to dashboard or token in cookie
    await page.waitForURL(/localhost:4000/, { timeout: 15000 });

    // Extract token from cookie
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'accessToken');
    return tokenCookie?.value ?? '';
}

/**
 * Inject token directly into cookies and localStorage — bypasses login UI.
 * Use for tests that don't need to test the login flow itself.
 */
export async function injectAuthToken(context: BrowserContext, token: string, dashboardUrl = DASHBOARD_URL): Promise<void> {
    await context.addCookies([
        {
            name: 'accessToken',
            value: token,
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false
        },
        {
            name: 'user_session',
            value: encodeURIComponent(JSON.stringify({ email: 'admin@company.local', role: 'admin' })),
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false
        }
    ]);
    // Also set in localStorage via JS execution
    const page = await context.newPage();
    await page.goto(dashboardUrl);
    await page.evaluate((t) => {
        localStorage.setItem('accessToken', t);
        localStorage.setItem('user', JSON.stringify({ email: 'admin@company.local', role: 'admin' }));
    }, token);
    await page.close();
}

/**
 * Create a mock JWT token with given payload for testing.
 * NOT a real signed JWT — for testing UI behavior only.
 */
export function createMockToken(payload: { exp?: number; sub?: string; role?: string } = {}): string {
    const defaultPayload = {
        sub: 'usr-test-1',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
        ...payload
    };
    const encoded = btoa(JSON.stringify(defaultPayload));
    return `eyJhbGciOiJIUzI1NiJ9.${encoded}.mock_signature`;
}

/**
 * Clear all auth state from browser context.
 */
export async function clearAuthState(page: Page): Promise<void> {
    await page.context().clearCookies();
    try {
        await page.evaluate(() => {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.clear();
            }
        });
    } catch {
        // Ignored if on blank page
    }
}
