import type {
  CompetenceSide,
  FormationConfig,
  PhaseDef,
  PlayerDef,
  PlayerRole,
  Point,
  ReceptionArea,
  ReceptionZones,
  SetterPosition,
} from '../configs/schema';
import { COURT_RECT } from '../court/courtGeometry';

/**
 * Reception competence maps: who covers which part of the court when the
 * team receives. Each rotation's map is a planar partition of the court
 * rectangle into one polygon per receiver, built from shared vertex ids (see
 * ReceptionZonesSchema) so moving a vertex reshapes every area touching it.
 *
 * Court coordinates as everywhere else: the net is at the top (smaller y)
 * and the team faces it, so the players' own left is the screen's left.
 */

/**
 * Default area colour per role, the same in every rotation and scheme so a
 * colour always means the same job. The two hitters receive side by side,
 * so they get two shades of one hue (first hitter in the scheme darker).
 */
export const ROLE_COLOURS: Record<PlayerRole, readonly string[]> = {
  hitter: ['#1d4ed8', '#60a5fa'],
  libero: ['#16a34a'],
  middle: ['#ca8a04'],
  opposite: ['#db2777'],
  setter: ['#64748b'],
};

/** `player`'s default area colour, by role (see ROLE_COLOURS); `players` sets the hitters' order. */
export function roleColour(player: PlayerDef, players: PlayerDef[]): string {
  const shades = ROLE_COLOURS[player.role];
  const index = players.filter((p) => p.role === player.role).findIndex((p) => p.id === player.id);
  return shades[Math.max(index, 0) % shades.length]!;
}

export const COMPETENCE_SIDES: readonly CompetenceSide[] = ['left', 'right', 'front', 'back'];

const EPS = 0.5;
const LEFT = COURT_RECT.x;
const RIGHT = COURT_RECT.x + COURT_RECT.width;
const TOP = COURT_RECT.y;
const BOTTOM = COURT_RECT.y + COURT_RECT.height;

/** The receive side's reception phase (the first receive-only phase), where the maps apply. */
export function getReceptionPhase(phases: Record<string, PhaseDef>): string | undefined {
  return Object.entries(phases).find(([, def]) => def.team === 'receive')?.[0];
}

function isOnCourt(p: Point): boolean {
  return p.x >= LEFT && p.x <= RIGHT && p.y >= TOP && p.y <= BOTTOM;
}

/** Players standing inside the court rectangle (not benched). */
export function getOnCourtIds(players: PlayerDef[], positions: Record<string, Point>): string[] {
  return players.filter((p) => positions[p.id] && isOnCourt(positions[p.id]!)).map((p) => p.id);
}

/** Default receivers: the hitters and the libero on court (the classic 3-player reception). */
export function getDefaultReceiverIds(players: PlayerDef[], positions: Record<string, Point>): string[] {
  return players
    .filter((p) => (p.role === 'hitter' || p.role === 'libero') && positions[p.id] && isOnCourt(positions[p.id]!))
    .map((p) => p.id);
}

/** Sutherland-Hodgman: keeps the part of `poly` closer to `a` than to `b`. */
function clipCloserTo(poly: Point[], a: Point, b: Point): Point[] {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const dir = { x: b.x - a.x, y: b.y - a.y };
  const side = (p: Point) => (p.x - mid.x) * dir.x + (p.y - mid.y) * dir.y;
  const out: Point[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i]!;
    const next = poly[(i + 1) % poly.length]!;
    const sc = side(cur);
    const sn = side(next);
    if (sc <= 0) out.push(cur);
    if ((sc < 0 && sn > 0) || (sc > 0 && sn < 0)) {
      const t = sc / (sc - sn);
      out.push({ x: cur.x + (next.x - cur.x) * t, y: cur.y + (next.y - cur.y) * t });
    }
  }
  return out;
}

/**
 * The default map, for a scheme that has none of its own: a Voronoi partition of the court between the receivers
 * (each point of the court goes to the nearest receiver). The libero gets
 * the side borders by default, the usual "ball in between is the libero's".
 * `previous` carries colours and competences over for players already in it.
 */
export function buildDefaultZones(
  receiverIds: string[],
  positions: Record<string, Point>,
  players: PlayerDef[],
  previous?: ReceptionZones,
): ReceptionZones {
  const ids = receiverIds.filter((id) => positions[id]).sort((a, b) => positions[a]!.x - positions[b]!.x);
  const court: Point[] = [
    { x: LEFT, y: TOP },
    { x: RIGHT, y: TOP },
    { x: RIGHT, y: BOTTOM },
    { x: LEFT, y: BOTTOM },
  ];
  const vertices: Record<string, Point> = {};
  const vertexId = (p: Point) => {
    const found = Object.entries(vertices).find(([, v]) => Math.abs(v.x - p.x) < EPS && Math.abs(v.y - p.y) < EPS);
    if (found) return found[0];
    const id = `v${Object.keys(vertices).length}`;
    vertices[id] = { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
    return id;
  };

  const areas: ReceptionArea[] = ids.map((id) => {
    let poly = court;
    for (const other of ids) {
      if (other !== id) poly = clipCloserTo(poly, positions[id]!, positions[other]!);
    }
    const vertexIds = poly.map(vertexId).filter((v, j, all) => v !== all[(j + 1) % all.length]);
    const old = previous?.areas.find((a) => a.playerId === id);
    const player = players.find((p) => p.id === id);
    const isLibero = player?.role === 'libero';
    return {
      playerId: id,
      // A colour picked by hand stays; otherwise the role's.
      color: old?.color ?? (player ? roleColour(player, players) : ROLE_COLOURS.setter[0]!),
      vertices: vertexIds,
      competence: old?.competence ?? (isLibero ? ['left', 'right'] : []),
    };
  });
  return { vertices, areas: areas.filter((a) => a.vertices.length >= 3) };
}

export function getStoredReceptionZones(config: FormationConfig, setterPosition: SetterPosition): ReceptionZones | undefined {
  return config.receptionZones[String(setterPosition)];
}

/**
 * The map shown for a rotation: the stored one when every area still
 * belongs to a player on court (a different libero choice can make it
 * stale), otherwise the default built from the current positions.
 */
export function resolveReceptionZones(
  config: FormationConfig,
  setterPosition: SetterPosition,
  players: PlayerDef[],
  positions: Record<string, Point>,
): { zones: ReceptionZones; stored: boolean } {
  const stored = getStoredReceptionZones(config, setterPosition);
  const onCourt = new Set(getOnCourtIds(players, positions));
  if (stored && stored.areas.length > 0 && stored.areas.every((a) => onCourt.has(a.playerId))) {
    return { zones: stored, stored: true };
  }
  return { zones: buildDefaultZones(getDefaultReceiverIds(players, positions), positions, players), stored: false };
}

/**
 * The map for a diagram as exported (team, phase, rotation), or null where
 * it doesn't apply — the same rule as the live view: receive side,
 * reception phase only.
 */
export function computeZonesOverlay(
  config: FormationConfig,
  team: 'serve' | 'receive',
  phaseKey: string,
  setterPosition: SetterPosition,
  players: PlayerDef[],
  positions: Record<string, Point>,
): ReceptionZones | null {
  if (team !== 'receive' || phaseKey !== getReceptionPhase(config.phases)) return null;
  const { zones } = resolveReceptionZones(config, setterPosition, players, positions);
  return zones.areas.length > 0 ? zones : null;
}

/** Returns a copy of `config` with the map for `setterPosition` set, or cleared with undefined. */
export function withReceptionZones(
  config: FormationConfig,
  setterPosition: SetterPosition,
  zones: ReceptionZones | undefined,
): FormationConfig {
  const next = { ...config.receptionZones };
  if (zones) next[String(setterPosition)] = zones;
  else delete next[String(setterPosition)];
  return { ...config, receptionZones: next };
}

function onVerticalBorder(p: Point) {
  return Math.abs(p.x - LEFT) < EPS || Math.abs(p.x - RIGHT) < EPS;
}

function onHorizontalBorder(p: Point) {
  return Math.abs(p.y - TOP) < EPS || Math.abs(p.y - BOTTOM) < EPS;
}

export function isCornerVertex(p: Point): boolean {
  return onVerticalBorder(p) && onHorizontalBorder(p);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Where a vertex dragged towards `target` may actually go: court corners
 * stay put, vertices on a border slide along it (so the map always covers
 * the whole court), interior ones stay strictly inside.
 */
export function constrainVertex(current: Point, target: Point): Point {
  const vertical = onVerticalBorder(current);
  const horizontal = onHorizontalBorder(current);
  if (vertical && horizontal) return current;
  if (vertical) return { x: current.x, y: clamp(target.y, TOP, BOTTOM) };
  if (horizontal) return { x: clamp(target.x, LEFT, RIGHT), y: current.y };
  return { x: clamp(target.x, LEFT + 1, RIGHT - 1), y: clamp(target.y, TOP + 1, BOTTOM - 1) };
}

export function withVertexMoved(zones: ReceptionZones, vertexId: string, target: Point): ReceptionZones {
  const current = zones.vertices[vertexId];
  if (!current) return zones;
  return { ...zones, vertices: { ...zones.vertices, [vertexId]: constrainVertex(current, target) } };
}

function edgeKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export interface SharedEdge {
  a: string;
  b: string;
  /** Indices into `zones.areas` of the two areas on either side. */
  areas: [number, number];
}

/** Every border between two areas (as vertex id pairs), i.e. where a ball can fall "in between". */
export function getSharedEdges(zones: ReceptionZones): SharedEdge[] {
  const byKey = new Map<string, { a: string; b: string; areas: number[] }>();
  zones.areas.forEach((area, i) => {
    area.vertices.forEach((a, j) => {
      const b = area.vertices[(j + 1) % area.vertices.length]!;
      const key = edgeKey(a, b);
      const entry = byKey.get(key) ?? { a, b, areas: [] };
      if (!entry.areas.includes(i)) entry.areas.push(i);
      byKey.set(key, entry);
    });
  });
  return [...byKey.values()]
    .filter((e) => e.areas.length === 2)
    .map((e) => ({ a: e.a, b: e.b, areas: [e.areas[0]!, e.areas[1]!] }));
}

/** Inserts a new vertex halfway along the a-b border, in every area that has that edge. */
export function withEdgeSplit(zones: ReceptionZones, a: string, b: string): ReceptionZones {
  const pa = zones.vertices[a];
  const pb = zones.vertices[b];
  if (!pa || !pb) return zones;
  let n = Object.keys(zones.vertices).length;
  while (zones.vertices[`v${n}`]) n++;
  const id = `v${n}`;
  const areas = zones.areas.map((area) => {
    const vs = area.vertices;
    for (let j = 0; j < vs.length; j++) {
      const next = vs[(j + 1) % vs.length]!;
      if ((vs[j] === a && next === b) || (vs[j] === b && next === a)) {
        return { ...area, vertices: [...vs.slice(0, j + 1), id, ...vs.slice(j + 1)] };
      }
    }
    return area;
  });
  return { vertices: { ...zones.vertices, [id]: { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 } }, areas };
}

/**
 * Removes a vertex that only bends a border (same two neighbours in every
 * area using it, not a court corner). Junctions of three or more areas and
 * corners can't go, or the areas would stop fitting together.
 */
export function canRemoveVertex(zones: ReceptionZones, vertexId: string): boolean {
  const p = zones.vertices[vertexId];
  if (!p || isCornerVertex(p)) return false;
  const pairs = zones.areas.flatMap((area) => {
    const j = area.vertices.indexOf(vertexId);
    if (j < 0) return [];
    if (area.vertices.length <= 3) return ['too-small'];
    const prev = area.vertices[(j - 1 + area.vertices.length) % area.vertices.length]!;
    const next = area.vertices[(j + 1) % area.vertices.length]!;
    return [edgeKey(prev, next)];
  });
  return pairs.length > 0 && !pairs.includes('too-small') && new Set(pairs).size === 1;
}

export function withVertexRemoved(zones: ReceptionZones, vertexId: string): ReceptionZones {
  if (!canRemoveVertex(zones, vertexId)) return zones;
  const vertices = { ...zones.vertices };
  delete vertices[vertexId];
  return { vertices, areas: zones.areas.map((a) => ({ ...a, vertices: a.vertices.filter((v) => v !== vertexId) })) };
}

export function withAreaChanged(zones: ReceptionZones, playerId: string, change: Partial<ReceptionArea>): ReceptionZones {
  return { ...zones, areas: zones.areas.map((a) => (a.playerId === playerId ? { ...a, ...change } : a)) };
}

export function areaPoints(zones: ReceptionZones, area: ReceptionArea): Point[] {
  return area.vertices.map((id) => zones.vertices[id]).filter((p): p is Point => !!p);
}

function signedArea(points: Point[]): number {
  let sum = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]!;
    sum += p.x * q.y - q.x * p.y;
  });
  return sum / 2;
}

/**
 * Which side of `area` the a-b edge is on, from the player's point of view:
 * the edge's outward normal, by its dominant axis (towards the net = front).
 */
export function edgeSide(zones: ReceptionZones, area: ReceptionArea, a: string, b: string): CompetenceSide | null {
  const pa = zones.vertices[a];
  const pb = zones.vertices[b];
  if (!pa || !pb) return null;
  const j = area.vertices.indexOf(a);
  // Walk the edge in the area's own winding so the normal sign is right.
  const forward = area.vertices[(j + 1) % area.vertices.length] === b;
  const [from, to] = forward ? [pa, pb] : [pb, pa];
  const orientation = Math.sign(signedArea(areaPoints(zones, area))) || 1;
  const nx = orientation * (to.y - from.y);
  const ny = orientation * -(to.x - from.x);
  if (Math.abs(nx) >= Math.abs(ny)) return nx < 0 ? 'left' : 'right';
  return ny < 0 ? 'front' : 'back';
}

export interface CompetenceEdge extends SharedEdge {
  /** Indices of the areas whose player claims this border (0, 1 or — a conflict — 2). */
  owners: number[];
}

/** Every border between two areas, with who claims it according to each area's competence sides. */
export function getCompetenceEdges(zones: ReceptionZones): CompetenceEdge[] {
  return getSharedEdges(zones).map((edge) => ({
    ...edge,
    owners: edge.areas.filter((i) => {
      const area = zones.areas[i]!;
      const side = edgeSide(zones, area, edge.a, edge.b);
      return side !== null && area.competence.includes(side);
    }),
  }));
}

export interface NeighbourSummary {
  /** Indices into `zones.areas`, the lower first. */
  areas: [number, number];
  /** Areas claiming at least one stretch of their common border. */
  owners: number[];
}

/** One entry per pair of neighbouring areas: who takes the ball falling between them. */
export function summariseNeighbours(zones: ReceptionZones): NeighbourSummary[] {
  const byPair = new Map<string, NeighbourSummary>();
  for (const edge of getCompetenceEdges(zones)) {
    const [i, j] = [...edge.areas].sort((x, y) => x - y) as [number, number];
    const key = `${i}-${j}`;
    const entry = byPair.get(key) ?? { areas: [i, j], owners: [] };
    for (const o of edge.owners) if (!entry.owners.includes(o)) entry.owners.push(o);
    byPair.set(key, entry);
  }
  return [...byPair.values()];
}

/** `hex` mixed towards black, for the competence band of an area of that colour. */
export function darken(hex: string, amount = 0.45): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}
