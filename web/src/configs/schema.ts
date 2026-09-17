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

/** playerId -> coordinates, for one (phase, setterPosition) combination */
export const RotationPositionsSchema = z.record(z.string(), PointSchema);
export type RotationPositions = z.infer<typeof RotationPositionsSchema>;

/** setterPosition ("1".."6") -> RotationPositions, for one phase */
export const PhasePositionsSchema = z.record(z.string(), RotationPositionsSchema);
export type PhasePositions = z.infer<typeof PhasePositionsSchema>;

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
     * Free-text comment per (phase, rotation), sparse/optional — phaseKey ->
     * setterPosition ("1".."6") -> text. Shown in a panel under the court and
     * usable as a subtitle/caption in PDF pipeline and video exports.
     */
    comments: z.record(z.string(), z.record(z.string(), z.string())).optional().default({}),
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
  });

export type FormationConfig = z.infer<typeof FormationConfigSchema>;

export function parseFormationConfig(data: unknown): FormationConfig {
  return FormationConfigSchema.parse(data);
}

export function safeParseFormationConfig(data: unknown) {
  return FormationConfigSchema.safeParse(data);
}
