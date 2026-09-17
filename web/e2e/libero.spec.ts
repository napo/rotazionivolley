import { test, expect } from '@playwright/test';
import { getPlayerPageRect } from './testUtils';

test.describe('Libero', () => {
  test('attivare un libero sostituisce il centrale di seconda linea nella stessa posizione', async ({ page }) => {
    await page.goto('/');

    // Default load: P2, servizio, base. C1 is the back-row middle at rotation 2.
    const c1Before = await getPlayerPageRect(page, 'C1');

    await page.getByRole('button', { name: 'L1', exact: true }).click();
    await page.waitForTimeout(150);

    const l1Rect = await getPlayerPageRect(page, 'L1');
    expect(Math.round(l1Rect.centerX)).toBe(Math.round(c1Before.centerX));
    expect(Math.round(l1Rect.centerY)).toBe(Math.round(c1Before.centerY));

    // C1 itself should no longer be drawn.
    const c1After = await page.evaluate(() => window.__rvTestHooks?.getPlayerRect('C1') ?? null);
    expect(c1After).toBeNull();

    // Switching back to "Nessuno" restores C1.
    await page.getByRole('button', { name: 'Nessuno' }).click();
    await page.waitForTimeout(150);
    const c1Restored = await getPlayerPageRect(page, 'C1');
    expect(Math.round(c1Restored.centerX)).toBe(Math.round(c1Before.centerX));
  });

  test('il libero attivo resta applicato quando si cambia fase', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'L1', exact: true }).click();
    await page.waitForTimeout(150);

    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Servizio' }).click();
    await page.waitForTimeout(700);

    const rect = await page.evaluate(() => window.__rvTestHooks?.getPlayerRect('L1') ?? null);
    expect(rect).not.toBeNull();
    const c1 = await page.evaluate(() => window.__rvTestHooks?.getPlayerRect('C1') ?? null);
    expect(c1).toBeNull();
  });
});
