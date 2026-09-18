import { jsPDF } from 'jspdf';
import type { FormationConfig, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { createOffscreenCanvas, drawFrame, TITLE_LEFT_INSET, TITLE_LINE_HEIGHT, TITLE_TOP_INSET } from '../court/canvasRenderer';
import { COURT_VIEWBOX } from '../court/courtGeometry';
import { getComment, resolveDiagramState } from '../state/selectors';
import { saveFile } from './platformSave';
import { buildSingleDiagramTitle, type SequencePage, type Translate } from './sequence';

export type { PipelineSequenceKind, SequencePage, CurrentSelection } from './sequence';
export { buildPipelinePages } from './sequence';

const PAGE_WIDTH = COURT_VIEWBOX.width;
const PAGE_HEIGHT = COURT_VIEWBOX.height;
const ORIENTATION = PAGE_WIDTH >= PAGE_HEIGHT ? 'landscape' : 'portrait';
const RASTER_SCALE = 2; // matches the PNG export default; kept modest since pipeline exports can be 40+ pages

function newDocument(): jsPDF {
  return new jsPDF({ orientation: ORIENTATION, unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
}

/**
 * Draws the court image raster, but title and comment as vector PDF text
 * overlaid on top of it (not baked into the raster like the PNG/video paths)
 * so they stay crisp/selectable. Positioned to land in the same place the
 * raster title/caption would (see canvasRenderer.ts's TITLE_* constants):
 * the image fills the page exactly, so page-space and canvas-pixel-space
 * coordinates match 1:1.
 */
function renderPage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  config: FormationConfig,
  team: Team,
  phaseKey: string,
  setterPosition: SetterPosition,
  activeLiberoId: string | null | undefined,
  titleLines: string[],
  comment?: string,
): void {
  const { players, positions } = resolveDiagramState(config, team, phaseKey, setterPosition, activeLiberoId);
  drawFrame(ctx, players, positions);

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  if (titleLines.length > 0) {
    titleLines.forEach((line, i) => {
      pdf.setFontSize(i === 0 ? 17 : 14);
      pdf.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      pdf.text(line, TITLE_LEFT_INSET, TITLE_TOP_INSET + i * TITLE_LINE_HEIGHT);
    });
    pdf.setFont('helvetica', 'normal');
  }

  if (comment) {
    const lines = comment.split('\n');
    const lineHeight = 16;
    pdf.setFontSize(14);
    pdf.text(lines, 10, PAGE_HEIGHT - 10 - (lines.length - 1) * lineHeight);
  }
}

export async function exportSinglePagePdf(
  config: FormationConfig,
  team: Team,
  phaseKey: string,
  setterPosition: SetterPosition,
  filename: string,
  activeLiberoId: string | null | undefined,
  t: Translate,
): Promise<void> {
  const pdf = newDocument();
  const { canvas, ctx } = createOffscreenCanvas(RASTER_SCALE);
  const title = buildSingleDiagramTitle(config, team, phaseKey, setterPosition, t);
  const comment = getComment(config, phaseKey, setterPosition);
  renderPage(pdf, canvas, ctx, config, team, phaseKey, setterPosition, activeLiberoId, title, comment || undefined);
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
    const page = pages[i];
    renderPage(
      pdf,
      canvas,
      ctx,
      config,
      page.team,
      page.phaseKey,
      page.setterPosition,
      activeLiberoId,
      page.titleLines,
      page.comment || undefined,
    );
  }
  await saveFile(pdf.output('blob'), filename);
}
