import { test, expect } from '@playwright/test';
import { getPlayerPageRect, selectReceiveRotation } from './testUtils';

// Liberos are part of the scheme now (authored in the editor, see
// liberoSwaps): in the default scheme L1 replaces the back-row middle in
// receive at P2, and sits benched (left of the court) otherwise.
test.describe('Libero', () => {
  test('in ricezione il libero prende il posto del centrale di seconda linea', async ({ page }) => {
    await page.goto('/');

    // Default load: P2, servizio -> no swap, L1 is on the bench and C1 plays.
    const c1Before = await getPlayerPageRect(page, 'C1');
    const l1Bench = await getPlayerPageRect(page, 'L1');

    await selectReceiveRotation(page, 'P2');
    await page.waitForTimeout(700);

    const l1Rect = await getPlayerPageRect(page, 'L1');
    expect(Math.round(l1Rect.centerX)).toBe(Math.round(c1Before.centerX));
    expect(Math.round(l1Rect.centerY)).toBe(Math.round(c1Before.centerY));

    // C1 itself goes to the bench, in the slot L1 just left.
    const c1After = await getPlayerPageRect(page, 'C1');
    expect(Math.round(c1After.centerX)).toBe(Math.round(l1Bench.centerX));
    expect(Math.round(c1After.centerY)).toBe(Math.round(l1Bench.centerY));
  });

  test('il libero resta in campo quando si cambia fase', async ({ page }) => {
    await page.goto('/');
    await selectReceiveRotation(page, 'P2');
    await page.waitForTimeout(700);
    const c1Benched = await getPlayerPageRect(page, 'C1');

    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
    await page.waitForTimeout(700);

    const c1 = await getPlayerPageRect(page, 'C1');
    expect(Math.round(c1.centerX)).toBe(Math.round(c1Benched.centerX));
    expect(Math.round(c1.centerY)).toBe(Math.round(c1Benched.centerY));
  });
});
