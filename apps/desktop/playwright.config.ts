import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
});
