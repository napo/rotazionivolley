import { test, expect } from '@playwright/test';
import { dragPlayer, openNewSchemeEditor, selectReceiveRotation } from './testUtils';

test.describe('Falli di posizione', () => {
  test('si passa dalla vista di un singolo giocatore alla vista completa', async ({ page }) => {
    await page.goto('/');
    await selectReceiveRotation(page, 'P2');
    const panel = page.locator('[data-tutorial="faults"]');
    await panel.getByRole('button', { name: 'Mostra' }).click();

    const whole = panel.getByRole('button', { name: 'Tutta la formazione' });
    await expect(whole).toHaveAttribute('aria-pressed', 'true');

    await panel.getByRole('button', { name: 'P', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'P', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(panel).toContainText(/P — zona \d/);

    await whole.click();
    await expect(whole).toHaveAttribute('aria-pressed', 'true');
    await expect(panel).not.toContainText(/P — zona \d/);
  });

  test("nell'editor un fallo creato trascinando un giocatore viene segnalato", async ({ page }) => {
    await page.goto('/');
    await openNewSchemeEditor(page);
    await selectReceiveRotation(page, 'P2');
    // "Base" defines the zones themselves, so a fault can only appear in the reception formation.
    await page.locator('.config-editor [data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
    await expect(page.locator('.config-editor .fault-panel__alert')).toHaveCount(0);

    // The setter is in the front row at P2: dragging it to the back of the court breaks the order.
    await dragPlayer(page, 'P', 0, 330);
    await expect(page.locator('.config-editor [role="alert"].fault-panel__alert')).toContainText('falli di posizione');
  });
});
