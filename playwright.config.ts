import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration
 *
 * Modes:
 * - Local (laptop): headed browser, slowMo for visibility
 * - CI (Jenkins): headless, parallel workers
 *
 * Apps must be running before tests:
 * - Auth:      http://localhost:4002
 * - Dashboard: http://localhost:4000
 * - Landing:   http://localhost:4001
 * - Backend:   http://localhost:3000
 */

const isCI = !!process.env['CI'];

export default defineConfig({
    testDir: './e2e',
    fullyParallel: isCI,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 2 : 1,

    reporter: [['html', { outputFolder: 'playwright-report', open: isCI ? 'never' : 'on-failure' }], ['list']],

    use: {
        // Auth app is the entry point for login
        baseURL: process.env.BASE_URL || process.env.AUTH_URL || 'http://localhost:4002',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',

        // Local: headed with visible browser; CI: headless
        headless: isCI,
        launchOptions: {
            slowMo: isCI ? 0 : 50
        }
    },

    projects: [
        // Desktop
        {
            name: 'chromium-desktop',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 }
            }
        },
        {
            name: 'chromium-laptop',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1366, height: 768 }
            }
        },

        // Tablet
        {
            name: 'tablet',
            use: {
                ...devices['iPad Pro 11'],
                defaultBrowserType: 'chromium',
                viewport: { width: 768, height: 1024 }
            }
        },

        // Mobile
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] }
        },
        {
            name: 'mobile-safari',
            use: {
                ...devices['iPhone 13'],
                defaultBrowserType: 'chromium'
            }
        },

        // Firefox & WebKit (Only if explicitly enabled)
        ...(process.env['ENABLE_ALL_BROWSERS']
            ? [
                  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
                  { name: 'webkit', use: { ...devices['Desktop Safari'] } }
              ]
            : [])
    ],

    // Start apps automatically if PLAYWRIGHT_WEBSERVER=1
    ...(process.env['PLAYWRIGHT_WEBSERVER']
        ? {
              webServer: [
                  {
                      command: 'npm run serve:ssr:auth',
                      url: 'http://localhost:4002',
                      reuseExistingServer: true,
                      timeout: 60000
                  },
                  {
                      command: 'npm run serve:ssr:dashboard',
                      url: 'http://localhost:4000',
                      reuseExistingServer: true,
                      timeout: 60000
                  },
                  {
                      command: 'npm run serve:ssr:landing',
                      url: 'http://localhost:4001',
                      reuseExistingServer: true,
                      timeout: 60000
                  }
              ]
          }
        : {})
});