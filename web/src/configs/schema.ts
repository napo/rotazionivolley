import { z } from 'zod';

export const PlayerRoleSchema = z.enum(['setter', 'opposite', 'middle', 'hitter', 'libero']);
export type PlayerRole = z.infer<typeof PlayerRoleSchema>;

export const PlayerDefSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  shortLabel: z.string().min(1),
  role: PlayerRoleSchema,
});
export type PlayerDef = z.infer<typeof PlayerDefSchema>;

export const TeamSideSchema = z.enum(['serve', 'receive', 'both']);
export type TeamSide = z.infer<typeof TeamSideSchema>;

export const PhaseDefSchema = z.object({
  team: TeamSideSchema,
  label: z.string().min(1),
});
export type PhaseDef = z.infer<typeof PhaseDefSchema>;

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Point = z.infer<typeof PointSchema>;

export const SETTER_POSITIONS = [1, 2, 3, 4, 5, 6] as const;
export type SetterPosition = (typeof SETTER_POSITIONS)[number];

/**
 * The order rotations actually advance in during a match (a side-out moves
 * the setter from zone N to zone N-1), rather than numeric order — used
 * wherever rotations are shown or exported as a sequence a player would
 * recognize (the rotation navigator, pipeline PDF/video exports).
 */
export const ROTATION_ORDER: readonly SetterPosition[] = [1, 6, 5, 4, 3, 2];

/** playerId -> coordinates, for one (phase, setterPosition) combination */
export const RotationPositionsSchema = z.record(z.string(), PointSchema);
export type RotationPositions = z.infer<typeof RotationPositionsSchema>;

/** setterPosition ("1".."6") -> RotationPositions, for one phase */
export const PhasePositionsSchema = z.record(z.string(), RotationPositionsSchema);
export type PhasePositions = z.infer<typeof PhasePositionsSchema>;

/**
 * Which libero is on court in place of which (real) player, for one
 * rotation *and one team side* (serve or receive). Chosen only on the
 * "base" phase and then locked for every phase of that sequence (base ->
 * ... -> the final "switch" phase) — a real substitution isn't something a
 * team can walk back mid play, only decide again once play resets to base.
 * "base" itself is shared visually by both the serve and receive sequences,
 * but the libero decision is not: a team may want it in for their receive
 * sequence and out for their serve sequence at the very same rotation, so
 * the two are tracked independently. See the editor's libero swap UI, which
 * only allows editing this while on "base" (for whichever side — serve or
 * receive column — is currently selected).
 */
export const LiberoSwapSchema = z.object({
  libero: z.string().min(1),
  replaces: z.string().min(1),
});
export type LiberoSwap = z.infer<typeof LiberoSwapSchema>;

/** setterPosition ("1".."6") -> team side ("serve"/"receive") -> the active libero swap, if any. */
export const LiberoSwapsSchema = z.record(z.string(), z.record(z.string(), LiberoSwapSchema));
export type LiberoSwaps = z.infer<typeof LiberoSwapsSchema>;

/**
 * Reception competence map for one rotation (receive side, reception
 * phase): a planar partition of the court into one polygon per receiver.
 * Polygons reference shared vertex ids rather than holding their own
 * coordinates, so dragging a vertex moves every area that touches it and
 * neighbouring areas can never drift apart. `competence` lists the sides
 * (from the player's point of view, facing the net) whose shared borders
 * are that player's ball — drawn as a darker band inside their area.
 */
export const CompetenceSideSchema = z.enum(['left', 'right', 'front', 'back']);
export type CompetenceSide = z.infer<typeof CompetenceSideSchema>;

export const ReceptionAreaSchema = z.object({
  playerId: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  vertices: z.array(z.string().min(1)).min(3),
  competence: z.array(CompetenceSideSchema).default([]),
});
export type ReceptionArea = z.infer<typeof ReceptionAreaSchema>;

export const ReceptionZonesSchema = z.object({
  vertices: z.record(z.string(), PointSchema),
  areas: z.array(ReceptionAreaSchema),
});
export type ReceptionZones = z.infer<typeof ReceptionZonesSchema>;

export const FormationConfigSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    players: z.array(PlayerDefSchema).min(1),
    /**
     * Optional Libero definitions (0-2, per volleyball rules). Unlike
     * `players`, liberos are NOT required to have coordinates for every
     * (phase, rotation) — the viewer derives their position automatically by
     * swapping in for whichever back-row middle they replace (see
     * state/selectors.ts). The editor can still author explicit sparse
     * entries in `positions` for them, which take precedence when present.
     */
    liberos: z.array(PlayerDefSchema).max(2).optional().default([]),
    phases: z.record(z.string(), PhaseDefSchema),
    positions: z.record(z.string(), PhasePositionsSchema),
    /**
     * Explicit, editor-authored record of which libero replaces which player
     * for a given (rotation, team side) — see the editor's libero swap UI.
     * Sparse/optional: no entry simply means no libero on court there.
     */
    liberoSwaps: LiberoSwapsSchema.optional().default({}),
    /**
     * Free-text comment per (phase, rotation), sparse/optional — phaseKey ->
     * setterPosition ("1".."6") -> text. Shown in a panel under the court and
     * usable as a subtitle/caption in PDF pipeline and video exports.
     */
    comments: z.record(z.string(), z.record(z.string(), z.string())).optional().default({}),
    /**
     * Reception competence maps, sparse/optional — setterPosition ("1".."6")
     * -> zones, for the receive side's reception phase only. No entry means
     * the viewer derives a default map from the players' positions (see
     * state/receptionZones.ts).
     */
    receptionZones: z.record(z.string(), ReceptionZonesSchema).optional().default({}),
  })
  .superRefine((config, ctx) => {
    const playerIds = config.players.map((p) => p.id);
    const phaseKeys = Object.keys(config.phases);

    for (const libero of config.liberos) {
      if (libero.role !== 'libero') {
        ctx.addIssue({
          code: 'custom',
          message: `Il giocatore "${libero.id}" in "liberos" deve avere role: "libero"`,
          path: ['liberos'],
        });
      }
    }

    if (phaseKeys.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'La configurazione deve definire almeno una fase' });
    }

    for (const phaseKey of phaseKeys) {
      const phasePositions = config.positions[phaseKey];
      if (!phasePositions) {
        ctx.addIssue({
          code: 'custom',
          message: `Posizioni mancanti per la fase "${phaseKey}"`,
          path: ['positions', phaseKey],
        });
        continue;
      }
      for (const setterPosition of SETTER_POSITIONS) {
        const key = String(setterPosition);
        const rotation = phasePositions[key];
        if (!rotation) {
          ctx.addIssue({
            code: 'custom',
            message: `Posizioni mancanti per la fase "${phaseKey}", rotazione P${setterPosition}`,
            path: ['positions', phaseKey, key],
          });
          continue;
        }
        for (const playerId of playerIds) {
          if (!rotation[playerId]) {
            ctx.addIssue({
              code: 'custom',
              message: `Coordinate mancanti per il giocatore "${playerId}" in fase "${phaseKey}", rotazione P${setterPosition}`,
              path: ['positions', phaseKey, key, playerId],
            });
          }
        }
      }
    }

    const liberoIds = config.liberos.map((l) => l.id);
    for (const [setterKey, byTeam] of Object.entries(config.liberoSwaps)) {
      for (const [team, swap] of Object.entries(byTeam)) {
        if (!liberoIds.includes(swap.libero)) {
          ctx.addIssue({
            code: 'custom',
            message: `liberoSwaps: "${swap.libero}" non è un libero dichiarato in "liberos"`,
            path: ['liberoSwaps', setterKey, team, 'libero'],
          });
        }
        if (!playerIds.includes(swap.replaces)) {
          ctx.addIssue({
            code: 'custom',
            message: `liberoSwaps: "${swap.replaces}" non è un giocatore dichiarato in "players"`,
            path: ['liberoSwaps', setterKey, team, 'replaces'],
          });
        }
      }
    }

    const allPlayerIds = [...playerIds, ...liberoIds];
    for (const [setterKey, zones] of Object.entries(config.receptionZones)) {
      zones.areas.forEach((area, i) => {
        if (!allPlayerIds.includes(area.playerId)) {
          ctx.addIssue({
            code: 'custom',
            message: `receptionZones: "${area.playerId}" non è un giocatore dichiarato`,
            path: ['receptionZones', setterKey, 'areas', i, 'playerId'],
          });
        }
        for (const vertexId of area.vertices) {
          if (!zones.vertices[vertexId]) {
            ctx.addIssue({
              code: 'custom',
              message: `receptionZones: vertice "${vertexId}" mancante`,
              path: ['receptionZones', setterKey, 'areas', i, 'vertices'],
            });
          }
        }
      });
    }
  });

export type FormationConfig = z.infer<typeof FormationConfigSchema>;

export function parseFormationConfig(data: unknown): FormationConfig {
  return FormationConfigSchema.parse(data);
}

export function safeParseFormationConfig(data: unknown) {
  return FormationConfigSchema.safeParse(data);
}
