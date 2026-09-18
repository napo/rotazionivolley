import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../configs';
import { strings } from '../i18n/strings';
import { buildPipelinePages, buildSingleDiagramTitle, type Translate } from './sequence';

// Mirrors I18nContext's t() against the Italian dictionary — sequence.ts is
// DOM/React-free, so tests supply a plain function rather than rendering a
// provider.
const t: Translate = (key, params) => {
  let text: string = strings.it[key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
};

describe('buildPipelinePages', () => {
  // Deliberately mismatched team/phaseKey vs. the sequences under test: the
  // "current" team must NOT leak into serveRotation/receiveRotation, which
  // fix their own team regardless of what's live on screen.
  const current = { team: 'receive' as const, phaseKey: 'receiveHit', setterPosition: 3 as const };

  it('serveRotation: one page per serve-side phase, fixed to serve regardless of the current team', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'serveRotation', t);
    expect(pages.map((p) => p.phaseKey)).toEqual(['base', 'serveServe', 'switchServe']);
    expect(pages.every((p) => p.team === 'serve')).toBe(true);
    expect(pages.every((p) => p.setterPosition === 3)).toBe(true);
  });

  it('receiveRotation: one page per receive-side phase, fixed to receive', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'receiveRotation', t);
    expect(pages.map((p) => p.phaseKey)).toEqual([
      'base',
      'receiveReceive',
      'receiveSet',
      'receiveHit',
      'switchReceive',
    ]);
    expect(pages.every((p) => p.team === 'receive')).toBe(true);
    expect(pages.every((p) => p.setterPosition === 3)).toBe(true);
  });

  it('full: cross product of every phase x every rotation, grouped rotation-major in match order', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'full', t);
    const phaseCount = Object.keys(defaultConfig.phases).length;
    expect(pages).toHaveLength(phaseCount * 6);
    // spot-check no duplicates
    const keys = new Set(pages.map((p) => `${p.phaseKey}-${p.setterPosition}`));
    expect(keys.size).toBe(pages.length);
    // rotation-major: all of P1's phases first, then all of P6's, matching ROTATION_ORDER
    expect(pages.slice(0, phaseCount).every((p) => p.setterPosition === 1)).toBe(true);
    expect(pages.slice(phaseCount, phaseCount * 2).every((p) => p.setterPosition === 6)).toBe(true);
  });

  it('each page carries the fixed document header plus its own line in titleLines', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'serveRotation', t);
    expect(pages[0].titleLines).toEqual(['Servizio situazione P3', defaultConfig.name, 'Base']);
    expect(pages[1].titleLines).toEqual(['Servizio situazione P3', defaultConfig.name, 'Servizio']);
  });

  it('full header is just the scheme name, each page states its own team/rotation/phase', () => {
    const pages = buildPipelinePages(defaultConfig, current, 'full', t);
    expect(pages[0].titleLines[0]).toBe(defaultConfig.name);
    expect(pages[0].titleLines).toHaveLength(2);
    expect(pages[0].titleLines[1]).toMatch(/^(Servizio|Ricezione) - P1 - /);
  });

  it('exposes a saved comment separately from the title, for that (phase, rotation)', () => {
    const withComment = {
      ...defaultConfig,
      comments: { base: { '3': 'Attenzione al muro doppio' } },
    };
    const pages = buildPipelinePages(withComment, current, 'serveRotation', t);
    expect(pages[0].comment).toBe('Attenzione al muro doppio');
    // Other cells without a comment are unaffected.
    expect(pages[1].comment).toBe('');
  });
});

describe('buildSingleDiagramTitle', () => {
  it('returns team + rotation on the first line and the phase label on the second', () => {
    expect(buildSingleDiagramTitle(defaultConfig, 'serve', 'base', 1, t)).toEqual(['Servizio - P1', 'Base']);
    expect(buildSingleDiagramTitle(defaultConfig, 'receive', 'receiveReceive', 6, t)).toEqual([
      'Ricezione - P6',
      'Ricezione',
    ]);
  });
});
