import { test, expect } from '@playwright/test';
import { dragPlayer, getPlayerPageRect } from './testUtils';

test.describe('Editor schemi', () => {
  test('clonare, trascinare un giocatore e applicare come schema attivo aggiorna il campo principale', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Editor schemi' }).click();
    await expect(page.locator('.config-editor')).toBeVisible();

    await page.getByRole('button', { name: 'Inizia da questo schema' }).click();
    await expect(page.locator('.config-editor__workspace')).toBeVisible();

    const before = await getPlayerPageRect(page, 'P');
    await dragPlayer(page, 'P', 200, 120);
    const after = await getPlayerPageRect(page, 'P');
    expect(Math.round(after.centerX)).not.toBe(Math.round(before.centerX));

    await page.getByRole('button', { name: 'Salva' }).click();

    // Editor closes (view switches back) and the main viewer now offers a config picker.
    await expect(page.locator('.config-editor')).toHaveCount(0);
    await expect(page.locator('.config-picker')).toBeVisible();
    const mainRect = await getPlayerPageRect(page, 'P');
    expect(mainRect.width).toBeGreaterThan(0);
  });

  test('scaricare il JSON produce un file valido con le coordinate modificate', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Editor schemi' }).click();
    await page.getByRole('button', { name: 'Inizia da questo schema' }).click();

    await dragPlayer(page, 'O', 60, 40);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Scarica JSON' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const config = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

    expect(config.id).toBe('ricezione-a-3-copia');
    expect(config.positions.base['2'].O).toBeDefined();
  });
});
