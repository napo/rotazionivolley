import { test, expect } from '@playwright/test';
import { exportSubmit, openCourtTool, openExportMenu, selectReceiveRotation } from './testUtils';

test.describe('Export', () => {
  test('esporta PNG', async ({ page }) => {
    await page.goto('/');
    await openExportMenu(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportSubmit(page).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test('esporta PDF a pagina singola', async ({ page }) => {
    await page.goto('/');
    await openExportMenu(page);
    await page.getByLabel('PDF (pagina singola)').check();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportSubmit(page).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('la sequenza pipeline "fasi della rotazione corrente" genera un PDF con una pagina per fase', async ({
    page,
  }) => {
    await page.goto('/');
    await openExportMenu(page);
    await page.getByLabel('PDF (sequenza / pipeline)').check();
    // Default state on load: P2, servizio.
    await page.getByLabel('Servizio rotazione P2').check();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportSubmit(page).click(),
    ]);
    const path = await download.path();
    expect(path).toBeTruthy();
    // Default state on load: P2, servizio -> Base/Servizio/Cambio = 3 pages.
    const buffer = await download.createReadStream().then(streamToBuffer);
    const pageCount = countPdfPages(buffer);
    expect(pageCount).toBe(3);
  });

  test('la sequenza pipeline "completa" genera un PDF con una pagina per ogni fase x rotazione', async ({ page }) => {
    // 42 rasterized pages is the slowest export path; give it real headroom
    // under parallel test-worker CPU contention rather than the 30s default.
    test.setTimeout(60000);
    await page.goto('/');
    await openExportMenu(page);
    await page.getByLabel('PDF (sequenza / pipeline)').check();
    await page.getByLabel('Tutte le fasi').check();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 45000 }),
      exportSubmit(page).click(),
    ]);
    const buffer = await download.createReadStream().then(streamToBuffer);
    const pageCount = countPdfPages(buffer);
    // 7 phases x 6 rotations for the default ricezione-a-3 config.
    expect(pageCount).toBe(42);
  });

  test('il PDF in sequenza aggiunge competenze e falli (tutta la squadra, poi un giocatore alla volta)', async ({ page }) => {
    await page.goto('/');
    await selectReceiveRotation(page, 'P1');
    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
    await openCourtTool(page, 'Competenze di ricezione');

    await openExportMenu(page);
    await page.getByLabel('PDF (sequenza / pipeline)').check();
    await page.getByLabel('Ricezione rotazione P1').check();
    // Ticked to match the screen: the competence map is open, the fault view isn't.
    const menu = page.locator('.export-menu');
    await expect(menu.getByLabel('Competenze di ricezione')).toBeChecked();
    await expect(menu.getByLabel(/Falli di posizione: tutta la squadra/)).not.toBeChecked();
    await menu.getByLabel(/Falli di posizione: tutta la squadra/).check();

    const [download] = await Promise.all([page.waitForEvent('download'), exportSubmit(page).click()]);
    const pageCount = countPdfPages(await download.createReadStream().then(streamToBuffer));
    // 5 receive phases + 1 competence map + faults (whole team + P, S1, C2, O, S2, L1) of the reception formation.
    expect(pageCount).toBe(5 + 1 + 7);
  });

  test('le caselle di falli e competenze compaiono solo per una sequenza con la ricezione', async ({ page }) => {
    await page.goto('/');
    await openExportMenu(page);
    await page.getByLabel('PDF (sequenza / pipeline)').check();
    const menu = page.locator('.export-menu');
    await page.getByLabel('Servizio rotazione P2').check();
    await expect(menu).not.toContainText('Falli di posizione');
    await page.getByLabel('Ricezione rotazione P2').check();
    await expect(menu.getByLabel(/Falli di posizione: tutta la squadra/)).toBeVisible();
    await page.getByLabel('Tutte le fasi').check();
    await expect(menu.getByLabel(/Falli di posizione: tutta la squadra/)).toBeVisible();
  });

  test('PNG e PDF a pagina singola esportano quello che si vede sul campo', async ({ page }) => {
    await page.goto('/');
    await selectReceiveRotation(page, 'P1');
    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
    await openCourtTool(page, 'Competenze di ricezione');
    await openExportMenu(page);
    await expect(page.locator('.export-menu__note')).toContainText('Competenze di ricezione');
    await expect(page.locator('.export-menu').getByLabel('Competenze di ricezione')).toHaveCount(0);
  });
});

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk as Buffer));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

function countPdfPages(buffer: Buffer): number {
  const matches = buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}
