import { describe, expect, it } from 'vitest';
import { COLOURS } from './courtGeometry';
import { contrastRatio, WCAG_NON_TEXT_MIN, WCAG_TEXT_AA_MIN } from './colorAccessibility';

// Colours are chosen so a colour-vision deficiency doesn't have to rely on
// hue alone: player vs playerHighlight has a large luminance gap (dark navy
// vs light gold), which survives protanopia/deuteranopia/tritanopia
// simulation and even full colour blindness (grayscale) — see the palette
// notes on COLOURS in courtGeometry.ts.
describe('court colour accessibility (WCAG)', () => {
  it('player marker has sufficient contrast against the court fill', () => {
    expect(contrastRatio(COLOURS.player, COLOURS.court)).toBeGreaterThanOrEqual(WCAG_NON_TEXT_MIN);
  });

  it('highlighted player marker has sufficient contrast against the unhighlighted player colour', () => {
    expect(contrastRatio(COLOURS.playerHighlight, COLOURS.player)).toBeGreaterThanOrEqual(WCAG_NON_TEXT_MIN);
  });

  it('player label text is readable on the normal player fill', () => {
    expect(contrastRatio(COLOURS.playerLabel, COLOURS.player)).toBeGreaterThanOrEqual(WCAG_TEXT_AA_MIN);
  });

  it('player label text is readable on the highlighted player fill', () => {
    expect(contrastRatio(COLOURS.playerLabelHighlighted, COLOURS.playerHighlight)).toBeGreaterThanOrEqual(
      WCAG_TEXT_AA_MIN,
    );
  });
});
