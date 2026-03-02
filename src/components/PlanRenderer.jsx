import React from 'react';
import { ELEC, FIXTURES, HEIGHT_REFERENCES, DEFAULT_MOUNT_HEIGHTS, DEFAULT_CEILING_HEIGHT, clamp } from '../constants';
import { calculateRoute, getDevicesOnCircuit } from '../circuitUtils';

const SCALE = 40; // px per foot
const PAD = 40;

// ─── Floor Plan Renderer ────────────────────────────────────────────

export function RenderFloorPlan({ room, printMode = false }) {
  const W = room.width * SCALE;
  const H = room.height * SCALE;
  const placements = room.placements || [];

  // Color scheme
  const bg = printMode ? '#ffffff' : '#1a1a2e';
  const gridMinor = printMode ? '#e0e0e0' : '#333';
  const gridMajor = printMode ? '#bbb' : '#444';
  const outlineStroke = printMode ? '#333' : '#667';
  const dimFill = printMode ? '#333' : '#999';
  const elecCircleFill = printMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)';
  const fixtureFillSuffix = printMode ? '30' : '40';
  const fixtureTextFill = printMode ? '#444' : '#666';

  return (
    <svg
      viewBox={`0 0 ${W + PAD * 2} ${H + PAD * 2}`}
      width="100%"
      style={{ maxWidth: W + PAD * 2 }}
    >
      {/* Background */}
      <rect x="0" y="0" width={W + PAD * 2} height={H + PAD * 2} fill={bg} />

      {/* Grid lines */}
      {Array.from({ length: room.width + 1 }).map((_, i) => (
        <line
          key={'gv' + i}
          x1={PAD + i * SCALE}
          y1={PAD}
          x2={PAD + i * SCALE}
          y2={PAD + H}
          stroke={i % 4 === 0 ? gridMajor : gridMinor}
          strokeWidth={i % 4 === 0 ? 0.8 : 0.5}
        />
      ))}
      {Array.from({ length: room.height + 1 }).map((_, i) => (
        <line
          key={'gh' + i}
          x1={PAD}
          y1={PAD + i * SCALE}
          x2={PAD + W}
          y2={PAD + i * SCALE}
          stroke={i % 4 === 0 ? gridMajor : gridMinor}
          strokeWidth={i % 4 === 0 ? 0.8 : 0.5}
        />
      ))}

      {/* Room outline */}
      <rect x={PAD} y={PAD} width={W} height={H} fill="none" stroke={outlineStroke} strokeWidth="2" />

      {/* Dimension labels */}
      <text
        x={PAD + W / 2}
        y={PAD - 10}
        textAnchor="middle"
        fill={dimFill}
        fontSize="12"
        fontFamily="Arial"
      >
        {room.width}&apos;
      </text>
      <text
        x={PAD - 14}
        y={PAD + H / 2}
        textAnchor="middle"
        fill={dimFill}
        fontSize="12"
        fontFamily="Arial"
        transform={`rotate(-90, ${PAD - 14}, ${PAD + H / 2})`}
      >
        {room.height}&apos;
      </text>

      {/* Circuit wires */}
      {(room.circuits || []).map(circuit =>
        circuit.segments.map((seg, si) => {
          const fromP = placements.find(p => p.id === seg.from);
          const toP = placements.find(p => p.id === seg.to);
          if (!fromP || !toP || fromP.cx === undefined || toP.cx === undefined) return null;
          const route = calculateRoute(fromP, toP);
          const d = route.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x + PAD},${pt.y + PAD}`).join(' ');
          const mid = route[Math.floor(route.length / 2)];
          return (
            <g key={`cw-${circuit.id}-${si}`}>
              <path
                d={d}
                fill="none"
                stroke={circuit.color}
                strokeWidth="2"
                strokeDasharray="6 3"
                strokeLinecap="round"
                opacity="0.85"
              />
              <text
                x={mid.x + PAD}
                y={mid.y + PAD - 6}
                textAnchor="middle"
                fill={circuit.color}
                fontSize="8"
                fontWeight="bold"
                fontFamily="Arial"
              >
                #{circuit.number}
              </text>
            </g>
          );
        })
      )}

      {/* Placed fixtures */}
      {placements.filter(p => p.fixtureKey && p.cx !== undefined).map(p => {
        const fw = (p.w || 30) * SCALE / 12;
        const fh = (p.h || 30) * SCALE / 12;
        const fcolor = p.color || '#888';
        return (
          <g
            key={p.id}
            transform={`translate(${p.cx + PAD}, ${p.cy + PAD}) rotate(${p.rotation || 0})`}
          >
            <rect
              x={-fw / 2}
              y={-fh / 2}
              width={fw}
              height={fh}
              rx="3"
              fill={fcolor + fixtureFillSuffix}
              stroke={fcolor}
              strokeWidth="1.5"
            />
            <text
              textAnchor="middle"
              y={-2}
              dominantBaseline="middle"
              fontSize={Math.min(fw * 0.45, 15)}
            >
              {p.icon || '\u25AA'}
            </text>
            <text
              textAnchor="middle"
              y={fh > 20 ? 11 : 8}
              dominantBaseline="middle"
              fill={fixtureTextFill}
              fontSize={Math.max(Math.min(fw / (p.name || '').length * 1.1, 9), 5)}
              fontWeight="600"
              fontFamily="sans-serif"
            >
              {p.name}
            </text>
          </g>
        );
      })}

      {/* Placed electrical */}
      {placements.filter(p => p.elecKey && p.cx !== undefined).map(p => {
        const def = ELEC[p.elecKey];
        if (!def) return null;
        return (
          <g
            key={p.id}
            transform={`translate(${p.cx + PAD}, ${p.cy + PAD}) rotate(${p.rotation || 0})`}
          >
            <circle
              r="14"
              fill={elecCircleFill}
              stroke={def.color}
              strokeWidth="1.5"
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill={def.color}
              fontSize={def.abbr.length > 2 ? '7' : '9'}
              fontWeight="bold"
              fontFamily="Arial"
            >
              {def.abbr}
            </text>
            {def.amps && (
              <text
                textAnchor="middle"
                y="22"
                fill={def.color}
                fontSize="7"
                fontWeight="bold"
                fontFamily="Arial"
                opacity="0.8"
              >
                {def.amps}A
              </text>
            )}
          </g>
        );
      })}
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

  // Coordinate helpers
  const inchesToY = (inches) => PAD + (ceilingHeightIn - inches) * SCALE / 12;
  const feetToX = (feet) => PAD + feet * SCALE;

  // Color scheme
  const bg = printMode ? '#ffffff' : '#1a1a2e';
  const gridMinor = printMode ? '#e0e0e0' : '#2a2a3e';
  const gridMajor = printMode ? '#bbb' : '#444';
  const outlineStroke = printMode ? '#333' : '#667';
  const dimFill = printMode ? '#333' : '#999';
  const floorColor = printMode ? '#665544' : '#998877';
  const elecCircleFill = printMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)';
  const heightLabelFill = printMode ? '#666' : '#aaa';
  const fixtureFillSuffix = printMode ? '30' : '40';
  const fixtureTextFill = printMode ? '#555' : '#888';
  const refLabelOpacity = printMode ? 0.7 : 0.9;
  const refLineOpacity = printMode ? 0.35 : 0.5;

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
      <rect x="0" y="0" width={W + PAD * 2 + LABEL_PAD} height={H + PAD * 2} fill={bg} />

      {/* Grid lines */}
      {Array.from({ length: Math.floor(wallLengthFt) + 1 }).map((_, i) => (
        <line
          key={'gv' + i}
          x1={PAD + i * SCALE}
          y1={PAD}
          x2={PAD + i * SCALE}
          y2={PAD + H}
          stroke={i % 4 === 0 ? gridMajor : gridMinor}
          strokeWidth={i % 4 === 0 ? 0.8 : 0.4}
        />
      ))}
      {Array.from({ length: Math.floor(ceilingHeight) + 1 }).map((_, i) => (
        <line
          key={'gh' + i}
          x1={PAD}
          y1={PAD + i * SCALE}
          x2={PAD + W}
          y2={PAD + i * SCALE}
          stroke={i % 4 === 0 ? gridMajor : gridMinor}
          strokeWidth={i % 4 === 0 ? 0.8 : 0.4}
        />
      ))}

      {/* Wall outline */}
      <rect x={PAD} y={PAD} width={W} height={H} fill="none" stroke={outlineStroke} strokeWidth="2" />

      {/* Floor line */}
      <line
        x1={PAD}
        y1={PAD + H}
        x2={PAD + W}
        y2={PAD + H}
        stroke={floorColor}
        strokeWidth="4"
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
              stroke={printMode ? '#999' : ref.color}
              strokeWidth="0.8"
              strokeDasharray="6 4"
              opacity={refLineOpacity}
            />
            <text
              x={PAD + W + 6}
              y={y + 3}
              fill={printMode ? '#777' : ref.color}
              fontSize="11"
              fontFamily="Arial, sans-serif"
              opacity={refLabelOpacity}
            >
              {ref.label}
            </text>
          </g>
        );
      })}

      {/* Dimension labels */}
      <text
        x={PAD + W / 2}
        y={PAD - 12}
        textAnchor="middle"
        fill={dimFill}
        fontSize="12"
        fontFamily="Arial"
      >
        {wallLengthFt}&apos;
      </text>
      <text
        x={PAD - 16}
        y={PAD + H / 2}
        textAnchor="middle"
        fill={dimFill}
        fontSize="12"
        fontFamily="Arial"
        transform={`rotate(-90, ${PAD - 16}, ${PAD + H / 2})`}
      >
        {ceilingHeight}&apos;
      </text>

      {/* Electrical devices */}
      {wallPlacements.filter(p => p.elecKey).map(p => {
        const def = ELEC[p.elecKey];
        if (!def) return null;
        const px = feetToX(clamp(p.wallPos || 0, 0, wallLengthFt));
        const py = inchesToY(clamp(p.mountHeight || 0, 0, ceilingHeightIn));
        return (
          <g key={p.id} transform={`translate(${px}, ${py})`}>
            <circle
              r="14"
              fill={elecCircleFill}
              stroke={def.color}
              strokeWidth="1.5"
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill={def.color}
              fontSize={def.abbr.length > 2 ? '7' : '9'}
              fontWeight="bold"
              fontFamily="Arial"
            >
              {def.abbr}
            </text>
            <text
              textAnchor="middle"
              y="22"
              fill={heightLabelFill}
              fontSize="10"
              fontFamily="monospace"
            >
              {p.mountHeight}&quot;
            </text>
          </g>
        );
      })}

      {/* Fixtures */}
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
        return (
          <g key={p.id}>
            <rect
              x={clampedPx - fw / 2}
              y={py}
              width={fw}
              height={fh}
              rx="3"
              fill={fcolor + fixtureFillSuffix}
              stroke={fcolor}
              strokeWidth="1.5"
            />
            <text
              x={clampedPx}
              y={py + fh / 2 - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(fw * 0.4, 16)}
            >
              {p.icon || def.icon || '\u25AA'}
            </text>
            <text
              x={clampedPx}
              y={py + fh / 2 + 7}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={fixtureTextFill}
              fontSize={Math.max(Math.min(fw / (p.name || '').length * 1.2, 11), 7)}
              fontWeight="600"
              fontFamily="sans-serif"
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
      {circuits.map(c => (
        <div key={c.id} className="print-legend-item">
          <div className="print-legend-swatch" style={{ background: c.color }} />
          <span>
            #{c.number} {c.label || ''} ({c.amperage}A, #{c.wireGauge} AWG
            {c.gfci ? ', GFCI' : ''}
            {c.afci ? ', AFCI' : ''})
          </span>
        </div>
      ))}
    </div>
  );
}
