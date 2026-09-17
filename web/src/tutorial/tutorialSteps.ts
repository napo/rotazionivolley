import type { StringKey } from '../i18n/strings';

export interface TutorialStep {
  /** CSS selector for the element this step highlights. */
  target: string;
  textKey: StringKey;
}

export const tutorialSteps: TutorialStep[] = [
  // Individual players are drawn on a <canvas> (Konva), not as separate DOM
  // nodes, so this step spotlights the whole court rather than one marker.
  { target: '[data-tutorial="court"]', textKey: 'tutorial.step1' },
  { target: '[data-tutorial="court"]', textKey: 'tutorial.step2' },
  { target: '[data-tutorial="rotation"]', textKey: 'tutorial.step3' },
  { target: '[data-tutorial="rotation-serve"]', textKey: 'tutorial.step4' },
  { target: '[data-tutorial="rotation-receive"]', textKey: 'tutorial.step5' },
  { target: '[data-tutorial="phase"]', textKey: 'tutorial.step6' },
];
