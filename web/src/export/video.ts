import type { FormationConfig, PlayerDef, RotationPositions } from '../configs/schema';
import { createOffscreenCanvas, drawFrame, tweenPositions } from '../court/canvasRenderer';
import { computeFaultOverlay, type FaultOverlayData, type PositionRelation } from '../state/positionalFaults';
import { resolveDiagramState } from '../state/selectors';
import { saveFile, type SaveOutcome } from './platformSave';
import type { SequencePage, Translate } from './sequence';

const HOLD_MS = 900;
const TRANSITION_MS = 500;

export function isVideoExportSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  );
}

function pickMimeType(): string {
  // WebM first (Chromium, Firefox); MP4 for Safari/iOS, which can't record WebM everywhere.
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4;codecs=avc1', 'video/mp4'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

/** Extra stills for the positional-fault walk-through (see buildSegments). */
const FAULT_ALL_MS = 2200;
const FAULT_PLAYER_MS = 1600;

/** One still of the clip: held for holdMs, then tweened into the next still over transitionMs. */
interface Segment {
  players: PlayerDef[];
  positions: RotationPositions;
  title: string[];
  caption?: string;
  faults?: FaultOverlayData;
  holdMs: number;
  transitionMs: number;
}

function faultCount(t: Translate, relations: PositionRelation[]): string {
  const count = relations.filter((r) => !r.ok).length;
  return count === 0 ? t('export.faults.none') : t(count === 1 ? 'faults.summaryOne' : 'faults.summaryMany', { count });
}

/**
 * One still per page; with `faultTour`, each reception formation (receiving
 * side at the service hit, as in the live view) is followed by a still with
 * the whole team's positional-fault overlay and then one per player in the
 * order P, S1, C2, O, S2, C1 (the libero in place of the player it
 * replaces). Stills of the same page share positions, so only the move to
 * the next page is animated.
 */
export function buildSegments(
  config: FormationConfig,
  pages: SequencePage[],
  activeLiberoId: string | null | undefined,
  faultTour: boolean,
  t: Translate,
): Segment[] {
  const segments: Segment[] = [];
  pages.forEach((page, index) => {
    const { players, positions } = resolveDiagramState(config, page.team, page.phaseKey, page.setterPosition, activeLiberoId);
    const isLastPage = index === pages.length - 1;
    const still = { players, positions, title: page.titleLines };
    const pageSegments: Segment[] = [{ ...still, caption: page.comment || undefined, holdMs: HOLD_MS, transitionMs: 0 }];

    // "base" defines the zones, so it can't hold a fault: walk through the reception formation only.
    const overlay =
      faultTour && page.phaseKey !== 'base'
        ? computeFaultOverlay(config, page.team, page.phaseKey, page.setterPosition, activeLiberoId, positions)
        : null;
    if (overlay) {
      const label = (id: string) => players.find((p) => p.id === id)?.shortLabel ?? id;
      pageSegments.push({
        ...still,
        caption: `${t('export.faults.all')} · ${faultCount(t, overlay.relations)}`,
        faults: { zones: overlay.zones, relations: overlay.relations, selectedId: null },
        holdMs: FAULT_ALL_MS,
        transitionMs: 0,
      });
      for (const id of overlay.tour) {
        const own = overlay.relations.filter((r) => r.firstId === id || r.secondId === id);
        pageSegments.push({
          ...still,
          caption: `${t('export.faults.player', { player: label(id), zone: overlay.zones[id]! })} · ${faultCount(t, own)}`,
          faults: { zones: overlay.zones, relations: overlay.relations, selectedId: id },
          holdMs: FAULT_PLAYER_MS,
          transitionMs: 0,
        });
      }
    }
    if (!isLastPage) pageSegments[pageSegments.length - 1]!.transitionMs = TRANSITION_MS;
    segments.push(...pageSegments);
  });
  return segments;
}

function drawSegment(ctx: CanvasRenderingContext2D, segment: Segment): void {
  drawFrame(ctx, segment.players, segment.positions, segment.title, segment.caption, segment.faults);
}

/**
 * Renders the given sequence of states (same shape used by the PDF pipeline
 * export) as a short animated clip: each state holds for HOLD_MS, then tweens
 * into the next over TRANSITION_MS, using the same easing as the interactive
 * on-screen animation — plus, with `faultTour`, the positional-fault stills
 * of each reception formation (see buildSegments). Captured from an
 * offscreen canvas via captureStream()+MediaRecorder, since only <canvas>
 * supports captureStream.
 */
export async function recordSequenceAsVideo(
  config: FormationConfig,
  pages: SequencePage[],
  filename: string,
  activeLiberoId: string | null | undefined,
  t: Translate,
  faultTour = false,
  scale = 2,
): Promise<SaveOutcome> {
  if (!isVideoExportSupported()) {
    throw new Error("L'export video non è supportato in questo browser/ambiente");
  }
  if (pages.length === 0) {
    throw new Error('La sequenza da esportare è vuota');
  }

  const { canvas, ctx } = createOffscreenCanvas(scale);
  const segments = buildSegments(config, pages, activeLiberoId, faultTour, t);
  drawSegment(ctx, segments[0]!);

  const stream = canvas.captureStream(30);
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  const totalDuration = segments.reduce((sum, segment) => sum + segment.holdMs + segment.transitionMs, 0);
  const startTime = performance.now();

  await new Promise<void>((resolve) => {
    function tick() {
      const elapsed = performance.now() - startTime;
      if (elapsed >= totalDuration) {
        drawSegment(ctx, segments[segments.length - 1]!);
        resolve();
        return;
      }

      let acc = 0;
      let index = 0;
      for (; index < segments.length - 1; index++) {
        const duration = segments[index]!.holdMs + segments[index]!.transitionMs;
        if (elapsed < acc + duration) break;
        acc += duration;
      }

      const segment = segments[index]!;
      const withinSegment = elapsed - acc;
      if (withinSegment < segment.holdMs || index === segments.length - 1) {
        drawSegment(ctx, segment);
      } else {
        const progress = (withinSegment - segment.holdMs) / segment.transitionMs;
        const tweened = tweenPositions(segment.positions, segments[index + 1]!.positions, progress);
        drawFrame(ctx, segment.players, tweened);
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  // Give the encoder one more moment to flush the final frame before stopping.
  await new Promise((resolve) => setTimeout(resolve, 150));
  recorder.stop();
  await stopped;

  // The recorder may have picked its own format when none was requested.
  const type = recorder.mimeType || mimeType || 'video/webm';
  const extension = type.startsWith('video/mp4') ? 'mp4' : 'webm';
  return saveFile(new Blob(chunks, { type }), filename.replace(/\.[^.]+$/, '') + '.' + extension);
}
