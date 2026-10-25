import type { Page } from '@playwright/test';

interface RvTestWindow {
  __rvTestHooks?: {
    getPlayerRect(id: string): { x: number; y: number; width: number; height: number } | null;
    getPlayerFill(id: string): string | null;
    findNodeIds(prefix: string): string[];
    getNodeRect(id: string): { x: number; y: number; width: number; height: number } | null;
  };
}

/**
 * Canvas-based rendering (Konva) means players aren't separate DOM nodes, so
 * e2e assertions go through the small `window.__rvTestHooks` API (see
 * src/court/testHooks.ts) instead of CSS selectors. These helpers convert
 * the Konva-relative rect it returns into real page coordinates (by adding
 * the canvas element's own on-page position), for both assertions and for
 * driving mouse-based drag interactions.
 */

export async function getPlayerPageRect(page: Page, playerId: string) {
  const canvasBox = await page.locator('.court-stage canvas').boundingBox();
  if (!canvasBox) throw new Error('canvas non trovato');
  const rect = await page.evaluate(
    (id) => (window as unknown as RvTestWindow).__rvTestHooks?.getPlayerRect(id) ?? null,
    playerId,
  );
  if (!rect) throw new Error(`giocatore "${playerId}" non trovato`);
  return {
    x: canvasBox.x + rect.x,
    y: canvasBox.y + rect.y,
    width: rect.width,
    height: rect.height,
    centerX: canvasBox.x + rect.x + rect.width / 2,
    centerY: canvasBox.y + rect.y + rect.height / 2,
  };
}

export function getPlayerFill(page: Page, playerId: string) {
  return page.evaluate((id) => (window as unknown as RvTestWindow).__rvTestHooks?.getPlayerFill(id) ?? null, playerId);
}

export async function dragPlayer(page: Page, playerId: string, deltaX: number, deltaY: number) {
  const before = await getPlayerPageRect(page, playerId);
  await page.mouse.move(before.centerX, before.centerY);
  await page.mouse.down();
  await page.mouse.move(before.centerX + deltaX, before.centerY + deltaY, { steps: 10 });
  await page.mouse.up();
}

/** Opens the header's Export dropdown, so its options and submit button become reachable. */
export async function openExportMenu(page: Page) {
  await page.locator('.header-dropdown__trigger').click();
}

export function exportSubmit(page: Page) {
  return page.locator('.export-menu__submit');
}

/** Selects the receive-side dot for a rotation in the rotation navigator. */
export async function selectReceiveRotation(page: Page, position: string) {
  await page
    .locator('[data-tutorial="rotation"] [data-tutorial="rotation-receive"]')
    .getByRole('button', { name: position })
    .click();
}

/** Opens the scheme picker and starts a new scheme in the editor, based on the first available scheme. */
export async function openNewSchemeEditor(page: Page) {
  await page.locator('.schema-switcher__trigger').click();
  await page.getByRole('button', { name: /Nuovo modulo/ }).click();
  await page.getByRole('button', { name: 'Inizia da questo schema' }).click();
}

/** Opens a tab of the court tools panel (positional faults, reception responsibilities) and returns its content. */
export async function openCourtTool(page: Page, name: 'Falli di posizione' | 'Competenze di ricezione') {
  const tab = page.getByRole('tab', { name: new RegExp(name) });
  // Clicking the open tab would close it.
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
  return page.getByRole('tabpanel');
}

export function findCourtNodeIds(page: Page, prefix: string) {
  return page.evaluate((p) => (window as unknown as RvTestWindow).__rvTestHooks?.findNodeIds(p) ?? [], prefix);
}

/**
 * Viewport coordinates of the centre of a Konva shape, by id (see
 * testHooks.getNodeRect), scrolling the page first if it's out of view so
 * the mouse can reach it.
 */
export async function getCourtNodeCentre(page: Page, nodeId: string) {
  const locate = async () => {
    const canvasBox = await page.locator('.court-stage canvas').boundingBox();
    if (!canvasBox) throw new Error('canvas non trovato');
    const rect = await page.evaluate((id) => (window as unknown as RvTestWindow).__rvTestHooks?.getNodeRect(id) ?? null, nodeId);
    if (!rect) throw new Error(`forma "${nodeId}" non trovata`);
    return { x: canvasBox.x + rect.x + rect.width / 2, y: canvasBox.y + rect.y + rect.height / 2 };
  };
  const point = await locate();
  const viewport = page.viewportSize();
  if (viewport && (point.y < 20 || point.y > viewport.height - 20)) {
    await page.evaluate((dy) => window.scrollBy(0, dy), point.y - viewport.height / 2);
    return locate();
  }
  return point;
}
