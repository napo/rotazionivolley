import type { FormationConfig, PlayerDef, RotationPositions, SetterPosition, TeamSide } from '../configs/schema';

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

export interface DiagramState {
  players: PlayerDef[];
  positions: RotationPositions;
}

/**
 * Resolves "which players are shown, and where" for a given (phase,
 * rotation) — the single source of truth used by both the live Konva view
 * and every headless export path (PNG/PDF/video), so they can never drift
 * out of sync.
 *
 * When `activeLiberoId` names one of the config's designated liberos, the
 * back-row middle for this rotation (see getBackRowMiddleId) is hidden and
 * replaced by the libero: an explicit, editor-authored position for that
 * libero at this (phase, rotation) is used if present, otherwise the libero
 * simply borrows the replaced middle's own coordinates for this phase.
 */
export function resolveDiagramState(
  config: FormationConfig,
  phaseKey: string,
  setterPosition: SetterPosition,
  activeLiberoId?: string | null,
): DiagramState {
  const positions = getPositions(config, phaseKey, setterPosition);
  const libero = activeLiberoId ? config.liberos.find((l) => l.id === activeLiberoId) : undefined;

  if (!libero) {
    return { players: config.players, positions };
  }

  const replacedId = getBackRowMiddleId(config, setterPosition);
  if (!replacedId || !positions[replacedId]) {
    return { players: config.players, positions };
  }

  const liberoPosition = getPositions(config, phaseKey, setterPosition)[libero.id] ?? positions[replacedId];
  const resolvedPositions: RotationPositions = { ...positions, [libero.id]: liberoPosition };
  delete resolvedPositions[replacedId];

  const players = config.players.filter((p) => p.id !== replacedId).concat(libero);

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
