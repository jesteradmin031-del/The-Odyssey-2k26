import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
// Optional real OCR integration check. Needs network for the first worker/model load.
// PowerShell: $env:TEST_OCR='1'; npm run test:ui -- tests/ocr.spec.js
test('scan a real image locally and translate the extracted text', async ({ page }) => {
  test.skip(
    process.env.TEST_OCR !== '1',
    'Enable TEST_OCR=1 to download the OCR model and run real OCR.',
  );
  test.setTimeout(120000);
  await page.addInitScript(() => sessionStorage.setItem('localroute-guest', 'true'));
  await page.goto('/');
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 280;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, 1400, 280);
    context.fillStyle = 'black';
    context.font = '56px Arial';
    context.fillText('Where is the metro station?', 55, 155);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  mkdirSync('tests/fixtures', { recursive: true });
  writeFileSync('tests/fixtures/metro-sign.png', Buffer.from(image, 'base64'));
  await page.getByRole('button', { name: 'Translator', exact: true }).click();
  await page.getByLabel('Upload image to scan').setInputFiles('tests/fixtures/metro-sign.png');
  await expect(page.getByRole('status').filter({ hasText: 'Scan complete' })).toBeVisible({
    timeout: 100000,
  });
  await expect(page.getByRole('textbox', { name: 'Text to translate' })).toHaveValue(
    /Where is the metro station/,
  );
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.locator('.translation-result')).toContainText('ಮೆಟ್ರೋ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?');
  await page.screenshot({ path: 'docs/translator-preview.png', fullPage: true });
});
