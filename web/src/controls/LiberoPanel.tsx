import type { FormationConfig } from '../configs/schema';
import { useI18n } from '../i18n/I18nContext';
import './controls.css';

interface LiberoPanelProps {
  config: FormationConfig;
  activeLiberoId: string | null;
  onSelect: (liberoId: string | null) => void;
}

export function LiberoPanel({ config, activeLiberoId, onSelect }: LiberoPanelProps) {
  const { t } = useI18n();
  if (config.liberos.length === 0) {
    return null;
  }

  return (
    <section className="panel libero-panel" aria-label={t('libero.title')} data-tutorial="libero">
      <h2 className="panel__title">{t('libero.title')}</h2>
      <div className="libero-panel__row">
        <button
          type="button"
          className={`libero-panel__btn${activeLiberoId === null ? ' is-active' : ''}`}
          onClick={() => onSelect(null)}
        >
          {t('libero.none')}
        </button>
        {config.liberos.map((libero) => (
          <button
            key={libero.id}
            type="button"
            className={`libero-panel__btn${activeLiberoId === libero.id ? ' is-active' : ''}`}
            onClick={() => onSelect(libero.id)}
          >
            {libero.shortLabel}
          </button>
        ))}
      </div>
    </section>
  );
}
