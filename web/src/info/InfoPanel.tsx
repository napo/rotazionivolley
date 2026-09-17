import { useI18n } from '../i18n/I18nContext';
import './info.css';

interface InfoPanelProps {
  onClose: () => void;
}

export function InfoPanel({ onClose }: InfoPanelProps) {
  const { t } = useI18n();

  return (
    <div className="info-overlay" role="dialog" aria-modal="true" aria-label={t('info.title')}>
      <div className="info-overlay__box">
        <div className="info-overlay__header">
          <h2>{t('info.title')}</h2>
          <button type="button" onClick={onClose} aria-label={t('info.close')}>
            ✕
          </button>
        </div>

        <section>
          <h3>{t('info.about.title')}</h3>
          <p>{t('info.about.body')}</p>
        </section>

        <section>
          <h3>{t('info.author.title')}</h3>
          <p>{t('info.author.body')}</p>
        </section>

        <section>
          <h3>{t('info.source.title')}</h3>
          <p>
            <a href="https://github.com/napo/rotazionivolley" target="_blank" rel="noreferrer">
              github.com/napo/rotazionivolley
            </a>
          </p>
        </section>

        <section>
          <h3>{t('info.ai.title')}</h3>
          <p>{t('info.ai.body')}</p>
        </section>
      </div>
    </div>
  );
}
