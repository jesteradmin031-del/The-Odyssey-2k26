import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('localroute-guest', 'true'));
});
async function translator(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Translator', exact: true }).click();
}
async function fakeSpeech(page) {
  await page.addInitScript(() => {
    window.SpeechRecognition = class {
      constructor() {
        window.testRecognition = this;
      }
      start() {}
      stop() {
        this.onend?.();
      }
      abort() {
        this.aborted = true;
        this.onend?.();
      }
    };
  });
}
test('swapping before translating preserves the entered text', async ({ page }) => {
  await translator(page);
  const input = page.getByRole('textbox', { name: 'Text to translate' });
  await input.fill('Please help me');
  await page.getByRole('button', { name: 'Swap languages' }).click();
  await expect(input).toHaveValue('Please help me');
});
test('changing source language cancels speech and ignores late transcripts', async ({ page }) => {
  await fakeSpeech(page);
  await translator(page);
  await page.getByRole('button', { name: 'Voice input', exact: true }).click();
  await page.evaluate(() => {
    window.lateResult = window.testRecognition.onresult;
  });
  await page.getByRole('combobox', { name: 'Source language' }).selectOption('hi');
  expect(await page.evaluate(() => window.testRecognition.aborted)).toBe(true);
  await page.evaluate(() =>
    window.lateResult({ results: [[{ transcript: 'stale English speech' }]] }),
  );
  await expect(page.getByRole('textbox', { name: 'Text to translate' })).toHaveValue(
    'Where is the metro station?',
  );
  await expect(page.getByRole('button', { name: 'Voice input', exact: true })).toBeVisible();
});
test('voice transcripts respect the translation limit', async ({ page }) => {
  await fakeSpeech(page);
  await translator(page);
  await page.getByRole('button', { name: 'Voice input', exact: true }).click();
  await page.evaluate(() =>
    window.testRecognition.onresult({ results: [[{ transcript: 'x'.repeat(3100) }]] }),
  );
  expect((await page.getByRole('textbox', { name: 'Text to translate' }).inputValue()).length).toBe(
    3000,
  );
});
test('keyboard selection with no search results cannot crash the app', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const destination = page.getByRole('combobox', { name: 'Destination', exact: true });
  await destination.fill('zzznomatchingplace');
  await expect(page.getByText('No places found.', { exact: false })).toBeVisible();
  await destination.press('ArrowUp');
  await destination.press('Enter');
  await expect(destination).toHaveValue('zzznomatchingplace');
  await expect(destination).toHaveAttribute('aria-expanded', 'true');
  expect(errors).toEqual([]);
});
