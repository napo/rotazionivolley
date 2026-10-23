import Konva from 'konva';
import { useEffect, useRef } from 'react';
import { Circle, Group, Line, Text } from 'react-konva';
import type { Point, ReceptionZones } from '../configs/schema';
import {
  areaPoints,
  canRemoveVertex,
  constrainVertex,
  darken,
  getCompetenceEdges,
  getSharedEdges,
  isCornerVertex,
} from '../state/receptionZones';
import { CourtLines } from './CourtBackground';
import { COLOURS, ZONE_STYLE } from './courtGeometry';

interface ReceptionZonesUnderlayProps {
  zones: ReceptionZones;
  /** Players tween to their new spots; the map fades in once they get there. */
  revealDelayMs?: number;
  /** Changes whenever the rotation does, to re-run the fade. */
  revealKey: string;
}

/**
 * Konva content drawn under the players: one translucent polygon per
 * receiver, white borders between them, and — for each border a player
 * claims (see getCompetenceEdges) — a darker band of that player's colour on
 * their side of it. The band is clipped to the owner's polygon, so whose
 * ball it is reads from which side it sits on even without the colours.
 * The court markings are redrawn on top in black (white gets lost on the
 * tinted areas), dashes included, so the 3 m line stays a reference.
 */
export function ReceptionZonesUnderlay({ zones, revealDelayMs = 0, revealKey }: ReceptionZonesUnderlayProps) {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    if (revealDelayMs <= 0) {
      node.opacity(1);
      return;
    }
    node.opacity(0);
    const timer = window.setTimeout(() => node.to({ opacity: 1, duration: 0.2 }), revealDelayMs);
    return () => window.clearTimeout(timer);
  }, [revealKey, revealDelayMs]);

  const edges = getCompetenceEdges(zones);
  const flat = (points: Point[]) => points.flatMap((p) => [p.x, p.y]);

  return (
    <Group ref={groupRef} listening={false}>
      {zones.areas.map((area) => (
        <Line
          key={`fill-${area.playerId}`}
          points={flat(areaPoints(zones, area))}
          closed
          fill={area.color}
          opacity={ZONE_STYLE.fillOpacity}
        />
      ))}
      {zones.areas.map((area, i) => {
        const owned = edges.filter((e) => e.owners.includes(i));
        if (owned.length === 0) return null;
        const polygon = areaPoints(zones, area);
        return (
          <Group
            key={`band-${area.playerId}`}
            clipFunc={(ctx) => {
              ctx.beginPath();
              polygon.forEach((p, j) => (j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
              ctx.closePath();
            }}
          >
            {owned.map((e) => (
              <Line
                key={`${e.a}-${e.b}`}
                points={flat([zones.vertices[e.a]!, zones.vertices[e.b]!])}
                stroke={darken(area.color)}
                strokeWidth={ZONE_STYLE.bandWidth}
                lineCap="round"
                opacity={ZONE_STYLE.bandOpacity}
              />
            ))}
          </Group>
        );
      })}
      {zones.areas.map((area) => (
        <Line
          key={`edge-${area.playerId}`}
          points={flat(areaPoints(zones, area))}
          closed
          stroke="#ffffff"
          strokeWidth={ZONE_STYLE.borderWidth}
          opacity={ZONE_STYLE.borderOpacity}
        />
      ))}
      <CourtLines colour={COLOURS.zoneLine} strokeWidth={ZONE_STYLE.courtLineWidth} />
    </Group>
  );
}

interface ReceptionZonesHandlesProps {
  zones: ReceptionZones;
  onMoveVertex: (vertexId: string, point: Point) => void;
  onMoveEnd: () => void;
  onSplitEdge: (a: string, b: string) => void;
  onRemoveVertex: (vertexId: string) => void;
}

function setCursor(e: Konva.KonvaEventObject<MouseEvent>, cursor: string) {
  const stage = e.target.getStage();
  if (stage) stage.container().style.cursor = cursor;
}

/**
 * Edit-mode handles, drawn above the players: a white dot per vertex (drag
 * to move — shared vertices move every area at once; double click/tap to
 * remove one that only bends a border) and a small "+" halfway along each
 * border between two areas (click to add a vertex there). Court corners are
 * fixed and border vertices slide along the border (see constrainVertex).
 */
export function ReceptionZonesHandles({ zones, onMoveVertex, onMoveEnd, onSplitEdge, onRemoveVertex }: ReceptionZonesHandlesProps) {
  return (
    <Group>
      {getSharedEdges(zones).map(({ a, b }) => {
        const pa = zones.vertices[a]!;
        const pb = zones.vertices[b]!;
        const split = () => onSplitEdge(a, b);
        return (
          <Group
            key={`split-${a}-${b}`}
            name="zone-split-handle"
            x={(pa.x + pb.x) / 2}
            y={(pa.y + pb.y) / 2}
            onClick={split}
            onTap={split}
            onMouseEnter={(e) => setCursor(e, 'copy')}
            onMouseLeave={(e) => setCursor(e, 'default')}
          >
            <Circle radius={9} fill="rgba(22, 72, 99, 0.85)" stroke="#ffffff" strokeWidth={1.5} />
            <Text text="+" width={18} height={18} offsetX={9} offsetY={9} align="center" verticalAlign="middle" fontStyle="bold" fontSize={16} fill="#ffffff" listening={false} />
          </Group>
        );
      })}
      {Object.entries(zones.vertices).map(([id, p]) => {
        const fixed = isCornerVertex(p);
        const removable = canRemoveVertex(zones, id);
        return (
          <Circle
            key={id}
            id={`zone-vertex-${id}`}
            x={p.x}
            y={p.y}
            radius={fixed ? 5 : 10}
            fill={fixed ? '#cbd5e1' : '#ffffff'}
            stroke="#164863"
            strokeWidth={3}
            draggable={!fixed}
            hitStrokeWidth={14}
            onDragMove={(e) => {
              const next = constrainVertex(p, { x: e.target.x(), y: e.target.y() });
              e.target.position(next);
              onMoveVertex(id, next);
            }}
            onDragEnd={onMoveEnd}
            onDblClick={() => removable && onRemoveVertex(id)}
            onDblTap={() => removable && onRemoveVertex(id)}
            onMouseEnter={(e) => setCursor(e, fixed ? 'default' : 'grab')}
            onMouseLeave={(e) => setCursor(e, 'default')}
          />
        );
      })}
    </Group>
  );
}
