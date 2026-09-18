import type { StringKey } from '../i18n/strings';

export interface TutorialStep {
  /** CSS selector for the element this step highlights. */
  target: string;
  /**
   * Spotlight a single player marker instead of `target` — players are
   * Konva shapes on a <canvas>, not DOM nodes, so this comes from the live
   * stage (see CourtStage's `apiRef`) rather than a selector. Falls back to
   * `target` if no player is available (e.g. a config with none).
   */
  usesSamplePlayerRect?: boolean;
  textKey: StringKey;
}

export const tutorialSteps: TutorialStep[] = [
  { target: '[data-tutorial="court"]', usesSamplePlayerRect: true, textKey: 'tutorial.step1' },
  { target: '[data-tutorial="court"]', textKey: 'tutorial.step2' },
  { target: '[data-tutorial="rotation"]', textKey: 'tutorial.step3' },
  { target: '[data-tutorial="rotation-serve"]', textKey: 'tutorial.step4' },
  { target: '[data-tutorial="rotation-receive"]', textKey: 'tutorial.step5' },
  { target: '[data-tutorial="phase"]', textKey: 'tutorial.step6' },
];
