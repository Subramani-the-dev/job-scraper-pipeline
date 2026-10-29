/* eslint-disable @typescript-eslint/triple-slash-reference -- required by the project scaffold standard */
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
});
