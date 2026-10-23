import type { FormationConfig } from '../configs/schema';
import { createOffscreenCanvas, drawFrame, tweenPositions } from '../court/canvasRenderer';
import { saveFile, type SaveOutcome } from './platformSave';
import type { SequencePage, Translate } from './sequence';
import { buildStills, type OverlayChoice, type Still, type StillKind } from './stills';

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

/** How long each kind of still is held (see buildStills). */
const HOLD_BY_KIND: Record<StillKind, number> = {
  page: HOLD_MS,
  zones: 2200,
  faultsAll: 2200,
  faultsPlayer: 1600,
};

/** One still of the clip: held for holdMs, then tweened into the next still over transitionMs. */
interface Segment extends Still {
  holdMs: number;
  transitionMs: number;
}

/**
 * The clip's stills (see buildStills: each page, then what `include` adds
 * after it). Stills of the same page share positions, so only the move to
 * the next page is animated.
 */
export function buildSegments(
  config: FormationConfig,
  pages: SequencePage[],
  activeLiberoId: string | null | undefined,
  include: OverlayChoice,
  t: Translate,
): Segment[] {
  const groups = buildStills(config, pages, activeLiberoId, include, t);
  return groups.flatMap((stills, index) =>
    stills.map((still, i) => ({
      ...still,
      holdMs: HOLD_BY_KIND[still.kind],
      transitionMs: i === stills.length - 1 && index < groups.length - 1 ? TRANSITION_MS : 0,
    })),
  );
}

function drawSegment(ctx: CanvasRenderingContext2D, segment: Segment): void {
  drawFrame(ctx, segment.players, segment.positions, segment.title, segment.caption, segment.faults, segment.zones);
}

/**
 * Renders the given sequence of states (same shape used by the PDF pipeline
 * export) as a short animated clip: each state holds for HOLD_MS, then tweens
 * into the next over TRANSITION_MS, using the same easing as the interactive
 * on-screen animation — plus, as chosen in `include`, the competence map
 * and positional-fault stills of each reception formation (see buildStills). Captured from an
 * offscreen canvas via captureStream()+MediaRecorder, since only <canvas>
 * supports captureStream.
 */
export async function recordSequenceAsVideo(
  config: FormationConfig,
  pages: SequencePage[],
  filename: string,
  activeLiberoId: string | null | undefined,
  t: Translate,
  include: OverlayChoice = { faults: false, zones: false },
  scale = 2,
): Promise<SaveOutcome> {
  if (!isVideoExportSupported()) {
    throw new Error("L'export video non è supportato in questo browser/ambiente");
  }
  if (pages.length === 0) {
    throw new Error('La sequenza da esportare è vuota');
  }

  const { canvas, ctx } = createOffscreenCanvas(scale);
  const segments = buildSegments(config, pages, activeLiberoId, include, t);
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
