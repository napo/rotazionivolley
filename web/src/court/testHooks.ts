import type Konva from 'konva';

/**
 * Canvas rendering means individual shapes are no longer separate DOM nodes
 * (unlike the old SVG version), so e2e tests can't query player circles via
 * CSS selectors/getAttribute. This exposes a tiny read-only API on `window`
 * backed by the live Konva stage, giving tests the same kind of assertions
 * (screen-space bounding boxes, fill colours) without coupling to canvas
 * pixel screenshots.
 */
export interface RvTestHooks {
  getPlayerRect(playerId: string): { x: number; y: number; width: number; height: number } | null;
  getPlayerFill(playerId: string): string | null;
}

declare global {
  interface Window {
    __rvTestHooks?: RvTestHooks;
  }
}

export function registerTestHooks(stage: Konva.Stage): void {
  window.__rvTestHooks = {
    getPlayerRect(playerId) {
      const node = stage.findOne(`#player-${playerId}`);
      if (!node) return null;
      return node.getClientRect({ relativeTo: stage });
    },
    getPlayerFill(playerId) {
      const node = stage.findOne(`#player-circle-${playerId}`);
      if (!node || typeof (node as Konva.Circle).fill !== 'function') return null;
      const fill = (node as Konva.Circle).fill();
      return typeof fill === 'string' ? fill : null;
    },
  };
}
