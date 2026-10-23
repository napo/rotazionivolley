import type { FormationConfig, PlayerDef, ReceptionZones, RotationPositions, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { createOffscreenCanvas, drawFrame } from '../court/canvasRenderer';
import { getComment, resolveDiagramState } from '../state/selectors';
import { computeFaultOverlay, type FaultOverlayData } from '../state/positionalFaults';
import { computeZonesOverlay } from '../state/receptionZones';
import { saveFile, type SaveOutcome } from './platformSave';
import { buildSingleDiagramTitle, type Translate } from './sequence';

/** The on-screen drawings over the court: the fault view (with its selected player) and/or the competence map. */
export interface ScreenOverlays {
  faults: { selectedId: string | null } | null;
  zones: boolean;
}

export const NO_OVERLAYS: ScreenOverlays = { faults: null, zones: false };

/** Recomputes what's on screen for a single-image export (PNG, single-page PDF), where it applies. */
export function resolveScreenOverlays(
  config: FormationConfig,
  team: Team,
  phaseKey: string,
  setterPosition: SetterPosition,
  activeLiberoId: string | null | undefined,
  players: PlayerDef[],
  positions: RotationPositions,
  screen: ScreenOverlays,
): { faults?: FaultOverlayData; zones?: ReceptionZones } {
  const faults = screen.faults
    ? computeFaultOverlay(config, team, phaseKey, setterPosition, activeLiberoId, positions)
    : null;
  const zones = screen.zones ? computeZonesOverlay(config, team, phaseKey, setterPosition, players, positions) : null;
  return {
    faults: faults ? { zones: faults.zones, relations: faults.relations, selectedId: screen.faults!.selectedId } : undefined,
    zones: zones ?? undefined,
  };
}

export async function exportStateAsPng(
  config: FormationConfig,
  team: Team,
  phaseKey: string,
  setterPosition: SetterPosition,
  filename: string,
  activeLiberoId: string | null | undefined,
  t: Translate,
  /** What's drawn on the court on screen besides the players — exported as is. */
  screen: ScreenOverlays = NO_OVERLAYS,
  scale = 2,
): Promise<SaveOutcome> {
  const { canvas, ctx } = createOffscreenCanvas(scale);
  const { players, positions } = resolveDiagramState(config, team, phaseKey, setterPosition, activeLiberoId);
  const title = buildSingleDiagramTitle(config, team, phaseKey, setterPosition, t);
  const comment = getComment(config, phaseKey, setterPosition);
  const { faults, zones } = resolveScreenOverlays(config, team, phaseKey, setterPosition, activeLiberoId, players, positions, screen);
  drawFrame(ctx, players, positions, title, comment || undefined, faults, zones);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Impossibile generare il PNG'))), 'image/png');
  });
  return saveFile(blob, filename);
}
