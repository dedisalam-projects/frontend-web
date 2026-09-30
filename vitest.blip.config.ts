/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: './projects/blip/tsconfig.spec.json',
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
    include: ['projects/blip/src/**/*.spec.ts'],
    reporters: ['verbose'],
  },
});
