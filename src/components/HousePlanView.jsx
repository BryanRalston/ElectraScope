import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ELEC, FIXTURES, clamp } from '../constants';
import { calculateRoute } from '../circuitUtils';

// ─── Scale & layout constants ─────────────────────────────────────
const ARRANGE_SCALE = 20; // px per foot in arrange mode
const MIN_PLAN_SCALE = 8;
const MAX_PLAN_SCALE = 30;
const DEFAULT_PLAN_SCALE = 20;
const WALL_THICKNESS = 8;
const PLAN_PAD = 60; // padding around the entire house plan

// ─── Architectural plan paths for fixtures (40×40 viewBox) ────────
// Duplicated from PlanRenderer for self-containment
const FIXTURE_PLAN_PATHS = {
  refrigerator:  'M2,2 L38,2 L38,38 L2,38 Z M2,30 L38,30 M18,30 L18,38 M22,30 L22,38',
  range:         'M2,2 L38,2 L38,38 L2,38 Z M8,8 A4,4 0 1,1 8.01,8 M20,8 A4,4 0 1,1 20.01,8 M32,8 A4,4 0 1,1 32.01,8 M8,22 A4,4 0 1,1 8.01,22 M20,22 A4,4 0 1,1 20.01,22 M32,22 A4,4 0 1,1 32.01,22',
  dishwasher:    'M2,2 L38,2 L38,38 L2,38 Z M6,6 L34,6 L34,34 L6,34 Z',
  sink_k:        'M2,2 L38,2 L38,38 L2,38 Z M4,6 L18,6 L18,34 L4,34 Z M22,6 L36,6 L36,34 L22,34 Z M14,20 A3,3 0 1,1 14.01,20',
  microwave:     'M2,4 L38,4 L38,36 L2,36 Z M4,6 L28,6 L28,34 L4,34 Z M32,14 A2,2 0 1,1 32.01,14',
  island:        'M2,2 L38,2 L38,38 L2,38 Z M4,4 L36,4 L36,36 L4,36 Z',
  hood:          'M4,8 L36,8 L36,32 L4,32 Z M10,14 L30,14 L30,26 L10,26 Z',
  upper_cab:     'M2,2 L38,2 L38,38 L2,38 Z M20,2 L20,38',
  lower_cab:     'M2,2 L38,2 L38,38 L2,38 Z M20,2 L20,38 M10,18 A2,2 0 1,1 10.01,18 M30,18 A2,2 0 1,1 30.01,18',
  cab_corner:    'M2,2 L38,2 L38,38 L2,38 Z M2,2 L38,38',
  pantry_cab:    'M2,2 L38,2 L38,38 L2,38 Z M2,10 L38,10 M2,20 L38,20 M2,30 L38,30',
  toilet:        'M10,36 L10,22 A10,12 0 0,1 30,22 L30,36 Z M8,36 L32,36 L32,40 L8,40 Z M14,8 A8,8 0 0,1 26,8 L26,22 L14,22 Z',
  bathtub:       'M2,2 L38,2 L38,38 L2,38 Z M4,4 L36,4 L36,36 L4,36 Q4,30 6,28 L6,8 Q6,6 8,6 L32,6 Q34,6 34,8 L34,28 Q36,30 36,36',
  shower:        'M2,2 L38,2 L38,38 L2,38 Z M4,4 L36,4 L36,36 L4,36 Z M20,8 A2,2 0 1,1 20.01,8',
  vanity:        'M2,2 L38,2 L38,38 L2,38 Z M10,8 A8,8 0 1,1 10.01,8 M30,8 A8,8 0 1,1 30.01,8',
  sink_b:        'M6,4 L34,4 L34,36 L6,36 Z M12,10 A8,10 0 1,1 12.01,10',
  washer:        'M2,2 L38,2 L38,38 L2,38 Z M20,22 A10,10 0 1,1 20.01,22 M20,22 A4,4 0 1,1 20.01,22',
  dryer:         'M2,2 L38,2 L38,38 L2,38 Z M20,22 A10,10 0 1,1 20.01,22',
  water_heater:  'M20,4 A16,16 0 1,1 20.01,4 Z',
  door_36:       'M2,18 L38,18 L38,22 L2,22 Z',
  door_30:       'M5,18 L35,18 L35,22 L5,22 Z',
  window_36:     'M2,14 L38,14 L38,26 L2,26 Z M2,18 L38,18 M2,22 L38,22',
  window_48:     'M2,14 L38,14 L38,26 L2,26 Z M2,18 L38,18 M2,22 L38,22',
  window_60:     'M2,14 L38,14 L38,26 L2,26 Z M2,18 L38,18 M2,22 L38,22',
  closet:        'M2,2 L38,2 L38,38 L2,38 Z M2,2 L20,20 L38,2',
  stairs:        'M2,2 L38,2 L38,38 L2,38 Z M2,6 L38,6 M2,10 L38,10 M2,14 L38,14 M2,18 L38,18 M2,22 L38,22 M2,26 L38,26 M2,30 L38,30 M2,34 L38,34 M14,2 L14,38 L26,2',
  bed_king:      'M2,2 L38,2 L38,38 L2,38 Z M2,6 L38,6 M6,6 L6,10 L18,10 L18,6 M22,6 L22,10 L34,10 L34,6',
  bed_queen:     'M2,2 L38,2 L38,38 L2,38 Z M2,6 L38,6 M6,6 L6,10 L18,10 L18,6 M22,6 L22,10 L34,10 L34,6',
  desk:          'M2,2 L38,2 L38,38 L2,38 Z M4,4 L4,8 M34,4 L34,8 M4,34 L4,36 M34,34 L34,36',
  sofa:          'M2,2 L38,2 L38,38 L2,38 Z M2,8 L6,8 L6,32 L2,32 M38,8 L34,8 L34,32 L38,32 M6,2 L6,6 L34,6 L34,2',
  tv_stand:      'M2,4 L38,4 L38,36 L2,36 Z M8,12 L32,12 L32,28 L8,28 Z',
  dining_table:  'M4,4 A2,2 0 0,1 6,2 L34,2 A2,2 0 0,1 36,4 L36,36 A2,2 0 0,1 34,38 L6,38 A2,2 0 0,1 4,36 Z',
};

// ─── Color palette (matches PlanRenderer PRINT_COLORS) ────────────
const COLORS = {
  bg: '#FFFFFF',
  wallFill: '#9E9E9E',
  gridMinor: '#F5F5F5',
  gridMajor: '#E8E8E8',
  roomFill: '#FAFAFA',
  roomLabel: '#888',
  dimFill: '#555',
  dimLine: '#999',
  outlet: '#1565C0',
  switch: '#C62828',
  light: '#F9A825',
  safety: '#D32F2F',
  panel: '#555',
  circuitWire: '#00897B',
  fixtureFillOpacity: 0.15,
  fixtureStrokeOpacity: 0.65,
  fixtureText: '#777',
};

// ─── Wall opening helpers ─────────────────────────────────────────

// Compute solid wall segments by subtracting openings (doors/windows)
function computeWallSegments(wallStart, wallEnd, openings) {
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

// Find door/window placements near a specific wall (uses room-local coordinates at 40px/ft)
function findWallOpeningsHP(placements, wall, roomW, roomH) {
  const SNAP = 2 * 40; // 2*SCALE where SCALE=40 is the placement coordinate scale
  return placements.filter(p => {
    if (!p.fixtureKey || p.cx === undefined || p.cy === undefined) return false;
    const isDoor = p.fixtureKey.startsWith('door_');
    const isWindow = p.fixtureKey.startsWith('window_');
    if (!isDoor && !isWindow) return false;
    if (p.wall === wall) return true;
    if (p.wall && p.wall !== wall) return false;
    // roomW and roomH are in room-local coords (width*40, height*40)
    switch (wall) {
      case 'north': return p.cy <= SNAP;
      case 'south': return p.cy >= roomH - SNAP;
      case 'west':  return p.cx <= SNAP;
      case 'east':  return p.cx >= roomW - SNAP;
      default: return false;
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────

function getElecColor(def) {
  switch (def.cat) {
    case 'Outlets':  return COLORS.outlet;
    case 'Switches': return COLORS.switch;
    case 'Lights':   return COLORS.light;
    case 'Safety':   return COLORS.safety;
    case 'Panel':    return COLORS.panel;
    default:         return def.color;
  }
}

function computeBounds(rooms) {
  if (!rooms.length) return { minX: 0, minY: 0, maxX: 20, maxY: 20 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rooms) {
    const rx = r.planX || 0;
    const ry = r.planY || 0;
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx + r.width);
    maxY = Math.max(maxY, ry + r.height);
  }
  return { minX, minY, maxX, maxY };
}

// ─── Dimension Line (architectural style) ─────────────────────────

function DimensionLine({ x1, y1, x2, y2, label, color, fontSize = 11, tickSize = 5, orientation = 'horizontal' }) {
  if (orientation === 'horizontal') {
    const midX = (x1 + x2) / 2;
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.8" />
        <line x1={x1} y1={y1 - tickSize} x2={x1} y2={y1 + tickSize} stroke={color} strokeWidth="0.8" />
        <line x1={x2} y1={y2 - tickSize} x2={x2} y2={y2 + tickSize} stroke={color} strokeWidth="0.8" />
        <polygon points={`${x1},${y1} ${x1 + 4},${y1 - 2.5} ${x1 + 4},${y1 + 2.5}`} fill={color} />
        <polygon points={`${x2},${y2} ${x2 - 4},${y2 - 2.5} ${x2 - 4},${y2 + 2.5}`} fill={color} />
        <text x={midX} y={y1 - 4} textAnchor="middle" fill={color} fontSize={fontSize} fontFamily="Arial, sans-serif">
          {label}
        </text>
      </g>
    );
  }
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.8" />
      <line x1={x1 - tickSize} y1={y1} x2={x1 + tickSize} y2={y1} stroke={color} strokeWidth="0.8" />
      <line x1={x2 - tickSize} y1={y2} x2={x2 + tickSize} y2={y2} stroke={color} strokeWidth="0.8" />
      <polygon points={`${x1},${y1} ${x1 - 2.5},${y1 + 4} ${x1 + 2.5},${y1 + 4}`} fill={color} />
      <polygon points={`${x2},${y2} ${x2 - 2.5},${y2 - 4} ${x2 + 2.5},${y2 - 4}`} fill={color} />
      <text
        x={x1 - 6} y={midY} textAnchor="middle" fill={color} fontSize={fontSize}
        fontFamily="Arial, sans-serif" transform={`rotate(-90, ${x1 - 6}, ${midY})`}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Door swing arc ───────────────────────────────────────────────

function DoorSwingArc({ cx, cy, radius, rotation, color }) {
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

// ─── Wire directional arrow ──────────────────────────────────────

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

// ═══════════════════════════════════════════════════════════════════
// ARRANGE CANVAS — drag rooms on a grid to set planX/planY
// ═══════════════════════════════════════════════════════════════════

function ArrangeCanvas({ rooms, onChange }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { roomId, offsetX, offsetY }
  const [hovered, setHovered] = useState(null);

  const S = ARRANGE_SCALE;

  // Compute canvas size from room positions
  const bounds = computeBounds(rooms);
  const canvasW = Math.max(60, bounds.maxX + 20);
  const canvasH = Math.max(40, bounds.maxY + 20);
  const svgW = canvasW * S + 60;
  const svgH = canvasH * S + 60;
  const OX = 30; // origin offset
  const OY = 30;

  const getSVGPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const handleMouseDown = useCallback((e, room) => {
    e.preventDefault();
    const pt = getSVGPoint(e);
    const rx = (room.planX || 0) * S + OX;
    const ry = (room.planY || 0) * S + OY;
    setDragging({ roomId: room.id, offsetX: pt.x - rx, offsetY: pt.y - ry });
  }, [getSVGPoint, S]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const pt = getSVGPoint(e);
    const rawX = (pt.x - OX - dragging.offsetX) / S;
    const rawY = (pt.y - OY - dragging.offsetY) / S;
    const snappedX = Math.round(rawX);
    const snappedY = Math.round(rawY);
    onChange(rooms.map(r =>
      r.id === dragging.roomId
        ? { ...r, planX: Math.max(0, snappedX), planY: Math.max(0, snappedY) }
        : r
    ));
  }, [dragging, getSVGPoint, rooms, onChange, S]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div className="arrange-canvas-wrap" style={{ overflow: 'auto', background: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: 8 }}>
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'default' }}
      >
        {/* Grid */}
        {Array.from({ length: canvasW + 1 }).map((_, i) => (
          <line
            key={`gv${i}`}
            x1={OX + i * S} y1={OY}
            x2={OX + i * S} y2={OY + canvasH * S}
            stroke={i % 5 === 0 ? '#DDD' : '#F0F0F0'}
            strokeWidth={i % 5 === 0 ? 0.8 : 0.3}
          />
        ))}
        {Array.from({ length: canvasH + 1 }).map((_, i) => (
          <line
            key={`gh${i}`}
            x1={OX} y1={OY + i * S}
            x2={OX + canvasW * S} y2={OY + i * S}
            stroke={i % 5 === 0 ? '#DDD' : '#F0F0F0'}
            strokeWidth={i % 5 === 0 ? 0.8 : 0.3}
          />
        ))}

        {/* Rooms */}
        {rooms.map(r => {
          const rx = (r.planX || 0) * S + OX;
          const ry = (r.planY || 0) * S + OY;
          const rw = r.width * S;
          const rh = r.height * S;
          const isActive = dragging && dragging.roomId === r.id;
          const isHov = hovered === r.id;
          return (
            <g
              key={r.id}
              onMouseDown={(e) => handleMouseDown(e, r)}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: isActive ? 'grabbing' : 'grab' }}
            >
              <rect
                x={rx} y={ry} width={rw} height={rh} rx={2}
                fill={isActive ? '#E3F2FD' : isHov ? '#F5F5F5' : '#FFF'}
                stroke={isActive ? '#1976D2' : isHov ? '#999' : '#BBB'}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {/* Room name */}
              <text
                x={rx + rw / 2} y={ry + rh / 2 - 6}
                textAnchor="middle" dominantBaseline="middle"
                fill="#333" fontSize="12" fontWeight="600" fontFamily="Arial, sans-serif"
                pointerEvents="none"
              >
                {r.name}
              </text>
              {/* Dimensions */}
              <text
                x={rx + rw / 2} y={ry + rh / 2 + 8}
                textAnchor="middle" dominantBaseline="middle"
                fill="#999" fontSize="10" fontFamily="Arial, sans-serif"
                pointerEvents="none"
              >
                {r.width}' x {r.height}'
              </text>
              {/* Position label */}
              <text
                x={rx + 4} y={ry + 12}
                fill="#AAA" fontSize="8" fontFamily="monospace"
                pointerEvents="none"
              >
                ({r.planX || 0}, {r.planY || 0})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOUSE PLAN SVG — professional architectural floor plan rendering
// ═══════════════════════════════════════════════════════════════════

function HousePlanSVG({ rooms, scale }) {
  const S = scale;
  const WT = WALL_THICKNESS;
  const bounds = computeBounds(rooms);
  const houseW = (bounds.maxX - bounds.minX) * S;
  const houseH = (bounds.maxY - bounds.minY) * S;
  const svgW = houseW + PLAN_PAD * 2;
  const svgH = houseH + PLAN_PAD * 2;

  // Origin offset: shift all rooms so the min is at PLAN_PAD
  const ox = PLAN_PAD - bounds.minX * S;
  const oy = PLAN_PAD - bounds.minY * S;

  // Collect all circuits across rooms for the legend
  const allCircuits = rooms.flatMap(r => r.circuits || []);
  const legendH = allCircuits.length > 0 ? allCircuits.length * 18 + 40 : 0;

  return (
    <div style={{ overflow: 'auto', background: '#FFF' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${svgW} ${svgH + legendH}`}
        style={{ maxWidth: svgW, background: COLORS.bg }}
      >
        {/* ── Grid ── */}
        {(() => {
          const lines = [];
          const totalW = (bounds.maxX - bounds.minX);
          const totalH = (bounds.maxY - bounds.minY);
          for (let i = 0; i <= totalW; i++) {
            lines.push(
              <line
                key={`gv${i}`}
                x1={ox + bounds.minX * S + i * S} y1={oy + bounds.minY * S}
                x2={ox + bounds.minX * S + i * S} y2={oy + bounds.maxY * S}
                stroke={i % 4 === 0 ? COLORS.gridMajor : COLORS.gridMinor}
                strokeWidth={i % 4 === 0 ? 0.5 : 0.2}
              />
            );
          }
          for (let i = 0; i <= totalH; i++) {
            lines.push(
              <line
                key={`gh${i}`}
                x1={ox + bounds.minX * S} y1={oy + bounds.minY * S + i * S}
                x2={ox + bounds.maxX * S} y2={oy + bounds.minY * S + i * S}
                stroke={i % 4 === 0 ? COLORS.gridMajor : COLORS.gridMinor}
                strokeWidth={i % 4 === 0 ? 0.5 : 0.2}
              />
            );
          }
          return lines;
        })()}

        {/* ── Per-room content (fills, fixtures, electrical, wires) ── */}
        {rooms.map(r => {
          const rx = ox + (r.planX || 0) * S;
          const ry = oy + (r.planY || 0) * S;
          const rw = r.width * S;
          const rh = r.height * S;
          const placements = r.placements || [];
          // Scale factor for mapping single-room coords (at 40px/ft) to house plan coords (at S px/ft)
          const pScale = S / 40;

          return (
            <g key={r.id}>
              {/* Room fill */}
              <rect x={rx} y={ry} width={rw} height={rh} fill={COLORS.roomFill} />

              {/* Circuit wires */}
              {(r.circuits || []).map(circuit =>
                circuit.segments.map((seg, si) => {
                  const fromP = placements.find(p => p.id === seg.from);
                  const toP = placements.find(p => p.id === seg.to);
                  if (!fromP || !toP || fromP.cx === undefined || toP.cx === undefined) return null;
                  const route = calculateRoute(fromP, toP);
                  const d = route.map((pt, i) =>
                    `${i === 0 ? 'M' : 'L'}${rx + pt.x * pScale},${ry + pt.y * pScale}`
                  ).join(' ');
                  const mid = route[Math.floor(route.length / 2)];
                  let arrowAngle = 0;
                  if (route.length >= 2) {
                    const p1 = route[Math.floor(route.length / 2) - 1] || route[0];
                    const p2 = route[Math.floor(route.length / 2)];
                    arrowAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                  }
                  return (
                    <g key={`cw-${circuit.id}-${si}`}>
                      <path
                        d={d} fill="none" stroke={COLORS.circuitWire}
                        strokeWidth="1.5" strokeDasharray="6 3" strokeLinecap="round" opacity="0.85"
                      />
                      <WireArrow
                        x={rx + mid.x * pScale} y={ry + mid.y * pScale}
                        angle={arrowAngle} color={COLORS.circuitWire}
                      />
                      {/* Background rect behind circuit number label */}
                      <rect
                        x={rx + mid.x * pScale - 8}
                        y={ry + mid.y * pScale - 12}
                        width={16} height={10}
                        fill={COLORS.bg} fillOpacity="0.8" rx="2"
                      />
                      <text
                        x={rx + mid.x * pScale} y={ry + mid.y * pScale - 6}
                        textAnchor="middle" fill={COLORS.circuitWire}
                        fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif"
                      >
                        #{circuit.number}
                      </text>
                    </g>
                  );
                })
              )}

              {/* Fixtures */}
              {placements.filter(p => p.fixtureKey && p.cx !== undefined).map(p => {
                const def = FIXTURES[p.fixtureKey];
                const fw = (p.w || (def && def.w) || 30) * S / 12;
                const fh = (p.h || (def && def.h) || 30) * S / 12;
                const fcolor = p.color || (def && def.color) || '#888';
                const rotation = p.rotation || 0;
                const planPath = (def && def.planPath) || FIXTURE_PLAN_PATHS[p.fixtureKey];
                const isDoor = p.fixtureKey && p.fixtureKey.startsWith('door_');
                const isWindow = p.fixtureKey && p.fixtureKey.startsWith('window_');
                return (
                  <g key={p.id} transform={`translate(${rx + p.cx * pScale}, ${ry + p.cy * pScale})`}>
                    {isDoor && (
                      <DoorSwingArc cx={-fw / 2} cy={0} radius={fw} rotation={rotation} color={fcolor} />
                    )}
                    <g transform={`rotate(${rotation}) scale(${fw / 40}, ${fh / 40})`}>
                      {planPath ? (
                        <path
                          d={planPath}
                          fill={fcolor} fillOpacity={COLORS.fixtureFillOpacity}
                          stroke={fcolor} strokeOpacity={COLORS.fixtureStrokeOpacity}
                          strokeWidth={1.5 * 40 / Math.max(fw, fh)} strokeLinejoin="round"
                        />
                      ) : (
                        <rect
                          x="2" y="2" width="36" height="36" rx="2"
                          fill={fcolor} fillOpacity={COLORS.fixtureFillOpacity}
                          stroke={fcolor} strokeOpacity={COLORS.fixtureStrokeOpacity}
                          strokeWidth={1.5 * 40 / Math.max(fw, fh)}
                        />
                      )}
                      {isWindow && (
                        <>
                          <line x1="2" y1="18" x2="38" y2="18" stroke={fcolor} strokeOpacity={COLORS.fixtureStrokeOpacity} strokeWidth={1 * 40 / Math.max(fw, fh)} />
                          <line x1="2" y1="22" x2="38" y2="22" stroke={fcolor} strokeOpacity={COLORS.fixtureStrokeOpacity} strokeWidth={1 * 40 / Math.max(fw, fh)} />
                        </>
                      )}
                    </g>
                    {/* Fixture text labels hidden at house plan scale — silhouette shape is sufficient */}
                  </g>
                );
              })}

              {/* Electrical symbols */}
              {placements.filter(p => p.elecKey && p.cx !== undefined).map(p => {
                const def = ELEC[p.elecKey];
                if (!def) return null;
                const symbolColor = getElecColor(def);
                const symbolSize = Math.max(16, 24 * (S / 20));
                const scaleFactor = symbolSize / 40;
                const rotation = p.rotation || 0;
                return (
                  <g key={p.id} transform={`translate(${rx + p.cx * pScale}, ${ry + p.cy * pScale})`}>
                    <g transform={`rotate(${rotation}) translate(${-symbolSize / 2}, ${-symbolSize / 2}) scale(${scaleFactor})`}>
                      <path
                        d={def.path} fill="none" stroke={symbolColor}
                        strokeWidth={2.5 / scaleFactor} strokeLinecap="round" strokeLinejoin="round"
                      />
                      {def.cat === 'Switches' && (
                        <text
                          x="20" y="22" textAnchor="middle" dominantBaseline="middle"
                          fill={symbolColor} fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif"
                        >
                          {def.abbr}
                        </text>
                      )}
                    </g>
                    {def.cat !== 'Switches' && (
                      <text
                        textAnchor="middle" y={symbolSize / 2 + 7} fill={symbolColor}
                        fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.85"
                      >
                        {def.abbr}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ── Walls — segmented with door/window openings ── */}
        {rooms.map(r => {
          const rx = ox + (r.planX || 0) * S;
          const ry = oy + (r.planY || 0) * S;
          const rw = r.width * S;
          const rh = r.height * S;
          const placements = r.placements || [];
          // Room-local coords use 40px/ft, house plan uses S px/ft
          const roomLocalW = r.width * 40;
          const roomLocalH = r.height * 40;
          const pScale = S / 40;

          // Compute wall openings for each wall of this room
          const roomWallDetails = {};
          for (const wall of ['north', 'south', 'east', 'west']) {
            const openingPlacements = findWallOpeningsHP(placements, wall, roomLocalW, roomLocalH);
            const isHorizontal = (wall === 'north' || wall === 'south');
            const openings = openingPlacements.map(p => {
              const def = FIXTURES[p.fixtureKey];
              const isDoor = p.fixtureKey.startsWith('door_');
              const widthInches = p.w || (def && def.w) || 36;
              const openingWidth = widthInches * S / 12;
              // Map placement center from room-local coords to house plan coords
              const center = isHorizontal
                ? (rx + p.cx * pScale)
                : (ry + p.cy * pScale);
              return { center, width: openingWidth, isDoor, isWindow: !isDoor };
            });

            const wallStart = isHorizontal ? (rx - WT / 2) : (ry - WT / 2);
            const wallEnd = isHorizontal ? (rx + rw + WT / 2) : (ry + rh + WT / 2);
            roomWallDetails[wall] = {
              segments: computeWallSegments(wallStart, wallEnd, openings),
              openings
            };
          }

          return (
            <g key={`walls-${r.id}`}>
              {/* North wall segments */}
              {roomWallDetails.north.segments.map((seg, i) => (
                <rect key={'nw' + i} x={seg.start} y={ry - WT / 2} width={seg.end - seg.start} height={WT} fill={COLORS.wallFill} />
              ))}
              {/* North wall openings */}
              {roomWallDetails.north.openings.map((op, i) => {
                const gapStart = op.center - op.width / 2;
                const gapEnd = op.center + op.width / 2;
                const wallCenterY = ry;
                if (op.isWindow) {
                  return (
                    <g key={'nwo' + i}>
                      <line x1={gapStart} y1={wallCenterY - 2} x2={gapEnd} y2={wallCenterY - 2} stroke="#88BBDD" strokeWidth="1.5" />
                      <line x1={gapStart} y1={wallCenterY + 2} x2={gapEnd} y2={wallCenterY + 2} stroke="#88BBDD" strokeWidth="1.5" />
                      <line x1={gapStart} y1={wallCenterY - WT / 2} x2={gapStart} y2={wallCenterY + WT / 2} stroke={COLORS.wallFill} strokeWidth="1" />
                      <line x1={gapEnd} y1={wallCenterY - WT / 2} x2={gapEnd} y2={wallCenterY + WT / 2} stroke={COLORS.wallFill} strokeWidth="1" />
                    </g>
                  );
                }
                const hingeX = gapStart;
                const doorW = op.width;
                return (
                  <g key={'nwo' + i}>
                    <line x1={hingeX} y1={wallCenterY} x2={hingeX} y2={wallCenterY + doorW} stroke="#887766" strokeWidth="2" />
                    <path d={`M ${hingeX},${wallCenterY + doorW} A ${doorW},${doorW} 0 0,1 ${hingeX + doorW},${wallCenterY}`} fill="none" stroke="#887766" strokeWidth="1" strokeDasharray="4 2" />
                  </g>
                );
              })}

              {/* South wall segments */}
              {roomWallDetails.south.segments.map((seg, i) => (
                <rect key={'sw' + i} x={seg.start} y={ry + rh - WT / 2} width={seg.end - seg.start} height={WT} fill={COLORS.wallFill} />
              ))}
              {/* South wall openings */}
              {roomWallDetails.south.openings.map((op, i) => {
                const gapStart = op.center - op.width / 2;
                const gapEnd = op.center + op.width / 2;
                const wallCenterY = ry + rh;
                if (op.isWindow) {
                  return (
                    <g key={'swo' + i}>
                      <line x1={gapStart} y1={wallCenterY - 2} x2={gapEnd} y2={wallCenterY - 2} stroke="#88BBDD" strokeWidth="1.5" />
                      <line x1={gapStart} y1={wallCenterY + 2} x2={gapEnd} y2={wallCenterY + 2} stroke="#88BBDD" strokeWidth="1.5" />
                      <line x1={gapStart} y1={wallCenterY - WT / 2} x2={gapStart} y2={wallCenterY + WT / 2} stroke={COLORS.wallFill} strokeWidth="1" />
                      <line x1={gapEnd} y1={wallCenterY - WT / 2} x2={gapEnd} y2={wallCenterY + WT / 2} stroke={COLORS.wallFill} strokeWidth="1" />
                    </g>
                  );
                }
                const hingeX = gapStart;
                const doorW = op.width;
                return (
                  <g key={'swo' + i}>
                    <line x1={hingeX} y1={wallCenterY} x2={hingeX} y2={wallCenterY - doorW} stroke="#887766" strokeWidth="2" />
                    <path d={`M ${hingeX},${wallCenterY - doorW} A ${doorW},${doorW} 0 0,0 ${hingeX + doorW},${wallCenterY}`} fill="none" stroke="#887766" strokeWidth="1" strokeDasharray="4 2" />
                  </g>
                );
              })}

              {/* West wall segments */}
              {roomWallDetails.west.segments.map((seg, i) => (
                <rect key={'ww' + i} x={rx - WT / 2} y={seg.start} width={WT} height={seg.end - seg.start} fill={COLORS.wallFill} />
              ))}
              {/* West wall openings */}
              {roomWallDetails.west.openings.map((op, i) => {
                const gapStart = op.center - op.width / 2;
                const gapEnd = op.center + op.width / 2;
                const wallCenterX = rx;
                if (op.isWindow) {
                  return (
                    <g key={'wwo' + i}>
                      <line x1={wallCenterX - 2} y1={gapStart} x2={wallCenterX - 2} y2={gapEnd} stroke="#88BBDD" strokeWidth="1.5" />
                      <line x1={wallCenterX + 2} y1={gapStart} x2={wallCenterX + 2} y2={gapEnd} stroke="#88BBDD" strokeWidth="1.5" />
                      <line x1={wallCenterX - WT / 2} y1={gapStart} x2={wallCenterX + WT / 2} y2={gapStart} stroke={COLORS.wallFill} strokeWidth="1" />
                      <line x1={wallCenterX - WT / 2} y1={gapEnd} x2={wallCenterX + WT / 2} y2={gapEnd} stroke={COLORS.wallFill} strokeWidth="1" />
                    </g>
                  );
                }
                const doorW = op.width;
                return (
                  <g key={'wwo' + i}>
                    <line x1={wallCenterX} y1={gapStart} x2={wallCenterX + doorW} y2={gapStart} stroke="#887766" strokeWidth="2" />
                    <path d={`M ${wallCenterX + doorW},${gapStart} A ${doorW},${doorW} 0 0,1 ${wallCenterX},${gapStart + doorW}`} fill="none" stroke="#887766" strokeWidth="1" strokeDasharray="4 2" />
                  </g>
                );
              })}

              {/* East wall segments */}
              {roomWallDetails.east.segments.map((seg, i) => (
                <rect key={'ew' + i} x={rx + rw - WT / 2} y={seg.start} width={WT} height={seg.end - seg.start} fill={COLORS.wallFill} />
              ))}
              {/* East wall openings */}
              {roomWallDetails.east.openings.map((op, i) => {
                const gapStart = op.center - op.width / 2;
                const gapEnd = op.center + op.width / 2;
                const wallCenterX = rx + rw;
                if (op.isWindow) {
                  return (
                    <g key={'ewo' + i}>
                      <line x1={wallCenterX - 2} y1={gapStart} x2={wallCenterX - 2} y2={gapEnd} stroke="#88BBDD" strokeWidth="1.5" />
                      <line x1={wallCenterX + 2} y1={gapStart} x2={wallCenterX + 2} y2={gapEnd} stroke="#88BBDD" strokeWidth="1.5" />
                      <line x1={wallCenterX - WT / 2} y1={gapStart} x2={wallCenterX + WT / 2} y2={gapStart} stroke={COLORS.wallFill} strokeWidth="1" />
                      <line x1={wallCenterX - WT / 2} y1={gapEnd} x2={wallCenterX + WT / 2} y2={gapEnd} stroke={COLORS.wallFill} strokeWidth="1" />
                    </g>
                  );
                }
                const doorW = op.width;
                return (
                  <g key={'ewo' + i}>
                    <line x1={wallCenterX} y1={gapStart} x2={wallCenterX - doorW} y2={gapStart} stroke="#887766" strokeWidth="2" />
                    <path d={`M ${wallCenterX - doorW},${gapStart} A ${doorW},${doorW} 0 0,0 ${wallCenterX},${gapStart + doorW}`} fill="none" stroke="#887766" strokeWidth="1" strokeDasharray="4 2" />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ── Room labels (on top of walls) ── */}
        {rooms.map(r => {
          const rx = ox + (r.planX || 0) * S;
          const ry = oy + (r.planY || 0) * S;
          const rw = r.width * S;
          const rh = r.height * S;
          const roomNameWidth = r.name.length * Math.max(10, Math.min(16, S * 0.7)) * 0.55;
          return (
            <g key={`label-${r.id}`}>
              {/* Background rect for room name readability */}
              <rect
                x={rx + rw / 2 - roomNameWidth / 2 - 6}
                y={ry + rh / 2 - 10}
                width={roomNameWidth + 12}
                height={20}
                fill={COLORS.bg}
                fillOpacity="0.85"
                rx="3"
              />
              <text
                x={rx + rw / 2} y={ry + rh / 2}
                textAnchor="middle" dominantBaseline="middle"
                fill={COLORS.roomLabel} fontSize={Math.max(10, Math.min(16, S * 0.7))}
                fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.8"
              >
                {r.name}
              </text>
              <text
                x={rx + rw / 2} y={ry + rh / 2 + Math.max(10, S * 0.6)}
                textAnchor="middle" dominantBaseline="middle"
                fill={COLORS.roomLabel} fontSize={Math.max(7, Math.min(10, S * 0.45))}
                fontFamily="Arial, sans-serif" opacity="0.4"
              >
                {r.width}' x {r.height}'
              </text>
            </g>
          );
        })}

        {/* ── Overall dimension lines ── */}
        <DimensionLine
          x1={ox + bounds.minX * S}
          y1={oy + bounds.minY * S - 22}
          x2={ox + bounds.maxX * S}
          y2={oy + bounds.minY * S - 22}
          label={`${bounds.maxX - bounds.minX}'`}
          color={COLORS.dimFill}
          orientation="horizontal"
        />
        <DimensionLine
          x1={ox + bounds.minX * S - 22}
          y1={oy + bounds.minY * S}
          x2={ox + bounds.minX * S - 22}
          y2={oy + bounds.maxY * S}
          label={`${bounds.maxY - bounds.minY}'`}
          color={COLORS.dimFill}
          orientation="vertical"
        />

        {/* ── Per-room dimension lines ── */}
        {rooms.map(r => {
          const rx = ox + (r.planX || 0) * S;
          const ry = oy + (r.planY || 0) * S;
          const rw = r.width * S;
          const rh = r.height * S;
          return (
            <g key={`dim-${r.id}`}>
              {/* Bottom dimension */}
              <DimensionLine
                x1={rx} y1={ry + rh + 14}
                x2={rx + rw} y2={ry + rh + 14}
                label={`${r.width}'`} color={COLORS.dimLine}
                fontSize={8} tickSize={3} orientation="horizontal"
              />
              {/* Right dimension */}
              <DimensionLine
                x1={rx + rw + 14} y1={ry}
                x2={rx + rw + 14} y2={ry + rh}
                label={`${r.height}'`} color={COLORS.dimLine}
                fontSize={8} tickSize={3} orientation="vertical"
              />
            </g>
          );
        })}

        {/* ── Circuit Legend (with card background) ── */}
        {allCircuits.length > 0 && (
          <g transform={`translate(${PLAN_PAD}, ${svgH + 10})`}>
            {/* Card background */}
            <rect
              x={-12} y={-16}
              width={280}
              height={allCircuits.length * 18 + 40}
              fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="1" rx="8"
            />
            <text x={0} y={0} fill="#333" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">
              Circuit Legend
            </text>
            {allCircuits.map((c, i) => (
              <g key={c.id} transform={`translate(0, ${16 + i * 18})`}>
                <line x1="0" y1="0" x2="20" y2="0" stroke={c.color} strokeWidth="2" strokeDasharray="4 2" />
                <circle cx="4" cy="0" r="2.5" fill="none" stroke={c.color} strokeWidth="1.2" />
                <circle cx="16" cy="0" r="2.5" fill="none" stroke={c.color} strokeWidth="1.2" />
                <rect x="24" y={-5} width="8" height="10" rx="1" fill={c.color} opacity="0.8" />
                <text x="38" y="4" fill="#555" fontSize="9" fontFamily="Arial, sans-serif">
                  #{c.number} {c.label || ''} ({c.amperage}A, #{c.wireGauge} AWG{c.gfci ? ', GFCI' : ''}{c.afci ? ', AFCI' : ''})
                </text>
              </g>
            ))}
          </g>
        )}

        {/* ── Symbol Legend (with card background) ── */}
        {(() => {
          // Collect unique elec types used across all rooms
          const usedElecKeys = new Set();
          for (const r of rooms) {
            for (const p of (r.placements || [])) {
              if (p.elecKey) usedElecKeys.add(p.elecKey);
            }
          }
          if (usedElecKeys.size === 0) return null;
          const legendItems = [...usedElecKeys].map(k => ELEC[k]).filter(Boolean);
          const startX = Math.max(svgW / 2, PLAN_PAD + 300);
          return (
            <g transform={`translate(${startX}, ${svgH + 10})`}>
              {/* Card background */}
              <rect
                x={-12} y={-16}
                width={260}
                height={legendItems.length * 18 + 40}
                fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="1" rx="8"
              />
              <text x={0} y={0} fill="#333" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">
                Symbol Legend
              </text>
              {legendItems.map((def, i) => {
                const symbolColor = getElecColor(def);
                return (
                  <g key={def.abbr + i} transform={`translate(0, ${16 + i * 18})`}>
                    <g transform="translate(0, -6) scale(0.4)">
                      <path d={def.path} fill="none" stroke={symbolColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <text x="22" y="3" fill="#555" fontSize="9" fontFamily="Arial, sans-serif">
                      {def.abbr} — {def.name}{def.amps ? ` (${def.amps}A)` : ''}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — HousePlanView
// ═══════════════════════════════════════════════════════════════════

export default function HousePlanView({ project, onSave, onBack }) {
  const [mode, setMode] = useState('plan');
  const [rooms, setRooms] = useState(() => {
    // Initialize rooms with planX/planY defaults
    return (project.rooms || []).map((r, i) => ({
      ...r,
      planX: r.planX ?? (i * (r.width + 2)),
      planY: r.planY ?? 0,
    }));
  });
  const [scale, setScale] = useState(DEFAULT_PLAN_SCALE);
  const [dirty, setDirty] = useState(false);

  // Sync rooms if project changes externally
  useEffect(() => {
    setRooms((project.rooms || []).map((r, i) => ({
      ...r,
      planX: r.planX ?? (i * (r.width + 2)),
      planY: r.planY ?? 0,
    })));
  }, [project.rooms]);

  // Auto-fit scale to viewport
  useEffect(() => {
    if (rooms.length === 0) return;
    const bounds = computeBounds(rooms);
    const totalW = bounds.maxX - bounds.minX;
    const totalH = bounds.maxY - bounds.minY;
    if (totalW <= 0 || totalH <= 0) return;
    // Aim for ~900px width
    const targetW = 900;
    const targetH = 700;
    const fitScale = Math.min(targetW / totalW, targetH / totalH);
    const clamped = clamp(Math.floor(fitScale), MIN_PLAN_SCALE, MAX_PLAN_SCALE);
    setScale(clamped);
  }, [rooms.length]); // Only recompute when room count changes, not every drag

  const handleArrangeChange = useCallback((updatedRooms) => {
    setRooms(updatedRooms);
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    const updated = { ...project, rooms };
    onSave(updated);
    setDirty(false);
  }, [project, rooms, onSave]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const totalPlacements = rooms.reduce((sum, r) => sum + (r.placements || []).length, 0);
  const totalCircuits = rooms.reduce((sum, r) => sum + (r.circuits || []).length, 0);

  return (
    <div className="container">
      {/* Toolbar */}
      <div className="card no-print" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn-outline" onClick={onBack}>&larr; Back</button>
        <div style={{ flex: 1 }} />
        <button
          className={mode === 'arrange' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setMode('arrange')}
        >
          Arrange Rooms
        </button>
        <button
          className={mode === 'plan' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setMode('plan')}
        >
          Plan View
        </button>
        <div style={{ flex: 1 }} />
        {mode === 'plan' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#888' }}>Scale:</label>
            <input
              type="range" min={MIN_PLAN_SCALE} max={MAX_PLAN_SCALE} value={scale}
              onChange={e => setScale(Number(e.target.value))}
              style={{ width: 80 }}
            />
            <span style={{ fontSize: 11, color: '#999', minWidth: 44 }}>{scale}px/ft</span>
          </div>
        )}
        {dirty && (
          <button className="btn-primary" onClick={handleSave}>
            Save Layout
          </button>
        )}
        {mode === 'plan' && (
          <button className="btn-outline" onClick={handlePrint}>
            Print
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="no-print" style={{ padding: '6px 0 2px', color: '#888', fontSize: 13 }}>
        <strong>{project.name}</strong>
        {project.address ? ` — ${project.address}` : ''}
        {' | '}
        {rooms.length} room{rooms.length !== 1 ? 's' : ''}
        {' | '}
        {totalPlacements} placement{totalPlacements !== 1 ? 's' : ''}
        {' | '}
        {totalCircuits} circuit{totalCircuits !== 1 ? 's' : ''}
      </div>

      {/* Canvas */}
      {rooms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No rooms in this project</div>
          <div style={{ marginTop: 8 }}>Add rooms from the project view, then come back here to arrange and view the whole-house plan.</div>
        </div>
      ) : mode === 'arrange' ? (
        <div>
          <div className="no-print" style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
            Drag rooms to position them. Snaps to 1-foot grid. Coordinates are in feet from the house origin (top-left).
          </div>
          <ArrangeCanvas rooms={rooms} onChange={handleArrangeChange} />
        </div>
      ) : (
        <HousePlanSVG rooms={rooms} scale={scale} />
      )}
    </div>
  );
}
