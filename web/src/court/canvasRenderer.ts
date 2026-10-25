import type { PlayerDef, Point, ReceptionZones, RotationPositions } from '../configs/schema';
import type { FaultOverlayData } from '../state/positionalFaults';
import { areaPoints, darken, getCompetenceEdges, zoneFillColour } from '../state/receptionZones';
import {
  ATTACK_LINE,
  ATTACK_LINE_TICKS,
  CENTRE_LINE,
  COLOURS,
  COURT_RECT,
  COURT_VIEWBOX,
  FAULT_COLOURS,
  PLAYER_RADIUS,
  trimmedSegment,
  ZONE_STYLE,
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
  faults?: FaultOverlayData,
  /** Reception competence map, drawn between the court and the players as in the live view. */
  zones?: ReceptionZones,
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

  drawCourtLines(ctx, COLOURS.line, 4);
  if (zones) drawZonesOverlay(ctx, zones);

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

  if (faults) drawFaultOverlay(ctx, positions, faults);

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

/**
 * Canvas 2D twin of court/PositionalFaultOverlay (the live Konva view): a
 * segment per adjacent-zone pair (dashed green = ok, thick red = fault), or
 * with a player selected only their pairs as arrows towards the partners,
 * plus each player's zone badge.
 */
function drawFaultOverlay(ctx: CanvasRenderingContext2D, positions: Record<string, Point>, faults: FaultOverlayData): void {
  const { zones, relations, selectedId } = faults;
  const shown = selectedId ? relations.filter((r) => r.firstId === selectedId || r.secondId === selectedId) : relations;
  const gap = PLAYER_RADIUS + 6;

  for (const r of shown) {
    const fromId = selectedId && r.secondId === selectedId ? r.secondId : r.firstId;
    const toId = fromId === r.firstId ? r.secondId : r.firstId;
    const from = positions[fromId];
    const to = positions[toId];
    const points = from && to ? trimmedSegment(from, to, gap) : null;
    if (!points) continue;
    const [x1, y1, x2, y2] = points as [number, number, number, number];
    const colour = r.ok ? FAULT_COLOURS.ok : FAULT_COLOURS.fault;

    ctx.save();
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = r.ok ? 4 : 7;
    ctx.lineCap = 'round';
    ctx.setLineDash(r.ok ? [10, 8] : []);
    const pointer = 16;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    // With an arrowhead, stop the shaft at its base so the round cap doesn't poke through the tip.
    const endX = selectedId ? x2 - Math.cos(angle) * pointer : x2;
    const endY = selectedId ? y2 - Math.sin(angle) * pointer : y2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    if (selectedId) {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(angle) * pointer - Math.sin(angle) * (pointer / 2), y2 - Math.sin(angle) * pointer + Math.cos(angle) * (pointer / 2));
      ctx.lineTo(x2 - Math.cos(angle) * pointer + Math.sin(angle) * (pointer / 2), y2 - Math.sin(angle) * pointer - Math.cos(angle) * (pointer / 2));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  for (const [id, zone] of Object.entries(zones)) {
    const p = positions[id];
    if (!p) continue;
    const bx = p.x + PLAYER_RADIUS * 0.8;
    const by = p.y - PLAYER_RADIUS * 0.8;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, 13, 0, Math.PI * 2);
    ctx.fillStyle = FAULT_COLOURS.badgeFill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = FAULT_COLOURS.badgeText;
    ctx.stroke();
    ctx.fillStyle = FAULT_COLOURS.badgeText;
    ctx.font = 'bold 15px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(zone), bx, by + 1);
    ctx.restore();
  }
}

/** Canvas 2D twin of CourtLines (CourtBackground.tsx): boundary, centre line, dashed attack line and ticks. */
function drawCourtLines(ctx: CanvasRenderingContext2D, colour: string, lineWidth: number): void {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.rect(COURT_RECT.x, COURT_RECT.y, COURT_RECT.width, COURT_RECT.height);
  ctx.stroke();
  ctx.restore();

  drawLine(ctx, colour, lineWidth, CENTRE_LINE.x1, CENTRE_LINE.y1, CENTRE_LINE.x2, CENTRE_LINE.y2);
  drawLine(ctx, colour, lineWidth, ATTACK_LINE.x1, ATTACK_LINE.y1, ATTACK_LINE.x2, ATTACK_LINE.y2, [9, 9]);
  for (const tick of ATTACK_LINE_TICKS) {
    drawLine(ctx, colour, lineWidth, tick.x1, tick.y1, tick.x2, tick.y2, [9, 9]);
  }
}

/**
 * Canvas 2D twin of court/ReceptionZonesLayer's underlay: a white court,
 * the areas in their tints,
 * each claimed border as a darker band clipped to its owner's area, white
 * borders, and the court markings again in black on top.
 */
function drawZonesOverlay(ctx: CanvasRenderingContext2D, zones: ReceptionZones): void {
  const tracePolygon = (points: Point[]) => {
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
  };
  const edges = getCompetenceEdges(zones);

  ctx.fillStyle = ZONE_STYLE.courtFill;
  ctx.fillRect(COURT_RECT.x, COURT_RECT.y, COURT_RECT.width, COURT_RECT.height);

  zones.areas.forEach((area, i) => {
    const polygon = areaPoints(zones, area);
    ctx.fillStyle = zoneFillColour(area.color);
    tracePolygon(polygon);
    ctx.fill();

    const owned = edges.filter((e) => e.owners.includes(i));
    if (owned.length === 0) return;
    ctx.save();
    tracePolygon(polygon);
    ctx.clip();
    ctx.globalAlpha = ZONE_STYLE.bandOpacity;
    ctx.strokeStyle = darken(area.color);
    ctx.lineWidth = ZONE_STYLE.bandWidth;
    ctx.lineCap = 'round';
    for (const e of owned) {
      const a = zones.vertices[e.a]!;
      const b = zones.vertices[e.b]!;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  });

  ctx.save();
  ctx.globalAlpha = ZONE_STYLE.borderOpacity;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = ZONE_STYLE.borderWidth;
  for (const area of zones.areas) {
    tracePolygon(areaPoints(zones, area));
    ctx.stroke();
  }
  ctx.restore();

  drawCourtLines(ctx, COLOURS.zoneLine, ZONE_STYLE.courtLineWidth);
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  colour: string,
  lineWidth: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash: number[] = [],
): void {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = lineWidth;
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
