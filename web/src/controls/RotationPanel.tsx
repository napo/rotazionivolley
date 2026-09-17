import type { SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { useI18n } from '../i18n/I18nContext';
import './controls.css';

interface RotationPanelProps {
  setterPosition: SetterPosition;
  team: Team;
  onSelect: (setterPosition: SetterPosition, team: Team) => void;
}

// Display order follows the actual rotation sequence (a side-out advances the
// setter from zone N to zone N-1), not numeric order — matching the original
// VBRotations navigator this panel is modelled on.
const DISPLAY_ORDER: SetterPosition[] = [2, 1, 6, 5, 4, 3];

// Row-pair gap (serve <-> receive, same setter position) vs. step gap
// (receive at N -> serve at N-1, i.e. the actual rotation advancing) — kept
// unequal so the zigzag reads as "same rotation, then next rotation".
const PAIR_GAP = 1;
const STEP_GAP = 4;

// Exported so PhasePanel's connector stub can line up with these columns.
export const SERVE_X = 24;
export const RECEIVE_X = 76;

interface Dot {
  position: SetterPosition;
  pairIndex: number;
  yUnits: number;
}

function buildRow(team: Team): Dot[] {
  const offset = team === 'serve' ? 0 : PAIR_GAP;
  return DISPLAY_ORDER.map((position, pairIndex) => ({
    position,
    pairIndex,
    yUnits: pairIndex * (PAIR_GAP + STEP_GAP) + offset,
  }));
}

const SERVE_DOTS = buildRow('serve');
const RECEIVE_DOTS = buildRow('receive');
const TOTAL_UNITS = RECEIVE_DOTS[RECEIVE_DOTS.length - 1].yUnits;

const Y_MARGIN = 6;

function yPercent(units: number): number {
  return Y_MARGIN + (units / TOTAL_UNITS) * (100 - 2 * Y_MARGIN);
}

export function RotationPanel({ setterPosition, team, onSelect }: RotationPanelProps) {
  const { t } = useI18n();

  return (
    <section className="panel rotation-graph" aria-label={t('rotation.title')} data-tutorial="rotation">
      <h2 className="panel__title">{t('rotation.title')}</h2>
      <div className="rotation-graph__headers">
        <span style={{ left: `${SERVE_X}%` }}>{t('rotation.serve')}</span>
        <span style={{ left: `${RECEIVE_X}%` }}>{t('rotation.receive')}</span>
      </div>
      <div className="rotation-graph__body">
        <svg className="rotation-graph__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {DISPLAY_ORDER.map((_, pairIndex) => (
            <line
              key={`pair-${pairIndex}`}
              x1={SERVE_X}
              y1={yPercent(SERVE_DOTS[pairIndex].yUnits)}
              x2={RECEIVE_X}
              y2={yPercent(RECEIVE_DOTS[pairIndex].yUnits)}
              className="rotation-graph__line"
            />
          ))}
          {DISPLAY_ORDER.slice(1).map((_, i) => (
            <line
              key={`step-${i}`}
              x1={RECEIVE_X}
              y1={yPercent(RECEIVE_DOTS[i].yUnits)}
              x2={SERVE_X}
              y2={yPercent(SERVE_DOTS[i + 1].yUnits)}
              className="rotation-graph__line"
            />
          ))}
        </svg>

        <div className="rotation-graph__col" data-tutorial="rotation-serve">
          {SERVE_DOTS.map((dot) => (
            <RotationDot
              key={`serve-${dot.position}`}
              dot={dot}
              x={SERVE_X}
              active={team === 'serve' && setterPosition === dot.position}
              onClick={() => onSelect(dot.position, 'serve')}
            />
          ))}
        </div>
        <div className="rotation-graph__col" data-tutorial="rotation-receive">
          {RECEIVE_DOTS.map((dot) => (
            <RotationDot
              key={`receive-${dot.position}`}
              dot={dot}
              x={RECEIVE_X}
              active={team === 'receive' && setterPosition === dot.position}
              onClick={() => onSelect(dot.position, 'receive')}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RotationDot({
  dot,
  x,
  active,
  onClick,
}: {
  dot: Dot;
  x: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rotation-graph__dot rotation-graph__dot--${dot.pairIndex % 2 === 0 ? 'a' : 'b'}${active ? ' is-active' : ''}`}
      style={{ left: `${x}%`, top: `${yPercent(dot.yUnits)}%` }}
      onClick={onClick}
    >
      {`P${dot.position}`}
    </button>
  );
}
