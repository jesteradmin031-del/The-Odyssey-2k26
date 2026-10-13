import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:4173/api/health',
    reuseExistingServer: false,
    env: {
      PORT: '4173',
      HOST: '127.0.0.1',
      ALLOWED_ORIGINS: 'http://127.0.0.1:4173',
      OPENAI_API_KEY: '',
      ORS_API_KEY: '',
      AUTH_DB_PATH: ':memory:',
      NODE_ENV: 'test',
    },
  },
});
