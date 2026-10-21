import type { PlayerDef } from '../configs/schema';
import { useI18n } from '../i18n/I18nContext';
import type { PositionRelation, Zone } from '../state/positionalFaults';
import './faults.css';

interface PositionalFaultPanelProps {
  /** Why the check can't run right now, or null when it can. */
  unavailableReason: string | null;
  enabled: boolean;
  onToggle: () => void;
  players: PlayerDef[];
  zones: Record<string, Zone>;
  relations: PositionRelation[];
  selectedId: string | null;
}

/**
 * Toggle + explanation for the positional-fault overlay drawn on the court
 * (see court/PositionalFaultOverlay). With a player selected it lists who
 * that player must have in front/behind/left/right; otherwise it summarises
 * the faults (if any) of the whole formation.
 */
export function PositionalFaultPanel({
  unavailableReason,
  enabled,
  onToggle,
  players,
  zones,
  relations,
  selectedId,
}: PositionalFaultPanelProps) {
  const { t } = useI18n();
  const label = (id: string) => players.find((p) => p.id === id)?.shortLabel ?? id;
  const active = enabled && !unavailableReason;
  const selectedZone = selectedId ? zones[selectedId] : undefined;
  const faults = relations.filter((r) => !r.ok);

  return (
    <section className="panel fault-panel" aria-label={t('faults.title')}>
      <div className="fault-panel__header">
        <h2 className="panel__title">{t('faults.title')}</h2>
        <button
          type="button"
          className={`fault-panel__toggle${active ? ' is-active' : ''}`}
          aria-pressed={active}
          disabled={!!unavailableReason}
          onClick={onToggle}
        >
          {active ? t('faults.hide') : t('faults.show')}
        </button>
      </div>

      {unavailableReason && <p className="fault-panel__note">{unavailableReason}</p>}

      {active && (
        <>
          {selectedId && selectedZone !== undefined ? (
            <div className="fault-panel__player">
              <p className="fault-panel__heading">
                {t('faults.playerHeading', { player: label(selectedId), zone: selectedZone })}
              </p>
              <ul className="fault-panel__list">
                {relations
                  .filter((r) => r.firstId === selectedId || r.secondId === selectedId)
                  .map((r) => {
                    const isFirst = r.firstId === selectedId;
                    const otherId = isFirst ? r.secondId : r.firstId;
                    const otherZone = isFirst ? r.secondZone : r.firstZone;
                    const key =
                      r.kind === 'frontBack'
                        ? isFirst
                          ? 'faults.needsBehind'
                          : 'faults.needsInFront'
                        : isFirst
                          ? 'faults.needsRight'
                          : 'faults.needsLeft';
                    return (
                      <li key={`${r.firstId}-${r.secondId}`} className={r.ok ? 'is-ok' : 'is-fault'}>
                        <span className="fault-panel__mark" aria-hidden="true">
                          {r.ok ? '✓' : '✗'}
                        </span>
                        <span>
                          {t(key, { other: label(otherId), zone: otherZone })}
                          {!r.ok && <strong> — {t('faults.faultNow')}</strong>}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ) : (
            <>
              <p className={`fault-panel__summary ${faults.length ? 'is-fault' : 'is-ok'}`}>
                {faults.length === 0
                  ? t('faults.summaryOk')
                  : t(faults.length === 1 ? 'faults.summaryOne' : 'faults.summaryMany', { count: faults.length })}
              </p>
              {faults.length > 0 && (
                <ul className="fault-panel__list">
                  {faults.map((r) => (
                    <li key={`${r.firstId}-${r.secondId}`} className="is-fault">
                      <span className="fault-panel__mark" aria-hidden="true">
                        ✗
                      </span>
                      <span>
                        {t(r.kind === 'frontBack' ? 'faults.pairFrontBack' : 'faults.pairLeftRight', {
                          first: label(r.firstId),
                          firstZone: r.firstZone,
                          second: label(r.secondId),
                          secondZone: r.secondZone,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="fault-panel__note">{t('faults.hint')}</p>
            </>
          )}
          <p className="fault-panel__note">{t('faults.rule')}</p>
        </>
      )}
    </section>
  );
}
