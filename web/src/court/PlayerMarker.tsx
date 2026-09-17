import Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Text } from 'react-konva';
import type { PlayerDef, Point } from '../configs/schema';
import { COLOURS, COURT_VIEWBOX, PLAYER_RADIUS } from './courtGeometry';

interface PlayerMarkerProps {
  player: PlayerDef;
  position: Point;
  durationMs: number;
  highlighted: boolean;
  draggable?: boolean;
  onToggle?: (playerId: string) => void;
  onDragMove?: (playerId: string, point: Point) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function PlayerMarker({
  player,
  position,
  durationMs,
  highlighted,
  draggable = false,
  onToggle,
  onDragMove,
}: PlayerMarkerProps) {
  const groupRef = useRef<Konva.Group>(null);
  const tweenRef = useRef<Konva.Tween | null>(null);
  const mountedRef = useRef(false);
  // Captured once per mount so the JSX x/y props (used only for the initial
  // paint) never fight with the imperative .to()/.position() calls that
  // drive every subsequent move — same pattern as the old SVG "initial"
  // prop, now applied via Konva's imperative API instead of CSS.
  const [initialPosition] = useState(position);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    tweenRef.current?.destroy();
    tweenRef.current = null;
    if (durationMs <= 0) {
      node.position({ x: position.x, y: position.y });
    } else {
      tweenRef.current = new Konva.Tween({
        node,
        x: position.x,
        y: position.y,
        duration: durationMs / 1000,
        easing: Konva.Easings.EaseInOut,
      });
      tweenRef.current.play();
    }
  }, [position.x, position.y, durationMs]);

  useEffect(() => {
    return () => {
      tweenRef.current?.destroy();
    };
  }, []);

  // One size for every marker, regardless of label length — a 1-letter role
  // (P, O) and a 2-letter one (C1, L2) must read as the same-size symbol.
  const fontSize = 22;

  return (
    <Group
      ref={groupRef}
      id={`player-${player.id}`}
      x={initialPosition.x}
      y={initialPosition.y}
      draggable={draggable}
      dragBoundFunc={function (pos) {
        const layer = this.getLayer();
        if (!layer) return pos;
        const inverse = layer.getAbsoluteTransform().copy().invert();
        const local = inverse.point(pos);
        const clamped = {
          x: clamp(local.x, COURT_VIEWBOX.minX, COURT_VIEWBOX.minX + COURT_VIEWBOX.width),
          y: clamp(local.y, COURT_VIEWBOX.minY, COURT_VIEWBOX.minY + COURT_VIEWBOX.height),
        };
        return layer.getAbsoluteTransform().point(clamped);
      }}
      onClick={() => onToggle?.(player.id)}
      onTap={() => onToggle?.(player.id)}
      onDragMove={(e) => onDragMove?.(player.id, { x: e.target.x(), y: e.target.y() })}
      onDragEnd={(e) => onDragMove?.(player.id, { x: e.target.x(), y: e.target.y() })}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = draggable ? 'grab' : 'pointer';
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
      }}
    >
      <Circle
        id={`player-circle-${player.id}`}
        radius={PLAYER_RADIUS}
        fill={highlighted ? COLOURS.playerHighlight : COLOURS.player}
        stroke="#eeeeee"
        strokeWidth={4}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={8}
        shadowOffsetY={2}
      />
      <Text
        text={player.shortLabel}
        width={PLAYER_RADIUS * 2}
        height={PLAYER_RADIUS * 2}
        offsetX={PLAYER_RADIUS}
        offsetY={PLAYER_RADIUS}
        align="center"
        verticalAlign="middle"
        fontStyle="bold"
        fontFamily="Verdana, sans-serif"
        fontSize={fontSize}
        fill={highlighted ? COLOURS.playerLabelHighlighted : COLOURS.playerLabel}
        listening={false}
      />
    </Group>
  );
}
