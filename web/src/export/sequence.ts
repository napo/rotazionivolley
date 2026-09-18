import { ROTATION_ORDER, type FormationConfig, type SetterPosition } from '../configs/schema';
import type { StringKey } from '../i18n/strings';
import { getComment, getPhasesForTeam } from '../state/selectors';
import type { Team } from '../state/AppStateContext';

// "serveRotation"/"receiveRotation" both use the rotation (Px) currently on
// screen, but fix the team to serve/receive respectively regardless of
// which side is currently active — see buildPipelinePages.
export type PipelineSequenceKind = 'serveRotation' | 'receiveRotation' | 'full';
export type Translate = (key: StringKey, params?: Record<string, string | number>) => string;

export interface SequencePage {
  team: Team;
  phaseKey: string;
  setterPosition: SetterPosition;
  /** Top-of-page title block, document context first then this page's own line — see buildPipelinePages. */
  titleLines: string[];
  /** Saved note for this (phase, rotation), if any — shown under the image, not mixed into the title. */
  comment: string;
}

export interface CurrentSelection {
  team: Team;
  phaseKey: string;
  setterPosition: SetterPosition;
}

function teamLabel(t: Translate, team: Team): string {
  return t(team === 'serve' ? 'rotation.serve' : 'rotation.receive');
}

/** The two-line title used for a single (non-pipeline) PNG/PDF export. */
export function buildSingleDiagramTitle(
  config: FormationConfig,
  team: Team,
  phaseKey: string,
  setterPosition: SetterPosition,
  t: Translate,
): string[] {
  const phaseLabel = config.phases[phaseKey]?.label ?? phaseKey;
  return [`${teamLabel(t, team)} - P${setterPosition}`, phaseLabel];
}

/**
 * Document-level header shown at the top of every page of a pipeline export,
 * above that page's own line (added by buildPipelinePages) — what's fixed
 * across the whole sequence, so a printed page stays self-explanatory out of
 * context: a rotation and a (forced) team for "serveRotation"/
 * "receiveRotation", or just the scheme itself for "full".
 */
function buildPipelineHeader(
  config: FormationConfig,
  current: CurrentSelection,
  sequence: PipelineSequenceKind,
  t: Translate,
): string[] {
  if (sequence === 'full') {
    return [config.name];
  }
  const team: Team = sequence === 'serveRotation' ? 'serve' : 'receive';
  return [t('export.header.rotation', { team: teamLabel(t, team), position: current.setterPosition }), config.name];
}

/** Builds the page list for a pipeline export, per the sequence type chosen by the user. Pure/DOM-free. */
export function buildPipelinePages(
  config: FormationConfig,
  current: CurrentSelection,
  sequence: PipelineSequenceKind,
  t: Translate,
): SequencePage[] {
  const header = buildPipelineHeader(config, current, sequence, t);

  if (sequence === 'serveRotation' || sequence === 'receiveRotation') {
    const team: Team = sequence === 'serveRotation' ? 'serve' : 'receive';
    return getPhasesForTeam(config, team).map((phase) => ({
      team,
      phaseKey: phase.key,
      setterPosition: current.setterPosition,
      titleLines: [...header, phase.label],
      comment: getComment(config, phase.key, current.setterPosition),
    }));
  }

  // "full": grouped rotation-major (all of a rotation's phases together, in
  // match rotation order) rather than phase-major, so it reads as a playbook
  // — "here's rotation P1 end to end", then "here's P6 end to end", etc.
  const pages: SequencePage[] = [];
  for (const setterPosition of ROTATION_ORDER) {
    for (const [phaseKey, phase] of Object.entries(config.phases)) {
      // "base" (team: "both") has no team of its own — the libero choice
      // there is scoped per side, so fall back to whichever side the export
      // was started from.
      const team = phase.team === 'both' ? current.team : phase.team;
      pages.push({
        team,
        phaseKey,
        setterPosition,
        titleLines: [...header, `${teamLabel(t, team)} - P${setterPosition} - ${phase.label}`],
        comment: getComment(config, phaseKey, setterPosition),
      });
    }
  }
  return pages;
}
