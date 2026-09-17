/**
 * Coordinate system matches the original app's player position data
 * (x roughly 0-450, y roughly 30-475) so the migrated JSON configs need no
 * transformation. The viewBox adds margin for the player circle radius/stroke
 * and for court lines that extend slightly outside the field rectangle.
 */
export const COURT_VIEWBOX = { minX: -40, minY: -85, width: 640, height: 670 } as const;

export const COURT_RECT = { x: 75, y: -15, width: 450, height: 535 } as const;
export const CENTRE_LINE = { x1: 60, y1: -15, x2: 540, y2: -15 } as const;
export const ATTACK_LINE = { x1: 75, y1: 200, x2: 525, y2: 200 } as const;
export const ATTACK_LINE_TICKS = [
  { x1: 10, y1: 200, x2: 75, y2: 200 },
  { x1: 525, y1: 200, x2: 590, y2: 200 },
] as const;

export const PLAYER_RADIUS = 27;

/**
 * Off-court "bench" spots for up to two liberos, left of the court, stacked
 * in a single column with the lowest one level with the baseline (the
 * court's bottom edge) — liberos are back-row players, so this reads as
 * "waiting behind the back row" rather than floating near the net. See the
 * editor's libero swap UI. Indexed by the libero's position in
 * `config.liberos` (0 or 1) — not by a specific id, so this stays agnostic
 * to whatever ids a given config uses for its liberos.
 */
const LIBERO_BENCH_X = 20;
const LIBERO_BENCH_BASELINE_Y = COURT_RECT.y + COURT_RECT.height;
export const LIBERO_BENCH_SLOTS = [
  { x: LIBERO_BENCH_X, y: LIBERO_BENCH_BASELINE_Y - 140 },
  { x: LIBERO_BENCH_X, y: LIBERO_BENCH_BASELINE_Y },
] as const;

/**
 * Chosen and verified for accessibility (see court/colorAccessibility.ts /
 * .test.ts): `player` vs `court` and `player` vs `playerHighlight` both clear
 * WCAG AA non-text contrast (>=3:1), and stay clearly distinguishable under
 * simulated protanopia/deuteranopia/tritanopia thanks to the large luminance
 * gap between the dark navy player fill and the light gold highlight — a
 * lightness-based cue survives colour-vision deficiency even where hue alone
 * would not. `playerLabel`/`playerLabelHighlighted` are chosen per-state so
 * the label text stays readable (>=7:1) against either fill.
 */
export const COLOURS = {
  background: '#85d6ff',
  court: '#ffb591',
  line: '#ffffff',
  player: '#164863',
  playerHighlight: '#ffb300',
  playerLabel: '#eeeeee',
  playerLabelHighlighted: '#1a1a1a',
} as const;

export const ANIMATION_DURATION_MS = 500;
