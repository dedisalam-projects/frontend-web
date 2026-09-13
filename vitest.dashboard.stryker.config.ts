/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

// Stryker-specific config: runs ONLY guard + service specs
// to minimize test-runner overhead per mutant
export default defineConfig({
    plugins: [
        angular({
            tsconfig: './projects/dashboard/tsconfig.spec.json',
        }) as any,
    ],
    resolve: {
        alias: {
            'shared-ui': new URL('./dist/shared-ui', import.meta.url).pathname,
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest-setup.ts'],
        include: [
            'projects/dashboard/src/app/guards/*.spec.ts',
            'projects/dashboard/src/app/pages/service/*.spec.ts',
        ],
        reporters: ['verbose'],
    },
});
