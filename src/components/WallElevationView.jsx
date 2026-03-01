import React, { useState, useRef, useCallback } from 'react';
import { ELEC, FIXTURES, DEFAULT_MOUNT_HEIGHTS, HEIGHT_REFERENCES, uid, clamp } from '../constants';
import { SymIcon } from './ui';

const SCALE = 40; // pixels per foot
const PAD = 40;   // padding around canvas

export default function WallElevationView({ room, wall, onUpdate, flash, selectedElec, selectedFixture, mode }) {
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef(null);

  const ceilingHeight = room.ceilingHeight || 9; // feet
  const wallLengthFt = (wall === 'north' || wall === 'south') ? room.width : room.height;
  const ceilingHeightIn = ceilingHeight * 12;

  const W = wallLengthFt * SCALE;
  const H = ceilingHeight * SCALE;
  const svgW = W + PAD * 2;
  const svgH = H + PAD * 2;

  const placements = room.placements || [];
  const wallPlacements = placements.filter(p => p.wall === wall);

  // --- Coordinate helpers ---

  const getSvgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = svgW / rect.width;
    const scaleY = svgH / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [svgW, svgH]);

  // Convert inches-from-floor to SVG y (top of wall = 0 inches from ceiling, bottom = floor)
  const inchesToSvgY = (inchesFromFloor) => {
    return PAD + (ceilingHeightIn - inchesFromFloor) * SCALE / 12;
  };

  const svgYToInches = (svgY) => {
    return ceilingHeightIn - (svgY - PAD) * 12 / SCALE;
  };

  const feetToSvgX = (feet) => {
    return PAD + feet * SCALE;
  };

  const svgXToFeet = (svgX) => {
    return (svgX - PAD) / SCALE;
  };

  // Map wall placement position to top-view cx/cy
  const wallPosToTopView = (wallPosFt) => {
    switch (wall) {
      case 'north': return { cx: wallPosFt * SCALE, cy: 0 };
      case 'south': return { cx: wallPosFt * SCALE, cy: room.height * SCALE };
      case 'east':  return { cx: room.width * SCALE, cy: wallPosFt * SCALE };
      case 'west':  return { cx: 0, cy: wallPosFt * SCALE };
      default:      return { cx: wallPosFt * SCALE, cy: 0 };
    }
  };

  // --- Interactions ---

  const handleSvgClick = useCallback((e) => {
    const pt = getSvgPoint(e);
    const rx = pt.x - PAD;
    const ry = pt.y - PAD;

    // Ignore clicks outside the wall area
    if (rx < 0 || ry < 0 || rx > W || ry > H) return;

    const wallPosFt = clamp(rx / SCALE, 0, wallLengthFt);
    const mountHeightIn = clamp(svgYToInches(pt.y), 0, ceilingHeightIn);
    const topView = wallPosToTopView(wallPosFt);

    if (mode === 'electric' && selectedElec) {
      const def = ELEC[selectedElec];
      if (!def) return;
      const defaultHeight = DEFAULT_MOUNT_HEIGHTS[def.cat] || 48;
      const p = {
        id: uid(),
        elecKey: selectedElec,
        name: def.name,
        qty: 1,
        location: '',
        height: '',
        circuit: '',
        spec: '',
        notes: '',
        wall: wall,
        wallPos: Math.round(wallPosFt * 10) / 10,
        mountHeight: Math.round(mountHeightIn),
        cx: topView.cx,
        cy: topView.cy,
        rotation: 0,
      };
      onUpdate({ ...room, placements: [...placements, p] });
      flash(`Placed ${def.name} at ${Math.round(mountHeightIn)}"`);
      return;
    }

    if (mode === 'fixture' && selectedFixture) {
      const def = FIXTURES[selectedFixture];
      if (!def) return;
      const p = {
        id: uid(),
        fixtureKey: selectedFixture,
        name: def.name,
        qty: 1,
        location: '',
        height: '',
        circuit: '',
        spec: `${def.w}" x ${def.h}"`,
        notes: '',
        wall: wall,
        wallPos: Math.round(wallPosFt * 10) / 10,
        mountHeight: 0,
        w: def.w,
        h: def.h,
        color: def.color,
        icon: def.icon,
        cx: topView.cx,
        cy: topView.cy,
        rotation: 0,
      };
      onUpdate({ ...room, placements: [...placements, p] });
      flash(`Placed ${def.name} on ${wall} wall`);
      return;
    }
  }, [mode, selectedElec, selectedFixture, room, placements, wall, wallLengthFt, ceilingHeightIn, W, H, getSvgPoint, onUpdate, flash]);

  const handleMouseDown = useCallback((e, placementId) => {
    e.stopPropagation();
    setSelectedPlacement(placementId);
    const pt = getSvgPoint(e);
    const p = placements.find(pl => pl.id === placementId);
    if (!p) return;

    const itemSvgX = feetToSvgX(p.wallPos || 0);
    const itemSvgY = inchesToSvgY(p.mountHeight || 0);

    setDragging({
      id: placementId,
      offsetX: pt.x - itemSvgX,
      offsetY: pt.y - itemSvgY,
    });
  }, [placements, getSvgPoint, ceilingHeightIn]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const pt = getSvgPoint(e);
    const newSvgX = pt.x - dragging.offsetX;
    const newSvgY = pt.y - dragging.offsetY;

    const newWallPos = clamp(svgXToFeet(newSvgX), 0, wallLengthFt);
    const newMountHeight = clamp(svgYToInches(newSvgY), 0, ceilingHeightIn);
    const topView = wallPosToTopView(newWallPos);

    const updated = placements.map(p =>
      p.id === dragging.id
        ? {
            ...p,
            wallPos: Math.round(newWallPos * 10) / 10,
            mountHeight: Math.round(newMountHeight),
            cx: topView.cx,
            cy: topView.cy,
          }
        : p
    );
    onUpdate({ ...room, placements: updated });
  }, [dragging, placements, room, wallLengthFt, ceilingHeightIn, getSvgPoint, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const deletePlacement = () => {
    if (!selectedPlacement) return;
    const updated = placements.filter(p => p.id !== selectedPlacement);
    onUpdate({ ...room, placements: updated });
    setSelectedPlacement(null);
    flash('Item removed');
  };

  const selectedP = placements.find(p => p.id === selectedPlacement);

  return (
    <div className="container">
      {/* Selected placement controls */}
      {selectedP && (
        <div className="card" style={{ marginBottom: 8, padding: 8 }}>
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            {selectedP.elecKey && <SymIcon sym={selectedP.elecKey} size={20} />}
            <span className="placement-name">{selectedP.name}</span>
            <span className="meta">
              {selectedP.mountHeight !== undefined ? `${selectedP.mountHeight}" from floor` : ''}
            </span>
            <button className="btn-sm btn-delete" onClick={deletePlacement}>Delete</button>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="canvas-wrapper">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="floor-plan-svg"
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseDown={(e) => {
            setSelectedPlacement(null);
          }}
          onMouseLeave={handleMouseUp}
        >
          {/* Background */}
          <rect x="0" y="0" width={svgW} height={svgH} fill="#1a1a2e" />

          {/* Grid - light lines every foot */}
          {Array.from({ length: Math.floor(wallLengthFt) + 1 }).map((_, i) => (
            <line
              key={'gv' + i}
              x1={PAD + i * SCALE}
              y1={PAD}
              x2={PAD + i * SCALE}
              y2={PAD + H}
              stroke={i % 4 === 0 ? '#444' : '#2a2a3e'}
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
              stroke={i % 4 === 0 ? '#444' : '#2a2a3e'}
              strokeWidth={i % 4 === 0 ? 0.8 : 0.4}
            />
          ))}

          {/* Wall outline */}
          <rect x={PAD} y={PAD} width={W} height={H} fill="none" stroke="#667" strokeWidth="2" />

          {/* Floor line - thick at bottom */}
          <line
            x1={PAD}
            y1={PAD + H}
            x2={PAD + W}
            y2={PAD + H}
            stroke="#998877"
            strokeWidth="4"
          />

          {/* Reference height lines */}
          {HEIGHT_REFERENCES.map((ref) => {
            if (ref.y > ceilingHeightIn) return null;
            const y = inchesToSvgY(ref.y);
            return (
              <g key={ref.label}>
                <line
                  x1={PAD}
                  y1={y}
                  x2={PAD + W}
                  y2={y}
                  stroke={ref.color}
                  strokeWidth="0.8"
                  strokeDasharray="6 4"
                  opacity="0.5"
                />
                <text
                  x={PAD + W + 6}
                  y={y + 3}
                  fill={ref.color}
                  fontSize="8"
                  fontFamily="Arial, sans-serif"
                  opacity="0.8"
                >
                  {ref.label}
                </text>
              </g>
            );
          })}

          {/* Dimension labels */}
          {/* Wall length on top */}
          <text
            x={PAD + W / 2}
            y={PAD - 12}
            textAnchor="middle"
            fill="#999"
            fontSize="12"
            fontFamily="Arial"
          >
            {wallLengthFt}&apos;
          </text>

          {/* Ceiling height on left side (rotated) */}
          <text
            x={PAD - 16}
            y={PAD + H / 2}
            textAnchor="middle"
            fill="#999"
            fontSize="12"
            fontFamily="Arial"
            transform={`rotate(-90, ${PAD - 16}, ${PAD + H / 2})`}
          >
            {ceilingHeight}&apos;
          </text>

          {/* Placed electrical items on this wall */}
          {wallPlacements.filter(p => p.elecKey).map(p => {
            const def = ELEC[p.elecKey];
            if (!def) return null;
            const px = feetToSvgX(p.wallPos || 0);
            const py = inchesToSvgY(p.mountHeight || 0);
            const isSelected = p.id === selectedPlacement;
            return (
              <g
                key={p.id}
                transform={`translate(${px}, ${py})`}
                onMouseDown={(e) => handleMouseDown(e, p.id)}
                style={{ cursor: 'move' }}
              >
                {/* Selection highlight ring */}
                {isSelected && (
                  <circle
                    r="18"
                    fill="none"
                    stroke="#C47A15"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    opacity="0.8"
                  />
                )}
                <circle
                  r="14"
                  fill={isSelected ? 'rgba(34,211,238,0.2)' : 'rgba(0,0,0,0.6)'}
                  stroke={isSelected ? '#22d3ee' : def.color}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={def.color}
                  fontSize={def.abbr.length > 2 ? '7' : '9'}
                  fontWeight="bold"
                  fontFamily="Arial"
                  pointerEvents="none"
                >
                  {def.abbr}
                </text>
                {/* Height label below */}
                <text
                  textAnchor="middle"
                  y="22"
                  fill="#aaa"
                  fontSize="8"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {p.mountHeight}"
                </text>
              </g>
            );
          })}

          {/* Placed fixtures on this wall */}
          {wallPlacements.filter(p => p.fixtureKey).map(p => {
            const def = FIXTURES[p.fixtureKey];
            if (!def) return null;
            const fw = (p.w || def.w) * SCALE / 12; // width in SVG pixels
            const fh = (p.h || def.h) * SCALE / 12; // height in SVG pixels
            const fcolor = p.color || def.color || '#888';
            const px = feetToSvgX(p.wallPos || 0);
            // Fixture sits on the floor: bottom edge at floor line
            const floorY = PAD + H;
            const py = floorY - fh;
            const isSelected = p.id === selectedPlacement;
            return (
              <g
                key={p.id}
                onMouseDown={(e) => handleMouseDown(e, p.id)}
                style={{ cursor: 'move' }}
              >
                {/* Selection highlight */}
                {isSelected && (
                  <rect
                    x={px - fw / 2 - 3}
                    y={py - 3}
                    width={fw + 6}
                    height={fh + 6}
                    rx="4"
                    fill="none"
                    stroke="#C47A15"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}
                <rect
                  x={px - fw / 2}
                  y={py}
                  width={fw}
                  height={fh}
                  rx="3"
                  fill={fcolor + '40'}
                  stroke={isSelected ? '#C47A15' : fcolor}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                {/* Fixture icon */}
                <text
                  x={px}
                  y={py + fh / 2 - 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(fw * 0.4, 16)}
                  pointerEvents="none"
                >
                  {p.icon || def.icon || '\u25AA'}
                </text>
                {/* Fixture name */}
                <text
                  x={px}
                  y={py + fh / 2 + 7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#888"
                  fontSize={Math.max(Math.min(fw / (p.name || '').length * 1.1, 8), 5)}
                  fontWeight="600"
                  fontFamily="sans-serif"
                  pointerEvents="none"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Wall items list */}
      {wallPlacements.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 12 }}>
            <h3 className="section-title">
              Items on {wall.charAt(0).toUpperCase() + wall.slice(1)} Wall ({wallPlacements.length})
            </h3>
          </div>
          {wallPlacements.map(p => (
            <div key={p.id} className="placement-card">
              <div className="placement-header">
                <div className="placement-header-left">
                  {p.elecKey && <SymIcon sym={p.elecKey} size={20} />}
                  <span className="placement-name">{p.name}</span>
                  {p.mountHeight !== undefined && (
                    <span className="meta" style={{ marginLeft: 8 }}>
                      {p.mountHeight}" from floor
                    </span>
                  )}
                  {p.wallPos !== undefined && (
                    <span className="meta" style={{ marginLeft: 4 }}>
                      @ {p.wallPos}&apos; from left
                    </span>
                  )}
                </div>
                <button className="btn-delete btn-sm" onClick={() => {
                  const updated = placements.filter(pl => pl.id !== p.id);
                  onUpdate({ ...room, placements: updated });
                  if (selectedPlacement === p.id) setSelectedPlacement(null);
                  flash('Item removed');
                }}>&times;</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
