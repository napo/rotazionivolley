import type { FormationConfig, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { createOffscreenCanvas, drawFrame } from '../court/canvasRenderer';
import { getComment, resolveDiagramState } from '../state/selectors';
import { computeFaultOverlay } from '../state/positionalFaults';
import { saveFile, type SaveOutcome } from './platformSave';
import { buildSingleDiagramTitle, type Translate } from './sequence';

export async function exportStateAsPng(
  config: FormationConfig,
  team: Team,
  phaseKey: string,
  setterPosition: SetterPosition,
  filename: string,
  activeLiberoId: string | null | undefined,
  t: Translate,
  /** The positional-fault view as shown on screen, or null when it's off. */
  faultView: { selectedId: string | null } | null = null,
  scale = 2,
): Promise<SaveOutcome> {
  const { canvas, ctx } = createOffscreenCanvas(scale);
  const { players, positions } = resolveDiagramState(config, team, phaseKey, setterPosition, activeLiberoId);
  const title = buildSingleDiagramTitle(config, team, phaseKey, setterPosition, t);
  const comment = getComment(config, phaseKey, setterPosition);
  const faults = faultView ? computeFaultOverlay(config, team, phaseKey, setterPosition, activeLiberoId, positions) : null;
  drawFrame(
    ctx,
    players,
    positions,
    title,
    comment || undefined,
    faults ? { zones: faults.zones, relations: faults.relations, selectedId: faultView?.selectedId ?? null } : undefined,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Impossibile generare il PNG'))), 'image/png');
  });
  return saveFile(blob, filename);
}
