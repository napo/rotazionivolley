import { jsPDF } from 'jspdf';
import type { FormationConfig, SetterPosition } from '../configs/schema';
import { createOffscreenCanvas, drawFrame } from '../court/canvasRenderer';
import { COURT_VIEWBOX } from '../court/courtGeometry';
import { getComment, resolveDiagramState } from '../state/selectors';
import { saveFile } from './platformSave';
import type { SequencePage } from './sequence';

export type { PipelineSequenceKind, SequencePage, CurrentSelection } from './sequence';
export { buildPipelinePages } from './sequence';

const PAGE_WIDTH = COURT_VIEWBOX.width;
const PAGE_HEIGHT = COURT_VIEWBOX.height;
const ORIENTATION = PAGE_WIDTH >= PAGE_HEIGHT ? 'landscape' : 'portrait';
const RASTER_SCALE = 2; // matches the PNG export default; kept modest since pipeline exports can be 40+ pages

function newDocument(): jsPDF {
  return new jsPDF({ orientation: ORIENTATION, unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
}

function renderPage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  config: FormationConfig,
  phaseKey: string,
  setterPosition: SetterPosition,
  activeLiberoId: string | null | undefined,
  caption?: string,
): void {
  const { players, positions } = resolveDiagramState(config, phaseKey, setterPosition, activeLiberoId);
  drawFrame(ctx, players, positions);

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  if (caption) {
    const lines = caption.split('\n');
    const lineHeight = 16;
    pdf.setFontSize(14);
    pdf.text(lines, 10, PAGE_HEIGHT - 10 - (lines.length - 1) * lineHeight);
  }
}

export async function exportSinglePagePdf(
  config: FormationConfig,
  phaseKey: string,
  setterPosition: SetterPosition,
  filename: string,
  activeLiberoId?: string | null,
): Promise<void> {
  const pdf = newDocument();
  const { canvas, ctx } = createOffscreenCanvas(RASTER_SCALE);
  const comment = getComment(config, phaseKey, setterPosition);
  renderPage(pdf, canvas, ctx, config, phaseKey, setterPosition, activeLiberoId, comment || undefined);
  await saveFile(pdf.output('blob'), filename);
}

export async function exportPipelinePdf(
  config: FormationConfig,
  pages: SequencePage[],
  filename: string,
  activeLiberoId?: string | null,
): Promise<void> {
  if (pages.length === 0) {
    throw new Error('La sequenza da esportare è vuota');
  }

  const pdf = newDocument();
  const { canvas, ctx } = createOffscreenCanvas(RASTER_SCALE);
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], ORIENTATION);
    }
    renderPage(pdf, canvas, ctx, config, pages[i].phaseKey, pages[i].setterPosition, activeLiberoId, pages[i].caption);
  }
  await saveFile(pdf.output('blob'), filename);
}
