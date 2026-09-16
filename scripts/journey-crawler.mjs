import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APPS = {
    landing: 'http://localhost:4001',
    auth: 'http://localhost:4002',
    dashboard: 'http://localhost:4000'
};

const CREDENTIALS = {
    email: 'superadmin@example.com',
    password: 'Admin123!'
};

const isHeaded = process.argv.includes('--headed');

async function main() {
    console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════');
    console.log('\x1b[1m\x1b[36m%s\x1b[0m', '  Playwright Autonomous User Journey Crawler');
    console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════\n');

    const browser = await chromium.launch({
        headless: !isHeaded,
        slowMo: isHeaded ? 50 : 0
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    const discoveredJourneys = [];
    const discoveredPages = new Map();
    const consoleErrors = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push({ url: page.url(), text: msg.text() });
        }
    });

    async function recordPage(url, category) {
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);

        const currentUrl = page.url();
        const title = await page.title();

        const pageData = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]')).map((a) => ({
                text: (a.textContent || '').trim().replace(/\s+/g, ' '),
                href: a.getAttribute('href') || ''
            }));

            const buttons = Array.from(document.querySelectorAll('button, p-button, [role="button"]')).map((b) => ({
                text: (b.textContent || b.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '),
                id: b.id || '',
                tag: b.tagName.toLowerCase()
            }));

            const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map((i) => ({
                name: i.getAttribute('name') || '',
                id: i.id || '',
                type: i.getAttribute('type') || i.tagName.toLowerCase()
            }));

            const tables = document.querySelectorAll('table, p-table, .p-datatable').length;
            const dialogs = document.querySelectorAll('p-dialog, [role="dialog"]').length;

            return { links, buttons, inputs, tables, dialogs };
        });

        const normalizedKey = currentUrl.replace(/#.*$/, '');
        if (!discoveredPages.has(normalizedKey)) {
            discoveredPages.set(normalizedKey, {
                url: currentUrl,
                title,
                category,
                linksCount: pageData.links.length,
                buttonsCount: pageData.buttons.length,
                inputsCount: pageData.inputs.length,
                tablesCount: pageData.tables,
                dialogsCount: pageData.dialogs,
                interactiveSummary: {
                    buttons: pageData.buttons.slice(0, 10).map((b) => b.text || b.id || 'Button'),
                    inputs: pageData.inputs.map((i) => i.id || i.name || i.type)
                }
            });
            console.log(`  \x1b[32m[Discovered]\x1b[0m ${category.padEnd(10)} | ${currentUrl} ("${title}")`);
        }

        return { currentUrl, pageData };
    }

    try {
        // ── Step 1: Landing Page Crawl ──────────────────────────────────────
        console.log('\x1b[1m[Phase 1] Crawling Landing Page...\x1b[0m');
        await page.goto(APPS.landing, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await recordPage(APPS.landing, 'Landing');

        discoveredJourneys.push({
            id: 'journey-landing-entry',
            from: 'Entry',
            action: 'Visit Landing Page',
            to: APPS.landing,
            type: 'navigation'
        });

        // Check if there is a CTA link to auth
        const authLink = await page.locator('a[href*="4002"], a[href*="login"], a:has-text("Get Started"), a:has-text("Sign In")').first();
        if (await authLink.isVisible()) {
            const linkHref = await authLink.getAttribute('href');
            discoveredJourneys.push({
                id: 'journey-landing-cta-auth',
                from: APPS.landing,
                action: 'Click "Get Started / Sign In" CTA',
                to: linkHref || APPS.auth,
                type: 'navigation'
            });
        }

        // ── Step 2: Auth Pages Crawl ────────────────────────────────────────
        console.log('\n\x1b[1m[Phase 2] Crawling Auth Pages...\x1b[0m');
        await page.goto(`${APPS.auth}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await recordPage(`${APPS.auth}/auth/login`, 'Auth');

        discoveredJourneys.push({
            id: 'journey-auth-login-view',
            from: 'Entry',
            action: 'Visit Auth Login Page',
            to: `${APPS.auth}/auth/login`,
            type: 'navigation'
        });

        // Check error & access pages in Auth
        for (const sub of ['access', 'error']) {
            try {
                await page.goto(`${APPS.auth}/auth/${sub}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
                await recordPage(`${APPS.auth}/auth/${sub}`, 'Auth');
                discoveredJourneys.push({
                    id: `journey-auth-${sub}-view`,
                    from: `${APPS.auth}/auth/login`,
                    action: `Navigate to Auth /${sub}`,
                    to: `${APPS.auth}/auth/${sub}`,
                    type: 'navigation'
                });
            } catch {
                // Ignore route if not reachable
            }
        }

        // ── Step 3: Authenticate & Enter Dashboard ──────────────────────────
        console.log('\n\x1b[1m[Phase 3] Authenticating as SuperAdmin...\x1b[0m');
        await page.goto(`${APPS.auth}/auth/login`, { waitUntil: 'domcontentloaded' });

        const emailInput = page.locator('#email1');
        const passwordInput = page.locator('#password1 input, input#password1, #password1');
        const signInBtn = page.locator('button:has-text("Sign In"), p-button[label="Sign In"] button').first();

        if (await emailInput.isVisible() && await passwordInput.isVisible()) {
            await emailInput.fill(CREDENTIALS.email);
            await passwordInput.fill(CREDENTIALS.password);
            await signInBtn.click();

            await page.waitForURL(/localhost:4000/, { timeout: 15000 });
            await page.waitForLoadState('domcontentloaded');

            discoveredJourneys.push({
                id: 'journey-auth-superadmin-login',
                from: `${APPS.auth}/auth/login`,
                action: 'SuperAdmin Submit Valid Credentials',
                to: `${APPS.dashboard}/`,
                type: 'auth-transition'
            });
            console.log(`  \x1b[32m[Success]\x1b[0m Redirected to Dashboard: ${page.url()}`);
        }

        // ── Step 4: Dashboard Deep Crawling ────────────────────────────────
        console.log('\n\x1b[1m[Phase 4] Deep Crawling Dashboard Navigation & Views...\x1b[0m');
        await recordPage(`${APPS.dashboard}/`, 'Dashboard');

        // Extract all sidebar links
        const navLinks = await page.evaluate(() => {
            const items = [];
            const anchors = document.querySelectorAll('.layout-sidebar a[href], .layout-menu a[href], aside a[href]');
            anchors.forEach((a) => {
                const text = (a.textContent || '').trim().replace(/\s+/g, ' ');
                const href = a.getAttribute('href') || '';
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    items.push({ text, href });
                }
            });
            return items;
        });

        console.log(`  Found ${navLinks.length} internal navigation routes in Dashboard sidebar.`);

        const visitedRoutes = new Set(['/', '']);

        // Known routes to ensure full coverage
        const knownRoutes = [
            { text: 'Users Management', href: '/users' },
            { text: 'Documentation', href: '/archive/documentation' },
            { text: 'CRUD Archive', href: '/archive/crud' },
            { text: 'Empty Page', href: '/archive/empty' },
            { text: 'Buttons UI', href: '/archive/uikit/button' },
            { text: 'Charts UI', href: '/archive/uikit/charts' },
            { text: 'Table UI', href: '/archive/uikit/table' },
            { text: 'Form Layout UI', href: '/archive/uikit/formlayout' },
            { text: 'Input UI', href: '/archive/uikit/input' },
            { text: 'List UI', href: '/archive/uikit/list' },
            { text: 'Messages UI', href: '/archive/uikit/message' },
            { text: 'Panels UI', href: '/archive/uikit/panel' },
            { text: 'Overlay UI', href: '/archive/uikit/overlay' }
        ];

        const allTargetRoutes = [...navLinks];
        knownRoutes.forEach((kr) => {
            if (!allTargetRoutes.some((r) => r.href === kr.href)) {
                allTargetRoutes.push(kr);
            }
        });

        for (const route of allTargetRoutes) {
            const cleanHref = route.href.replace(/^\//, '');
            if (visitedRoutes.has(cleanHref)) continue;
            visitedRoutes.add(cleanHref);

            const targetUrl = `${APPS.dashboard}/${cleanHref}`;
            try {
                await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
                await recordPage(targetUrl, 'Dashboard');

                discoveredJourneys.push({
                    id: `journey-dashboard-nav-${cleanHref.replace(/[^a-zA-Z0-9]/g, '-')}`,
                    from: `${APPS.dashboard}/`,
                    action: `Navigate to ${route.text || cleanHref}`,
                    to: targetUrl,
                    type: 'navigation'
                });

                // Deep interactive inspection on User Management
                if (cleanHref.includes('users')) {
                    console.log('    \x1b[34m[Inspect Interactions]\x1b[0m Testing User Management interactions...');
                    const newBtn = page.locator('button:has-text("New"), p-button[label="New"], button:has(.pi-plus)').first();
                    if (await newBtn.isVisible({ timeout: 3000 })) {
                        await newBtn.click();
                        await page.waitForTimeout(600);

                        const isDialogVisible = await page.locator('p-dialog, [role="dialog"]').first().isVisible();
                        if (isDialogVisible) {
                            discoveredJourneys.push({
                                id: 'journey-users-open-add-dialog',
                                from: targetUrl,
                                action: 'Click "New" -> Open Add User Dialog',
                                to: `${targetUrl}#dialog-new-user`,
                                type: 'modal-interaction'
                            });

                            // Close dialog
                            const cancelBtn = page.locator('.p-dialog button:has-text("Cancel"), p-dialog button:has(.pi-times)').first();
                            if (await cancelBtn.isVisible({ timeout: 2000 })) {
                                await cancelBtn.click();
                                await page.waitForTimeout(400);
                            }
                        }
                    }

                    // Check Search input
                    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"]').first();
                    if (await searchInput.isVisible({ timeout: 2000 })) {
                        discoveredJourneys.push({
                            id: 'journey-users-filter-search',
                            from: targetUrl,
                            action: 'Filter/Search users in datatable',
                            to: `${targetUrl}#filtered`,
                            type: 'data-filter'
                        });
                    }

                    // Check Sort headers
                    const sortHeaders = page.locator('th[pSortableColumn], th.p-sortable-column');
                    const sortCount = await sortHeaders.count();
                    if (sortCount > 0) {
                        discoveredJourneys.push({
                            id: 'journey-users-sort-columns',
                            from: targetUrl,
                            action: `Sort columns in datatable (${sortCount} columns available)`,
                            to: `${targetUrl}#sorted`,
                            type: 'data-sort'
                        });
                    }
                }
            } catch (err) {
                console.warn(`    \x1b[33m[Warning]\x1b[0m Failed navigating to ${targetUrl}: ${err.message}`);
            }
        }
    } finally {
        await browser.close();
    }

    // ── Export Results ──────────────────────────────────────────────────────
    const pagesArray = Array.from(discoveredPages.values());

    const result = {
        generatedAt: new Date().toISOString(),
        summary: {
            totalPages: pagesArray.length,
            totalJourneys: discoveredJourneys.length,
            consoleErrorsCount: consoleErrors.length
        },
        pages: pagesArray,
        journeys: discoveredJourneys,
        consoleErrors
    };

    const outputPath = resolve(process.cwd(), 'user-journeys.json');
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    console.log('\n\x1b[32m════════════════════════════════════════════════════════════════\x1b[0m');
    console.log(`\x1b[1m\x1b[32m✔ Crawl Completed Successfully!\x1b[0m`);
    console.log(`  - Discovered Pages:    \x1b[1m${pagesArray.length}\x1b[0m`);
    console.log(`  - Discovered Journeys: \x1b[1m${discoveredJourneys.length}\x1b[0m`);
    console.log(`  - Console Errors:      \x1b[1m${consoleErrors.length}\x1b[0m`);
    console.log(`  - Output Map:          \x1b[34m${outputPath}\x1b[0m`);
    console.log('\x1b[32m════════════════════════════════════════════════════════════════\x1b[0m\n');
}

main().catch((err) => {
    console.error('\x1b[31mError during user journey crawl:\x1b[0m', err);
    process.exit(1);
});
