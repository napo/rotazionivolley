import type { FormationConfig, SetterPosition } from '../configs/schema';
import { createOffscreenCanvas, drawFrame } from '../court/canvasRenderer';
import { getComment, resolveDiagramState } from '../state/selectors';
import { saveFile } from './platformSave';

export async function exportStateAsPng(
  config: FormationConfig,
  phaseKey: string,
  setterPosition: SetterPosition,
  filename: string,
  activeLiberoId?: string | null,
  scale = 2,
): Promise<void> {
  const { canvas, ctx } = createOffscreenCanvas(scale);
  const { players, positions } = resolveDiagramState(config, phaseKey, setterPosition, activeLiberoId);
  const comment = getComment(config, phaseKey, setterPosition);
  drawFrame(ctx, players, positions, comment || undefined);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Impossibile generare il PNG'))), 'image/png');
  });
  await saveFile(blob, filename);
}
