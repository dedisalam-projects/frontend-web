/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
    plugins: [
        angular({
            tsconfig: './projects/auth/tsconfig.spec.json'
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
        include: ['projects/auth/src/**/*.spec.ts'],
        reporters: ['verbose'],
        coverage: {
            provider: 'v8',
            include: ['projects/auth/src/app/**/*.ts'],
            exclude: ['**/*.spec.ts', '**/main*.ts', '**/server.ts']
        }
    }
});
