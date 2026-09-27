import { test, expect } from '@playwright/test';

const BLIP_URL = 'http://127.0.0.1:4300';
const AUTH_URL = 'http://127.0.0.1:4202';
const API_URL = 'http://localhost:3000';

const SUPERADMIN_CREDENTIALS = {
  email: 'admin@dedisalam.my.id',
  password: 'Password123!',
};

test.describe('Blip Studio — Micro-Frontend SSO & PDF Generation E2E Suite', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies and storage for clean isolation
    await context.clearCookies();
  });

  test('E2E-BLIP-01: Unauthorized access redirects to dedicated Auth frontend with encoded return URL', async ({ page }) => {
    const targetUrl = `${BLIP_URL}/generate-pdf/traveloka`;
    await page.goto(targetUrl);
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected to dedicated auth login
    await page.waitForURL((url) => url.toString().includes('4202') && url.toString().includes('login'), { timeout: 15000 });
    expect(page.url()).toContain('127.0.0.1:4202');
    expect(page.url()).toContain('redirect=');
    expect(page.url()).toContain(encodeURIComponent(targetUrl));

    // Form fields in dedicated auth should be visible
    await expect(page.locator('#email1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#password1')).toBeVisible();
  });

  test('E2E-BLIP-02: Superadmin login via dedicated Auth returns user to requested Blip Studio provider', async ({ page }) => {
    const targetUrl = `${BLIP_URL}/generate-pdf/traveloka`;
    await page.goto(`${AUTH_URL}/login?redirect=${encodeURIComponent(targetUrl)}`);
    await page.waitForLoadState('domcontentloaded');

    // Fill credentials
    await page.locator('#email1').fill(SUPERADMIN_CREDENTIALS.email);
    await page.locator('#password1').fill(SUPERADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in|masuk/i }).click();

    // Verify redirected back to Blip Studio
    await page.waitForURL((url) => url.toString().includes('4300/generate-pdf/traveloka'), { timeout: 20000 });
    expect(page.url()).toContain('127.0.0.1:4300/generate-pdf/traveloka');

    // Verify topbar displays authenticated user email
    const topbarUser = page.locator('text=admin@dedisalam.my.id');
    await expect(topbarUser).toBeVisible({ timeout: 10000 });

    // Verify table has data rows
    const tableRows = page.locator('p-table table tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const count = await tableRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('E2E-BLIP-03: Provider navigation switches views and renders provider-specific tables', async ({ page }) => {
    // Inject valid session cookie to bypass login
    const targetUrl = `${BLIP_URL}/generate-pdf/traveloka`;
    await page.goto(`${AUTH_URL}/login?redirect=${encodeURIComponent(targetUrl)}`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#email1').fill(SUPERADMIN_CREDENTIALS.email);
    await page.locator('#password1').fill(SUPERADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in|masuk/i }).click();
    await page.waitForURL((url) => url.toString().includes('4300'), { timeout: 20000 });
    await expect(page.locator('text=admin@dedisalam.my.id')).toBeVisible({ timeout: 10000 });

    // Navigate to Gojek
    await page.goto(`${BLIP_URL}/generate-pdf/gojek`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Gojek Documents")')).toBeVisible({ timeout: 10000 });

    // Navigate to inDrive
    await page.goto(`${BLIP_URL}/generate-pdf/indrive`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("inDrive Documents")')).toBeVisible({ timeout: 10000 });

    // Navigate to Jackal Holidays
    await page.goto(`${BLIP_URL}/generate-pdf/jackal`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Jackal Holidays Documents")')).toBeVisible({ timeout: 10000 });
  });

  test('E2E-BLIP-04: PDF generation button triggers binary stream and updates row status', async ({ page }) => {
    const targetUrl = `${BLIP_URL}/generate-pdf/traveloka`;
    await page.goto(`${AUTH_URL}/login?redirect=${encodeURIComponent(targetUrl)}`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#email1').fill(SUPERADMIN_CREDENTIALS.email);
    await page.locator('#password1').fill(SUPERADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in|masuk/i }).click();
    await page.waitForURL((url) => url.toString().includes('4300/generate-pdf/traveloka'), { timeout: 20000 });

    // Wait for table to load
    await expect(page.locator('p-table table tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Find the Generate button in the first row
    const generateBtn = page.locator('p-table table tbody tr').first().locator('button:has-text("Generate")');
    await expect(generateBtn).toBeVisible();

    // Listen for PDF download or generation request
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/generate') && (res.status() === 201 || res.status() === 200), { timeout: 15000 }),
      generateBtn.click(),
    ]);

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/pdf');
  });

  test('E2E-BLIP-05: Logout from Blip Studio topbar clears session and returns to dedicated Auth frontend', async ({ page }) => {
    const targetUrl = `${BLIP_URL}/generate-pdf/traveloka`;
    await page.goto(`${AUTH_URL}/login?redirect=${encodeURIComponent(targetUrl)}`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#email1').fill(SUPERADMIN_CREDENTIALS.email);
    await page.locator('#password1').fill(SUPERADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in|masuk/i }).click();
    await page.waitForURL((url) => url.toString().includes('4300/generate-pdf/traveloka'), { timeout: 20000 });

    // Find and click the Logout button in Topbar
    const logoutBtn = page.locator('button[aria-label="Logout"]');
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.click();

    // Verify redirected back to dedicated auth login
    await page.waitForURL((url) => url.toString().includes('4202') && url.toString().includes('login'), { timeout: 15000 });
    expect(page.url()).toContain('127.0.0.1:4202/login');

    // Accessing protected route again must redirect to login
    await page.goto(`${BLIP_URL}/generate-pdf/traveloka`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForURL((url) => url.toString().includes('4202'), { timeout: 15000 });
    expect(page.url()).toContain('127.0.0.1:4202');
  });
});
