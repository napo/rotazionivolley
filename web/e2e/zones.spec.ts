import { test, expect } from '@playwright/test';
import { openCourtTool, selectReceiveRotation } from './testUtils';

test.describe('Competenze di ricezione', () => {
  test('falli e competenze compaiono solo nella formazione di ricezione', async ({ page }) => {
    await page.goto('/');
    const faults = page.getByRole('tab', { name: /Falli di posizione/ });
    const zones = page.getByRole('tab', { name: 'Competenze di ricezione' });
    const phase = page.locator('[data-tutorial="phase"]');

    // Default: a serve rotation — neither applies, so there's no panel at all.
    await expect(page.locator('[data-tutorial="court-tools"]')).toHaveCount(0);
    await expect(faults).toHaveCount(0);
    await expect(zones).toHaveCount(0);

    // Receive "Base" defines the zones themselves: still no reception formation.
    await selectReceiveRotation(page, 'P1');
    await expect(page.locator('[data-tutorial="court-tools"]')).toHaveCount(0);

    await phase.getByRole('button', { name: 'Ricezione' }).click();
    await expect(faults).toBeVisible();
    await expect(zones).toBeVisible();

    // After the serve (set, attack, ...) players move freely.
    await phase.getByRole('button', { name: 'Alzata' }).click();
    await expect(faults).toHaveCount(0);
    await expect(zones).toHaveCount(0);
  });

  test('lo schema ha già le sue competenze; un lato in più segnala il conflitto, resta salvato e si può ripristinare', async ({
    page,
  }) => {
    await page.goto('/');
    await selectReceiveRotation(page, 'P1');
    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
    const panel = await openCourtTool(page, 'Competenze di ricezione');

    // Built-in P1: S2 (back row) takes the ball towards L1; S1 (front row) leaves it to L1.
    await expect(panel).toContainText('tra S2 e L1: palla di S2');
    await expect(panel).toContainText('tra L1 e S1: palla di L1');
    await expect(panel.getByRole('button', { name: 'Ripristina le zone di partenza' })).toHaveCount(0);

    await panel.getByRole('group', { name: 'Lati di competenza di L1' }).getByRole('button', { name: /Sinistra/ }).click();
    await expect(panel).toContainText('tra S2 e L1: la rivendicano entrambi');

    await page.reload();
    await selectReceiveRotation(page, 'P1');
    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
    await openCourtTool(page, 'Competenze di ricezione');
    await expect(panel).toContainText('tra S2 e L1: la rivendicano entrambi');
    // Opening the other tab swaps the content in the same space.
    await openCourtTool(page, 'Falli di posizione');
    await expect(panel).toContainText('Tutta la formazione');
    await openCourtTool(page, 'Competenze di ricezione');

    await panel.getByRole('button', { name: 'Ripristina le zone di partenza' }).click();
    await expect(panel).toContainText('tra S2 e L1: palla di S2');
    await expect(panel.getByRole('button', { name: 'Ripristina le zone di partenza' })).toHaveCount(0);
  });

  test('si dà una zona a chiunque tranne il palleggiatore, e togliendone una le altre si allargano', async ({ page }) => {
    await page.goto('/');
    await selectReceiveRotation(page, 'P1');
    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
    const panel = await openCourtTool(page, 'Competenze di ricezione');

    const addGroup = panel.getByRole('group', { name: 'Dai una zona a:' });
    // The front-row middle already has a zone in the built-in P1 map: only the opposite is left (never the setter).
    await expect(addGroup.getByRole('button')).toHaveText(['+ O']);

    await addGroup.getByRole('button', { name: 'Dai una zona a O' }).click();
    await expect(panel.getByRole('group', { name: 'Lati di competenza di O' })).toBeVisible();
    await expect(panel).toContainText(/tra (O e S2|S2 e O)/);

    await panel.getByRole('button', { name: 'Togli la zona di L1' }).click();
    await expect(panel.getByRole('group', { name: 'Lati di competenza di L1' })).toHaveCount(0);
    await expect(panel.locator('.zones-panel__summary')).not.toContainText('L1');
    await expect(addGroup.getByRole('button', { name: 'Dai una zona a L1' })).toBeVisible();
  });
});
