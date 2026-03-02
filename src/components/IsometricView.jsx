import React, { useState, useMemo } from 'react';
import { ELEC, FIXTURES, WALL_LABELS } from '../constants';
import { calculateRoute } from '../circuitUtils';

// ─── Fixture physical heights (inches) ─────────────────────────────
const FIXTURE_HEIGHTS = {
  refrigerator: 70, range: 36, dishwasher: 34, sink_k: 8, microwave: 12, island: 36, hood: 8,
  upper_cab: 30, lower_cab: 34, cab_corner: 34, pantry_cab: 84,
  toilet: 28, bathtub: 20, shower: 80, vanity: 34, sink_b: 8,
  washer: 38, dryer: 38, water_heater: 60,
  door_36: 80, door_30: 80, window_36: 48, window_48: 48, window_60: 48, closet: 84, stairs: 10,
  bed_king: 24, bed_queen: 24, desk: 30, sofa: 30, tv_stand: 24, dining_table: 30,
};
const DEFAULT_FIXTURE_HEIGHT = 36;

// ─── Isometric projection constants ────────────────────────────────
const ANGLE = Math.PI / 6; // 30 degrees
const COS = Math.cos(ANGLE); // ~0.866
const SIN = Math.sin(ANGLE); // 0.5
const ISO_SCALE = 25; // pixels per foot (smaller than plan view's 40)
const PLAN_SCALE = 40; // plan view pixels-per-foot (placement coords use this)

// Convert a 3D point (x, y, z) in feet to 2D isometric screen coords
function toIso(x, y, z) {
  return {
    sx: (x - y) * COS,
    sy: (x + y) * SIN - z,
  };
}

// ─── View definitions ──────────────────────────────────────────────
// Each view rotates the "camera" 90 degrees around the room center.
// We remap room coordinates (rx, ry) before projecting to isometric.
// rx runs along room width, ry along room depth, rz is height.
const VIEWS = {
  NW: { label: 'NW', backWalls: ['north', 'west'] },
  NE: { label: 'NE', backWalls: ['north', 'east'] },
  SE: { label: 'SE', backWalls: ['south', 'east'] },
  SW: { label: 'SW', backWalls: ['south', 'west'] },
};

function getProjection(view, W, D) {
  switch (view) {
    case 'NW':
      return (rx, ry, rz) => toIso(rx, ry, rz);
    case 'NE':
      return (rx, ry, rz) => toIso(D - ry, rx, rz);
    case 'SE':
      return (rx, ry, rz) => toIso(W - rx, D - ry, rz);
    case 'SW':
      return (rx, ry, rz) => toIso(ry, W - rx, rz);
    default:
      return (rx, ry, rz) => toIso(rx, ry, rz);
  }
}

// ─── Polygon helper ────────────────────────────────────────────────
function polyPoints(pts) {
  return pts.map(p => `${p.sx},${p.sy}`).join(' ');
}

// ─── Wall geometry ─────────────────────────────────────────────────
function getWallCorners(wallName, W, D, CH) {
  switch (wallName) {
    case 'north':
      return [
        { x: 0, y: 0, z: 0 },
        { x: W, y: 0, z: 0 },
        { x: W, y: 0, z: CH },
        { x: 0, y: 0, z: CH },
      ];
    case 'south':
      return [
        { x: 0, y: D, z: 0 },
        { x: W, y: D, z: 0 },
        { x: W, y: D, z: CH },
        { x: 0, y: D, z: CH },
      ];
    case 'east':
      return [
        { x: W, y: 0, z: 0 },
        { x: W, y: D, z: 0 },
        { x: W, y: D, z: CH },
        { x: W, y: 0, z: CH },
      ];
    case 'west':
      return [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: D, z: 0 },
        { x: 0, y: D, z: CH },
        { x: 0, y: 0, z: CH },
      ];
    default:
      return [];
  }
}

// Wall label position: center of the wall at half height
function getWallLabelPos(wallName, W, D, CH) {
  switch (wallName) {
    case 'north': return { x: W / 2, y: 0, z: CH / 2 };
    case 'south': return { x: W / 2, y: D, z: CH / 2 };
    case 'east':  return { x: W, y: D / 2, z: CH / 2 };
    case 'west':  return { x: 0, y: D / 2, z: CH / 2 };
    default: return { x: 0, y: 0, z: 0 };
  }
}

// ─── Map a wall placement to 3D coordinates ────────────────────────
function wallPlacementTo3D(p, W, D) {
  const wallPos = (p.wallPos || 0); // feet along the wall
  const mountZ = (p.mountHeight || 48) / 12; // convert inches to feet
  switch (p.wall) {
    case 'north': return { x: wallPos, y: 0, z: mountZ };
    case 'south': return { x: wallPos, y: D, z: mountZ };
    case 'east':  return { x: W, y: wallPos, z: mountZ };
    case 'west':  return { x: 0, y: wallPos, z: mountZ };
    default: return { x: 0, y: 0, z: mountZ };
  }
}

// ─── Component ─────────────────────────────────────────────────────
export default function IsometricView({ room }) {
  const [view, setView] = useState('NW');

  const W = room.width;   // feet
  const D = room.height;  // feet (depth)
  const CH = room.ceilingHeight || 9;
  const placements = room.placements || [];
  const wires = room.wires || [];

  const project = useMemo(() => getProjection(view, W, D), [view, W, D]);

  // Compute projected floor corners to determine SVG viewBox
  const viewBox = useMemo(() => {
    // Project all 8 room corners (floor + ceiling) to find bounding box
    const corners = [];
    for (let x of [0, W]) {
      for (let y of [0, D]) {
        for (let z of [0, CH]) {
          corners.push(project(x, y, z));
        }
      }
    }
    const xs = corners.map(c => c.sx * ISO_SCALE);
    const ys = corners.map(c => c.sy * ISO_SCALE);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 60;
    return {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    };
  }, [project, W, D, CH]);

  // Project and scale a room-space point to SVG coords
  function p3d(rx, ry, rz) {
    const iso = project(rx, ry, rz);
    return { sx: iso.sx * ISO_SCALE, sy: iso.sy * ISO_SCALE };
  }

  // ── Floor polygon ──
  const floorPts = [p3d(0, 0, 0), p3d(W, 0, 0), p3d(W, D, 0), p3d(0, D, 0)];

  // ── Floor grid lines (every 2 feet) ──
  const gridLines = useMemo(() => {
    const lines = [];
    // Lines along width (x-axis)
    for (let x = 0; x <= W; x += 2) {
      lines.push({ a: p3d(x, 0, 0), b: p3d(x, D, 0) });
    }
    // Lines along depth (y-axis)
    for (let y = 0; y <= D; y += 2) {
      lines.push({ a: p3d(0, y, 0), b: p3d(W, y, 0) });
    }
    return lines;
  }, [project, W, D]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Walls ──
  const backWalls = VIEWS[view].backWalls;

  const wallPolygons = useMemo(() => {
    return backWalls.map(wallName => {
      const corners3d = getWallCorners(wallName, W, D, CH);
      const pts = corners3d.map(c => p3d(c.x, c.y, c.z));
      const labelPos3d = getWallLabelPos(wallName, W, D, CH);
      const labelPt = p3d(labelPos3d.x, labelPos3d.y, labelPos3d.z);
      return { wallName, pts, labelPt };
    });
  }, [project, W, D, CH, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Vertical edges (room frame) ──
  const verticalEdges = useMemo(() => {
    const edges = [];
    // All four vertical corner edges
    const floorCorners = [
      { x: 0, y: 0 },
      { x: W, y: 0 },
      { x: W, y: D },
      { x: 0, y: D },
    ];
    for (const c of floorCorners) {
      edges.push({
        a: p3d(c.x, c.y, 0),
        b: p3d(c.x, c.y, CH),
      });
    }
    return edges;
  }, [project, W, D, CH]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Top edges (ceiling outline) for back walls ──
  const ceilingEdges = useMemo(() => {
    return backWalls.map(wallName => {
      const corners3d = getWallCorners(wallName, W, D, CH);
      // Top edge is corners[2] -> corners[3] (the ceiling line)
      return {
        a: p3d(corners3d[2].x, corners3d[2].y, corners3d[2].z),
        b: p3d(corners3d[3].x, corners3d[3].y, corners3d[3].z),
      };
    });
  }, [project, W, D, CH, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Placement rendering ──
  function renderPlacement(p) {
    let pos;

    if (p.wall) {
      // Wall-mounted item
      const coords = wallPlacementTo3D(p, W, D);
      pos = p3d(coords.x, coords.y, coords.z);
    } else {
      // Floor item: cx, cy are in plan-view pixels (PLAN_SCALE = 40 px/ft)
      const rx = (p.cx || 0) / PLAN_SCALE;
      const ry = (p.cy || 0) / PLAN_SCALE;
      pos = p3d(rx, ry, 0);
    }

    const isElectrical = !!p.elecKey;
    const def = isElectrical ? ELEC[p.elecKey] : (p.fixtureKey ? FIXTURES[p.fixtureKey] : null);
    const color = def ? def.color : (p.color || '#888');
    const label = def ? (isElectrical ? def.abbr : def.name) : (p.name || '?');

    if (isElectrical) {
      // Electrical symbol: circle with abbreviation
      return (
        <g key={p.id} transform={`translate(${pos.sx}, ${pos.sy})`}>
          <circle r="10" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
          <text
            y="1"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize="7"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            {def.abbr}
          </text>
          <text
            y="18"
            textAnchor="middle"
            fill="#ccc"
            fontSize="11"
            fontFamily="Arial, sans-serif"
          >
            {p.name || def.name}
          </text>
        </g>
      );
    }

    // Fixture: render as a 3D isometric box
    if (p.fixtureKey && def) {
      const fw = (p.w || def.w) / 12; // inches to feet
      const fh = (p.h || def.h) / 12;
      const fixtureH = (FIXTURE_HEIGHTS[p.fixtureKey] || DEFAULT_FIXTURE_HEIGHT) / 12; // inches to feet
      const halfW = fw / 2;
      const halfH = fh / 2;
      const rx = (p.cx || 0) / PLAN_SCALE;
      const ry = (p.cy || 0) / PLAN_SCALE;
      const rot = (p.rotation || 0) * Math.PI / 180;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      const rotX = (dx, dy) => dx * cosR - dy * sinR;
      const rotY = (dx, dy) => dx * sinR + dy * cosR;

      const baseZ = (p.mountHeight || (def && def.defaultMountHeight) || 0) / 12;

      const b0 = p3d(rx + rotX(-halfW, -halfH), ry + rotY(-halfW, -halfH), baseZ);
      const b1 = p3d(rx + rotX( halfW, -halfH), ry + rotY( halfW, -halfH), baseZ);
      const b2 = p3d(rx + rotX( halfW,  halfH), ry + rotY( halfW,  halfH), baseZ);
      const b3 = p3d(rx + rotX(-halfW,  halfH), ry + rotY(-halfW,  halfH), baseZ);

      const t0 = p3d(rx + rotX(-halfW, -halfH), ry + rotY(-halfW, -halfH), baseZ + fixtureH);
      const t1 = p3d(rx + rotX( halfW, -halfH), ry + rotY( halfW, -halfH), baseZ + fixtureH);
      const t2 = p3d(rx + rotX( halfW,  halfH), ry + rotY( halfW,  halfH), baseZ + fixtureH);
      const t3 = p3d(rx + rotX(-halfW,  halfH), ry + rotY(-halfW,  halfH), baseZ + fixtureH);

      const topCenter = p3d(rx, ry, baseZ + fixtureH);
      const labelPos = p3d(rx, ry, baseZ);

      const strokeColor = color;

      return (
        <g key={p.id}>
          {/* Back side face (b0-b1-t1-t0) */}
          <polygon
            points={polyPoints([b0, b1, t1, t0])}
            fill={color}
            fillOpacity="0.2"
            stroke={strokeColor}
            strokeOpacity="0.8"
            strokeWidth="1"
          />
          {/* Left side face (b3-b0-t0-t3) */}
          <polygon
            points={polyPoints([b3, b0, t0, t3])}
            fill={color}
            fillOpacity="0.25"
            stroke={strokeColor}
            strokeOpacity="0.8"
            strokeWidth="1"
          />
          {/* Right side face (b1-b2-t2-t1) */}
          <polygon
            points={polyPoints([b1, b2, t2, t1])}
            fill={color}
            fillOpacity="0.35"
            stroke={strokeColor}
            strokeOpacity="0.8"
            strokeWidth="1"
          />
          {/* Front side face (b2-b3-t3-t2) */}
          <polygon
            points={polyPoints([b2, b3, t3, t2])}
            fill={color}
            fillOpacity="0.3"
            stroke={strokeColor}
            strokeOpacity="0.8"
            strokeWidth="1"
          />
          {/* Top face */}
          <polygon
            points={polyPoints([t0, t1, t2, t3])}
            fill={color}
            fillOpacity="0.5"
            stroke={strokeColor}
            strokeOpacity="0.8"
            strokeWidth="1"
          />
          {/* Icon on top face */}
          <text
            x={topCenter.sx}
            y={topCenter.sy + 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize="6"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            {def.icon || label.slice(0, 3)}
          </text>
          {/* Name label below box */}
          <text
            x={labelPos.sx}
            y={labelPos.sy + 10}
            textAnchor="middle"
            fill="#aaa"
            fontSize="11"
            fontFamily="Arial, sans-serif"
          >
            {def.name}
          </text>
        </g>
      );
    }

    // Generic fallback
    return (
      <g key={p.id} transform={`translate(${pos.sx}, ${pos.sy})`}>
        <rect x="-6" y="-6" width="12" height="12" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
        <text
          y="18"
          textAnchor="middle"
          fill="#aaa"
          fontSize="11"
          fontFamily="Arial, sans-serif"
        >
          {label}
        </text>
      </g>
    );
  }

  // ── Wire rendering ──
  function renderWire(wire) {
    if (!wire.points || wire.points.length < 2) return null;
    const pts = wire.points.map(pt => {
      const rx = pt.x / PLAN_SCALE;
      const ry = pt.y / PLAN_SCALE;
      return p3d(rx, ry, 0);
    });
    const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.sx},${pt.sy}`).join(' ');
    return (
      <path
        key={wire.id}
        d={d}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeDasharray="4,3"
        opacity="0.7"
      />
    );
  }

  // ── Circuit wire rendering ──
  function renderCircuitWires() {
    const circuits = room.circuits || [];
    if (!circuits.length) return null;
    return circuits.map(circuit =>
      circuit.segments.map((seg, si) => {
        const fromP = placements.find(p => p.id === seg.from);
        const toP = placements.find(p => p.id === seg.to);
        if (!fromP || !toP || fromP.cx === undefined || toP.cx === undefined) return null;
        const route = calculateRoute(fromP, toP);
        const pts = route.map(pt => p3d(pt.x / PLAN_SCALE, pt.y / PLAN_SCALE, 0));
        const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.sx},${pt.sy}`).join(' ');
        return (
          <path
            key={`cc-${circuit.id}-${si}`}
            d={d}
            fill="none"
            stroke={circuit.color}
            strokeWidth="2"
            strokeDasharray="6,3"
            opacity="0.8"
          />
        );
      })
    );
  }

  // ── Determine wall paint order (back walls drawn first) ──
  // Sort so the wall further from camera is drawn first
  const sortedWalls = useMemo(() => {
    // For correct overlap, we want the "leftmost" back wall first
    // This depends on view angle — just render in consistent order
    const order = { north: 0, west: 1, south: 2, east: 3 };
    return [...wallPolygons].sort((a, b) => order[a.wallName] - order[b.wallName]);
  }, [wallPolygons]);

  return (
    <div>
      {/* Room dimensions header */}
      <div style={{
        textAlign: 'center',
        padding: '8px 0 4px',
        color: '#94a3b8',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '0.5px',
      }}>
        {W}&apos; x {D}&apos; x {CH}&apos; ceiling
      </div>

      {/* SVG isometric canvas */}
      <div className="canvas-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          width="100%"
          style={{ maxWidth: '700px', maxHeight: '500px' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Floor grid */}
          <g opacity="0.15">
            {gridLines.map((line, i) => (
              <line
                key={`grid-${i}`}
                x1={line.a.sx}
                y1={line.a.sy}
                x2={line.b.sx}
                y2={line.b.sy}
                stroke="#C47A15"
                strokeWidth="0.5"
              />
            ))}
          </g>

          {/* Floor polygon */}
          <polygon
            points={polyPoints(floorPts)}
            fill="rgba(196, 122, 21, 0.08)"
            stroke="#C47A15"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />

          {/* Back walls */}
          {sortedWalls.map(({ wallName, pts, labelPt }) => (
            <g key={wallName}>
              <polygon
                points={polyPoints(pts)}
                fill="rgba(200, 200, 200, 0.08)"
                stroke="rgba(200, 200, 200, 0.35)"
                strokeWidth="1"
              />
              <text
                x={labelPt.sx}
                y={labelPt.sy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255, 255, 255, 0.6)"
                fontSize="12"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
                letterSpacing="1"
              >
                {WALL_LABELS[wallName] || wallName}
              </text>
            </g>
          ))}

          {/* Ceiling edges for back walls */}
          {ceilingEdges.map((edge, i) => (
            <line
              key={`ceil-${i}`}
              x1={edge.a.sx}
              y1={edge.a.sy}
              x2={edge.b.sx}
              y2={edge.b.sy}
              stroke="rgba(200, 200, 200, 0.25)"
              strokeWidth="1"
              strokeDasharray="6,4"
            />
          ))}

          {/* Vertical edges */}
          {verticalEdges.map((edge, i) => (
            <line
              key={`vert-${i}`}
              x1={edge.a.sx}
              y1={edge.a.sy}
              x2={edge.b.sx}
              y2={edge.b.sy}
              stroke="rgba(200, 200, 200, 0.2)"
              strokeWidth="0.8"
            />
          ))}

          {/* Wires */}
          {wires.map(w => renderWire(w))}

          {/* Circuit wires */}
          {renderCircuitWires()}

          {/* Placements */}
          {placements.map(p => renderPlacement(p))}

          {/* Dimension labels on floor edges */}
          {(() => {
            const midW = p3d(W / 2, 0, 0);
            const midD = p3d(0, D / 2, 0);
            return (
              <>
                <text
                  x={midW.sx}
                  y={midW.sy + 14}
                  textAnchor="middle"
                  fill="#C47A15"
                  fontSize="12"
                  fontFamily="Inter, sans-serif"
                  fontWeight="600"
                >
                  {W}&apos;
                </text>
                <text
                  x={midD.sx - 14}
                  y={midD.sy}
                  textAnchor="middle"
                  fill="#C47A15"
                  fontSize="12"
                  fontFamily="Inter, sans-serif"
                  fontWeight="600"
                >
                  {D}&apos;
                </text>
              </>
            );
          })()}

          {/* Ceiling height label on a back-wall vertical edge */}
          {(() => {
            // Pick the shared corner of the two back walls
            const sharedCorners = {
              NW: { x: 0, y: 0 },
              NE: { x: W, y: 0 },
              SE: { x: W, y: D },
              SW: { x: 0, y: D },
            };
            const corner = sharedCorners[view];
            const mid = p3d(corner.x, corner.y, CH / 2);
            return (
              <text
                x={mid.sx - 12}
                y={mid.sy}
                textAnchor="end"
                dominantBaseline="middle"
                fill="rgba(200, 200, 200, 0.5)"
                fontSize="7"
                fontFamily="Inter, sans-serif"
              >
                {CH}&apos;
              </text>
            );
          })()}
        </svg>
      </div>

      {/* Rotation buttons */}
      <div className="row" style={{ justifyContent: 'center', gap: '6px', padding: '8px 0' }}>
        {Object.keys(VIEWS).map(key => (
          <button
            key={key}
            className={view === key ? 'tab tab-active' : 'tab'}
            onClick={() => setView(key)}
            title={`View from ${key} corner`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
