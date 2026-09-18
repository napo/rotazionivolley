import type { PlayerDef, Point, RotationPositions } from '../configs/schema';
import {
  ATTACK_LINE,
  ATTACK_LINE_TICKS,
  CENTRE_LINE,
  COLOURS,
  COURT_RECT,
  COURT_VIEWBOX,
  PLAYER_RADIUS,
} from './courtGeometry';

/**
 * Headless Canvas 2D renderer shared by every "offscreen" export path (PNG,
 * PDF page rasterization, video frames) so they never drift out of sync with
 * each other or with the live Konva view — geometry constants and visual
 * styling (shadow, court line width) are kept in step with
 * CourtBackground.tsx / PlayerMarker.tsx by hand, since Canvas 2D and Konva
 * don't share a renderer.
 */
/**
 * Left inset and line height shared with the PDF export path, which draws
 * the same title text as vector content instead of baking it into the
 * raster image — see export/pdf.ts. Sized to fit up to 3 lines (document
 * header + a page's own line, for the "rotations of one phase" pipeline)
 * inside the sky strip above the court rectangle (COURT_VIEWBOX.minY to
 * COURT_RECT.y, 70px).
 */
export const TITLE_LEFT_INSET = 10;
export const TITLE_TOP_INSET = 18;
export const TITLE_LINE_HEIGHT = 18;

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  players: PlayerDef[],
  positions: Record<string, Point>,
  title?: string[],
  caption?: string,
): void {
  const { minX, minY, width, height } = COURT_VIEWBOX;

  ctx.fillStyle = COLOURS.background;
  ctx.fillRect(minX, minY, width, height);

  ctx.save();
  ctx.shadowColor = 'rgba(20, 40, 60, 0.35)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = COLOURS.court;
  ctx.beginPath();
  ctx.rect(COURT_RECT.x, COURT_RECT.y, COURT_RECT.width, COURT_RECT.height);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = COLOURS.line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.rect(COURT_RECT.x, COURT_RECT.y, COURT_RECT.width, COURT_RECT.height);
  ctx.stroke();

  drawLine(ctx, CENTRE_LINE.x1, CENTRE_LINE.y1, CENTRE_LINE.x2, CENTRE_LINE.y2);
  drawLine(ctx, ATTACK_LINE.x1, ATTACK_LINE.y1, ATTACK_LINE.x2, ATTACK_LINE.y2, [9, 9]);
  for (const tick of ATTACK_LINE_TICKS) {
    drawLine(ctx, tick.x1, tick.y1, tick.x2, tick.y2, [9, 9]);
  }

  for (const player of players) {
    const position = positions[player.id];
    if (!position) continue;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(position.x, position.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLOURS.player;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(position.x, position.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = COLOURS.playerLabel;
    ctx.font = `bold ${player.shortLabel.length > 1 ? 20 : 26}px Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.shortLabel, position.x, position.y + 1);
  }

  if (title && title.length > 0) {
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    title.forEach((line, i) => {
      ctx.font = i === 0 ? 'bold 17px Verdana, sans-serif' : '14px Verdana, sans-serif';
      ctx.fillText(line, minX + TITLE_LEFT_INSET, minY + TITLE_TOP_INSET + i * TITLE_LINE_HEIGHT);
    });
  }

  if (caption) {
    const lines = caption.split('\n');
    ctx.fillStyle = '#222222';
    ctx.font = '18px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const lineHeight = 22;
    const baseY = minY + height - 12 - (lines.length - 1) * lineHeight;
    lines.forEach((line, i) => ctx.fillText(line, minX + 10, baseY + i * lineHeight));
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash: number[] = [],
): void {
  ctx.save();
  ctx.strokeStyle = COLOURS.line;
  ctx.lineWidth = 4;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Matches the easing used by the interactive Konva transitions. */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function tweenPositions(from: RotationPositions, to: RotationPositions, progress: number): RotationPositions {
  const eased = easeInOutQuad(Math.min(Math.max(progress, 0), 1));
  const result: RotationPositions = {};
  for (const playerId of Object.keys(to)) {
    const a = from[playerId] ?? to[playerId];
    const b = to[playerId];
    result[playerId] = {
      x: a.x + (b.x - a.x) * eased,
      y: a.y + (b.y - a.y) * eased,
    };
  }
  return result;
}

/**
 * Creates an offscreen canvas sized to COURT_VIEWBOX, with the context
 * pre-scaled and translated so drawFrame() can be called with the exact same
 * raw court-space coordinates used everywhere else (position data, Konva
 * layer) — including the same -minX/-minY margin the live Konva view applies
 * via its Layer transform, so exports match what's shown on screen.
 */
export function createOffscreenCanvas(scale = 2): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const { width, height, minX, minY } = COURT_VIEWBOX;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D non disponibile in questo ambiente');
  }
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  return { canvas, ctx };
}
