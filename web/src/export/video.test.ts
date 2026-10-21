import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../configs';
import { buildPipelinePages, type Translate } from './sequence';
import { buildSegments } from './video';

const t: Translate = (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key);

describe('video: fotogrammi dei falli di posizione', () => {
  // Default scheme at P2: in receive the libero L1 replaces C1.
  const pages = buildPipelinePages(defaultConfig, { team: 'receive', phaseKey: 'base', setterPosition: 2 }, 'receiveRotation', t);

  it('senza la vista dei falli c’è un fotogramma per fase', () => {
    expect(buildSegments(defaultConfig, pages, null, false, t)).toHaveLength(pages.length);
  });

  it('nella formazione di ricezione: tutta la squadra, poi P, S1, C2, O, S2 e il libero al posto di C1', () => {
    const segments = buildSegments(defaultConfig, pages, null, true, t);
    const receiveIndex = pages.findIndex((p) => p.phaseKey === 'receiveReceive');
    const faultStills = segments.filter((s) => s.faults);

    expect(segments).toHaveLength(pages.length + 7);
    expect(faultStills.map((s) => s.faults!.selectedId)).toEqual([null, 'P', 'S1', 'C2', 'O', 'S2', 'L1']);
    expect(faultStills.every((s) => s.title === pages[receiveIndex]!.titleLines)).toBe(true);

    // Only the move to the next phase is animated, not the stills of the same formation.
    const lastOfReceive = segments.indexOf(faultStills[faultStills.length - 1]!);
    expect(segments.slice(receiveIndex, lastOfReceive).every((s) => s.transitionMs === 0)).toBe(true);
    expect(segments[lastOfReceive]!.transitionMs).toBeGreaterThan(0);
  });

  it('la fase base non ha il giro dei falli (le zone si ricavano proprio da lì)', () => {
    const segments = buildSegments(defaultConfig, pages, null, true, t);
    const baseTitle = pages.find((p) => p.phaseKey === 'base')!.titleLines;
    expect(segments.filter((s) => s.title === baseTitle && s.faults)).toEqual([]);
  });
});
