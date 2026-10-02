import { join } from 'node:path';
import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await electron.launch({ args: [join(__dirname, '..', 'out', 'main', 'index.js')] });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await app.close();
});

test('window opens with the app title', async () => {
  await expect(page.getByRole('heading', { name: 'Realtime Interview Assistant' })).toBeVisible();
});

test('renderer cannot reach Node.js', async () => {
  const exposed = await page.evaluate(() => ({
    hasRequire: typeof (window as unknown as Record<string, unknown>)['require'] !== 'undefined',
    hasProcess: typeof (window as unknown as Record<string, unknown>)['process'] !== 'undefined',
  }));
  expect(exposed.hasRequire).toBe(false);
  expect(exposed.hasProcess).toBe(false);
  await expect(page.getByText('blocked (good)')).toBeVisible();
});

test('IPC round-trip succeeds via the preload bridge', async () => {
  const result = await page.evaluate(() => window.ria.ping({ nonce: 'e2e-nonce' }));
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.nonce).toBe('e2e-nonce');
});

test('invalid IPC request is rejected by main validation', async () => {
  const result = await page.evaluate(() => window.ria.ping({ nonce: 'x'.repeat(5000) }));
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe('IPC_INVALID_REQUEST');
});
