import { test, expect } from '@playwright/test';

test.describe('Export', () => {
  test('esporta PNG', async ({ page }) => {
    await page.goto('/');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Esporta' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test('esporta PDF a pagina singola', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('PDF (pagina singola)').check();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Esporta' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('la sequenza pipeline "fasi della rotazione corrente" genera un PDF con una pagina per fase', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('PDF (sequenza / pipeline)').check();
    await page.getByLabel('Tutte le fasi della rotazione corrente').check();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Esporta' }).click(),
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
    await page.getByLabel('PDF (sequenza / pipeline)').check();
    await page.getByLabel('Sequenza completa (fasi × rotazioni)').check();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 45000 }),
      page.getByRole('button', { name: 'Esporta' }).click(),
    ]);
    const buffer = await download.createReadStream().then(streamToBuffer);
    const pageCount = countPdfPages(buffer);
    // 7 phases x 6 rotations for the default ricezione-a-3 config.
    expect(pageCount).toBe(42);
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
