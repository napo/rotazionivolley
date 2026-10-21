import type { FormationConfig, LiberoSwap, PhaseDef, Point, SetterPosition } from '../configs/schema';

/**
 * Positional faults (FIVB rule 7.4, 2025-2028 edition): at the service hit
 * only the RECEIVING team must be in rotational order; the serving team is
 * free. The order is checked only between adjacent zones:
 *
 *   front/back (same column):  4-5, 3-6, 2-1  -> front player closer to the net
 *   left/right (same row):     4-3, 3-2, 5-6, 6-1 -> left player more to the left
 *
 * Court coordinates: the net is at the top (smaller y = closer to the net)
 * and the team faces it, so the players' own left is the screen's left
 * (smaller x). The real rule looks at the feet on the floor; here the marker
 * centre is used as a stand-in.
 */

export type Zone = 1 | 2 | 3 | 4 | 5 | 6;

export type RelationKind = 'frontBack' | 'leftRight';

export interface PositionRelation {
  kind: RelationKind;
  /** frontBack: the front-row player; leftRight: the player on the left. */
  firstId: string;
  /** frontBack: the back-row player; leftRight: the player on the right. */
  secondId: string;
  firstZone: Zone;
  secondZone: Zone;
  /** true when the current positions respect the rotational order for this pair. */
  ok: boolean;
}

const CONSTRAINTS: ReadonlyArray<{ kind: RelationKind; first: Zone; second: Zone }> = [
  { kind: 'frontBack', first: 4, second: 5 },
  { kind: 'frontBack', first: 3, second: 6 },
  { kind: 'frontBack', first: 2, second: 1 },
  { kind: 'leftRight', first: 4, second: 3 },
  { kind: 'leftRight', first: 3, second: 2 },
  { kind: 'leftRight', first: 5, second: 6 },
  { kind: 'leftRight', first: 6, second: 1 },
];

/**
 * Rotational zone of every player on court for a rotation, derived from the
 * "base" phase (the only phase whose coordinates map directly onto court
 * zones): the 3 players nearest the net are the front row (4-3-2 left to
 * right), the others the back row (5-6-1 left to right). A libero on court
 * takes the zone of the player it replaces. Returns {} when the config has
 * no usable 6-player base for that rotation.
 */
export function getRotationZones(
  config: FormationConfig,
  setterPosition: SetterPosition,
  swap?: LiberoSwap,
): Record<string, Zone> {
  const base = config.positions.base?.[String(setterPosition)];
  if (!base) return {};
  const onBase = config.players.filter((p) => base[p.id]);
  if (onBase.length !== 6) return {};

  const byY = [...onBase].sort((a, b) => base[a.id]!.y - base[b.id]!.y);
  const byX = (ids: typeof onBase) => [...ids].sort((a, b) => base[a.id]!.x - base[b.id]!.x);
  const front = byX(byY.slice(0, 3));
  const back = byX(byY.slice(3));

  const zones: Record<string, Zone> = {};
  ([4, 3, 2] as const).forEach((zone, i) => (zones[front[i]!.id] = zone));
  ([5, 6, 1] as const).forEach((zone, i) => (zones[back[i]!.id] = zone));

  if (swap && zones[swap.replaces] !== undefined) {
    zones[swap.libero] = zones[swap.replaces]!;
    delete zones[swap.replaces];
  }
  return zones;
}

/** Checks every adjacent-zone pair against the given on-court positions. */
export function checkPositionalFaults(
  zones: Record<string, Zone>,
  positions: Record<string, Point>,
): PositionRelation[] {
  const idByZone = new Map<Zone, string>();
  for (const [id, zone] of Object.entries(zones)) idByZone.set(zone, id);

  return CONSTRAINTS.flatMap(({ kind, first, second }) => {
    const firstId = idByZone.get(first);
    const secondId = idByZone.get(second);
    const a = firstId ? positions[firstId] : undefined;
    const b = secondId ? positions[secondId] : undefined;
    if (!firstId || !secondId || !a || !b) return [];
    const ok = kind === 'frontBack' ? a.y < b.y : a.x < b.x;
    return [{ kind, firstId, secondId, firstZone: first, secondZone: second, ok }];
  });
}

/**
 * Phases where the check makes sense for the receiving side: "base" and the
 * first receive-only phase (the reception formation at the service hit).
 * Later phases (set, attack, ...) happen after the serve, when everyone is
 * free to move.
 */
export function getPositionalCheckPhases(phases: Record<string, PhaseDef>): string[] {
  const firstReceive = Object.entries(phases).find(([, def]) => def.team === 'receive')?.[0];
  return ['base', ...(firstReceive ? [firstReceive] : [])].filter((key) => phases[key]);
}
