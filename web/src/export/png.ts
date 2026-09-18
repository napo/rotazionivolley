import type { FormationConfig, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { createOffscreenCanvas, drawFrame } from '../court/canvasRenderer';
import { getComment, resolveDiagramState } from '../state/selectors';
import { saveFile } from './platformSave';
import { buildSingleDiagramTitle, type Translate } from './sequence';

export async function exportStateAsPng(
  config: FormationConfig,
  team: Team,
  phaseKey: string,
  setterPosition: SetterPosition,
  filename: string,
  activeLiberoId: string | null | undefined,
  t: Translate,
  scale = 2,
): Promise<void> {
  const { canvas, ctx } = createOffscreenCanvas(scale);
  const { players, positions } = resolveDiagramState(config, team, phaseKey, setterPosition, activeLiberoId);
  const title = buildSingleDiagramTitle(config, team, phaseKey, setterPosition, t);
  const comment = getComment(config, phaseKey, setterPosition);
  drawFrame(ctx, players, positions, title, comment || undefined);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Impossibile generare il PNG'))), 'image/png');
  });
  await saveFile(blob, filename);
}
