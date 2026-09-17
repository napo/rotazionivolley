import { useLayoutEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { tutorialSteps } from './tutorialSteps';
import './tutorial.css';

interface TutorialProps {
  onClose: () => void;
}

export function Tutorial({ onClose }: TutorialProps) {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = tutorialSteps[stepIndex];

  useLayoutEffect(() => {
    const el = document.querySelector(step.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

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
