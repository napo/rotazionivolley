import { useLayoutEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { tutorialSteps } from './tutorialSteps';
import './tutorial.css';

interface TutorialProps {
  onClose: () => void;
  /** See TutorialStep.usesSamplePlayerRect. */
  getSamplePlayerRect?: () => DOMRect | null;
}

/**
 * Union of a set of elements' boxes, in viewport coordinates. Used for the
 * rotation panel's serve/receive columns: each column wrapper fills the
 * whole panel (its dots are placed by percentage against the shared body),
 * so its own getBoundingClientRect() would spotlight the entire panel —
 * the dots it actually contains are the real target.
 */
function unionRect(elements: Element[]): DOMRect | null {
  if (elements.length === 0) return null;
  const boxes = elements.map((el) => el.getBoundingClientRect());
  const left = Math.min(...boxes.map((b) => b.left));
  const top = Math.min(...boxes.map((b) => b.top));
  const right = Math.max(...boxes.map((b) => b.right));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

export function Tutorial({ onClose, getSamplePlayerRect }: TutorialProps) {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = tutorialSteps[stepIndex];

  useLayoutEffect(() => {
    if (step.usesSamplePlayerRect) {
      const playerRect = getSamplePlayerRect?.() ?? null;
      if (playerRect) {
        setRect(playerRect);
        return;
      }
    }
    const el = document.querySelector(step.target);
    if (el?.classList.contains('rotation-graph__col')) {
      setRect(unionRect(Array.from(el.querySelectorAll('.rotation-graph__dot'))) ?? el.getBoundingClientRect());
      return;
    }
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step, getSamplePlayerRect]);

  const isLast = stepIndex === tutorialSteps.length - 1;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label={t('app.tutorialButton')}>
      {rect && (
        <div
          className="tutorial-overlay__spotlight"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}
      <div className="tutorial-overlay__callout">
        <p>
          {t(step.textKey)
            .split('\n')
            .map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
        </p>
        <div className="tutorial-overlay__actions">
          <button type="button" onClick={onClose}>
            {t('tutorial.close')}
          </button>
          <button type="button" onClick={() => (isLast ? onClose() : setStepIndex((i) => i + 1))} autoFocus>
            {isLast ? t('tutorial.finish') : t('tutorial.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
