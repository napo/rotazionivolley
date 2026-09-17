import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../configs';
import { buildPipelinePages } from './sequence';

describe('buildPipelinePages', () => {
  const current = { team: 'receive' as const, phaseKey: 'receiveHit', setterPosition: 3 as const };

  it('phasesForRotation: one page per phase of the current team, fixed rotation', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'phasesForRotation');
    expect(pages.map((p) => p.phaseKey)).toEqual(['base', 'receiveReceive', 'receiveSet', 'receiveHit', 'switchReceive']);
    expect(pages.every((p) => p.setterPosition === 3)).toBe(true);
  });

  it('rotationsForPhase: one page per rotation (1-6), fixed phase', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'rotationsForPhase');
    expect(pages.map((p) => p.setterPosition)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(pages.every((p) => p.phaseKey === 'receiveHit')).toBe(true);
  });

  it('full: cross product of every phase x every rotation', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'full');
    const phaseCount = Object.keys(defaultConfig.phases).length;
    expect(pages).toHaveLength(phaseCount * 6);
    // spot-check no duplicates
    const keys = new Set(pages.map((p) => `${p.phaseKey}-${p.setterPosition}`));
    expect(keys.size).toBe(pages.length);
  });

  it('captions include the setter position and phase label', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'phasesForRotation');
    expect(pages[0].caption).toBe('P3 — Base');
  });

  it('appends a saved comment on a new line when one exists for that (phase, rotation)', () => {
    const withComment = {
      ...defaultConfig,
      comments: { base: { '3': 'Attenzione al muro doppio' } },
    };
    const pages = buildPipelinePages(withComment, current, 'phasesForRotation');
    expect(pages[0].caption).toBe('P3 — Base\nAttenzione al muro doppio');
    // Other cells without a comment are unaffected.
    expect(pages[1].caption).toBe('P3 — Ricezione');
  });
});
