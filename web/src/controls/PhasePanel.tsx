import type { FormationConfig } from '../configs/schema';
import { getPhasesForTeam } from '../state/selectors';
import type { Team } from '../state/AppStateContext';
import { useI18n } from '../i18n/I18nContext';
import './controls.css';

interface PhasePanelProps {
  config: FormationConfig;
  team: Team;
  phaseKey: string;
  onSelect: (phaseKey: string) => void;
}

export function PhasePanel({ config, team, phaseKey, onSelect }: PhasePanelProps) {
  const { t } = useI18n();
  const phases = getPhasesForTeam(config, team);

  return (
    <section className="panel phase-panel" aria-label={t('phase.ariaLabel')} data-tutorial="phase">
      <h2 className="panel__title">{t('phase.title')}</h2>
      <div className="phase-panel__row">
        {phases.map((phase) => (
          <button
            key={phase.key}
            type="button"
            className={`phase-panel__btn${phase.key === phaseKey ? ' is-active' : ''}`}
            onClick={() => onSelect(phase.key)}
          >
            {phase.label}
          </button>
        ))}
      </div>
    </section>
  );
}
