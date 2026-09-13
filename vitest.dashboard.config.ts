/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

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
        include: ['projects/dashboard/src/**/*.spec.ts'],
        exclude: ['projects/dashboard/src/app/pages/archive/**'],
        reporters: ['verbose'],
        coverage: {
            provider: 'v8',
            include: [
                'projects/dashboard/src/app/**/*.ts',
            ],
            exclude: [
                '**/*.spec.ts',
                '**/main*.ts',
                '**/server.ts',
                '**/app.routes.ts',
                '**/archive/**',
            ],
        },
    },
});
