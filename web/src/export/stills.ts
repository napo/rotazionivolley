import type { FormationConfig, PlayerDef, ReceptionZones, RotationPositions } from '../configs/schema';
import { computeFaultOverlay, type FaultOverlayData, type PositionRelation } from '../state/positionalFaults';
import { computeZonesOverlay } from '../state/receptionZones';
import { resolveDiagramState } from '../state/selectors';
import type { SequencePage, Translate } from './sequence';

/** What a sequence export (multi-page PDF, video) adds after each formation it applies to. */
export interface OverlayChoice {
  faults: boolean;
  zones: boolean;
}

/**
 * page: the formation as such; zones: its reception competence map;
 * faultsAll / faultsPlayer: its positional-fault overlay for the whole team,
 * then for one player.
 */
export type StillKind = 'page' | 'zones' | 'faultsAll' | 'faultsPlayer';

/** One image of a sequence export: a PDF page, or a held frame of the video. */
export interface Still {
  kind: StillKind;
  players: PlayerDef[];
  positions: RotationPositions;
  title: string[];
  caption?: string;
  faults?: FaultOverlayData;
  zones?: ReceptionZones;
}

function faultCount(t: Translate, relations: PositionRelation[]): string {
  const count = relations.filter((r) => !r.ok).length;
  return count === 0 ? t('export.faults.none') : t(count === 1 ? 'faults.summaryOne' : 'faults.summaryMany', { count });
}

/**
 * The stills of a sequence export, grouped per page: the page itself, then
 * — where they apply, as in the live view — its competence map (reception
 * formation only) and its positional faults (receiving side at the service
 * hit), first for the whole team and then one player at a time in the order
 * P, S1, C2, O, S2, C1 (the libero in place of the player it replaces).
 * Stills of the same page share its positions.
 */
export function buildStills(
  config: FormationConfig,
  pages: SequencePage[],
  activeLiberoId: string | null | undefined,
  include: OverlayChoice,
  t: Translate,
): Still[][] {
  return pages.map((page) => {
    const { players, positions } = resolveDiagramState(config, page.team, page.phaseKey, page.setterPosition, activeLiberoId);
    const base = { players, positions, title: page.titleLines };
    const stills: Still[] = [{ ...base, kind: 'page', caption: page.comment || undefined }];

    const zones = include.zones
      ? computeZonesOverlay(config, page.team, page.phaseKey, page.setterPosition, players, positions)
      : null;
    if (zones) stills.push({ ...base, kind: 'zones', caption: t('zones.title'), zones });

    const overlay = include.faults
      ? computeFaultOverlay(config, page.team, page.phaseKey, page.setterPosition, activeLiberoId, positions)
      : null;
    if (overlay) {
      const label = (id: string) => players.find((p) => p.id === id)?.shortLabel ?? id;
      stills.push({
        ...base,
        kind: 'faultsAll',
        caption: `${t('export.faults.all')} · ${faultCount(t, overlay.relations)}`,
        faults: { zones: overlay.zones, relations: overlay.relations, selectedId: null },
      });
      for (const id of overlay.tour) {
        const own = overlay.relations.filter((r) => r.firstId === id || r.secondId === id);
        stills.push({
          ...base,
          kind: 'faultsPlayer',
          caption: `${t('export.faults.player', { player: label(id), zone: overlay.zones[id]! })} · ${faultCount(t, own)}`,
          faults: { zones: overlay.zones, relations: overlay.relations, selectedId: id },
        });
      }
    }
    return stills;
  });
}
