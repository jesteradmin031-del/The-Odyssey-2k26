import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('localroute-guest', 'true'));
});
test('route planner, search, saved places and preview', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Where are we headed?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'The direct way', exact: false })).toBeVisible();
  const walking = await page.locator('.route-numbers').first().innerText();
  await page.getByRole('button', { name: 'Cycle', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cycle', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.route-numbers').first()).not.toHaveText(walking);
  await page.getByRole('button', { name: 'Save destination', exact: true }).click();
  await page.getByRole('button', { name: 'Saved', exact: false }).first().click();
  await expect(page.locator('.saved-place')).toContainText('Cubbon Park');
  await page.reload();
  await page.getByRole('button', { name: 'Saved', exact: false }).first().click();
  await expect(page.locator('.saved-place')).toContainText('Cubbon Park');
  await page.locator('.saved-place').click();
  const destination = page.getByRole('combobox', { name: 'Destination', exact: true });
  await destination.fill('Coffee');
  await page.getByRole('option', { name: /Indian Coffee House/ }).click();
  await expect(destination).toHaveValue('Indian Coffee House');
  await page.getByRole('button', { name: 'Preview demo', exact: true }).click();
  await expect(page.locator('.trip-preview')).toContainText('DIRECTIONS PREVIEW');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.trip-preview')).toContainText('illustrative path');
  expect(errors).toEqual([]);
});
test('translator handles phrases, swaps, empty input and unavailable live translation', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Translator', exact: true }).click();
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.locator('.translation-result')).toContainText('ಮೆಟ್ರೋ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?');
  await expect(page.locator('.translation-result')).toContainText('Offline phrasebook');
  await page.getByRole('button', { name: 'Swap languages' }).click();
  await expect(page.getByRole('combobox', { name: 'Source language' })).toHaveValue('kn');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.locator('.translation-result')).toContainText('Where is the metro station?');
  await page.getByRole('textbox', { name: 'Text to translate' }).fill('');
  await expect(page.getByRole('button', { name: 'Translate', exact: true })).toBeDisabled();
  await page
    .getByRole('textbox', { name: 'Text to translate' })
    .fill('An arbitrary sentence not in the phrasebook');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Live translation is unavailable');
  await expect(page.getByRole('button', { name: 'Scan or upload an image' })).toBeVisible();
});
test('assistant, safety, future transport and mobile layout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'AI guide', exact: true }).click();
  await page.getByRole('button', { name: 'Find a coffee stop' }).click();
  await expect(page.locator('.chat-message').last()).toContainText('Indian Coffee House');
  await page.getByRole('button', { name: 'Safety', exact: true }).click();
  await page.getByRole('switch').click();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.safety-layer-badge')).toBeVisible();
  await page.getByRole('button', { name: 'Transport', exact: true }).click();
  await expect(page.locator('.transport-panel')).toContainText('not connected');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page.screenshot({ path: 'docs/mobile-preview.png', fullPage: true });
});
test('offline API failure still allows clearly labelled route and phrasebook demos', async ({
  page,
}) => {
  await page.route('**/api/**', (route) => route.abort());
  await page.goto('/');
  await expect(
    page.getByRole('status').filter({ hasText: 'Local server unavailable' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Preview demo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Translator', exact: true }).click();
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.locator('.translation-result')).toContainText('Offline phrasebook');
});
test('capture desktop demo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Preview demo', exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/desktop-preview.png', fullPage: true });
});
