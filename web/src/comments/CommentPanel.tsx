import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import './comments.css';

interface CommentPanelProps {
  value: string;
  onChange: (text: string) => void;
}

/**
 * Freeform comment for the current (phase, rotation), shown under the court.
 * Saved into the active config's JSON (see state/AppStateContext.setComment)
 * and picked up by PDF pipeline / video export as a subtitle.
 */
export function CommentPanel({ value, onChange }: CommentPanelProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(value);

  // Keep the textarea in sync when the user switches rotation/phase/config.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <section className="panel comment-panel" aria-label={t('comment.title')} data-tutorial="comment">
      <h2 className="panel__title">{t('comment.title')}</h2>
      <textarea
        className="comment-panel__textarea"
        placeholder={t('comment.placeholder')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onChange(draft);
        }}
      />
    </section>
  );
}
