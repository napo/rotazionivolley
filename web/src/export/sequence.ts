import { SETTER_POSITIONS, type FormationConfig, type SetterPosition } from '../configs/schema';
import { getComment, getPhasesForTeam } from '../state/selectors';
import type { Team } from '../state/AppStateContext';

export type PipelineSequenceKind = 'phasesForRotation' | 'rotationsForPhase' | 'full';

export interface SequencePage {
  team: Team;
  phaseKey: string;
  setterPosition: SetterPosition;
  caption: string;
}

export interface CurrentSelection {
  team: Team;
  phaseKey: string;
  setterPosition: SetterPosition;
}

function withComment(config: FormationConfig, phaseKey: string, setterPosition: SetterPosition, caption: string) {
  const comment = getComment(config, phaseKey, setterPosition);
  return comment ? `${caption}\n${comment}` : caption;
}

/** Builds the page list for a pipeline export, per the sequence type chosen by the user. Pure/DOM-free. */
export function buildPipelinePages(
  config: FormationConfig,
  current: CurrentSelection,
  sequence: PipelineSequenceKind,
): SequencePage[] {
  if (sequence === 'phasesForRotation') {
    return getPhasesForTeam(config, current.team).map((phase) => ({
      team: current.team,
      phaseKey: phase.key,
      setterPosition: current.setterPosition,
      caption: withComment(
        config,
        phase.key,
        current.setterPosition,
        `P${current.setterPosition} — ${phase.label}`,
      ),
    }));
  }

  if (sequence === 'rotationsForPhase') {
    const label = config.phases[current.phaseKey]?.label ?? current.phaseKey;
    return SETTER_POSITIONS.map((setterPosition) => ({
      team: current.team,
      phaseKey: current.phaseKey,
      setterPosition,
      caption: withComment(config, current.phaseKey, setterPosition, `P${setterPosition} — ${label}`),
    }));
  }

  const pages: SequencePage[] = [];
  for (const [phaseKey, phase] of Object.entries(config.phases)) {
    // "base" (team: "both") has no team of its own — the libero choice
    // there is scoped per side, so fall back to whichever side the export
    // was started from.
    const team = phase.team === 'both' ? current.team : phase.team;
    for (const setterPosition of SETTER_POSITIONS) {
      pages.push({
        team,
        phaseKey,
        setterPosition,
        caption: withComment(config, phaseKey, setterPosition, `P${setterPosition} — ${phase.label}`),
      });
    }
  }
  return pages;
}
