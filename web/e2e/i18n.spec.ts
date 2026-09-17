import { test, expect } from '@playwright/test';

test.describe('Lingua e Info', () => {
  test('passa da italiano a inglese e la scelta resta dopo un reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Rotazioni di ricezione nella pallavolo' })).toBeVisible();

    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Volleyball reception rotations' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Scheme editor' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Volleyball reception rotations' })).toBeVisible();
  });

  test('il pannello Info mostra progetto, autore, codice sorgente e nota AI', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Info' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Maurizio Napolitano')).toBeVisible();
    await expect(dialog.getByRole('link', { name: /rotazionivolley/ })).toHaveAttribute(
      'href',
      'https://github.com/napo/rotazionivolley',
    );
    await expect(dialog.getByText(/intelligenza artificiale/)).toBeVisible();

    await page.getByRole('button', { name: 'Chiudi' }).click();
    await expect(dialog).toHaveCount(0);
  });
});
