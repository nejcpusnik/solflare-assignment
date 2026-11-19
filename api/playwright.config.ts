import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export default defineConfig({
  testDir: './tests',
  // Tests are independent, so they can safely run in parallel.
  fullyParallel: true,
  // One retry absorbs a network blip against the live API without hiding real failures.
  retries: 1,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://wallet-api.solflare.com',
    // Solflare generates a uuid4 for every app install and sends it as
    // "Authorization: Bearer {uuid4}" on every request. We do the same:
    // a fresh uuid4 per test run, attached to every request by default.
    extraHTTPHeaders: {
      Authorization: `Bearer ${randomUUID()}`,
    },
  },
});
