import type { FormationConfig } from '../configs/schema';
import { createOffscreenCanvas, drawFrame, tweenPositions } from '../court/canvasRenderer';
import { resolveDiagramState } from '../state/selectors';
import { saveFile } from './platformSave';
import type { SequencePage } from './sequence';

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
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

/**
 * Renders the given sequence of states (same shape used by the PDF pipeline
 * export) as a short animated clip: each state holds for HOLD_MS, then tweens
 * into the next over TRANSITION_MS, using the same easing as the interactive
 * on-screen animation. Captured from an offscreen canvas via
 * captureStream()+MediaRecorder, since only <canvas> supports captureStream.
 */
export async function recordSequenceAsWebm(
  config: FormationConfig,
  pages: SequencePage[],
  filename: string,
  activeLiberoId?: string | null,
  scale = 2,
): Promise<void> {
  if (!isVideoExportSupported()) {
    throw new Error("L'export video non è supportato in questo browser/ambiente");
  }
  if (pages.length === 0) {
    throw new Error('La sequenza da esportare è vuota');
  }

  const { canvas, ctx } = createOffscreenCanvas(scale);
  const frames = pages.map((page) =>
    resolveDiagramState(config, page.team, page.phaseKey, page.setterPosition, activeLiberoId),
  );
  drawFrame(ctx, frames[0].players, frames[0].positions, pages[0].caption);

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

  const segmentDuration = (index: number) => HOLD_MS + (index < pages.length - 1 ? TRANSITION_MS : 0);
  const totalDuration = pages.reduce((sum, _page, index) => sum + segmentDuration(index), 0);
  const startTime = performance.now();

  await new Promise<void>((resolve) => {
    function tick() {
      const elapsed = performance.now() - startTime;
      if (elapsed >= totalDuration) {
        const last = pages.length - 1;
        drawFrame(ctx, frames[last].players, frames[last].positions, pages[last].caption);
        resolve();
        return;
      }

      let acc = 0;
      let segmentIndex = 0;
      for (; segmentIndex < pages.length; segmentIndex++) {
        const duration = segmentDuration(segmentIndex);
        if (elapsed < acc + duration) break;
        acc += duration;
      }

      const withinSegment = elapsed - acc;
      const isLastSegment = segmentIndex === pages.length - 1;
      if (withinSegment < HOLD_MS || isLastSegment) {
        drawFrame(ctx, frames[segmentIndex].players, frames[segmentIndex].positions, pages[segmentIndex].caption);
      } else {
        const progress = (withinSegment - HOLD_MS) / TRANSITION_MS;
        const tweened = tweenPositions(frames[segmentIndex].positions, frames[segmentIndex + 1].positions, progress);
        drawFrame(ctx, frames[segmentIndex].players, tweened);
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  // Give the encoder one more moment to flush the final frame before stopping.
  await new Promise((resolve) => setTimeout(resolve, 150));
  recorder.stop();
  await stopped;

  await saveFile(new Blob(chunks, { type: mimeType || 'video/webm' }), filename);
}
