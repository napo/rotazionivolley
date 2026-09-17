import type { FormationConfig, LiberoSwap, PlayerDef, Point } from '../configs/schema';
import { LIBERO_BENCH_SLOTS } from './courtGeometry';

export interface BenchDisplay {
  /** Every real player plus every libero — always the full roster, on court or benched. */
  players: PlayerDef[];
  /** On-court coordinates for whoever is playing, bench slot coordinates for whoever is out. */
  positions: Record<string, Point>;
  /** Ids currently benched: liberos not in `swap`, plus the player `swap` replaces (if any). */
  benchedIds: Set<string>;
}

/**
 * Lays out the full roster for one (phase, rotation) cell, given which
 * libero swap (if any) is in effect — shared by the editor (drag-to-edit)
 * and the live viewer (read-only), so the "who's on the bench" visual is
 * identical in both places.
 */
export function computeBenchDisplay(
  config: FormationConfig,
  cellPositions: Record<string, Point>,
  swap: LiberoSwap | undefined,
): BenchDisplay {
  const players = [...config.players, ...config.liberos];
  const positions: Record<string, Point> = { ...cellPositions };
  const benchedIds = new Set<string>();

  config.liberos.forEach((libero, i) => {
    const benchSlot = LIBERO_BENCH_SLOTS[i] ?? LIBERO_BENCH_SLOTS[0];
    if (swap?.libero === libero.id) {
      positions[libero.id] = cellPositions[libero.id] ?? cellPositions[swap.replaces] ?? benchSlot;
    } else {
      positions[libero.id] = benchSlot;
      benchedIds.add(libero.id);
    }
  });

  if (swap) {
    const benchIndex = config.liberos.findIndex((l) => l.id === swap.libero);
    positions[swap.replaces] = LIBERO_BENCH_SLOTS[benchIndex] ?? LIBERO_BENCH_SLOTS[0];
    benchedIds.add(swap.replaces);
  }

  return { players, positions, benchedIds };
}
