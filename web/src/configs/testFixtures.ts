import type { FormationConfig } from './schema';

/**
 * A small, deterministic config for tests that need to assert on specific
 * coordinate values or structural properties (a clean grid, a sparse
 * libero, etc.) — `defaultConfig` is real, user-authored data edited
 * through the app's own editor, so it drifts and must never be pinned to
 * by exact-value assertions.
 */
export function buildFixtureConfig(): FormationConfig {
  const base = {
    '1': { P: { x: 350, y: 300 }, S1: { x: 350, y: 50 }, C2: { x: 225, y: 50 }, O: { x: 100, y: 50 }, S2: { x: 100, y: 300 }, C1: { x: 225, y: 300 } },
    '2': { C1: { x: 350, y: 300 }, P: { x: 350, y: 50 }, S1: { x: 225, y: 50 }, C2: { x: 100, y: 50 }, O: { x: 100, y: 300 }, S2: { x: 225, y: 300 } },
    '3': { S2: { x: 350, y: 300 }, C1: { x: 350, y: 50 }, P: { x: 225, y: 50 }, S1: { x: 100, y: 50 }, C2: { x: 100, y: 300 }, O: { x: 225, y: 300 } },
    '4': { O: { x: 350, y: 300 }, S2: { x: 350, y: 50 }, C1: { x: 225, y: 50 }, P: { x: 100, y: 50 }, S1: { x: 100, y: 300 }, C2: { x: 225, y: 300 } },
    '5': { C2: { x: 350, y: 300 }, O: { x: 350, y: 50 }, S2: { x: 225, y: 50 }, C1: { x: 100, y: 50 }, P: { x: 100, y: 300 }, S1: { x: 225, y: 300 } },
    '6': { S1: { x: 350, y: 300 }, C2: { x: 350, y: 50 }, O: { x: 225, y: 50 }, S2: { x: 100, y: 50 }, C1: { x: 100, y: 300 }, P: { x: 225, y: 300 } },
  };

  return {
    id: 'fixture',
    name: 'Fixture',
    players: [
      { id: 'P', label: 'Palleggiatore', shortLabel: 'P', role: 'setter' },
      { id: 'O', label: 'Opposto', shortLabel: 'O', role: 'opposite' },
      { id: 'C1', label: 'Centrale 1', shortLabel: 'C1', role: 'middle' },
      { id: 'C2', label: 'Centrale 2', shortLabel: 'C2', role: 'middle' },
      { id: 'S1', label: 'Schiacciatore 1', shortLabel: 'S1', role: 'hitter' },
      { id: 'S2', label: 'Schiacciatore 2', shortLabel: 'S2', role: 'hitter' },
    ],
    liberos: [{ id: 'L1', label: 'Libero 1', shortLabel: 'L1', role: 'libero' }],
    phases: {
      base: { team: 'both', label: 'Base' },
      set: { team: 'both', label: 'Alzata' },
      attack: { team: 'both', label: 'Attacco' },
    },
    positions: { base, set: base, attack: base },
    liberoSwaps: {},
    comments: {},
  };
}
