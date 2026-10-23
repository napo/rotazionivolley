import { describe, expect, it } from 'vitest';
import { builtInConfigs, defaultConfig } from '../configs';
import { SETTER_POSITIONS } from '../configs/schema';
import { checkPositionalFaults, getPositionalCheckPhases, getRotationZones } from './positionalFaults';
import { getPositions, resolveActiveLiberoSwap } from './selectors';

describe('getRotationZones', () => {
  it('assegna le zone dalla fase base (P1: P in zona 1, S1 in 2, C2 in 3, O in 4, S2 in 5, C1 in 6)', () => {
    expect(getRotationZones(defaultConfig, 1)).toEqual({ P: 1, S1: 2, C2: 3, O: 4, S2: 5, C1: 6 });
  });

  it('il libero prende la zona del giocatore che sostituisce', () => {
    const zones = getRotationZones(defaultConfig, 1, { libero: 'L1', replaces: 'C1' });
    expect(zones.L1).toBe(6);
    expect(zones.C1).toBeUndefined();
  });

  it('ogni rotazione ha esattamente le zone 1-6', () => {
    for (const sp of SETTER_POSITIONS) {
      const zones = Object.values(getRotationZones(defaultConfig, sp)).sort();
      expect(zones).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });
});

describe('checkPositionalFaults', () => {
  const zones = { A: 4 as const, B: 3 as const, C: 2 as const, D: 5 as const, E: 6 as const, F: 1 as const };
  const legal = {
    A: { x: 100, y: 50 },
    B: { x: 200, y: 50 },
    C: { x: 300, y: 50 },
    D: { x: 100, y: 300 },
    E: { x: 200, y: 300 },
    F: { x: 300, y: 300 },
  };

  it('controlla solo le 7 coppie adiacenti', () => {
    const relations = checkPositionalFaults(zones, legal);
    expect(relations).toHaveLength(7);
    expect(relations.every((r) => r.ok)).toBe(true);
  });

  it('segnala il fallo avanti/dietro', () => {
    const relations = checkPositionalFaults(zones, { ...legal, C: { x: 300, y: 350 } });
    const bad = relations.filter((r) => !r.ok);
    expect(bad).toEqual([expect.objectContaining({ kind: 'frontBack', firstId: 'C', secondId: 'F' })]);
  });

  it('segnala il fallo destra/sinistra', () => {
    const relations = checkPositionalFaults(zones, { ...legal, A: { x: 250, y: 50 } });
    const bad = relations.filter((r) => !r.ok);
    expect(bad).toEqual([expect.objectContaining({ kind: 'leftRight', firstId: 'A', secondId: 'B' })]);
  });

  it('non confronta zone non adiacenti (4 e 1)', () => {
    const relations = checkPositionalFaults(zones, legal);
    expect(relations.some((r) => [r.firstZone, r.secondZone].sort().join() === '1,4')).toBe(false);
  });
});

describe('schemi inclusi', () => {
  it.each(builtInConfigs.map((config) => [config.name, config] as const))(
    '%s: la formazione di ricezione non ha falli di posizione in nessuna rotazione',
    (_name, config) => {
      const phases = getPositionalCheckPhases(config.phases);
      expect(phases).toEqual(['receiveReceive']);
      for (const sp of SETTER_POSITIONS) {
        const swap = resolveActiveLiberoSwap(config, 'receive', sp);
        const zones = getRotationZones(config, sp, swap);
        for (const phase of phases) {
          const positions = { ...getPositions(config, phase, sp) };
          if (swap) positions[swap.libero] = positions[swap.libero] ?? positions[swap.replaces]!;
          const bad = checkPositionalFaults(zones, positions).filter((r) => !r.ok);
          expect(bad, `P${sp} ${phase}`).toEqual([]);
        }
      }
    },
  );
});
