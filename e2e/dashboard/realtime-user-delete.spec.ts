import { test, expect } from '@playwright/test';

test.describe('Realtime User Deletion Flow', () => {
    test('should instantly remove deleted user from table in realtime via WebSocket without page refresh', async ({ page }) => {
        // 1. Authenticate as superadmin to get accessToken
        const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'superadmin@example.com', password: 'Admin123!' })
        });
        const loginData = await loginRes.json();
        const token = loginData?.data?.accessToken;
        expect(token).toBeTruthy();

        // 2. Open dashboard on localhost:4000 with the superadmin token
        await page.goto(`http://localhost:4000/?token=${token}`);
        await page.waitForURL(/localhost:4000/, { timeout: 15000 });

        // Navigate to users management page
        await page.goto('http://localhost:4000/users');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('p-table', { timeout: 15000 });

        // 3. Create a unique user via backend API to test realtime deletion
        const uniqueEmail = `rt_del_${Date.now()}@example.com`;
        const regRes = await fetch('http://localhost:3000/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Realtime Target User',
                email: uniqueEmail,
                password: 'Password123!',
                role: 'user'
            })
        });
        const regData = await regRes.json();
        const userId = regData?.data?.user?.id || regData?.data?.id || regData?.data?._id;
        expect(userId).toBeTruthy();

        console.log(`Created test user: ${userId} (${uniqueEmail})`);

        // Wait up to 5s for the user to be visible in the table via realtime event or refresh
        const userRow = page.locator('tr', { hasText: uniqueEmail });
        await expect(userRow).toBeVisible({ timeout: 10000 });
        console.log('✅ Target user row is confirmed visible in table!');

        // 4. Now simulate ANOTHER client/admin deleting the user remotely
        console.log(`Simulating remote deletion of user ${userId}...`);
        const delRes = await fetch(`http://localhost:3000/api/v1/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const delData = await delRes.json();
        expect(delData.statusCode).toBe(200);

        // 5. Verify the user row disappears from the table IN REAL TIME without page refresh!
        await expect(userRow).not.toBeVisible({ timeout: 10000 });
        console.log('✅ Target user row DISAPPEARED in realtime without page reload!');

        // 6. Verify NO sync toast notification appeared (silent realtime update)
        const toast = page.locator('.p-toast-message');
        await expect(toast).toHaveCount(0);
        console.log('✅ Confirmed silent update: no sync toast displayed!');
    });
});
