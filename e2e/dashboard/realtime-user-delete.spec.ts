import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';

async function emitSocketAck<T = any>(socket: Socket, event: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for Ack on ${event}`)), 10000);
        socket.emit(event, data, (res: any) => {
            clearTimeout(timer);
            resolve(res);
        });
    });
}

test.describe('Realtime User Deletion Flow', () => {
    test('should instantly remove deleted user from table in realtime via WebSocket without page refresh', async ({ page }) => {
        // 1. Authenticate as superadmin via REST /api/v1/auth/login
        const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'superadmin@example.com',
                password: 'Admin123!'
            })
        });
        const loginRes = await loginResponse.json();
        expect(loginRes?.success).toBe(true);
        const token = loginRes?.data?.accessToken;
        expect(token).toBeTruthy();

        // 2. Setup cookies and open dashboard on localhost:4000
        await page.context().addCookies([
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
                value: encodeURIComponent(JSON.stringify(loginRes.data?.user || { email: 'superadmin@example.com', role: 'admin' })),
                domain: 'localhost',
                path: '/',
                httpOnly: false,
                secure: false
            }
        ]);

        // Navigate to users management page
        await page.goto('http://localhost:4000/users');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('p-table', { timeout: 15000 });

        // 3. Connect to /users namespace as admin to create and delete a user
        const userSocket = io('http://localhost:3000/users', {
            auth: { token },
            transports: ['websocket', 'polling']
        });
        await new Promise((resolve) => userSocket.on('connect', resolve));

        const uniqueEmail = `rt_del_${Date.now()}@example.com`;
        const createRes = await emitSocketAck(userSocket, 'admin:users:create', {
            name: 'Realtime Target User',
            email: uniqueEmail,
            password: 'Password123!',
            role: 'user'
        });
        expect(createRes?.success).toBe(true);
        const createdUser = createRes?.data?.user || createRes?.data;
        const userId = createdUser?.id || createdUser?._id;
        expect(userId).toBeTruthy();

        console.log(`Created test user via Socket.IO: ${userId} (${uniqueEmail})`);

        // Wait up to 10s for the user to be visible in the table via realtime event
        const userRow = page.locator('tr', { hasText: uniqueEmail });
        await expect(userRow).toBeVisible({ timeout: 10000 });
        console.log('✅ Target user row is confirmed visible in table!');

        // 4. Now simulate ANOTHER client/admin deleting the user remotely via Socket.IO Ack RPC
        console.log(`Simulating remote deletion of user ${userId} via admin:users:delete...`);
        const delRes = await emitSocketAck(userSocket, 'admin:users:delete', { userId });
        expect(delRes?.success).toBe(true);

        // 5. Verify the user row disappears from the table IN REAL TIME without page refresh!
        await expect(userRow).not.toBeVisible({ timeout: 10000 });
        console.log('✅ Target user row DISAPPEARED in realtime without page reload!');

        // 6. Verify NO sync toast notification appeared (silent realtime update)
        const toast = page.locator('.p-toast-message');
        await expect(toast).toHaveCount(0);
        console.log('✅ Confirmed silent update: no sync toast displayed!');

        userSocket.disconnect();
    });
});
