import type { FormationConfig } from '../configs/schema';
import { getPhasesForTeam } from '../state/selectors';
import type { Team } from '../state/AppStateContext';
import { useI18n } from '../i18n/I18nContext';
import { RECEIVE_X, SERVE_X } from './RotationPanel';
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
  const last = phases.length - 1;
  const margin = 12;
  const xPercent = (i: number) => (last === 0 ? 50 : margin + (i / last) * (100 - 2 * margin));
  // Alternate a top/bottom tier so labels have room to breathe — with 5
  // phases (the receive side) same-row neighbours would otherwise overlap.
  const TOP = 30;
  const BOTTOM = 70;
  const yPercent = (i: number) => (i % 2 === 0 ? TOP : BOTTOM);

  const connectorX = team === 'serve' ? SERVE_X : RECEIVE_X;

  return (
    <section className="panel phase-graph" aria-label={t('phase.ariaLabel')} data-tutorial="phase">
      <div className="phase-graph__connector" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1={connectorX} y1="0" x2={connectorX} y2="100" className="phase-graph__connector-line" />
        </svg>
      </div>
      <h2 className="panel__title">{t('phase.title')}</h2>
      <div className="phase-graph__body">
        <svg className="phase-graph__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {phases.slice(1).map((phase, i) => (
            <line
              key={phase.key}
              x1={xPercent(i)}
              y1={yPercent(i)}
              x2={xPercent(i + 1)}
              y2={yPercent(i + 1)}
              className="phase-graph__line"
            />
          ))}
        </svg>
        {phases.map((phase, i) => (
          <button
            key={phase.key}
            type="button"
            className={`phase-graph__dot phase-graph__dot--${i % 2 === 0 ? 'a' : 'b'}${phase.key === phaseKey ? ' is-active' : ''}`}
            style={{ left: `${xPercent(i)}%`, top: `${yPercent(i)}%` }}
            onClick={() => onSelect(phase.key)}
          >
            {phase.label}
          </button>
        ))}
      </div>
    </section>
  );
}
