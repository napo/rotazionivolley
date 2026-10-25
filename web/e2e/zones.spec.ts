import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findCourtNodeIds, getCourtNodeCentre, openCourtTool, openExportMenu, selectReceiveRotation } from './testUtils';

async function openReceptionZones(page: Page) {
  await selectReceiveRotation(page, 'P1');
  await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
  return openCourtTool(page, 'Competenze di ricezione');
}

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

    // Built-in P1: L1 takes the ball towards S2; S1 takes it towards L1.
    await expect(panel).toContainText('tra S2 e L1: palla di L1');
    await expect(panel).toContainText('tra L1 e S1: palla di S1');
    await expect(panel.getByRole('button', { name: 'Ripristina le zone di partenza' })).toHaveCount(0);

    // Outside edit mode it's only a legend.
    const rightOfS2 = panel.getByRole('group', { name: 'Lati di competenza di S2' }).getByRole('button', { name: /Destra/ });
    await expect(rightOfS2).toBeDisabled();
    await panel.getByRole('button', { name: 'Modifica' }).click();
    await rightOfS2.click();
    await expect(panel).toContainText('tra S2 e L1: la rivendicano entrambi');
    await expect(panel).toContainText('Modifiche non ancora salvate');
    await panel.getByRole('button', { name: 'Salva' }).click();
    await expect(panel.getByRole('button', { name: 'Modifica' })).toBeVisible();

    await page.reload();
    await selectReceiveRotation(page, 'P1');
    await page.locator('[data-tutorial="phase"]').getByRole('button', { name: 'Ricezione' }).click();
    await openCourtTool(page, 'Competenze di ricezione');
    await expect(panel).toContainText('tra S2 e L1: la rivendicano entrambi');
    // Opening the other tab swaps the content in the same space.
    await openCourtTool(page, 'Falli di posizione');
    await expect(panel).toContainText('Tutta la formazione');
    await openCourtTool(page, 'Competenze di ricezione');

    await panel.getByRole('button', { name: 'Modifica' }).click();
    await panel.getByRole('button', { name: 'Ripristina le zone di partenza' }).click();
    await expect(panel).toContainText('tra S2 e L1: palla di L1');
    await expect(panel.getByRole('button', { name: 'Ripristina le zone di partenza' })).toHaveCount(0);
    await panel.getByRole('button', { name: 'Salva' }).click();
  });

  test('si dà una zona a chiunque tranne il palleggiatore, e togliendone una le altre si allargano', async ({ page }) => {
    await page.goto('/');
    const panel = await openReceptionZones(page);
    await panel.getByRole('button', { name: 'Modifica' }).click();

    // Everyone but the setter has a zone in the built-in P1 map: freeing the opposite's makes it the only one to give.
    await panel.getByRole('button', { name: 'Togli la zona di O' }).click();
    const addGroup = panel.getByRole('group', { name: 'Dai una zona a:' });
    await expect(addGroup.getByRole('button')).toHaveText(['+ O']);

    await addGroup.getByRole('button', { name: 'Dai una zona a O' }).click();
    await expect(panel.getByRole('group', { name: 'Lati di competenza di O' })).toBeVisible();
    await expect(panel).toContainText(/tra (O e S2|S2 e O)/);

    await panel.getByRole('button', { name: 'Togli la zona di L1' }).click();
    await expect(panel.getByRole('group', { name: 'Lati di competenza di L1' })).toHaveCount(0);
    await expect(panel.locator('.zones-panel__summary')).not.toContainText('L1');
    await expect(addGroup.getByRole('button', { name: 'Dai una zona a L1' })).toBeVisible();
  });

  test('le modifiche non salvate si scartano con Annulla, o si salvano/scartano cambiando rotazione', async ({ page }) => {
    await page.goto('/');
    const panel = await openReceptionZones(page);
    const rightOfS2 = panel.getByRole('group', { name: 'Lati di competenza di S2' }).getByRole('button', { name: /Destra/ });

    await panel.getByRole('button', { name: 'Modifica' }).click();
    await rightOfS2.click();
    await panel.getByRole('button', { name: 'Annulla' }).click();
    await expect(panel).toContainText('tra S2 e L1: palla di L1');

    await panel.getByRole('button', { name: 'Modifica' }).click();
    await rightOfS2.click();
    page.once('dialog', (dialog) => void dialog.accept());
    await selectReceiveRotation(page, 'P6');
    await openReceptionZones(page);
    await expect(panel).toContainText('tra S2 e L1: la rivendicano entrambi');
  });

  test('il "+" aggiunge un pallino da spostare; il doppio clic lo elimina dopo la conferma', async ({ page }) => {
    // Many canvas round trips: slow when the whole suite runs in parallel.
    test.setTimeout(90_000);
    await page.goto('/');
    const panel = await openReceptionZones(page);
    await panel.getByRole('button', { name: 'Modifica' }).click();

    const before = await findCourtNodeIds(page, 'zone-vertex-');
    const splits = await findCourtNodeIds(page, 'zone-split-');
    expect(splits.length).toBeGreaterThan(0);
    const plus = await getCourtNodeCentre(page, splits[0]!);
    await page.mouse.click(plus.x, plus.y);
    const after = await findCourtNodeIds(page, 'zone-vertex-');
    expect(after).toHaveLength(before.length + 1);
    const added = after.find((id) => !before.includes(id))!;

    // The new dot is where the "+" was, and can be dragged away.
    const start = await getCourtNodeCentre(page, added);
    expect(Math.abs(start.x - plus.x)).toBeLessThan(2);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 25, start.y + 15, { steps: 8 });
    await page.mouse.up();
    const moved = await getCourtNodeCentre(page, added);
    expect(Math.hypot(moved.x - start.x, moved.y - start.y)).toBeGreaterThan(10);

    // Double click: asks first; "Annulla" keeps it. (Konva only sees a
    // double click within 400 ms, which a busy parallel run can miss: retried.)
    const dialog = page.getByRole('alertdialog', { name: 'Eliminare il punto?' });
    const askToRemove = async (id: string) => {
      await expect(async () => {
        const p = await getCourtNodeCentre(page, id);
        await page.mouse.dblclick(p.x, p.y);
        await expect(dialog).toBeVisible({ timeout: 1000 });
      }).toPass();
    };
    await askToRemove(added);
    await dialog.getByRole('button', { name: 'Annulla' }).click();
    expect(await findCourtNodeIds(page, 'zone-vertex-')).toContain(added);

    // "Elimina" with "don't ask again": gone, and the next one goes without asking.
    await askToRemove(added);
    await dialog.getByRole('checkbox', { name: /Non chiederlo più/ }).check();
    await dialog.getByRole('button', { name: 'Elimina' }).click();
    expect(await findCourtNodeIds(page, 'zone-vertex-')).toEqual(before);

    await page.mouse.click(plus.x, plus.y);
    const again = (await findCourtNodeIds(page, 'zone-vertex-')).find((id) => !before.includes(id))!;
    await expect(async () => {
      const p = await getCourtNodeCentre(page, again);
      await page.mouse.dblclick(p.x, p.y);
      expect(await findCourtNodeIds(page, 'zone-vertex-')).toEqual(before);
    }).toPass();
    await expect(dialog).toHaveCount(0);
    await panel.getByRole('button', { name: /Salva|Fine/ }).click();

    // The question comes back from the Info page.
    await page.getByRole('button', { name: 'Info' }).click();
    const ask = page.getByRole('checkbox', { name: /Chiedi conferma prima di eliminare un punto/ });
    await expect(ask).not.toBeChecked();
    await ask.check();
    await page.getByRole('button', { name: /Torna alle rotazioni/ }).click();
    await openReceptionZones(page);
    await panel.getByRole('button', { name: 'Modifica' }).click();
    const plusAgain = await getCourtNodeCentre(page, splits[0]!);
    await page.mouse.click(plusAgain.x, plusAgain.y);
    const third = (await findCourtNodeIds(page, 'zone-vertex-')).find((id) => !before.includes(id))!;
    await askToRemove(third);
  });

  test('la configurazione si esporta in JSON dal menu Esporta, con le competenze salvate', async ({ page }) => {
    await page.goto('/');
    const panel = await openReceptionZones(page);
    await panel.getByRole('button', { name: 'Modifica' }).click();
    await panel.getByRole('group', { name: 'Lati di competenza di S2' }).getByRole('button', { name: /Destra/ }).click();
    await panel.getByRole('button', { name: 'Salva' }).click();

    await openExportMenu(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Esporta la configurazione (JSON)' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    const path = await download.path();
    const { readFileSync } = await import('node:fs');
    const config = JSON.parse(readFileSync(path!, 'utf8'));
    const s2 = config.receptionZones['1'].areas.find((a: { playerId: string }) => a.playerId === 'S2');
    expect(s2.competence).toContain('right');
  });

  test('ogni "+" aggiunge un pallino, anche sui confini già divisi', async ({ page }) => {
    // Many canvas round trips: slow when the whole suite runs in parallel.
    test.setTimeout(90_000);
    await page.goto('/');
    const panel = await openReceptionZones(page);
    await panel.getByRole('button', { name: 'Modifica' }).click();
    for (let round = 0; round < 2; round++) {
      for (const id of await findCourtNodeIds(page, 'zone-split-')) {
        // A split earlier in the round may have replaced this border.
        if ((await findCourtNodeIds(page, id)).length === 0) continue;
        const count = (await findCourtNodeIds(page, 'zone-vertex-')).length;
        const plus = await getCourtNodeCentre(page, id);
        await page.mouse.click(plus.x, plus.y);
        expect(await findCourtNodeIds(page, 'zone-vertex-'), id).toHaveLength(count + 1);
      }
    }
  });

  test('un pallino lasciato sopra un altro si unisce a lui', async ({ page }) => {
    await page.goto('/');
    const panel = await openReceptionZones(page);
    await panel.getByRole('button', { name: 'Modifica' }).click();

    const before = await findCourtNodeIds(page, 'zone-vertex-');
    // A "+" between two movable dots (not a court corner): its id names the border's ends.
    const splitId = (await findCourtNodeIds(page, 'zone-split-'))[0]!;
    const [, endA] = splitId.match(/^zone-split-(v\d+)-(v\d+)$/)!;
    const plus = await getCourtNodeCentre(page, splitId);
    await page.mouse.click(plus.x, plus.y);
    const added = (await findCourtNodeIds(page, 'zone-vertex-')).find((id) => !before.includes(id))!;

    const from = await getCourtNodeCentre(page, added);
    const to = await getCourtNodeCentre(page, `zone-vertex-${endA}`);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x + 2, to.y + 2, { steps: 12 });
    await page.mouse.up();

    expect((await findCourtNodeIds(page, 'zone-vertex-')).sort()).toEqual([...before].sort());
    await expect(panel).toContainText('tra S2 e L1: palla di L1');
  });
});
