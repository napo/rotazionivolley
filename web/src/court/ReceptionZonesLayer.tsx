import Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Line, Rect, Text } from 'react-konva';
import type { Point, ReceptionZones } from '../configs/schema';
import {
  areaPoints,
  constrainVertex,
  darken,
  findMergeTarget,
  getCompetenceEdges,
  getSharedEdges,
  isCornerVertex,
  zoneFillColour,
} from '../state/receptionZones';
import { CourtLines } from './CourtBackground';
import { COLOURS, COURT_RECT, ZONE_STYLE } from './courtGeometry';

interface ReceptionZonesUnderlayProps {
  zones: ReceptionZones;
  /** Players tween to their new spots; the map fades in once they get there. */
  revealDelayMs?: number;
  /** Changes whenever the rotation does, to re-run the fade. */
  revealKey: string;
}

/**
 * Konva content drawn under the players: the court turned white, one
 * polygon per receiver in its tint (zoneFillColour — the same colour as the
 * legend's swatch), white borders between them, and — for each border a player
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
      <Rect x={COURT_RECT.x} y={COURT_RECT.y} width={COURT_RECT.width} height={COURT_RECT.height} fill={ZONE_STYLE.courtFill} />
      {zones.areas.map((area) => (
        <Line
          key={`fill-${area.playerId}`}
          points={flat(areaPoints(zones, area))}
          closed
          fill={zoneFillColour(area.color)}
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
  /** Drop of the dragged vertex: the caller merges it into the vertex under it, if any (see findMergeTarget). */
  onMoveEnd: (vertexId: string) => void;
  onSplitEdge: (a: string, b: string) => void;
  /** Double click/tap on a vertex: the caller confirms and checks it can go (see canRemoveVertex). */
  onRequestRemoveVertex: (vertexId: string) => void;
}

const VERTEX_RADIUS = 10;
const SPLIT_RADIUS = 11;
/** Borders shorter than this get no "+": its handle would sit on top of the vertices at either end. */
const MIN_SPLIT_LENGTH = 2 * (VERTEX_RADIUS + SPLIT_RADIUS);

function setCursor(e: Konva.KonvaEventObject<MouseEvent>, cursor: string) {
  const stage = e.target.getStage();
  if (stage) stage.container().style.cursor = cursor;
}

/**
 * Edit-mode handles, drawn above the players: a white dot per vertex (drag
 * to move — shared vertices move every area at once; dropped on another
 * one, the two merge, and that one is ringed in green while it would;
 * double click/tap to remove it) and a "+" halfway along each border between two areas (click
 * to add a vertex there, which can then be dragged). The "+" are drawn
 * above the dots, with a generous hit area, so a click on one always
 * reaches it. Court corners are fixed and border vertices slide along the
 * border (see constrainVertex).
 */
export function ReceptionZonesHandles({ zones, onMoveVertex, onMoveEnd, onSplitEdge, onRequestRemoveVertex }: ReceptionZonesHandlesProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const mergeTarget = draggingId ? findMergeTarget(zones, draggingId) : null;
  // The dragged vertex last, so it stays on top of the one it's dropped on.
  const vertices = Object.entries(zones.vertices).sort(([a], [b]) => Number(a === draggingId) - Number(b === draggingId));

  return (
    <Group>
      {vertices.map(([id, p]) => {
        const fixed = isCornerVertex(p);
        const remove = () => !fixed && onRequestRemoveVertex(id);
        const isTarget = id === mergeTarget;
        return (
          <Circle
            key={id}
            id={`zone-vertex-${id}`}
            x={p.x}
            y={p.y}
            radius={isTarget ? VERTEX_RADIUS + 5 : fixed ? 5 : VERTEX_RADIUS}
            fill={fixed ? '#cbd5e1' : '#ffffff'}
            stroke={isTarget ? '#16a34a' : '#164863'}
            strokeWidth={isTarget ? 5 : 3}
            draggable={!fixed}
            hitStrokeWidth={14}
            onDragStart={() => setDraggingId(id)}
            onDragMove={(e) => {
              const next = constrainVertex(p, { x: e.target.x(), y: e.target.y() });
              e.target.position(next);
              onMoveVertex(id, next);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              onMoveEnd(id);
            }}
            onDblClick={remove}
            onDblTap={remove}
            onMouseEnter={(e) => setCursor(e, fixed ? 'default' : 'grab')}
            onMouseLeave={(e) => setCursor(e, 'default')}
          />
        );
      })}
      {getSharedEdges(zones).map(({ a, b }) => {
        const pa = zones.vertices[a]!;
        const pb = zones.vertices[b]!;
        if (Math.hypot(pb.x - pa.x, pb.y - pa.y) < MIN_SPLIT_LENGTH) return null;
        const split = (e: Konva.KonvaEventObject<Event>) => {
          e.cancelBubble = true;
          onSplitEdge(a, b);
        };
        return (
          <Group
            key={`split-${a}-${b}`}
            id={`zone-split-${a}-${b}`}
            name="zone-split-handle"
            x={(pa.x + pb.x) / 2}
            y={(pa.y + pb.y) / 2}
            onClick={split}
            onTap={split}
            onMouseEnter={(e) => setCursor(e, 'copy')}
            onMouseLeave={(e) => setCursor(e, 'default')}
          >
            <Circle radius={SPLIT_RADIUS} fill="rgba(22, 72, 99, 0.9)" stroke="#ffffff" strokeWidth={1.5} hitStrokeWidth={12} />
            <Text text="+" width={22} height={22} offsetX={11} offsetY={11} align="center" verticalAlign="middle" fontStyle="bold" fontSize={18} fill="#ffffff" listening={false} />
          </Group>
        );
      })}
    </Group>
  );
}
