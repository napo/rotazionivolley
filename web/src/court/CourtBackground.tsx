import { Line, Rect } from 'react-konva';
import { ATTACK_LINE, ATTACK_LINE_TICKS, CENTRE_LINE, COLOURS, COURT_RECT, COURT_VIEWBOX } from './courtGeometry';

export function CourtBackground() {
  return (
    <>
      <Rect
        x={COURT_VIEWBOX.minX}
        y={COURT_VIEWBOX.minY}
        width={COURT_VIEWBOX.width}
        height={COURT_VIEWBOX.height}
        fill={COLOURS.background}
        listening={false}
      />
      <Rect
        x={COURT_RECT.x}
        y={COURT_RECT.y}
        width={COURT_RECT.width}
        height={COURT_RECT.height}
        fill={COLOURS.court}
        stroke={COLOURS.line}
        strokeWidth={4}
        cornerRadius={6}
        shadowColor="rgba(20, 40, 60, 0.35)"
        shadowBlur={16}
        shadowOffsetY={4}
        listening={false}
      />
      <Line
        points={[CENTRE_LINE.x1, CENTRE_LINE.y1, CENTRE_LINE.x2, CENTRE_LINE.y2]}
        stroke={COLOURS.line}
        strokeWidth={4}
        listening={false}
      />
      <Line
        points={[ATTACK_LINE.x1, ATTACK_LINE.y1, ATTACK_LINE.x2, ATTACK_LINE.y2]}
        stroke={COLOURS.line}
        strokeWidth={4}
        dash={[9, 9]}
        listening={false}
      />
      {ATTACK_LINE_TICKS.map((tick, i) => (
        <Line
          key={i}
          points={[tick.x1, tick.y1, tick.x2, tick.y2]}
          stroke={COLOURS.line}
          strokeWidth={4}
          dash={[9, 9]}
          listening={false}
        />
      ))}
    </>
  );
}
