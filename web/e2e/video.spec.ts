import { test, expect } from '@playwright/test';

test.describe('Export video', () => {
  test('esporta una sequenza animata come webm', async ({ page }) => {
    await page.goto('/');
    const videoOption = page.getByLabel(/Video \(sequenza animata/);
    await expect(videoOption).toBeEnabled();
    await videoOption.check();
    // Default state on load: P2, servizio.
    await page.getByLabel('Servizio rotazione P2').check();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.getByRole('button', { name: 'Esporta' }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.webm$/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});
