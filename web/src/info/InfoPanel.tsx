import { useI18n } from '../i18n/I18nContext';
import { APP_VERSION } from '../version';
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

        <p>
          {t('info.project')}{' '}
          <a href="https://github.com/napo" target="_blank" rel="noreferrer">
            Maurizio Napolitano
          </a>
        </p>
        <p>{t('info.builtOn')}</p>
        <p>
          {t('info.sourceLabel')}{' '}
          <a href="https://github.com/napo/rotazionivolley" target="_blank" rel="noreferrer">
            https://github.com/napo/rotazionivolley
          </a>
        </p>
        <p>{t('info.aiAssisted')}</p>
        <p>{t('info.version', { version: APP_VERSION })}</p>
        <p>
          {t('info.licenseLabel')}{' '}
          <a href="https://github.com/napo/rotazionivolley/blob/master/LICENSE" target="_blank" rel="noreferrer">
            Apache License 2.0
          </a>
        </p>
      </div>
    </div>
  );
}
