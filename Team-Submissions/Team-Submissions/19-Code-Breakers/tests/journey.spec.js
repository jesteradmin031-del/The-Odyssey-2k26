import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('localroute-guest', 'true'));
  await page.goto('/');
});

test('adding and removing a stop changes the requested route', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'The direct way', exact: false })).toBeVisible();
  const request = page.waitForRequest(
    (r) =>
      r.url().endsWith('/api/routes') &&
      r.method() === 'POST' &&
      r.postDataJSON().stop?.id === 'coffee',
  );
  await page.locator('.stop-suggestion').filter({ hasText: 'Indian Coffee House' }).click();
  expect((await request).postDataJSON().stop.name).toBe('Indian Coffee House');
  await expect(page.locator('.route-card.selected')).toContainText('Via your stop');
  await page.getByRole('button', { name: 'Remove stop' }).click();
  await expect(page.getByRole('combobox', { name: 'Optional stop', exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'The direct way', exact: false })).toBeVisible();
});

test('reviewed translator text reaches notice check and updates destination only after confirmation', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Translator', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Text to translate' })
    .fill('Cubbon Park entrance closed. Use alternative entrance.');
  await page.getByRole('button', { name: 'Check this as a travel notice' }).click();
  await expect(page.getByRole('textbox', { name: 'Notice text' })).toHaveValue(
    /Cubbon Park entrance closed/,
  );
  await page.getByRole('button', { name: 'Check notice', exact: true }).click();
  await expect(page.getByText('Possible closure mentioned', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/notice-preview.png', fullPage: true });
  await page.getByRole('combobox', { name: 'Alternative destination', exact: true }).fill('museum');
  await page.getByRole('option', { name: /Visvesvaraya Museum/ }).click();
  const apply = page.getByRole('button', { name: 'Use alternative destination' });
  await expect(apply).toBeDisabled();
  await page.getByRole('checkbox', { name: /I checked the notice/ }).check();
  await apply.click();
  await expect(page.getByRole('button', { name: 'Destination updated' })).toBeDisabled();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Destination', exact: true })).toHaveValue(
    'Visvesvaraya Museum',
  );
});

test('expired notice blocks adaptation and trip card downloads with notes preserved across tabs', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Notice check', exact: true }).click();
  await page.getByRole('textbox', { name: 'Notice text' }).fill('Entrance closed');
  await page.getByLabel('Notice expiry', { exact: true }).fill('2020-01-01T12:00');
  await page.getByRole('button', { name: 'Check notice', exact: true }).click();
  await expect(page.getByText('This notice has expired', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Alternative destination', exact: true }),
  ).not.toBeVisible();
  await page.getByRole('button', { name: 'Trip card', exact: true }).click();
  await page.getByRole('textbox', { name: 'Trip notes' }).fill('Meet by the entrance');
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await page.getByRole('button', { name: 'Trip card', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Trip notes' })).toHaveValue(
    'Meet by the entrance',
  );
  await page.screenshot({ path: 'docs/trip-card-preview.png', fullPage: true });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download offline trip card' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('localroute-trip-card.html');
  const stream = await file.createReadStream();
  let html = '';
  for await (const chunk of stream) html += chunk.toString();
  expect(html).toContain('Meet by the entrance');
  expect(html).toContain('SIMULATED ROUTE');
});

test('new panels fit a mobile viewport and remain reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ['Notice check', 'Trip card', 'Translator', 'Saved']) {
    await page.getByRole('button', { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({ path: 'docs/redesign-mobile.png', fullPage: true });
});

test('guest and signed-in saved places remain separate', async ({ page }) => {
  await page.getByRole('button', { name: 'Save destination', exact: true }).click();
  const register = await page.request.post('/api/auth/register', {
    data: {
      name: 'Separate Explorer',
      email: 'separate-explorer@example.test',
      password: 'separate-test-password',
    },
  });
  expect(register.status()).toBe(201);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.locator('.saved-place')).toHaveCount(0);
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await page.getByRole('button', { name: 'Save destination', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Saved/ }).click();
  await expect(page.locator('.saved-place')).toContainText('Cubbon Park');
});
