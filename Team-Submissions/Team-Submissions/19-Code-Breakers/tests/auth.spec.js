import { test, expect } from '@playwright/test';
test('3D landing and real account lifecycle', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Every journey/ })).toBeVisible();
  await expect(page.locator('.city-canvas canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Pause city animation' }).click();
  await expect(page.getByRole('button', { name: 'Play city animation' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.screenshot({ path: 'docs/landing-preview.png', fullPage: true });
  await page.getByRole('button', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Demo Explorer');
  await page.getByLabel('Email address', { exact: true }).fill('browser-test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('browser-test-password');
  await page.getByLabel('Confirm password', { exact: true }).fill('different-password');
  await page.getByRole('button', { name: 'Create my account', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('do not match');
  await page.getByLabel('Confirm password', { exact: true }).fill('browser-test-password');
  await page.screenshot({ path: 'docs/signup-preview.png', fullPage: true });
  await page.getByRole('button', { name: 'Create my account', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Every journey/ })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByLabel('Email address', { exact: true }).fill('browser-test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await page.getByLabel('Password', { exact: true }).fill('browser-test-password');
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Where are we headed?' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('landing and signup remain usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Explore demo', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'docs/landing-mobile-preview.png', fullPage: true });
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await expect(page.getByLabel('Confirm password', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Just looking? Explore the demo', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Preview demo', exact: true })).toBeVisible();
});
