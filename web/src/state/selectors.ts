import type { FormationConfig, LiberoSwap, PlayerDef, RotationPositions, SetterPosition, TeamSide } from '../configs/schema';

export function getPositions(
  config: FormationConfig,
  phaseKey: string,
  setterPosition: SetterPosition,
): RotationPositions {
  const phase = config.positions[phaseKey];
  if (!phase) {
    throw new Error(`Fase sconosciuta: "${phaseKey}"`);
  }
  const rotation = phase[String(setterPosition)];
  if (!rotation) {
    throw new Error(`Rotazione sconosciuta: P${setterPosition} per la fase "${phaseKey}"`);
  }
  return rotation;
}

/**
 * Which "middle" player is in the back row for a given rotation, derived
 * from the "base" phase (the only phase whose coordinates directly
 * correspond to real court zones — tactical phases like "attacco" move
 * players to attacking positions that no longer reflect their zone). In a
 * standard 6-player rotation exactly one of the two middles is back-row at
 * any time (front row = near the net, smaller y; back row = larger y),
 * which is also exactly who a libero is allowed to replace under the rules.
 */
export function getBackRowMiddleId(config: FormationConfig, setterPosition: SetterPosition): string | undefined {
  const base = config.positions.base?.[String(setterPosition)];
  if (!base) return undefined;

  const middles = config.players.filter((p) => p.role === 'middle');
  let backRowId: string | undefined;
  let maxY = -Infinity;
  for (const middle of middles) {
    const point = base[middle.id];
    if (point && point.y > maxY) {
      maxY = point.y;
      backRowId = middle.id;
    }
  }
  return backRowId;
}

/**
 * The 3 back-row player ids for a rotation, derived from the "base" phase
 * (the only phase whose coordinates directly correspond to real court
 * zones): whoever has the larger y (further from the net) in that phase.
 * This is the set of players a libero is allowed to replace — see
 * getBackRowMiddleId for the narrower "which middle" case the live viewer
 * still uses, and the editor's libero swap UI for the general case.
 */
export function getBackRowPlayerIds(config: FormationConfig, setterPosition: SetterPosition): string[] {
  const base = config.positions.base?.[String(setterPosition)];
  if (!base) return [];
  return config.players
    .filter((p) => base[p.id])
    .sort((a, b) => base[b.id]!.y - base[a.id]!.y)
    .slice(0, 3)
    .map((p) => p.id);
}

/**
 * Returns the active libero swap for one (rotation, team side), if any.
 * Chosen only on "base" and shared by every phase in that side's sequence
 * (base -> ... -> switch) — but "base" itself is shared visually by both
 * sides, so the serve-side and receive-side choices for the same rotation
 * are tracked independently (see LiberoSwapSchema).
 */
export function getLiberoSwap(
  config: FormationConfig,
  team: 'serve' | 'receive',
  setterPosition: SetterPosition,
): LiberoSwap | undefined {
  return config.liberoSwaps[String(setterPosition)]?.[team];
}

/** Returns a copy of `config` with the libero swap for (setterPosition, team) set or cleared. */
export function withLiberoSwap(
  config: FormationConfig,
  team: 'serve' | 'receive',
  setterPosition: SetterPosition,
  swap: LiberoSwap | undefined,
): FormationConfig {
  const key = String(setterPosition);
  const byTeam = { ...config.liberoSwaps[key] };
  if (swap) {
    byTeam[team] = swap;
  } else {
    delete byTeam[team];
  }
  return { ...config, liberoSwaps: { ...config.liberoSwaps, [key]: byTeam } };
}

/**
 * The libero swap actually driving the diagram right now: a manually
 * selected libero (from the viewer's Libero panel) always wins and swaps in
 * for this rotation's back-row middle; with no manual selection, falls back
 * to whatever the editor authored for this (rotation, team side) — see
 * getLiberoSwap.
 */
export function resolveActiveLiberoSwap(
  config: FormationConfig,
  team: 'serve' | 'receive',
  setterPosition: SetterPosition,
  activeLiberoId?: string | null,
): LiberoSwap | undefined {
  if (activeLiberoId) {
    const libero = config.liberos.find((l) => l.id === activeLiberoId);
    const replacedId = libero ? getBackRowMiddleId(config, setterPosition) : undefined;
    return libero && replacedId ? { libero: libero.id, replaces: replacedId } : undefined;
  }
  return getLiberoSwap(config, team, setterPosition);
}

export interface DiagramState {
  players: PlayerDef[];
  positions: RotationPositions;
}

/**
 * Resolves "which players are shown, and where" for a given (team, phase,
 * rotation) — the single source of truth used by both the live Konva view
 * and every headless export path (PNG/PDF/video), so they can never drift
 * out of sync.
 *
 * `activeLiberoId` (a manual pick from the viewer's Libero panel) always
 * wins when set; otherwise the swap the editor authored for this (rotation,
 * team side) is used automatically (see resolveActiveLiberoSwap /
 * getLiberoSwap). Either way, an explicit editor-authored position for the
 * libero at this (phase, rotation) is used if present, otherwise the libero
 * simply borrows the replaced player's own coordinates for this phase.
 */
export function resolveDiagramState(
  config: FormationConfig,
  team: 'serve' | 'receive',
  phaseKey: string,
  setterPosition: SetterPosition,
  activeLiberoId?: string | null,
): DiagramState {
  const positions = getPositions(config, phaseKey, setterPosition);
  const swap = resolveActiveLiberoSwap(config, team, setterPosition, activeLiberoId);
  const libero = swap ? config.liberos.find((l) => l.id === swap.libero) : undefined;

  if (!swap || !libero || !positions[swap.replaces]) {
    return { players: config.players, positions };
  }

  const liberoPosition = positions[libero.id] ?? positions[swap.replaces];
  const resolvedPositions: RotationPositions = { ...positions, [libero.id]: liberoPosition };
  delete resolvedPositions[swap.replaces];

  const players = config.players.filter((p) => p.id !== swap.replaces).concat(libero);

  return { players, positions: resolvedPositions };
}

export function getComment(config: FormationConfig, phaseKey: string, setterPosition: SetterPosition): string {
  return config.comments[phaseKey]?.[String(setterPosition)] ?? '';
}

/** Returns a copy of `config` with the comment for (phaseKey, setterPosition) set. */
export function withComment(
  config: FormationConfig,
  phaseKey: string,
  setterPosition: SetterPosition,
  text: string,
): FormationConfig {
  return {
    ...config,
    comments: {
      ...config.comments,
      [phaseKey]: { ...config.comments[phaseKey], [String(setterPosition)]: text },
    },
  };
}

export interface PhaseOption {
  key: string;
  label: string;
  team: TeamSide;
}

/** Phases available for a given team, in JSON declaration order (shared "both" phases included). */
export function getPhasesForTeam(config: FormationConfig, team: 'serve' | 'receive'): PhaseOption[] {
  return Object.entries(config.phases)
    .filter(([, def]) => def.team === team || def.team === 'both')
    .map(([key, def]) => ({ key, label: def.label, team: def.team }));
}
