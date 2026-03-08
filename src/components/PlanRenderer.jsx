import React from 'react';
import { ELEC, FIXTURES, HEIGHT_REFERENCES, DEFAULT_MOUNT_HEIGHTS, DEFAULT_CEILING_HEIGHT, clamp } from '../constants';
import { calculateRoute, getDevicesOnCircuit } from '../circuitUtils';

const SCALE = 40; // px per foot
const PAD = 40;
const WALL_THICKNESS = 8;

// ─── Architectural plan paths for fixtures (40×40 viewBox) ─────────
// Top-down silhouettes for professional floor plans
const FIXTURE_PLAN_PATHS = {
  // Kitchen
  refrigerator:  'M2,2 L38,2 L38,38 L2,38 Z M2,30 L38,30 M18,30 L18,38 M22,30 L22,38',
  range:         'M2,2 L38,2 L38,38 L2,38 Z M8,8 A4,4 0 1,1 8.01,8 M20,8 A4,4 0 1,1 20.01,8 M32,8 A4,4 0 1,1 32.01,8 M8,22 A4,4 0 1,1 8.01,22 M20,22 A4,4 0 1,1 20.01,22 M32,22 A4,4 0 1,1 32.01,22',
  dishwasher:    'M2,2 L38,2 L38,38 L2,38 Z M6,6 L34,6 L34,34 L6,34 Z',
  sink_k:        'M2,2 L38,2 L38,38 L2,38 Z M4,6 L18,6 L18,34 L4,34 Z M22,6 L36,6 L36,34 L22,34 Z M14,20 A3,3 0 1,1 14.01,20',
  microwave:     'M2,4 L38,4 L38,36 L2,36 Z M4,6 L28,6 L28,34 L4,34 Z M32,14 A2,2 0 1,1 32.01,14',
  island:        'M2,2 L38,2 L38,38 L2,38 Z M4,4 L36,4 L36,36 L4,36 Z',
  hood:          'M4,8 L36,8 L36,32 L4,32 Z M10,14 L30,14 L30,26 L10,26 Z',
  // Cabinets
  upper_cab:     'M2,2 L38,2 L38,38 L2,38 Z M20,2 L20,38',
  lower_cab:     'M2,2 L38,2 L38,38 L2,38 Z M20,2 L20,38 M10,18 A2,2 0 1,1 10.01,18 M30,18 A2,2 0 1,1 30.01,18',
  cab_corner:    'M2,2 L38,2 L38,38 L2,38 Z M2,2 L38,38',
  pantry_cab:    'M2,2 L38,2 L38,38 L2,38 Z M2,10 L38,10 M2,20 L38,20 M2,30 L38,30',
  // Bathroom
  toilet:        'M10,36 L10,22 A10,12 0 0,1 30,22 L30,36 Z M8,36 L32,36 L32,40 L8,40 Z M14,8 A8,8 0 0,1 26,8 L26,22 L14,22 Z',
  bathtub:       'M2,2 L38,2 L38,38 L2,38 Z M4,4 L36,4 L36,36 L4,36 Q4,30 6,28 L6,8 Q6,6 8,6 L32,6 Q34,6 34,8 L34,28 Q36,30 36,36',
  shower:        'M2,2 L38,2 L38,38 L2,38 Z M4,4 L36,4 L36,36 L4,36 Z M20,8 A2,2 0 1,1 20.01,8',
  vanity:        'M2,2 L38,2 L38,38 L2,38 Z M10,8 A8,8 0 1,1 10.01,8 M30,8 A8,8 0 1,1 30.01,8',
  sink_b:        'M6,4 L34,4 L34,36 L6,36 Z M12,10 A8,10 0 1,1 12.01,10',
  // Laundry
  washer:        'M2,2 L38,2 L38,38 L2,38 Z M20,22 A10,10 0 1,1 20.01,22 M20,22 A4,4 0 1,1 20.01,22',
  dryer:         'M2,2 L38,2 L38,38 L2,38 Z M20,22 A10,10 0 1,1 20.01,22',
  water_heater:  'M20,4 A16,16 0 1,1 20.01,4 Z',
  // Structure — doors get special arc rendering
  door_36:       'M2,18 L38,18 L38,22 L2,22 Z',
  door_30:       'M5,18 L35,18 L35,22 L5,22 Z',
  window_36:     'M2,14 L38,14 L38,26 L2,26 Z M2,18 L38,18 M2,22 L38,22',
  window_48:     'M2,14 L38,14 L38,26 L2,26 Z M2,18 L38,18 M2,22 L38,22',
  window_60:     'M2,14 L38,14 L38,26 L2,26 Z M2,18 L38,18 M2,22 L38,22',
  closet:        'M2,2 L38,2 L38,38 L2,38 Z M2,2 L20,20 L38,2',
  stairs:        'M2,2 L38,2 L38,38 L2,38 Z M2,6 L38,6 M2,10 L38,10 M2,14 L38,14 M2,18 L38,18 M2,22 L38,22 M2,26 L38,26 M2,30 L38,30 M2,34 L38,34 M14,2 L14,38 L26,2',
  // Furniture
  bed_king:      'M2,2 L38,2 L38,38 L2,38 Z M2,6 L38,6 M6,6 L6,10 L18,10 L18,6 M22,6 L22,10 L34,10 L34,6',
  bed_queen:     'M2,2 L38,2 L38,38 L2,38 Z M2,6 L38,6 M6,6 L6,10 L18,10 L18,6 M22,6 L22,10 L34,10 L34,6',
  desk:          'M2,2 L38,2 L38,38 L2,38 Z M4,4 L4,8 M34,4 L34,8 M4,34 L4,36 M34,34 L34,36',
  sofa:          'M2,2 L38,2 L38,38 L2,38 Z M2,8 L6,8 L6,32 L2,32 M38,8 L34,8 L34,32 L38,32 M6,2 L6,6 L34,6 L34,2',
  tv_stand:      'M2,4 L38,4 L38,36 L2,36 Z M8,12 L32,12 L32,28 L8,28 Z',
  dining_table:  'M4,4 A2,2 0 0,1 6,2 L34,2 A2,2 0 0,1 36,4 L36,36 A2,2 0 0,1 34,38 L6,38 A2,2 0 0,1 4,36 Z',
};

// ─── Professional color palettes ──────────────────────────────────
const PRINT_COLORS = {
  bg: '#FFFFFF',
  wallFill: '#9E9E9E',
  gridMinor: '#F0F0F0',
  gridMajor: '#E0E0E0',
  dimFill: '#555',
  dimLine: '#999',
  roomLabel: '#666',
  fixtureFillOpacity: 0.15,
  fixtureStrokeOpacity: 0.7,
  fixtureText: '#555',
  floorLine: '#8D7B68',
  heightLabel: '#666',
  refLine: '#BBB',
  refLabel: '#888',
  circuitWire: '#00897B',
  // Electrical category colors
  outlet: '#1565C0',
  switch: '#C62828',
  light: '#F9A825',
  safety: '#D32F2F',
  panel: '#555',
};

const DARK_COLORS = {
  bg: '#1a1a2e',
  wallFill: '#667',
  gridMinor: '#252540',
  gridMajor: '#3a3a55',
  dimFill: '#999',
  dimLine: '#555',
  roomLabel: '#556',
  fixtureFillOpacity: 0.25,
  fixtureStrokeOpacity: 0.65,
  fixtureText: '#888',
  floorLine: '#998877',
  heightLabel: '#aaa',
  refLine: '#444',
  refLabel: '#777',
  circuitWire: '#26A69A',
  outlet: '#42A5F5',
  switch: '#EF5350',
  light: '#FFCA28',
  safety: '#EF5350',
  panel: '#999',
};

// Map electrical category to professional color
function getElecColor(def, colors) {
  switch (def.cat) {
    case 'Outlets':  return colors.outlet;
    case 'Switches': return colors.switch;
    case 'Lights':   return colors.light;
    case 'Safety':   return colors.safety;
    case 'Panel':    return colors.panel;
    default:         return def.color;
  }
}

// ─── Dimension line helper (architectural style) ─────────────────
function DimensionLine({ x1, y1, x2, y2, label, color, fontSize = 11, tickSize = 5, orientation = 'horizontal' }) {
  if (orientation === 'horizontal') {
    const midX = (x1 + x2) / 2;
    return (
      <g>
        {/* Main line */}
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.8" />
        {/* Left tick */}
        <line x1={x1} y1={y1 - tickSize} x2={x1} y2={y1 + tickSize} stroke={color} strokeWidth="0.8" />
        {/* Right tick */}
        <line x1={x2} y1={y2 - tickSize} x2={x2} y2={y2 + tickSize} stroke={color} strokeWidth="0.8" />
        {/* Arrowhead left */}
        <polygon points={`${x1},${y1} ${x1 + 4},${y1 - 2.5} ${x1 + 4},${y1 + 2.5}`} fill={color} />
        {/* Arrowhead right */}
        <polygon points={`${x2},${y2} ${x2 - 4},${y2 - 2.5} ${x2 - 4},${y2 + 2.5}`} fill={color} />
        {/* Label */}
        <text
          x={midX}
          y={y1 - 4}
          textAnchor="middle"
          fill={color}
          fontSize={fontSize}
          fontFamily="Arial, sans-serif"
        >
          {label}
        </text>
      </g>
    );
  }
  // Vertical
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.8" />
      <line x1={x1 - tickSize} y1={y1} x2={x1 + tickSize} y2={y1} stroke={color} strokeWidth="0.8" />
      <line x1={x2 - tickSize} y1={y2} x2={x2 + tickSize} y2={y2} stroke={color} strokeWidth="0.8" />
      <polygon points={`${x1},${y1} ${x1 - 2.5},${y1 + 4} ${x1 + 2.5},${y1 + 4}`} fill={color} />
      <polygon points={`${x2},${y2} ${x2 - 2.5},${y2 - 4} ${x2 + 2.5},${y2 - 4}`} fill={color} />
      <text
        x={x1 - 6}
        y={midY}
        textAnchor="middle"
        fill={color}
        fontSize={fontSize}
        fontFamily="Arial, sans-serif"
        transform={`rotate(-90, ${x1 - 6}, ${midY})`}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Door swing arc rendering ────────────────────────────────────
function DoorSwingArc({ cx, cy, radius, rotation, color }) {
  // Quarter-circle arc showing door swing direction
  // The arc starts from the hinge side and sweeps 90 degrees
  const r = radius;
  const startAngle = ((rotation || 0) - 90) * Math.PI / 180;
  const endAngle = startAngle + Math.PI / 2;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  return (
    <path
      d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`}
      fill={color + '08'}
      stroke={color}
      strokeWidth="1"
      strokeDasharray="3 2"
    />
  );
}

// ─── Wire arrow (small directional triangle) ────────────────────
function WireArrow({ x, y, angle, color }) {
  const size = 4;
  const rad = angle * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tip = { x: x + size * cos, y: y + size * sin };
  const left = { x: x - size * cos + size * 0.5 * sin, y: y - size * sin - size * 0.5 * cos };
  const right = { x: x - size * cos - size * 0.5 * sin, y: y - size * sin + size * 0.5 * cos };
  return (
    <polygon
      points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
      fill={color}
      opacity="0.7"
    />
  );
}

// ─── Wall opening helpers ───────────────────────────────────────────

// Compute solid wall segments by subtracting openings (doors/windows)
function computeWallSegments(wallStart, wallEnd, openings) {
  // openings: [{center, width}, ...] sorted by center
  const sorted = [...openings].sort((a, b) => a.center - b.center);
  const segments = [];
  let cursor = wallStart;
  for (const op of sorted) {
    const gapStart = op.center - op.width / 2;
    const gapEnd = op.center + op.width / 2;
    const clampedGapStart = Math.max(wallStart, gapStart);
    const clampedGapEnd = Math.min(wallEnd, gapEnd);
    if (clampedGapStart > cursor) {
      segments.push({ start: cursor, end: clampedGapStart });
    }
    cursor = Math.max(cursor, clampedGapEnd);
  }
  if (cursor < wallEnd) {
    segments.push({ start: cursor, end: wallEnd });
  }
  return segments;
}

// Find door/window placements near a specific wall
function findWallOpenings(placements, wall, roomW, roomH, scale) {
  const SNAP = 2 * scale;
  return placements.filter(p => {
    if (!p.fixtureKey || p.cx === undefined || p.cy === undefined) return false;
    const isDoor = p.fixtureKey.startsWith('door_');
    const isWindow = p.fixtureKey.startsWith('window_');
    if (!isDoor && !isWindow) return false;
    // Check explicit wall assignment first
    if (p.wall === wall) return true;
    if (p.wall && p.wall !== wall) return false;
    // Infer wall from position
    switch (wall) {
      case 'north': return p.cy <= SNAP;
      case 'south': return p.cy >= roomH - SNAP;
      case 'west':  return p.cx <= SNAP;
      case 'east':  return p.cx >= roomW - SNAP;
      default: return false;
    }
  });
}

// Render wall opening symbols (window glazing or door swing) for horizontal walls
function renderHorizontalOpening(op, i, wallCenterY, wallY, WT, colors, wallSide) {
  const gapStart = op.center - op.width / 2;
  const gapEnd = op.center + op.width / 2;
  if (op.isWindow) {
    return (
      <g key={`${wallSide}wo` + i}>
        {/* Double glass pane lines */}
        <line x1={gapStart} y1={wallCenterY - 2} x2={gapEnd} y2={wallCenterY - 2} stroke="#88BBDD" strokeWidth="1.5" />
        <line x1={gapStart} y1={wallCenterY + 2} x2={gapEnd} y2={wallCenterY + 2} stroke="#88BBDD" strokeWidth="1.5" />
        {/* Frame ticks at ends */}
        <line x1={gapStart} y1={wallCenterY - WT / 2} x2={gapStart} y2={wallCenterY + WT / 2} stroke={colors.wallFill} strokeWidth="1" />
        <line x1={gapEnd} y1={wallCenterY - WT / 2} x2={gapEnd} y2={wallCenterY + WT / 2} stroke={colors.wallFill} strokeWidth="1" />
      </g>
    );
  }
  // Door opening
  const hingeX = gapStart;
  const hingeY = wallCenterY;
  const doorW = op.width;
  if (wallSide === 'n') {
    // North wall: door swings into room (downward)
    return (
      <g key={'nwo' + i}>
        <line x1={hingeX} y1={hingeY} x2={hingeX} y2={hingeY + doorW} stroke="#887766" strokeWidth="2" />
        <path d={`M ${hingeX},${hingeY + doorW} A ${doorW},${doorW} 0 0,1 ${hingeX + doorW},${hingeY}`} fill="none" stroke="#887766" strokeWidth="1" strokeDasharray="4 2" />
      </g>
    );
  }
  // South wall: door swings into room (upward)
  return (
    <g key={'swo' + i}>
      <line x1={hingeX} y1={hingeY} x2={hingeX} y2={hingeY - doorW} stroke="#887766" strokeWidth="2" />
      <path d={`M ${hingeX},${hingeY - doorW} A ${doorW},${doorW} 0 0,0 ${hingeX + doorW},${hingeY}`} fill="none" stroke="#887766" strokeWidth="1" strokeDasharray="4 2" />
    </g>
  );
}

// Render wall opening symbols for vertical walls
function renderVerticalOpening(op, i, wallCenterX, wallX, WT, colors, wallSide) {
  const gapStart = op.center - op.width / 2;
  const gapEnd = op.center + op.width / 2;
  if (op.isWindow) {
    return (
      <g key={`${wallSide}wo` + i}>
        {/* Double glass pane lines (vertical) */}
        <line x1={wallCenterX - 2} y1={gapStart} x2={wallCenterX - 2} y2={gapEnd} stroke="#88BBDD" strokeWidth="1.5" />
        <line x1={wallCenterX + 2} y1={gapStart} x2={wallCenterX + 2} y2={gapEnd} stroke="#88BBDD" strokeWidth="1.5" />
        {/* Frame ticks at ends */}
        <line x1={wallCenterX - WT / 2} y1={gapStart} x2={wallCenterX + WT / 2} y2={gapStart} stroke={colors.wallFill} strokeWidth="1" />
        <line x1={wallCenterX - WT / 2} y1={gapEnd} x2={wallCenterX + WT / 2} y2={gapEnd} stroke={colors.wallFill} strokeWidth="1" />
      </g>
    );
  }
  // Door opening
  const hingeX = wallCenterX;
  const hingeY = gapStart;
  const doorW = op.width;
  if (wallSide === 'w') {
    // West wall: door swings into room (rightward)
    return (
      <g key={'wwo' + i}>
        <line x1={hingeX} y1={hingeY} x2={hingeX + doorW} y2={hingeY} stroke="#887766" strokeWidth="2" />
        <path d={`M ${hingeX + doorW},${hingeY} A ${doorW},${doorW} 0 0,1 ${hingeX},${hingeY + doorW}`} fill="none" stroke="#887766" strokeWidth="1" strokeDasharray="4 2" />
      </g>
    );
  }
  // East wall: door swings into room (leftward)
  return (
    <g key={'ewo' + i}>
      <line x1={hingeX} y1={hingeY} x2={hingeX - doorW} y2={hingeY} stroke="#887766" strokeWidth="2" />
      <path d={`M ${hingeX - doorW},${hingeY} A ${doorW},${doorW} 0 0,0 ${hingeX},${hingeY + doorW}`} fill="none" stroke="#887766" strokeWidth="1" strokeDasharray="4 2" />
    </g>
  );
}

// ─── Floor Plan Renderer ────────────────────────────────────────────

export function RenderFloorPlan({ room, printMode = false }) {
  const W = room.width * SCALE;
  const H = room.height * SCALE;
  const placements = room.placements || [];
  const WT = WALL_THICKNESS;

  const colors = printMode ? PRINT_COLORS : DARK_COLORS;

  // ── Compute wall openings for doors and windows ──
  const wallOpeningDetails = {};
  for (const wall of ['north', 'south', 'east', 'west']) {
    const openingPlacements = findWallOpenings(placements, wall, W, H, SCALE);
    const isHorizontal = (wall === 'north' || wall === 'south');
    const openings = openingPlacements.map(p => {
      const def = FIXTURES[p.fixtureKey];
      const isDoor = p.fixtureKey.startsWith('door_');
      const widthInches = p.w || (def && def.w) || 36;
      const openingWidth = widthInches * SCALE / 12;
      const center = isHorizontal ? (p.cx + PAD) : (p.cy + PAD);
      return { center, width: openingWidth, placement: p, isDoor, isWindow: !isDoor };
    });

    // Compute segments
    const wallStart = PAD - WT / 2;
    const wallEnd = isHorizontal ? (PAD + W + WT / 2) : (PAD + H + WT / 2);
    wallOpeningDetails[wall] = {
      segments: computeWallSegments(wallStart, wallEnd, openings),
      openings
    };
  }

  return (
    <svg
      viewBox={`0 0 ${W + PAD * 2} ${H + PAD * 2}`}
      width="100%"
      style={{ maxWidth: W + PAD * 2 }}
    >
      {/* Background */}
      <rect x="0" y="0" width={W + PAD * 2} height={H + PAD * 2} fill={colors.bg} />

      {/* Grid lines */}
      {Array.from({ length: room.width + 1 }).map((_, i) => (
        <line
          key={'gv' + i}
          x1={PAD + i * SCALE}
          y1={PAD}
          x2={PAD + i * SCALE}
          y2={PAD + H}
          stroke={i % 4 === 0 ? colors.gridMajor : colors.gridMinor}
          strokeWidth={i % 4 === 0 ? 0.6 : 0.3}
        />
      ))}
      {Array.from({ length: room.height + 1 }).map((_, i) => (
        <line
          key={'gh' + i}
          x1={PAD}
          y1={PAD + i * SCALE}
          x2={PAD + W}
          y2={PAD + i * SCALE}
          stroke={i % 4 === 0 ? colors.gridMajor : colors.gridMinor}
          strokeWidth={i % 4 === 0 ? 0.6 : 0.3}
        />
      ))}

      {/* Thick architectural walls — segmented with door/window openings */}

      {/* North wall segments */}
      {wallOpeningDetails.north.segments.map((seg, i) => (
        <rect key={'nw' + i} x={seg.start} y={PAD - WT / 2} width={seg.end - seg.start} height={WT} fill={colors.wallFill} />
      ))}
      {/* North wall openings */}
      {wallOpeningDetails.north.openings.map((op, i) =>
        renderHorizontalOpening(op, i, PAD, PAD - WT / 2, WT, colors, 'n')
      )}

      {/* South wall segments */}
      {wallOpeningDetails.south.segments.map((seg, i) => (
        <rect key={'sw' + i} x={seg.start} y={PAD + H - WT / 2} width={seg.end - seg.start} height={WT} fill={colors.wallFill} />
      ))}
      {/* South wall openings */}
      {wallOpeningDetails.south.openings.map((op, i) =>
        renderHorizontalOpening(op, i, PAD + H, PAD + H - WT / 2, WT, colors, 's')
      )}

      {/* West wall segments */}
      {wallOpeningDetails.west.segments.map((seg, i) => (
        <rect key={'ww' + i} x={PAD - WT / 2} y={seg.start} width={WT} height={seg.end - seg.start} fill={colors.wallFill} />
      ))}
      {/* West wall openings */}
      {wallOpeningDetails.west.openings.map((op, i) =>
        renderVerticalOpening(op, i, PAD, PAD - WT / 2, WT, colors, 'w')
      )}

      {/* East wall segments */}
      {wallOpeningDetails.east.segments.map((seg, i) => (
        <rect key={'ew' + i} x={PAD + W - WT / 2} y={seg.start} width={WT} height={seg.end - seg.start} fill={colors.wallFill} />
      ))}
      {/* East wall openings */}
      {wallOpeningDetails.east.openings.map((op, i) =>
        renderVerticalOpening(op, i, PAD + W, PAD + W - WT / 2, WT, colors, 'e')
      )}

      {/* Architectural dimension lines */}
      <DimensionLine
        x1={PAD}
        y1={PAD - 16}
        x2={PAD + W}
        y2={PAD - 16}
        label={`${room.width}'`}
        color={colors.dimFill}
        orientation="horizontal"
      />
      <DimensionLine
        x1={PAD - 16}
        y1={PAD}
        x2={PAD - 16}
        y2={PAD + H}
        label={`${room.height}'`}
        color={colors.dimFill}
        orientation="vertical"
      />

      {/* Room name label with background for readability */}
      {(() => {
        const roomNameWidth = room.name.length * 8;
        return (
          <>
            <rect
              x={PAD + W / 2 - roomNameWidth / 2 - 6}
              y={PAD + H / 2 - 10}
              width={roomNameWidth + 12}
              height={20}
              fill={colors.bg}
              fillOpacity="0.85"
              rx="3"
            />
            <text
              x={PAD + W / 2}
              y={PAD + H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={colors.roomLabel}
              fontSize="16"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
              opacity="0.8"
            >
              {room.name}
            </text>
          </>
        );
      })()}

      {/* Circuit wires — teal dashed with directional arrows */}
      {(room.circuits || []).map(circuit =>
        circuit.segments.map((seg, si) => {
          const fromP = placements.find(p => p.id === seg.from);
          const toP = placements.find(p => p.id === seg.to);
          if (!fromP || !toP || fromP.cx === undefined || toP.cx === undefined) return null;
          const route = calculateRoute(fromP, toP);
          const d = route.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x + PAD},${pt.y + PAD}`).join(' ');
          const mid = route[Math.floor(route.length / 2)];

          // Calculate wire angle for arrow at midpoint
          let arrowAngle = 0;
          if (route.length >= 2) {
            const p1 = route[Math.floor(route.length / 2) - 1] || route[0];
            const p2 = route[Math.floor(route.length / 2)];
            arrowAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
          }

          return (
            <g key={`cw-${circuit.id}-${si}`}>
              <path
                d={d}
                fill="none"
                stroke={colors.circuitWire}
                strokeWidth="2"
                strokeDasharray="8 4"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Directional arrow at midpoint */}
              <WireArrow
                x={mid.x + PAD}
                y={mid.y + PAD}
                angle={arrowAngle}
                color={colors.circuitWire}
              />
              {/* Background rect behind circuit number label */}
              <rect
                x={mid.x + PAD - 8}
                y={mid.y + PAD - 14}
                width={16}
                height={10}
                fill={colors.bg}
                fillOpacity="0.8"
                rx="2"
              />
              <text
                x={mid.x + PAD}
                y={mid.y + PAD - 8}
                textAnchor="middle"
                fill={colors.circuitWire}
                fontSize="7"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                #{circuit.number}
              </text>
            </g>
          );
        })
      )}

      {/* Placed fixtures — architectural SVG silhouettes with smart label hiding */}
      {(() => {
        const fixtureItems = placements.filter(p => p.fixtureKey && p.cx !== undefined);
        const isCrowded = fixtureItems.length > 25;
        const fontScale = isCrowded ? 0.8 : 1;

        // Build label bounding boxes for collision detection
        const labelBoxes = [];

        return fixtureItems.map(p => {
          const def = FIXTURES[p.fixtureKey];
          const fw = (p.w || (def && def.w) || 30) * SCALE / 12;
          const fh = (p.h || (def && def.h) || 30) * SCALE / 12;
          const fcolor = p.color || (def && def.color) || '#888';
          const rotation = p.rotation || 0;
          const planPath = (def && def.planPath) || FIXTURE_PLAN_PATHS[p.fixtureKey];
          const isDoor = p.fixtureKey && p.fixtureKey.startsWith('door_');
          const isWindow = p.fixtureKey && p.fixtureKey.startsWith('window_');

          // Smart label visibility: hide label if fixture is too small (< 40px wide)
          const baseFontSize = Math.max(Math.min(fw / (p.name || '').length * 1.1, 9), 5) * fontScale;
          const labelX = p.cx + PAD;
          const labelY = p.cy + PAD + fh / 2 + 10;
          const labelW = (p.name || '').length * baseFontSize * 0.6;
          const labelH = baseFontSize + 2;
          let showLabel = fw >= 40;

          // Check for overlap with already-placed labels
          if (showLabel) {
            const box = { x: labelX - labelW / 2, y: labelY - labelH / 2, w: labelW, h: labelH };
            for (const existing of labelBoxes) {
              if (box.x < existing.x + existing.w && box.x + box.w > existing.x &&
                  box.y < existing.y + existing.h && box.y + box.h > existing.y) {
                showLabel = false;
                break;
              }
            }
            if (showLabel) {
              labelBoxes.push(box);
            }
          }

          return (
            <g
              key={p.id}
              transform={`translate(${p.cx + PAD}, ${p.cy + PAD})`}
            >
              {/* Door swing arc */}
              {isDoor && (
                <DoorSwingArc
                  cx={-fw / 2}
                  cy={0}
                  radius={fw}
                  rotation={rotation}
                  color={fcolor}
                />
              )}
              {/* Fixture silhouette */}
              <g transform={`rotate(${rotation}) scale(${fw / 40}, ${fh / 40})`}>
                {planPath ? (
                  <path
                    d={planPath}
                    fill={fcolor}
                    fillOpacity={colors.fixtureFillOpacity}
                    stroke={fcolor}
                    strokeOpacity={colors.fixtureStrokeOpacity}
                    strokeWidth={1.5 * 40 / Math.max(fw, fh)}
                    strokeLinejoin="round"
                  />
                ) : (
                  <rect
                    x="2"
                    y="2"
                    width="36"
                    height="36"
                    rx="2"
                    fill={fcolor}
                    fillOpacity={colors.fixtureFillOpacity}
                    stroke={fcolor}
                    strokeOpacity={colors.fixtureStrokeOpacity}
                    strokeWidth={1.5 * 40 / Math.max(fw, fh)}
                  />
                )}
                {/* Window special rendering — parallel lines through wall */}
                {isWindow && (
                  <>
                    <line x1="2" y1="18" x2="38" y2="18" stroke={fcolor} strokeOpacity={colors.fixtureStrokeOpacity} strokeWidth={1 * 40 / Math.max(fw, fh)} />
                    <line x1="2" y1="22" x2="38" y2="22" stroke={fcolor} strokeOpacity={colors.fixtureStrokeOpacity} strokeWidth={1 * 40 / Math.max(fw, fh)} />
                  </>
                )}
              </g>
              {/* Fixture label — hidden for small fixtures or when overlapping */}
              {showLabel && (
                <text
                  textAnchor="middle"
                  y={fh / 2 + 10}
                  dominantBaseline="middle"
                  fill={colors.fixtureText}
                  fontSize={baseFontSize}
                  fontWeight="600"
                  fontFamily="Arial, sans-serif"
                >
                  {p.name}
                </text>
              )}
            </g>
          );
        });
      })()}

      {/* Placed electrical — SVG path symbols with proximity-based label hiding */}
      {(() => {
        const elecItems = placements.filter(p => p.elecKey && p.cx !== undefined);
        return elecItems.map(p => {
          const def = ELEC[p.elecKey];
          if (!def) return null;
          const symbolColor = getElecColor(def, colors);
          const symbolSize = 30; // display size in pixels
          const scaleFactor = symbolSize / 40;
          const rotation = p.rotation || 0;

          // Hide amperage label when another electrical symbol is within 30px
          const hasNearby = elecItems.some(other =>
            other.id !== p.id &&
            Math.hypot((other.cx || 0) - (p.cx || 0), (other.cy || 0) - (p.cy || 0)) < 30
          );

          return (
            <g
              key={p.id}
              transform={`translate(${p.cx + PAD}, ${p.cy + PAD})`}
            >
              {/* SVG path symbol */}
              <g transform={`rotate(${rotation}) translate(${-symbolSize / 2}, ${-symbolSize / 2}) scale(${scaleFactor})`}>
                <path
                  d={def.path}
                  fill="none"
                  stroke={symbolColor}
                  strokeWidth={2.5 / scaleFactor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Switch text overlay for switches (they use circle + letter) */}
                {def.cat === 'Switches' && (
                  <text
                    x="20"
                    y="22"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={symbolColor}
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                  >
                    {def.abbr}
                  </text>
                )}
              </g>
              {/* Label below symbol (non-switches) — always show abbreviation */}
              {def.cat !== 'Switches' && (
                <text
                  textAnchor="middle"
                  y={symbolSize / 2 + 9}
                  fill={symbolColor}
                  fontSize="7"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  opacity="0.85"
                >
                  {def.abbr}
                </text>
              )}
              {/* Amp rating for outlets — hidden when symbols are close together */}
              {def.amps && def.cat === 'Outlets' && !hasNearby && (
                <text
                  textAnchor="middle"
                  y={symbolSize / 2 + 17}
                  fill={symbolColor}
                  fontSize="6"
                  fontFamily="Arial, sans-serif"
                  opacity="0.65"
                >
                  {def.amps}A
                </text>
              )}
            </g>
          );
        });
      })()}
    </svg>
  );
}

// ─── Wall Elevation Renderer ────────────────────────────────────────

export function RenderWallElevation({ room, wall, printMode = false }) {
  const LABEL_PAD = 100;
  const ceilingHeight = room.ceilingHeight || DEFAULT_CEILING_HEIGHT;
  const ceilingHeightIn = ceilingHeight * 12;
  const wallLengthFt = (wall === 'north' || wall === 'south') ? room.width : room.height;
  const W = wallLengthFt * SCALE;
  const H = ceilingHeight * SCALE;
  const placements = room.placements || [];
  const WT = WALL_THICKNESS;

  const colors = printMode ? PRINT_COLORS : DARK_COLORS;

  // Coordinate helpers
  const inchesToY = (inches) => PAD + (ceilingHeightIn - inches) * SCALE / 12;
  const feetToX = (feet) => PAD + feet * SCALE;

  // Wall placement inference — filter and map placements to this wall
  const SNAP_THRESHOLD = 2 * SCALE;
  const wallPlacements = placements.filter(p => {
    if (p.wall === wall) return true;
    if (p.cx === undefined || p.cy === undefined) return false;
    if (p.wall) return false;
    const roomW = room.width * SCALE;
    const roomH = room.height * SCALE;
    switch (wall) {
      case 'north': return p.cy <= SNAP_THRESHOLD;
      case 'south': return p.cy >= roomH - SNAP_THRESHOLD;
      case 'east':  return p.cx >= roomW - SNAP_THRESHOLD;
      case 'west':  return p.cx <= SNAP_THRESHOLD;
      default: return false;
    }
  }).map(p => {
    if (p.wall) return p;
    const roomW = room.width * SCALE;
    const roomH = room.height * SCALE;
    let wallPos;
    switch (wall) {
      case 'north': wallPos = p.cx / SCALE; break;
      case 'south': wallPos = (roomW - p.cx) / SCALE; break;
      case 'east':  wallPos = p.cy / SCALE; break;
      case 'west':  wallPos = (roomH - p.cy) / SCALE; break;
      default: wallPos = 0;
    }
    wallPos = clamp(wallPos, 0, wallLengthFt);
    let inferredHeight = 0;
    if (p.fixtureKey && FIXTURES[p.fixtureKey]) {
      inferredHeight = FIXTURES[p.fixtureKey].defaultMountHeight || 0;
    } else if (p.elecKey && ELEC[p.elecKey]) {
      inferredHeight = DEFAULT_MOUNT_HEIGHTS[ELEC[p.elecKey].cat] || 48;
    }
    return {
      ...p,
      wallPos: Math.round(wallPos * 10) / 10,
      mountHeight: p.mountHeight ?? inferredHeight,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${W + PAD * 2 + LABEL_PAD} ${H + PAD * 2}`}
      width="100%"
    >
      {/* Background */}
      <rect x="0" y="0" width={W + PAD * 2 + LABEL_PAD} height={H + PAD * 2} fill={colors.bg} />

      {/* Grid lines */}
      {Array.from({ length: Math.floor(wallLengthFt) + 1 }).map((_, i) => (
        <line
          key={'gv' + i}
          x1={PAD + i * SCALE}
          y1={PAD}
          x2={PAD + i * SCALE}
          y2={PAD + H}
          stroke={i % 4 === 0 ? colors.gridMajor : colors.gridMinor}
          strokeWidth={i % 4 === 0 ? 0.6 : 0.3}
        />
      ))}
      {Array.from({ length: Math.floor(ceilingHeight) + 1 }).map((_, i) => (
        <line
          key={'gh' + i}
          x1={PAD}
          y1={PAD + i * SCALE}
          x2={PAD + W}
          y2={PAD + i * SCALE}
          stroke={i % 4 === 0 ? colors.gridMajor : colors.gridMinor}
          strokeWidth={i % 4 === 0 ? 0.6 : 0.3}
        />
      ))}

      {/* Thick wall outline — top and sides */}
      {/* Ceiling line (top) */}
      <rect
        x={PAD - WT / 2}
        y={PAD - WT / 2}
        width={W + WT}
        height={WT}
        fill={colors.wallFill}
      />
      {/* Left wall edge */}
      <rect
        x={PAD - WT / 2}
        y={PAD - WT / 2}
        width={WT}
        height={H + WT}
        fill={colors.wallFill}
      />
      {/* Right wall edge */}
      <rect
        x={PAD + W - WT / 2}
        y={PAD - WT / 2}
        width={WT}
        height={H + WT}
        fill={colors.wallFill}
      />

      {/* Floor line — thick brown/gray */}
      <rect
        x={PAD - WT / 2}
        y={PAD + H - 2}
        width={W + WT}
        height={4}
        fill={colors.floorLine}
      />

      {/* Height reference lines */}
      {HEIGHT_REFERENCES.map((ref) => {
        if (ref.y > ceilingHeightIn) return null;
        const y = inchesToY(ref.y);
        return (
          <g key={ref.label}>
            <line
              x1={PAD}
              y1={y}
              x2={PAD + W}
              y2={y}
              stroke={colors.refLine}
              strokeWidth="0.6"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            <text
              x={PAD + W + 6}
              y={y + 3}
              fill={colors.refLabel}
              fontSize="10"
              fontFamily="Arial, sans-serif"
              opacity="0.8"
            >
              {ref.label}
            </text>
          </g>
        );
      })}

      {/* Architectural dimension lines */}
      <DimensionLine
        x1={PAD}
        y1={PAD - 16}
        x2={PAD + W}
        y2={PAD - 16}
        label={`${wallLengthFt}'`}
        color={colors.dimFill}
        orientation="horizontal"
      />
      <DimensionLine
        x1={PAD - 20}
        y1={PAD}
        x2={PAD - 20}
        y2={PAD + H}
        label={`${ceilingHeight}'`}
        color={colors.dimFill}
        orientation="vertical"
      />

      {/* Electrical devices — SVG path symbols */}
      {wallPlacements.filter(p => p.elecKey).map(p => {
        const def = ELEC[p.elecKey];
        if (!def) return null;
        const px = feetToX(clamp(p.wallPos || 0, 0, wallLengthFt));
        const py = inchesToY(clamp(p.mountHeight || 0, 0, ceilingHeightIn));
        const symbolColor = getElecColor(def, colors);
        const symbolSize = 28;
        const scaleFactor = symbolSize / 40;

        return (
          <g key={p.id} transform={`translate(${px}, ${py})`}>
            {/* SVG path symbol */}
            <g transform={`translate(${-symbolSize / 2}, ${-symbolSize / 2}) scale(${scaleFactor})`}>
              <path
                d={def.path}
                fill="none"
                stroke={symbolColor}
                strokeWidth={2.5 / scaleFactor}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Switch text overlay */}
              {def.cat === 'Switches' && (
                <text
                  x="20"
                  y="22"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={symbolColor}
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                >
                  {def.abbr}
                </text>
              )}
            </g>
            {/* Abbreviation label (non-switches) */}
            {def.cat !== 'Switches' && (
              <text
                textAnchor="middle"
                y={symbolSize / 2 + 8}
                fill={symbolColor}
                fontSize="7"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
                opacity="0.85"
              >
                {def.abbr}
              </text>
            )}
            {/* Mount height label */}
            <text
              textAnchor="middle"
              y={-(symbolSize / 2 + 3)}
              fill={colors.heightLabel}
              fontSize="9"
              fontFamily="monospace, sans-serif"
              opacity="0.8"
            >
              {p.mountHeight}&quot;
            </text>
          </g>
        );
      })}

      {/* Fixtures — SVG path silhouettes */}
      {wallPlacements.filter(p => p.fixtureKey).map(p => {
        const def = FIXTURES[p.fixtureKey];
        if (!def) return null;
        const fw = (p.w || def.w) * SCALE / 12;
        const fh = (def.wallH || p.h || def.h) * SCALE / 12;
        const fcolor = p.color || def.color || '#888';
        const clampedWallPos = clamp(p.wallPos || 0, 0, wallLengthFt);
        const px = feetToX(clampedWallPos);
        const halfW = fw / 2;
        const minX = PAD + halfW;
        const maxX = PAD + W - halfW;
        const clampedPx = Math.max(minX, Math.min(maxX, px));
        const mountHeight = p.mountHeight || (def && def.defaultMountHeight) || 0;
        const bottomEdgeY = inchesToY(mountHeight);
        const py = bottomEdgeY - fh;
        // Use wall elevation-appropriate path (simple rectangle for elevation view)
        return (
          <g key={p.id}>
            <rect
              x={clampedPx - fw / 2}
              y={py}
              width={fw}
              height={fh}
              rx="2"
              fill={fcolor}
              fillOpacity={colors.fixtureFillOpacity}
              stroke={fcolor}
              strokeOpacity={colors.fixtureStrokeOpacity}
              strokeWidth="1.5"
            />
            {/* Fixture label */}
            <text
              x={clampedPx}
              y={py + fh / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={colors.fixtureText}
              fontSize={Math.max(Math.min(fw / (p.name || '').length * 1.2, 10), 6)}
              fontWeight="600"
              fontFamily="Arial, sans-serif"
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Circuit Legend ─────────────────────────────────────────────────

export function CircuitLegend({ circuits }) {
  return (
    <div className="print-circuit-legend">
      {circuits.map(c => {
        // Collect unique device types on this circuit
        const deviceTypes = new Set();
        if (c.segments) {
          for (const seg of c.segments) {
            // We don't have access to placements here, so show circuit info
          }
        }
        return (
          <div key={c.id} className="print-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Color swatch with circuit symbol */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="24" height="16" viewBox="0 0 24 16">
                <line x1="0" y1="8" x2="24" y2="8" stroke={c.color} strokeWidth="2" strokeDasharray="4 2" />
                <circle cx="4" cy="8" r="3" fill="none" stroke={c.color} strokeWidth="1.5" />
                <circle cx="20" cy="8" r="3" fill="none" stroke={c.color} strokeWidth="1.5" />
              </svg>
              <div className="print-legend-swatch" style={{ background: c.color, width: '10px', height: '10px', borderRadius: '2px', flexShrink: 0 }} />
            </div>
            <span>
              #{c.number} {c.label || ''} ({c.amperage}A, #{c.wireGauge} AWG
              {c.gfci ? ', GFCI' : ''}
              {c.afci ? ', AFCI' : ''})
            </span>
          </div>
        );
      })}
    </div>
  );
}
