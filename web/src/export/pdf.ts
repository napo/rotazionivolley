import { jsPDF } from 'jspdf';
import type { FormationConfig, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { createOffscreenCanvas, drawFrame, TITLE_LEFT_INSET, TITLE_LINE_HEIGHT, TITLE_TOP_INSET } from '../court/canvasRenderer';
import { COURT_VIEWBOX } from '../court/courtGeometry';
import { getComment, resolveDiagramState } from '../state/selectors';
import type { FaultOverlayData } from '../state/positionalFaults';
import type { PlayerDef, ReceptionZones, RotationPositions } from '../configs/schema';
import { saveFile, type SaveOutcome } from './platformSave';
import { resolveScreenOverlays, type ScreenOverlays } from './png';
import { buildSingleDiagramTitle, type SequencePage, type Translate } from './sequence';
import { buildStills, type OverlayChoice } from './stills';

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
  players: PlayerDef[],
  positions: RotationPositions,
  titleLines: string[],
  comment?: string,
  faults?: FaultOverlayData,
  zones?: ReceptionZones,
): void {
  drawFrame(ctx, players, positions, undefined, undefined, faults, zones);

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
  /** What's drawn on the court on screen besides the players — exported as is. */
  screen?: ScreenOverlays,
): Promise<SaveOutcome> {
  const pdf = newDocument();
  const { canvas, ctx } = createOffscreenCanvas(RASTER_SCALE);
  const title = buildSingleDiagramTitle(config, team, phaseKey, setterPosition, t);
  const comment = getComment(config, phaseKey, setterPosition);
  const { players, positions } = resolveDiagramState(config, team, phaseKey, setterPosition, activeLiberoId);
  const { faults, zones } = screen
    ? resolveScreenOverlays(config, team, phaseKey, setterPosition, activeLiberoId, players, positions, screen)
    : {};
  renderPage(pdf, canvas, ctx, players, positions, title, comment || undefined, faults, zones);
  return saveFile(pdf.output('blob'), filename);
}

/**
 * One page per still of the sequence (see buildStills): each formation,
 * then — as chosen in `include` — its competence map and positional-fault
 * pages, with what they show as the page's caption.
 */
export async function exportPipelinePdf(
  config: FormationConfig,
  pages: SequencePage[],
  filename: string,
  activeLiberoId: string | null | undefined,
  t: Translate,
  include: OverlayChoice = { faults: false, zones: false },
): Promise<SaveOutcome> {
  if (pages.length === 0) {
    throw new Error('La sequenza da esportare è vuota');
  }

  const pdf = newDocument();
  const { canvas, ctx } = createOffscreenCanvas(RASTER_SCALE);
  buildStills(config, pages, activeLiberoId, include, t)
    .flat()
    .forEach((still, i) => {
      if (i > 0) {
        pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], ORIENTATION);
      }
      renderPage(pdf, canvas, ctx, still.players, still.positions, still.title, still.caption, still.faults, still.zones);
    });
  return saveFile(pdf.output('blob'), filename);
}
