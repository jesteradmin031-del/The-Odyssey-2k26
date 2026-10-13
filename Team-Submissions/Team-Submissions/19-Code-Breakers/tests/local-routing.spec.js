import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('localroute-guest', 'true'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Route lab', exact: true }).click();
});

test('confirmed notice closes a path and produces a real local detour that survives reload', async ({
  page,
}) => {
  await expect(page.locator('.lab-distance')).toContainText('390');
  await page.getByRole('button', { name: 'Use sample notice for selected path' }).click();
  const apply = page.getByRole('button', { name: 'Close path and reroute' });
  await expect(apply).toBeDisabled();
  await page.getByRole('checkbox', { name: /I confirm this notice/ }).check();
  await apply.click();
  await expect(page.locator('.lab-distance')).toContainText('570');
  await expect(page.locator('.lab-impact')).toContainText('+180 m');
  await expect(page.locator('.closed-edge')).toHaveCount(1);
  await expect(page.locator('.lab-directions')).not.toContainText('Library steps');
  await page.screenshot({ path: 'docs/local-routing-preview.png', fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Route lab', exact: true }).click();
  await expect(page.locator('.lab-distance')).toContainText('570');
  await page.getByRole('button', { name: 'Reopen path', exact: true }).click();
  await expect(page.locator('.lab-distance')).toContainText('390');
});

test('preferences and report expose the calculation without route API requests', async ({
  page,
}) => {
  await expect(page.locator('.lab-distance')).toContainText('390');
  const requests = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/routes')) requests.push(r.url());
  });
  await page.getByLabel('Local route preference', { exact: true }).selectOption('stairs');
  await expect(page.locator('.lab-distance')).toContainText('570');
  await page.getByLabel('Local route preference', { exact: true }).selectOption('crossings');
  await expect(page.locator('.lab-distance')).toContainText('580');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence report' }).click();
  const download = await pending;
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk.toString();
  const report = JSON.parse(text);
  expect(report.selectedRoute.crossings).toBe(0);
  expect(report.selectedRoute.metres).toBe(580);
  expect(report.preference).toBe('crossings');
  expect(requests).toEqual([]);
});

test('Translator handoff and expired closure validation work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Translator', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Text to translate' })
    .fill('Library steps closed for repairs');
  await page.getByRole('button', { name: 'Send notice to Route lab' }).click();
  await expect(page.getByRole('textbox', { name: 'Local closure evidence' })).toHaveValue(
    'Library steps closed for repairs',
  );
  await page.getByLabel('Local closure expiry', { exact: true }).fill('2020-01-01T12:00');
  await page.getByRole('checkbox', { name: /I confirm this notice/ }).check();
  await page.getByRole('button', { name: 'Close path and reroute' }).click();
  await expect(page.getByRole('alert')).toContainText('future');
  await expect(page.locator('.lab-distance')).toContainText('390');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/local-routing-mobile.png', fullPage: true });
});

test('network import rejects bad data and path edits recalculate routing', async ({ page }) => {
  await page.getByText('Bring your own network', { exact: true }).click();
  await page
    .getByLabel('Import local network', { exact: true })
    .setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":1}'),
    });
  await expect(page.getByRole('alert')).toContainText('Network needs');
  await expect(page.locator('.lab-distance')).toContainText('390');
  await page.getByText('Edit selected path data', { exact: true }).click();
  await page.getByLabel('Distance in metres', { exact: true }).fill('1000');
  await page.getByRole('button', { name: 'Save path data' }).click();
  await expect(page.locator('.lab-distance')).toContainText('570');
  await expect(page.locator('.lab-directions')).not.toContainText('Library steps');
});

test('a timed closure automatically expires and restores the original route', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-01-01T12:00:00Z') });
  await page.reload();
  await page.getByRole('button', { name: 'Route lab', exact: true }).click();
  const expiry = await page.evaluate(() => {
    const date = new Date(Date.now() + 60000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  await page.getByRole('button', { name: 'Use sample notice for selected path' }).click();
  await page.getByLabel('Local closure expiry', { exact: true }).fill(expiry);
  await page.getByRole('checkbox', { name: /I confirm this notice/ }).check();
  await page.getByRole('button', { name: 'Close path and reroute' }).click();
  await expect(page.locator('.lab-distance')).toContainText('570');
  await page.clock.fastForward(61000);
  await expect(page.locator('.lab-distance')).toContainText('390');
  await expect(page.locator('.lab-closure')).toContainText('Expired');
  await expect(page.locator('.closed-edge')).toHaveCount(0);
});
