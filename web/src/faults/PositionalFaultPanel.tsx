import type { PlayerDef } from '../configs/schema';
import { useI18n } from '../i18n/I18nContext';
import type { PositionRelation, Zone } from '../state/positionalFaults';
import './faults.css';

interface PositionalFaultPanelProps {
  /** Single-player view for that player, or back to the whole formation with null. */
  onSelectPlayer: (playerId: string | null) => void;
  players: PlayerDef[];
  zones: Record<string, Zone>;
  relations: PositionRelation[];
  selectedId: string | null;
}

/** Court order of the zones (front row 4-3-2, back row 5-6-1), for the player switcher. */
const ZONE_ORDER: Zone[] = [4, 3, 2, 5, 6, 1];

/**
 * Explanation for the positional-fault overlay drawn on the court (see
 * court/PositionalFaultOverlay), shown in its tab of the court tools panel
 * (see controls/CourtToolsPanel — which also announces a fault while the
 * tab is closed). A switcher picks between the whole formation and a single
 * player (also reachable by clicking the player on court): for a player it
 * lists who they must have in front/behind/left/right; for the formation it
 * lists its faults, if any.
 */
export function PositionalFaultPanel({
  players,
  zones,
  relations,
  selectedId,
  onSelectPlayer,
}: PositionalFaultPanelProps) {
  const { t } = useI18n();
  const label = (id: string) => players.find((p) => p.id === id)?.shortLabel ?? id;
  const selectedZone = selectedId ? zones[selectedId] : undefined;
  const faults = relations.filter((r) => !r.ok);
  const inFault = new Set(faults.flatMap((r) => [r.firstId, r.secondId]));
  const zonedIds = Object.keys(zones).sort((a, b) => ZONE_ORDER.indexOf(zones[a]!) - ZONE_ORDER.indexOf(zones[b]!));

  return (
    <div className="fault-panel">
      {faults.length > 0 && (
        <p className="fault-panel__alert">
          <span aria-hidden="true">⚠ </span>
          {t(faults.length === 1 ? 'faults.summaryOne' : 'faults.summaryMany', { count: faults.length })}
        </p>
      )}

      <div className="fault-panel__views" role="group" aria-label={t('faults.viewLabel')}>
        <button
          type="button"
          className="fault-panel__view"
          aria-pressed={!selectedId}
          onClick={() => onSelectPlayer(null)}
        >
          {t('faults.viewAll')}
        </button>
        {zonedIds.map((id) => (
          <button
            key={id}
            type="button"
            className={`fault-panel__view${inFault.has(id) ? ' has-fault' : ''}`}
            aria-pressed={selectedId === id}
            title={t('faults.viewPlayer', { player: label(id), zone: zones[id]! })}
            onClick={() => onSelectPlayer(id)}
          >
            {label(id)}
          </button>
        ))}
      </div>
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
          {faults.length === 0 && <p className="fault-panel__summary is-ok">{t('faults.summaryOk')}</p>}
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
    </div>
  );
}
