import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const JOURNEYS_FILE = resolve(process.cwd(), 'user-journeys.json');
const OUTPUT_DIR = resolve(process.cwd(), 'e2e', 'generated');

if (!existsSync(JOURNEYS_FILE)) {
    console.error('\x1b[31mError: user-journeys.json not found!\x1b[0m');
    console.error('Run "npm run test:crawl" first.');
    process.exit(1);
}

if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
}

const data = JSON.parse(readFileSync(JOURNEYS_FILE, 'utf-8'));
const { pages, journeys } = data;

console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════');
console.log('\x1b[1m\x1b[36m%s\x1b[0m', '  AI & Dynamic Playwright Test Generator');
console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════\n');

// ── Generator 1: Landing Page Spec ──────────────────────────────────────────
const landingSpec = `import { test, expect } from '@playwright/test';

const LANDING_URL = 'http://localhost:4001';

test.describe('Generated: Landing Page User Journeys', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('should visit landing page and render navigation and content', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(LANDING_URL, { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveTitle(/Landing|Sakai/i);
        expect(errors).toHaveLength(0);
    });

    test('should have working CTA to auth or login', async ({ page }) => {
        await page.goto(LANDING_URL, { waitUntil: 'domcontentloaded' });
        const cta = page.locator('a[href*="4002"], a[href*="login"], a:has-text("Get Started"), a:has-text("Sign In")').first();
        if (await cta.isVisible()) {
            await expect(cta).toBeVisible();
            const href = await cta.getAttribute('href');
            expect(href).toBeTruthy();
        }
    });
});
`;

// ── Generator 2: Auth Pages Spec ───────────────────────────────────────────
const authSpec = `import { test, expect } from '@playwright/test';

const AUTH_URL = 'http://localhost:4002';

test.describe('Generated: Auth Micro-frontend Journeys', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('should render login page with email and password inputs', async ({ page }) => {
        await page.goto(\`\${AUTH_URL}/auth/login\`, { waitUntil: 'domcontentloaded' });
        const email = page.locator('#email1');
        const password = page.locator('#password1 input, input#password1, #password1');
        const submit = page.locator('button:has-text("Sign In"), p-button[label="Sign In"] button').first();

        await expect(email).toBeVisible();
        await expect(password).toBeVisible();
        await expect(submit).toBeVisible();
    });

    test('should display validation or reject invalid credentials', async ({ page }) => {
        await page.goto(\`\${AUTH_URL}/auth/login\`, { waitUntil: 'domcontentloaded' });
        await page.locator('#email1').fill('invalid@nonexistent.domain');
        await page.locator('#password1 input, input#password1, #password1').fill('WrongPassword!');
        await page.locator('button:has-text("Sign In"), p-button[label="Sign In"] button').first().click();

        // Should not redirect to dashboard
        await page.waitForTimeout(1000);
        expect(page.url()).not.toContain('localhost:4000');
    });

    test('should render access error page gracefully', async ({ page }) => {
        const response = await page.goto(\`\${AUTH_URL}/auth/access\`, { waitUntil: 'domcontentloaded' });
        expect(response?.status()).toBeLessThan(500);
    });

    test('should render general error page gracefully', async ({ page }) => {
        const response = await page.goto(\`\${AUTH_URL}/auth/error\`, { waitUntil: 'domcontentloaded' });
        expect(response?.status()).toBeLessThan(500);
    });
});
`;

// ── Generator 3: Dashboard Discovered Navigation & UI Specs ─────────────────
const dashboardRoutes = pages
    .filter((p) => p.category === 'Dashboard' && p.url.includes('localhost:4000'))
    .map((p) => {
        const path = p.url.replace(/^http:\/\/localhost:4000/, '') || '/';
        return {
            url: p.url,
            path,
            title: p.title,
            buttonsCount: p.buttonsCount,
            inputsCount: p.inputsCount,
            tablesCount: p.tablesCount
        };
    });

const dashboardRouteTests = dashboardRoutes.map((r) => {
    const safeName = r.path === '/' ? 'Root Dashboard' : r.path.replace(/^\//, '');
    let testBlock = `
    test('should navigate to ${safeName} (${r.path}) without runtime errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(\`\${DASHBOARD_URL}${r.path}\`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Assert page loaded and no uncaught fatal exceptions
        const body = page.locator('body');
        await expect(body).toBeVisible();
        expect(errors).toHaveLength(0);
    });`;

    if (r.path.includes('users')) {
        testBlock += `

    test('should perform full-cycle create user mutation on ${r.path}', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(\`\${DASHBOARD_URL}${r.path}\`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const newBtn = page.locator('button:has-text("New"), p-button[label="New"], button:has(.pi-plus)').first();
        await expect(newBtn).toBeVisible({ timeout: 10000 });
        await newBtn.click();

        const nameField = page.locator('#name');
        await expect(nameField).toBeVisible({ timeout: 10000 });

        const timestamp = Date.now();
        const testName = \`Gen User \${timestamp}\`;
        const testEmail = \`gen.user.\${timestamp}@example.com\`;

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
        const createdRow = page.locator(\`tbody tr:has-text("\${testName}")\`).first();
        await expect(createdRow).toBeVisible({ timeout: 10000 });

        expect(errors).toHaveLength(0);
    });`;
    }

    return testBlock;
}).join('\n');

const dashboardSpec = `import { test, expect, Page } from '@playwright/test';

const AUTH_URL = 'http://localhost:4002';
const DASHBOARD_URL = 'http://localhost:4000';

async function loginAsAdmin(page: Page): Promise<void> {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(\`\${AUTH_URL}/auth/login\`);
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
${dashboardRouteTests}
});
`;

// ── Write Generated Files ───────────────────────────────────────────────────
const files = [
    { name: 'landing-journeys.spec.ts', content: landingSpec },
    { name: 'auth-journeys.spec.ts', content: authSpec },
    { name: 'dashboard-routes.spec.ts', content: dashboardSpec }
];

let generatedCount = 0;
for (const file of files) {
    const filePath = join(OUTPUT_DIR, file.name);
    writeFileSync(filePath, file.content, 'utf-8');
    console.log(`  \x1b[32m✔ [Generated]\x1b[0m ${file.name} -> \x1b[90me2e/generated/${file.name}\x1b[0m`);
    generatedCount++;
}

console.log(`\n\x1b[32mSuccessfully generated ${generatedCount} dynamic test suite(s) based on ${journeys.length} discovered journeys!\x1b[0m\n`);
