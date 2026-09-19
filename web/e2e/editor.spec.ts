import { test, expect } from '@playwright/test';
import { dragPlayer, getPlayerPageRect, openNewSchemeEditor } from './testUtils';

test.describe('Editor schemi', () => {
  test('clonare, trascinare un giocatore e salvare aggiorna il campo principale', async ({
    page,
  }) => {
    await page.goto('/');
    await openNewSchemeEditor(page);
    await expect(page.locator('.config-editor__workspace')).toBeVisible();

    const before = await getPlayerPageRect(page, 'P');
    await dragPlayer(page, 'P', 200, 120);
    const after = await getPlayerPageRect(page, 'P');
    expect(Math.round(after.centerX)).not.toBe(Math.round(before.centerX));

    await page.getByRole('button', { name: 'Salva' }).click();

    // Editor closes (view switches back) and the main viewer now offers a config picker.
    await expect(page.locator('.config-editor')).toHaveCount(0);
    await expect(page.locator('.schema-switcher__trigger')).toContainText('(copia)');
    const mainRect = await getPlayerPageRect(page, 'P');
    expect(mainRect.width).toBeGreaterThan(0);
  });

  test('scaricare il JSON produce un file valido con le coordinate modificate', async ({ page }) => {
    await page.goto('/');
    await openNewSchemeEditor(page);

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

    expect(config.id).toMatch(/^modulo-a-tre-con-due-laterali.*copia/);
    expect(config.positions.base['2'].O).toBeDefined();
  });

  test('il bollo P2 trasforma l\'opposto in secondo palleggiatore e viceversa', async ({ page }) => {
    await page.goto('/');
    await openNewSchemeEditor(page);

    const badge = page.locator('.config-editor__badge');
    await expect(badge).toHaveText('P2');
    await expect(page.getByText(/con due palleggiatori/)).toBeVisible();

    await badge.click();
    await expect(badge).toHaveText('O');
    await expect(page.getByText(/con un solo palleggiatore/)).toBeVisible();

    await badge.click();
    await expect(badge).toHaveText('P2');
  });

  test('uno schema salvato si può cancellare dall\'elenco', async ({ page }) => {
    page.on('dialog', (dialog) => void dialog.accept());
    await page.goto('/');
    await openNewSchemeEditor(page);
    await page.getByRole('button', { name: 'Salva' }).click();

    const trigger = page.locator('.schema-switcher__trigger');
    await expect(trigger).toContainText('(copia)');
    await trigger.click();
    await page.getByRole('button', { name: /^Cancella .*\(copia\)/ }).click();

    await expect(trigger).not.toContainText('(copia)');
  });
});
