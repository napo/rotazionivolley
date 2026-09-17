import { SETTER_POSITIONS, type FormationConfig, type SetterPosition } from '../configs/schema';
import { getComment, getPhasesForTeam } from '../state/selectors';
import type { Team } from '../state/AppStateContext';

export type PipelineSequenceKind = 'phasesForRotation' | 'rotationsForPhase' | 'full';

export interface SequencePage {
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
      phaseKey: current.phaseKey,
      setterPosition,
      caption: withComment(config, current.phaseKey, setterPosition, `P${setterPosition} — ${label}`),
    }));
  }

  const pages: SequencePage[] = [];
  for (const [phaseKey, phase] of Object.entries(config.phases)) {
    for (const setterPosition of SETTER_POSITIONS) {
      pages.push({
        phaseKey,
        setterPosition,
        caption: withComment(config, phaseKey, setterPosition, `P${setterPosition} — ${phase.label}`),
      });
    }
  }
  return pages;
}
