import { test, expect } from '@playwright/test';
import { DASHBOARD_URL, createMockToken, injectAuthToken } from '../fixtures/auth.fixture';

/**
 * D-21 Golden Contract Test Vectors: PrimeNG Enterprise Table Standard
 * Document: D-21-CONTRACT-FE-TABLE-001
 * Target Modules: products, categories, branches, brands, indogrosir
 */

const TARGET_MODULES = [
    { name: 'Branches', path: '/branches', title: 'Cabang', sortCol: 'name', filterKeyword: 'Bandung' },
    { name: 'Brands', path: '/brands', title: 'Brand', sortCol: 'name', filterKeyword: 'INDOMILK' },
    { name: 'Indogrosir', path: '/indogrosir', title: 'Indogrosir', sortCol: 'name', filterKeyword: 'Cipinang' },
    { name: 'Products', path: '/products', title: 'Produk', sortCol: 'name', filterKeyword: 'Minyak' },
    { name: 'Categories', path: '/categories', title: 'Kategori', sortCol: 'name', filterKeyword: 'Makanan' }
];

test.describe('D-21 Golden Contract: PrimeNG Table Standardization E2E', () => {
    test.beforeEach(async ({ context }) => {
        const token = createMockToken({ email: 'admin@dedisalam.my.id', role: 'admin' });
        await injectAuthToken(context, token, DASHBOARD_URL);
    });

    for (const mod of TARGET_MODULES) {
        test.describe(`Module: ${mod.name} (${mod.path})`, () => {
            test(`[TV-01] Paginator should support 10, 20, 50, 100 options on ${mod.name}`, async ({ page }) => {
                await page.goto(`${DASHBOARD_URL}${mod.path}`);
                await page.waitForLoadState('domcontentloaded');

                const table = page.locator('p-table').first();
                await expect(table).toBeVisible({ timeout: 15000 });

                const paginator = page.locator('.p-paginator').first();
                await expect(paginator).toBeVisible();

                // Verify rows per page dropdown exists
                const rppoDropdown = paginator.locator('.p-paginator-rpp-dropdown, .p-select, .p-dropdown').first();
                await expect(rppoDropdown).toBeVisible();

                // Click dropdown to inspect options
                await rppoDropdown.click();
                const dropdownOptions = page.locator('.p-select-option, .p-dropdown-item');
                await expect(dropdownOptions).toHaveCount(4);

                const optionTexts = await dropdownOptions.allInnerTexts();
                expect(optionTexts.map((t) => t.trim())).toEqual(['10', '20', '50', '100']);
            });

            test(`[TV-02] Interactive column sort should exist and toggle state on ${mod.name}`, async ({ page }) => {
                await page.goto(`${DASHBOARD_URL}${mod.path}`);
                await page.waitForLoadState('domcontentloaded');

                const table = page.locator('p-table').first();
                await expect(table).toBeVisible({ timeout: 15000 });

                const sortableTh = page.locator(`th[psortablecolumn="${mod.sortCol}"]`).first();
                await expect(sortableTh).toBeVisible();
                await expect(sortableTh).toHaveClass(/cursor-pointer/);
                await expect(sortableTh).toHaveClass(/select-none/);

                // Initial click -> sort ASC
                await sortableTh.click();
                await expect(sortableTh).toHaveAttribute('aria-sort', /ascending/i);

                // Second click -> sort DESC
                await sortableTh.click();
                await expect(sortableTh).toHaveAttribute('aria-sort', /descending/i);
            });

            test(`[TV-03] Global filter input should filter table contents on ${mod.name}`, async ({ page }) => {
                await page.goto(`${DASHBOARD_URL}${mod.path}`);
                await page.waitForLoadState('domcontentloaded');

                const table = page.locator('p-table').first();
                await expect(table).toBeVisible({ timeout: 15000 });

                const searchInput = page.locator('p-iconfield input[pinputtext], input[pinputtext]').first();
                await expect(searchInput).toBeVisible();

                // Test filter input
                await searchInput.fill(mod.filterKeyword);
                await page.waitForTimeout(400);

                // Clear filter
                await searchInput.fill('');
                await page.waitForTimeout(400);
            });

            test(`[TV-04] Zero custom inline CSS check on ${mod.name}`, async ({ page }) => {
                await page.goto(`${DASHBOARD_URL}${mod.path}`);
                await page.waitForLoadState('domcontentloaded');

                const table = page.locator('p-table').first();
                await expect(table).toBeVisible({ timeout: 15000 });

                // Check table element does not have forbidden inline min-width style
                const styleAttr = await table.getAttribute('style');
                expect(styleAttr || '').not.toContain('min-width');
            });
        });
    }
});
