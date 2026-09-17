import type { SetterPosition } from '../configs/schema';
import { SETTER_POSITIONS } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { useI18n } from '../i18n/I18nContext';
import './controls.css';

interface RotationPanelProps {
  setterPosition: SetterPosition;
  team: Team;
  onSelect: (setterPosition: SetterPosition, team: Team) => void;
}

export function RotationPanel({ setterPosition, team, onSelect }: RotationPanelProps) {
  const { t } = useI18n();
  return (
    <section className="panel rotation-panel" aria-label={t('rotation.title')} data-tutorial="rotation">
      <h2 className="panel__title">{t('rotation.title')}</h2>
      <div className="rotation-panel__columns">
        <div className="rotation-panel__col" data-tutorial="rotation-serve">
          <div className="rotation-panel__col-header">{t('rotation.serve')}</div>
          {SETTER_POSITIONS.map((position) => (
            <RotationButton
              key={position}
              label={`P${position}`}
              active={setterPosition === position && team === 'serve'}
              onClick={() => onSelect(position, 'serve')}
            />
          ))}
        </div>
        <div className="rotation-panel__col" data-tutorial="rotation-receive">
          <div className="rotation-panel__col-header">{t('rotation.receive')}</div>
          {SETTER_POSITIONS.map((position) => (
            <RotationButton
              key={position}
              label={`P${position}`}
              active={setterPosition === position && team === 'receive'}
              onClick={() => onSelect(position, 'receive')}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RotationButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`rotation-panel__btn${active ? ' is-active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}
