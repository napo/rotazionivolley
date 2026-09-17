import { describe, expect, it } from 'vitest';
import { defaultConfig } from './index';
import { parseFormationConfig, safeParseFormationConfig } from './schema';
import { buildFixtureConfig } from './testFixtures';

describe('FormationConfigSchema', () => {
  it('accepts the built-in ricezione-a-3 config', () => {
    expect(() => parseFormationConfig(defaultConfig)).not.toThrow();
  });

  it('rejects a config missing coordinates for a player in one rotation', () => {
    const broken = structuredClone(defaultConfig) as Record<string, unknown>;
    const positions = broken.positions as Record<string, Record<string, Record<string, unknown>>>;
    delete positions.base['3'].P;

    const result = safeParseFormationConfig(broken);
    expect(result.success).toBe(false);
  });

  it('rejects a config missing an entire rotation for a phase', () => {
    const broken = structuredClone(defaultConfig) as Record<string, unknown>;
    const positions = broken.positions as Record<string, Record<string, unknown>>;
    delete positions.receiveHit['4'];

    const result = safeParseFormationConfig(broken);
    expect(result.success).toBe(false);
  });

  it('accepts liberos with no coordinates at all (sparse by design)', () => {
    const fixture = buildFixtureConfig();
    expect(fixture.liberos.map((l) => l.id)).toEqual(['L1']);
    for (const phaseKey of Object.keys(fixture.phases)) {
      for (const setterPosition of ['1', '2', '3', '4', '5', '6']) {
        expect(fixture.positions[phaseKey][setterPosition].L1).toBeUndefined();
      }
    }
    expect(() => parseFormationConfig(fixture)).not.toThrow();
  });

  it('rejects a libero entry whose role is not "libero"', () => {
    const broken = structuredClone(defaultConfig) as Record<string, unknown>;
    (broken.liberos as Array<Record<string, unknown>>)[0].role = 'hitter';

    const result = safeParseFormationConfig(broken);
    expect(result.success).toBe(false);
  });

  it('defaults liberos to an empty array when omitted', () => {
    const withoutLiberos = structuredClone(buildFixtureConfig()) as Record<string, unknown>;
    delete withoutLiberos.liberos;

    const result = safeParseFormationConfig(withoutLiberos);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.liberos).toEqual([]);
    }
  });
});
