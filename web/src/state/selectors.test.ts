import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../configs';
import { buildFixtureConfig } from '../configs/testFixtures';
import {
  getBackRowMiddleId,
  getComment,
  getLiberoSwap,
  getPhasesForTeam,
  getPositions,
  resolveDiagramState,
  withComment,
  withLiberoSwap,
} from './selectors';

describe('getPositions', () => {
  it('returns coordinates for a known (phase, rotation)', () => {
    const fixture = buildFixtureConfig();
    const positions = getPositions(fixture, 'base', 1);
    expect(positions.P).toEqual({ x: 350, y: 300 });
    expect(positions.S1).toEqual({ x: 350, y: 50 });
    expect(positions.C2).toEqual({ x: 225, y: 50 });
    expect(positions.O).toEqual({ x: 100, y: 50 });
    expect(positions.S2).toEqual({ x: 100, y: 300 });
    expect(positions.C1).toEqual({ x: 225, y: 300 });
  });

  it('returns coordinates for every setter position and every phase', () => {
    for (const phaseKey of Object.keys(defaultConfig.phases)) {
      for (let setterPosition = 1; setterPosition <= 6; setterPosition++) {
        const positions = getPositions(defaultConfig, phaseKey, setterPosition as 1 | 2 | 3 | 4 | 5 | 6);
        for (const player of defaultConfig.players) {
          expect(positions[player.id]).toBeDefined();
        }
      }
    }
  });

  it('throws for an unknown phase', () => {
    expect(() => getPositions(defaultConfig, 'doesNotExist', 1)).toThrow(/Fase sconosciuta/);
  });
});

describe('getBackRowMiddleId', () => {
  it('picks whichever middle has the larger y in the base phase, per rotation', () => {
    const fixture = buildFixtureConfig();
    const expected: Record<number, string> = { 1: 'C1', 2: 'C1', 3: 'C2', 4: 'C2', 5: 'C2', 6: 'C1' };
    for (const [setterPosition, expectedId] of Object.entries(expected)) {
      expect(getBackRowMiddleId(fixture, Number(setterPosition) as 1 | 2 | 3 | 4 | 5 | 6)).toBe(expectedId);
    }
  });
});

describe('resolveDiagramState with an active libero', () => {
  it('without an active libero, returns all 6 standard players unchanged', () => {
    const fixture = buildFixtureConfig();
    const { players, positions } = resolveDiagramState(fixture, 'receive', 'base', 1, null);
    expect(players.map((p) => p.id).sort()).toEqual(['C1', 'C2', 'O', 'P', 'S1', 'S2']);
    expect(positions.C1).toEqual({ x: 225, y: 300 });
  });

  it('replaces the back-row middle with the active libero, at the same coordinates', () => {
    const fixture = buildFixtureConfig();
    const { players, positions } = resolveDiagramState(fixture, 'receive', 'base', 1, 'L1');
    const ids = players.map((p) => p.id).sort();
    expect(ids).toEqual(['C2', 'L1', 'O', 'P', 'S1', 'S2']); // C1 (back row at rotation 1) is replaced
    expect(positions.L1).toEqual({ x: 225, y: 300 }); // borrows C1's coordinates
    expect(positions.C1).toBeUndefined();
  });

  it('replaces the other middle once the rotation puts it in the back row', () => {
    const fixture = buildFixtureConfig();
    const { players } = resolveDiagramState(fixture, 'receive', 'base', 3, 'L1');
    const ids = players.map((p) => p.id).sort();
    expect(ids).toEqual(['C1', 'L1', 'O', 'P', 'S1', 'S2']); // C2 is back row at rotation 3
  });

  it('applies the same manual swap across every phase of a rotation, not just base', () => {
    const fixture = buildFixtureConfig();
    const { players, positions } = resolveDiagramState(fixture, 'receive', 'attack', 1, 'L1');
    expect(players.some((p) => p.id === 'L1')).toBe(true);
    expect(players.some((p) => p.id === 'C1')).toBe(false);
    expect(positions.L1).toEqual(getPositions(fixture, 'attack', 1).C1);
  });

  it('an unknown libero id is ignored (no swap)', () => {
    const fixture = buildFixtureConfig();
    const { players } = resolveDiagramState(fixture, 'receive', 'base', 1, 'doesNotExist');
    expect(players.map((p) => p.id).sort()).toEqual(['C1', 'C2', 'O', 'P', 'S1', 'S2']);
  });
});

describe('getLiberoSwap / withLiberoSwap', () => {
  it('is undefined when nothing was ever authored', () => {
    const fixture = buildFixtureConfig();
    expect(getLiberoSwap(fixture, 'receive', 1)).toBeUndefined();
  });

  it('is scoped per rotation, not per phase — one choice holds for every phase of that side’s sequence', () => {
    const withSwap = withLiberoSwap(buildFixtureConfig(), 'receive', 1, { libero: 'L1', replaces: 'C1' });
    expect(getLiberoSwap(withSwap, 'receive', 1)).toEqual({ libero: 'L1', replaces: 'C1' });
    // Same value regardless of which phase is being viewed — there's no per-phase override.
    expect(resolveDiagramState(withSwap, 'receive', 'set', 1, null).players.some((p) => p.id === 'L1')).toBe(true);
    expect(resolveDiagramState(withSwap, 'receive', 'attack', 1, null).players.some((p) => p.id === 'L1')).toBe(true);
  });

  it('does not leak into other rotations', () => {
    const withSwap = withLiberoSwap(buildFixtureConfig(), 'receive', 1, { libero: 'L1', replaces: 'C1' });
    expect(getLiberoSwap(withSwap, 'receive', 3)).toBeUndefined();
  });

  it('clearing (undefined) removes the swap again', () => {
    let config = withLiberoSwap(buildFixtureConfig(), 'receive', 1, { libero: 'L1', replaces: 'C1' });
    config = withLiberoSwap(config, 'receive', 1, undefined);
    expect(getLiberoSwap(config, 'receive', 1)).toBeUndefined();
  });

  it('is independent between serve and receive for the very same rotation — "base" is shared visually but not for the libero choice', () => {
    let config = withLiberoSwap(buildFixtureConfig(), 'receive', 1, { libero: 'L1', replaces: 'C1' });
    // Only the receive side was set — the serve side for the same P1 stays empty.
    expect(getLiberoSwap(config, 'serve', 1)).toBeUndefined();
    expect(resolveDiagramState(config, 'serve', 'base', 1, null).players.some((p) => p.id === 'L1')).toBe(false);
    expect(resolveDiagramState(config, 'receive', 'base', 1, null).players.some((p) => p.id === 'L1')).toBe(true);

    // Setting the serve side too doesn't disturb the receive side.
    config = withLiberoSwap(config, 'serve', 1, { libero: 'L1', replaces: 'C2' });
    expect(getLiberoSwap(config, 'receive', 1)).toEqual({ libero: 'L1', replaces: 'C1' });
    expect(getLiberoSwap(config, 'serve', 1)).toEqual({ libero: 'L1', replaces: 'C2' });
  });
});

describe('comments', () => {
  it('getComment returns an empty string when none is set', () => {
    expect(getComment(defaultConfig, 'base', 2)).toBe('');
  });

  it('withComment sets a comment without mutating the original config, isolated per (phase, rotation)', () => {
    const updated = withComment(defaultConfig, 'base', 2, 'Attenta al centrale');
    expect(getComment(updated, 'base', 2)).toBe('Attenta al centrale');
    expect(getComment(defaultConfig, 'base', 2)).toBe(''); // original untouched
    expect(getComment(updated, 'base', 3)).toBe(''); // other rotations untouched
  });
});

describe('getPhasesForTeam', () => {
  it('lists base + serve-only phases for the serving team, in JSON order', () => {
    const phases = getPhasesForTeam(defaultConfig, 'serve').map((p) => p.key);
    expect(phases).toEqual(['base', 'serveServe', 'switchServe']);
  });

  it('lists base + receive-only phases for the receiving team, in JSON order', () => {
    const phases = getPhasesForTeam(defaultConfig, 'receive').map((p) => p.key);
    expect(phases).toEqual(['base', 'receiveReceive', 'receiveSet', 'receiveHit', 'switchReceive']);
  });
});
