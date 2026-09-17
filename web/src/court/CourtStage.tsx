import type Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import type { PlayerDef, Point } from '../configs/schema';
import { CourtBackground } from './CourtBackground';
import { COURT_VIEWBOX } from './courtGeometry';
import { PlayerMarker } from './PlayerMarker';
import { registerTestHooks } from './testHooks';
import './courtStage.css';

interface CourtStageProps {
  players: PlayerDef[];
  positions: Record<string, Point>;
  durationMs: number;
  highlightedPlayerId?: string | null;
  onTogglePlayer?: (playerId: string) => void;
  editable?: boolean;
  onPlayerDrag?: (playerId: string, point: Point) => void;
  /** Player ids that stay non-draggable even when `editable` — e.g. a benched player in the libero swap UI. */
  nonDraggableIds?: ReadonlySet<string>;
  ariaLabel: string;
}

export function CourtStage({
  players,
  positions,
  durationMs,
  highlightedPlayerId = null,
  onTogglePlayer,
  editable = false,
  onPlayerDrag,
  nonDraggableIds,
  ariaLabel,
}: CourtStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [width, setWidth] = useState<number>(COURT_VIEWBOX.width);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.clientWidth || COURT_VIEWBOX.width);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (stageRef.current) registerTestHooks(stageRef.current);
  });

  const height = width * (COURT_VIEWBOX.height / COURT_VIEWBOX.width);
  const scale = width / COURT_VIEWBOX.width;

  return (
    <div ref={containerRef} className="court-stage" role="img" aria-label={ariaLabel}>
      <Stage ref={stageRef} width={width} height={height}>
        <Layer x={-COURT_VIEWBOX.minX * scale} y={-COURT_VIEWBOX.minY * scale} scaleX={scale} scaleY={scale}>
          <CourtBackground />
          {players.map((player) => {
            const position = positions[player.id];
            if (!position) return null;
            return (
              <PlayerMarker
                key={player.id}
                player={player}
                position={position}
                durationMs={durationMs}
                highlighted={highlightedPlayerId === player.id}
                draggable={editable && !nonDraggableIds?.has(player.id)}
                onToggle={onTogglePlayer}
                onDragMove={onPlayerDrag}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
