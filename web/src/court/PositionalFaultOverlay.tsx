import Konva from 'konva';
import { useEffect, useRef } from 'react';
import { Arrow, Circle, Group, Line, Text } from 'react-konva';
import type { Point } from '../configs/schema';
import type { PositionRelation, Zone } from '../state/positionalFaults';
import { PLAYER_RADIUS } from './courtGeometry';

const FAULT_COLOURS = {
  ok: '#1b7a3a',
  fault: '#d0021b',
  badgeFill: '#ffffff',
  badgeText: '#164863',
} as const;

interface PositionalFaultOverlayProps {
  zones: Record<string, Zone>;
  positions: Record<string, Point>;
  relations: PositionRelation[];
  /** When set, only that player's relations are drawn, as arrows pointing to the partners. */
  selectedId?: string | null;
  /** Players tween to their new spots; the overlay fades in once they get there. */
  revealDelayMs?: number;
}

/** Segment between two marker centres, trimmed so it starts/ends at the circle edges. */
function trimmed(a: Point, b: Point, gap: number): number[] | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len <= gap * 2) return null;
  const ux = dx / len;
  const uy = dy / len;
  return [a.x + ux * gap, a.y + uy * gap, b.x - ux * gap, b.y - uy * gap];
}

/**
 * Konva layer content drawn above the players: a zone badge on each player
 * and one segment per adjacent-zone pair (dashed green = order respected,
 * solid thick red = positional fault). Dash vs solid keeps the two states
 * distinguishable without relying on colour.
 */
export function PositionalFaultOverlay({
  zones,
  positions,
  relations,
  selectedId,
  revealDelayMs = 0,
}: PositionalFaultOverlayProps) {
  const groupRef = useRef<Konva.Group>(null);
  const positionsKey = JSON.stringify(positions);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    if (revealDelayMs <= 0) {
      node.opacity(1);
      return;
    }
    node.opacity(0);
    const timer = window.setTimeout(() => {
      node.to({ opacity: 1, duration: 0.2 });
    }, revealDelayMs);
    return () => window.clearTimeout(timer);
  }, [positionsKey, revealDelayMs]);

  const gap = PLAYER_RADIUS + 6;
  const selectedRelations = selectedId
    ? relations.filter((r) => r.firstId === selectedId || r.secondId === selectedId)
    : null;

  return (
    <Group ref={groupRef} listening={false}>
      {(selectedRelations ?? relations).map((r) => {
        const fromId = selectedId && r.secondId === selectedId ? r.secondId : r.firstId;
        const toId = fromId === r.firstId ? r.secondId : r.firstId;
        const points = trimmed(positions[fromId]!, positions[toId]!, gap);
        if (!points) return null;
        const colour = r.ok ? FAULT_COLOURS.ok : FAULT_COLOURS.fault;
        const common = {
          points,
          stroke: colour,
          strokeWidth: r.ok ? 4 : 7,
          dash: r.ok ? [10, 8] : undefined,
          lineCap: 'round' as const,
        };
        return selectedRelations ? (
          <Arrow key={`${r.firstId}-${r.secondId}`} {...common} fill={colour} pointerLength={16} pointerWidth={16} />
        ) : (
          <Line key={`${r.firstId}-${r.secondId}`} {...common} />
        );
      })}

      {Object.entries(zones).map(([id, zone]) => {
        const p = positions[id];
        if (!p) return null;
        const bx = p.x + PLAYER_RADIUS * 0.8;
        const by = p.y - PLAYER_RADIUS * 0.8;
        const r = 13;
        return (
          <Group key={id} x={bx} y={by}>
            <Circle radius={r} fill={FAULT_COLOURS.badgeFill} stroke={FAULT_COLOURS.badgeText} strokeWidth={2} />
            <Text
              text={String(zone)}
              width={r * 2}
              height={r * 2}
              offsetX={r}
              offsetY={r}
              align="center"
              verticalAlign="middle"
              fontStyle="bold"
              fontFamily="Verdana, sans-serif"
              fontSize={15}
              fill={FAULT_COLOURS.badgeText}
            />
          </Group>
        );
      })}
    </Group>
  );
}
