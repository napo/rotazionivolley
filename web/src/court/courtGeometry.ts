/**
 * Coordinate system matches the original app's player position data
 * (x roughly 0-450, y roughly 30-475) so the migrated JSON configs need no
 * transformation. The viewBox adds margin for the player circle radius/stroke
 * and for court lines that extend slightly outside the field rectangle.
 */
export const COURT_VIEWBOX = { minX: -40, minY: -20, width: 640, height: 560 } as const;

export const COURT_RECT = { x: 75, y: 50, width: 450, height: 425 } as const;
export const CENTRE_LINE = { x1: 60, y1: 50, x2: 540, y2: 50 } as const;
export const ATTACK_LINE = { x1: 75, y1: 200, x2: 525, y2: 200 } as const;
export const ATTACK_LINE_TICKS = [
  { x1: 10, y1: 200, x2: 75, y2: 200 },
  { x1: 525, y1: 200, x2: 590, y2: 200 },
] as const;

export const PLAYER_RADIUS = 27;

export const COLOURS = {
  background: '#85d6ff',
  court: '#ffb591',
  line: '#ffffff',
  player: '#efa581',
  playerHighlight: '#66dd66',
} as const;

export const ANIMATION_DURATION_MS = 500;
