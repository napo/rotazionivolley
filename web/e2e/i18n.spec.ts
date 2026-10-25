import { test, expect } from '@playwright/test';

test.describe('Lingua e Info', () => {
  test('passa da italiano a inglese e la scelta resta dopo un reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Rotazioni di ricezione nella pallavolo' })).toBeVisible();

    await page.locator('.language-switcher').selectOption('en');
    await expect(page.getByRole('heading', { name: 'Volleyball reception rotations' })).toBeVisible();
    await page.locator('.schema-switcher__trigger').click();
    await expect(page.getByRole('button', { name: /New scheme/ })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Volleyball reception rotations' })).toBeVisible();
  });

  test('la pagina Info mostra progetto, autore, codice sorgente e nota AI', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Info' }).click();

    // A full page in place of the court, not a dialog over it.
    const info = page.locator('.info-page');
    await expect(page.getByRole('heading', { name: 'Informazioni' })).toBeVisible();
    await expect(page.locator('.court-stage')).toHaveCount(0);
    await expect(info.getByText('Maurizio Napolitano')).toBeVisible();
    await expect(info.getByRole('link', { name: /rotazionivolley/ })).toHaveAttribute(
      'href',
      'https://github.com/napo/rotazionivolley',
    );
    await expect(info.getByText(/Claude AI/)).toBeVisible();

    await page.getByRole('button', { name: /Torna alle rotazioni/ }).click();
    await expect(info).toHaveCount(0);
    await expect(page.locator('.court-stage')).toBeVisible();
  });
});
