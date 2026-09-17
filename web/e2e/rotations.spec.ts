import { test, expect } from '@playwright/test';
import { getPlayerFill, getPlayerPageRect } from './testUtils';

function roundPoint(rect: { centerX: number; centerY: number }) {
  return { x: Math.round(rect.centerX), y: Math.round(rect.centerY) };
}

test.describe('Rotazioni volley - percorso principale', () => {
  test('carica lo schema di default con 6 giocatori', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.court-stage canvas')).toBeVisible();
    const rect = await getPlayerPageRect(page, 'P');
    expect(rect.width).toBeGreaterThan(0);
  });

  test('cambiare rotazione muove i giocatori e aggiorna il pannello azione', async ({ page }) => {
    await page.goto('/');
    const before = await getPlayerPageRect(page, 'P');

    const rotation = page.locator('[data-tutorial="rotation"]');
    await rotation.locator('[data-tutorial="rotation-receive"]').getByRole('button', { name: 'P5' }).click();
    await page.waitForTimeout(600);

    const after = await getPlayerPageRect(page, 'P');
    expect(roundPoint(after)).not.toEqual(roundPoint(before));

    const phaseLabels = await page.locator('[data-tutorial="phase"] button').allTextContents();
    expect(phaseLabels).toEqual(['Base', 'Ricezione', 'Alzata', 'Attacco', 'Cambio']);
  });

  test('cambiare fase muove i giocatori', async ({ page }) => {
    await page.goto('/');
    const before = await getPlayerPageRect(page, 'P');

    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Servizio' }).click();
    await page.waitForTimeout(600);

    const after = await getPlayerPageRect(page, 'P');
    expect(roundPoint(after)).not.toEqual(roundPoint(before));
  });

  test('cliccare un giocatore lo evidenzia', async ({ page }) => {
    await page.goto('/');
    expect(await getPlayerFill(page, 'O')).toBe('#efa581');

    const rect = await getPlayerPageRect(page, 'O');
    await page.mouse.click(rect.centerX, rect.centerY);
    expect(await getPlayerFill(page, 'O')).toBe('#66dd66');

    await page.mouse.click(rect.centerX, rect.centerY);
    expect(await getPlayerFill(page, 'O')).toBe('#efa581');
  });

  test('il tutorial si può scorrere fino alla fine e chiudere', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Tutorial' }).click();
    await expect(page.locator('.tutorial-overlay')).toBeVisible();

    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Avanti' }).click();
    }
    await page.getByRole('button', { name: 'Fine' }).click();
    await expect(page.locator('.tutorial-overlay')).toHaveCount(0);
  });

  test('il layout è responsive senza overflow orizzontale a 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
