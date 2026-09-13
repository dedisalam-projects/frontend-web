/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

/**
 * Vitest config for integration tests.
 * Runs only *.integration.spec.ts files across all projects.
 * These tests verify cross-layer behavior: HTTP interceptors,
 * auth flow, service composition, and route guard chains.
 */
export default defineConfig({
    plugins: [
        angular({
            tsconfig: './projects/dashboard/tsconfig.spec.json'
        }) as any
    ],
    resolve: {
        alias: {
            'shared-ui': new URL('./dist/shared-ui', import.meta.url).pathname
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest-setup.ts'],
        include: ['projects/**/src/**/*.integration.spec.ts'],
        reporters: ['verbose'],
        testTimeout: 15000
    }
});
