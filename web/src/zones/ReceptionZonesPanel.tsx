import type { CompetenceSide, PlayerDef, ReceptionArea, ReceptionZones } from '../configs/schema';
import { useI18n } from '../i18n/I18nContext';
import { COMPETENCE_SIDES, summariseNeighbours } from '../state/receptionZones';
import '../faults/faults.css';
import './zones.css';

interface ReceptionZonesPanelProps {
  editing: boolean;
  onToggleEditing: () => void;
  players: PlayerDef[];
  /** Players on court who may be given a zone (everyone but the setter). */
  candidateIds: string[];
  zones: ReceptionZones;
  onChangeArea: (playerId: string, change: Partial<ReceptionArea>) => void;
  onSetReceivers: (playerIds: string[]) => void;
  /** Back to the map derived from the positions; undefined when nothing was customised. */
  onReset?: () => void;
}

const SIDE_ARROWS: Record<CompetenceSide, string> = { left: '←', right: '→', front: '↑', back: '↓' };

/**
 * Controls for the reception competence map drawn on the court (see
 * court/ReceptionZonesLayer), shown in its tab of the court tools panel
 * (see controls/CourtToolsPanel): an edit-mode switch, one row per receiver with their colour,
 * the sides whose borders are their ball and a button to drop their zone
 * (the remaining ones are recomputed to cover the court), buttons to give
 * a zone to the other players on court (not the setter), and a
 * summary of who takes the ball between each pair of neighbours — flagging
 * borders nobody claims or both do.
 */
export function ReceptionZonesPanel({
  editing,
  onToggleEditing,
  players,
  candidateIds,
  zones,
  onChangeArea,
  onSetReceivers,
  onReset,
}: ReceptionZonesPanelProps) {
  const { t } = useI18n();
  const label = (id: string) => players.find((p) => p.id === id)?.shortLabel ?? id;
  const receiverIds = zones.areas.map((a) => a.playerId);
  const neighbours = summariseNeighbours(zones);
  const addableIds = candidateIds.filter((id) => !receiverIds.includes(id));

  return (
    <div className="zones-panel">
      <div className="zones-panel__toolbar">
        <p className="fault-panel__note">{editing ? t('zones.editHint') : t('zones.hint')}</p>
        <button
          type="button"
          className={`fault-panel__toggle${editing ? ' is-active' : ''}`}
          aria-pressed={editing}
          onClick={onToggleEditing}
        >
          {editing ? t('zones.editDone') : t('zones.edit')}
        </button>
      </div>

      <ul className="zones-panel__areas">
        {zones.areas.map((area) => (
          <li key={area.playerId} className="zones-panel__area">
            <label className="zones-panel__swatch" style={{ background: area.color }} title={t('zones.colour', { player: label(area.playerId) })}>
              <input
                type="color"
                value={area.color}
                aria-label={t('zones.colour', { player: label(area.playerId) })}
                onChange={(e) => onChangeArea(area.playerId, { color: e.target.value })}
              />
            </label>
            <span className="zones-panel__player">{label(area.playerId)}</span>
            <div className="zones-panel__sides" role="group" aria-label={t('zones.sidesLabel', { player: label(area.playerId) })}>
              {COMPETENCE_SIDES.map((side) => {
                const on = area.competence.includes(side);
                return (
                  <button
                    key={side}
                    type="button"
                    className="zones-panel__side"
                    aria-pressed={on}
                    title={t(`zones.side.${side}`)}
                    onClick={() =>
                      onChangeArea(area.playerId, {
                        competence: on ? area.competence.filter((s) => s !== side) : [...area.competence, side],
                      })
                    }
                  >
                    <span aria-hidden="true">{SIDE_ARROWS[side]}</span> {t(`zones.side.${side}`)}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="zones-panel__remove"
              aria-label={t('zones.remove', { player: label(area.playerId) })}
              title={t('zones.remove', { player: label(area.playerId) })}
              disabled={zones.areas.length <= 1}
              onClick={() => onSetReceivers(receiverIds.filter((r) => r !== area.playerId))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {neighbours.length > 0 && (
        <ul className="fault-panel__list zones-panel__summary">
          {neighbours.map(({ areas: [i, j], owners }) => {
            const a = label(zones.areas[i]!.playerId);
            const b = label(zones.areas[j]!.playerId);
            const ok = owners.length === 1;
            return (
              <li key={`${i}-${j}`} className={ok ? 'is-ok' : 'is-fault'}>
                <span className="fault-panel__mark" aria-hidden="true">
                  {ok ? '✓' : '!'}
                </span>
                <span>
                  {owners.length === 0
                    ? t('zones.borderNobody', { a, b })
                    : owners.length === 1
                      ? t('zones.borderOwner', { a, b, owner: label(zones.areas[owners[0]!]!.playerId) })
                      : t('zones.borderBoth', { a, b })}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {addableIds.length > 0 && (
        <div className="fault-panel__views zones-panel__add" role="group" aria-label={t('zones.addLabel')}>
          <span className="zones-panel__add-label">{t('zones.addLabel')}</span>
          {addableIds.map((id) => (
            <button
              key={id}
              type="button"
              className="fault-panel__view"
              aria-label={t('zones.add', { player: label(id) })}
              onClick={() => onSetReceivers([...receiverIds, id])}
            >
              + {label(id)}
            </button>
          ))}
        </div>
      )}

      {onReset && (
        <p className="fault-panel__note">
          <button type="button" className="zones-panel__reset" onClick={onReset}>
            {t('zones.reset')}
          </button>
        </p>
      )}
    </div>
  );
}
