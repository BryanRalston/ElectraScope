import React, { useState, useRef, useCallback, useEffect, useMemo, Suspense } from 'react';
import { ELEC, FIXTURES, ECAT, FCAT, WALLS, WALL_LABELS, DEFAULT_CEILING_HEIGHT, uid, clamp } from '../constants';
import { SymIcon } from './ui';
import WallElevationView from './WallElevationView';
import IsometricView from './IsometricView';

const ModelView = React.lazy(() => import('./ModelView'));

const SCALE = 40; // pixels per foot
const PAD = 40;   // padding around room

const BASE_VIEW_TABS = [
  { key: 'top', label: 'Top View', icon: '\u{1F5FA}' },
  { key: 'north', label: 'North', icon: '\u2B06' },
  { key: 'south', label: 'South', icon: '\u2B07' },
  { key: 'east', label: 'East', icon: '\u27A1' },
  { key: 'west', label: 'West', icon: '\u2B05' },
  { key: '3d', label: '3D', icon: '\u{1F4CB}' },
];

export default function FloorPlanEditor({ room, onUpdate, flash }) {
  const [viewTab, setViewTab] = useState('top');
  const [mode, setMode] = useState('electric');

  const viewTabs = useMemo(() => {
    const tabs = [...BASE_VIEW_TABS];
    if (room.model) {
      tabs.push({ key: 'model', label: '3D Model', icon: '\u{1F3D7}' });
    }
    return tabs;
  }, [room.model]);
  const [eCat, setECat] = useState(ECAT[0]);
  const [fCat, setFCat] = useState(FCAT[0]);
  const [selectedElec, setSelectedElec] = useState(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [wireStart, setWireStart] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [currentPath, setCurrentPath] = useState([]);
  const [photoOpacity, setPhotoOpacity] = useState(0.3);
  const [showDims, setShowDims] = useState(false);
  const [dimForm, setDimForm] = useState({ width: room.width, height: room.height, ceilingHeight: room.ceilingHeight || DEFAULT_CEILING_HEIGHT });
  const svgRef = useRef(null);
  const didDragRef = useRef(false);

  const W = room.width * SCALE;
  const H = room.height * SCALE;
  const svgW = W + PAD * 2;
  const svgH = H + PAD * 2;

  const placements = room.placements || [];
  const wires = room.wires || [];
  const drawings = room.drawings || [];

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

  const handleSvgClick = useCallback((e) => {
    // Suppress placement if we just finished dragging
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    const pt = getSvgPoint(e);
    const rx = pt.x - PAD;
    const ry = pt.y - PAD;

    if (rx < 0 || ry < 0 || rx > W || ry > H) return;

    if (mode === 'electric' && selectedElec) {
      const def = ELEC[selectedElec];
      if (!def) return;
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
        cx: rx,
        cy: ry,
        rotation: 0,
      };
      onUpdate({ ...room, placements: [...placements, p] });
      flash(`Placed ${def.name}`);
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
        cx: rx,
        cy: ry,
        w: def.w,
        h: def.h,
        color: def.color,
        icon: def.icon,
        rotation: 0,
      };
      onUpdate({ ...room, placements: [...placements, p] });
      flash(`Placed ${def.name}`);
      return;
    }

    if (mode === 'wire') {
      if (!wireStart) {
        setWireStart({ x: rx, y: ry });
        return;
      }
      const x1 = wireStart.x, y1 = wireStart.y;
      const x2 = rx, y2 = ry;
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      let points;
      if (dx < 5) {
        points = [{ x: x1, y: y1 }, { x: x1, y: y2 }];
      } else if (dy < 5) {
        points = [{ x: x1, y: y1 }, { x: x2, y: y1 }];
      } else {
        points = [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }];
      }
      const wire = { id: uid(), points };
      onUpdate({ ...room, wires: [...wires, wire] });
      setWireStart(null);
      flash('Wire placed');
      return;
    }
  }, [mode, selectedElec, selectedFixture, wireStart, room, placements, wires, W, H, getSvgPoint, onUpdate, flash]);

  const handleMouseDown = useCallback((e, placementId) => {
    // In wire mode, don't start dragging — let click bubble for wire placement
    if (mode === 'wire') return;
    e.stopPropagation();
    setSelectedPlacement(placementId);
    const pt = getSvgPoint(e);
    const p = placements.find(pl => pl.id === placementId);
    if (!p) return;
    setDragging({
      id: placementId,
      offsetX: pt.x - PAD - (p.cx || 0),
      offsetY: pt.y - PAD - (p.cy || 0),
    });
  }, [placements, getSvgPoint, mode]);

  const handleMouseMove = useCallback((e) => {
    if (mode === 'draw' && drawing) {
      const pt = getSvgPoint(e);
      setCurrentPath(prev => [...prev, { x: pt.x - PAD, y: pt.y - PAD }]);
      return;
    }

    if (!dragging) return;
    didDragRef.current = true;
    const pt = getSvgPoint(e);
    const nx = clamp(pt.x - PAD - dragging.offsetX, 0, W);
    const ny = clamp(pt.y - PAD - dragging.offsetY, 0, H);
    const updated = placements.map(p =>
      p.id === dragging.id ? { ...p, cx: nx, cy: ny } : p
    );
    onUpdate({ ...room, placements: updated });
  }, [dragging, drawing, mode, placements, room, W, H, getSvgPoint, onUpdate]);

  const handleMouseUp = useCallback(() => {
    if (mode === 'draw' && drawing && currentPath.length > 1) {
      const d = { id: uid(), points: currentPath, color: drawColor };
      onUpdate({ ...room, drawings: [...drawings, d] });
      setCurrentPath([]);
      setDrawing(false);
      return;
    }
    if (dragging) {
      didDragRef.current = true;
    }
    setDragging(null);
  }, [mode, drawing, currentPath, drawColor, room, drawings, onUpdate, dragging]);

  const handleDrawStart = useCallback((e) => {
    if (mode !== 'draw') return;
    const pt = getSvgPoint(e);
    setDrawing(true);
    setCurrentPath([{ x: pt.x - PAD, y: pt.y - PAD }]);
  }, [mode, getSvgPoint]);

  const rotatePlacement = () => {
    if (!selectedPlacement) return;
    const updated = placements.map(p =>
      p.id === selectedPlacement ? { ...p, rotation: ((p.rotation || 0) + 45) % 360 } : p
    );
    onUpdate({ ...room, placements: updated });
  };

  const resizePlacement = (delta) => {
    if (!selectedPlacement) return;
    const updated = placements.map(p => {
      if (p.id !== selectedPlacement || !p.fixtureKey) return p;
      const ratio = p.h / p.w;
      const nw = clamp((p.w || 30) + delta, 6, 120);
      return { ...p, w: nw, h: Math.round(nw * ratio) };
    });
    onUpdate({ ...room, placements: updated });
  };

  const deletePlacement = () => {
    if (!selectedPlacement) return;
    const updated = placements.filter(p => p.id !== selectedPlacement);
    onUpdate({ ...room, placements: updated });
    setSelectedPlacement(null);
    flash('Item removed');
  };

  const deleteWire = (id) => {
    onUpdate({ ...room, wires: wires.filter(w => w.id !== id) });
    flash('Wire removed');
  };

  const deleteDrawing = (id) => {
    onUpdate({ ...room, drawings: drawings.filter(d => d.id !== id) });
    flash('Drawing removed');
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({ ...room, photo: ev.target.result });
      flash('Photo added');
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    onUpdate({ ...room, photo: null });
    flash('Photo removed');
  };

  const saveDims = () => {
    const w = clamp(Number(dimForm.width) || room.width, 4, 100);
    const h = clamp(Number(dimForm.height) || room.height, 4, 100);
    const ch = clamp(Number(dimForm.ceilingHeight) || room.ceilingHeight || 9, 7, 20);
    onUpdate({ ...room, width: w, height: h, ceilingHeight: ch });
    setShowDims(false);
    flash('Dimensions updated');
  };

  const pathToD = (points) => {
    if (!points || points.length < 2) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x + PAD},${p.y + PAD}`).join(' ');
  };

  const elecKeys = Object.entries(ELEC).filter(([, v]) => v.cat === eCat);
  const fixKeys = Object.entries(FIXTURES).filter(([, v]) => v.cat === fCat);

  const selectedP = placements.find(p => p.id === selectedPlacement);

  return (
    <div className="container">
      {/* View tabs */}
      <div className="view-tabs">
        {viewTabs.map(vt => (
          <button
            key={vt.key}
            className={viewTab === vt.key ? 'view-tab view-tab-active' : 'view-tab'}
            onClick={() => setViewTab(vt.key)}
            title={vt.label}
          >
            <span className="view-tab-icon">{vt.icon}</span>
            <span className="view-tab-label">{vt.label}</span>
          </button>
        ))}
      </div>

      {/* Wall elevation views */}
      {WALLS.includes(viewTab) && (
        <WallElevationView
          room={room}
          wall={viewTab}
          onUpdate={onUpdate}
          flash={flash}
          selectedElec={selectedElec}
          selectedFixture={selectedFixture}
          mode={mode}
        />
      )}

      {/* 3D isometric view */}
      {viewTab === '3d' && (
        <IsometricView room={room} />
      )}

      {/* 3D Model view (lazy loaded) */}
      {viewTab === 'model' && room.model && (
        <Suspense fallback={<div className="meta" style={{ textAlign: 'center', padding: 60 }}>Loading 3D viewer...</div>}>
          <ModelView
            room={room}
            onUpdate={onUpdate}
            flash={flash}
            selectedElec={selectedElec}
            selectedFixture={selectedFixture}
            mode={mode}
            onClearSelection={() => { setSelectedElec(null); setSelectedFixture(null); }}
          />
        </Suspense>
      )}

      {/* Mode toolbar — shown for top, wall, and model views (not isometric 3D) */}
      {viewTab !== '3d' && (
        <div className="toolbar">
          {['fixture', 'electric', 'wire', 'draw'].map(m => (
            <button
              key={m}
              className={mode === m ? 'tool-btn tool-active' : 'tool-btn'}
              onClick={() => { setMode(m); setWireStart(null); setDrawing(false); setCurrentPath([]); }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Symbol/fixture picker — shown for top and wall views */}
      {mode === 'electric' && (
        <>
          <div className="tabs" style={{ marginTop: 8 }}>
            {ECAT.map(c => (
              <button key={c} className={eCat === c ? 'tab tab-active' : 'tab'} onClick={() => setECat(c)}>{c}</button>
            ))}
          </div>
          <div className="symbol-grid">
            {elecKeys.map(([key, def]) => (
              <button
                key={key}
                className={selectedElec === key ? 'symbol-btn symbol-btn-selected' : 'symbol-btn'}
                onClick={() => setSelectedElec(selectedElec === key ? null : key)}
                title={def.name}
              >
                <SymIcon sym={key} size={28} />
                <span className="symbol-label">{def.shortName || def.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'fixture' && (
        <>
          <div className="tabs" style={{ marginTop: 8, flexWrap: 'wrap' }}>
            {FCAT.map(c => (
              <button key={c} className={fCat === c ? 'tab tab-active' : 'tab'} onClick={() => setFCat(c)}>{c}</button>
            ))}
          </div>
          <div className="fixture-grid">
            {fixKeys.map(([key, def]) => (
              <button
                key={key}
                className={selectedFixture === key ? 'fixture-btn fixture-btn-selected' : 'fixture-btn'}
                onClick={() => setSelectedFixture(selectedFixture === key ? null : key)}
              >
                <span style={{ fontSize: 20 }}>{def.icon}</span>
                <div className="fixture-btn-name">{def.name}</div>
                <div className="meta">{def.w}" x {def.h}"</div>
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'draw' && (
        <div className="row" style={{ marginTop: 8, alignItems: 'center', gap: 8 }}>
          <label className="dim-label">Color:</label>
          <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} />
          <span className="meta">Click and drag to draw</span>
        </div>
      )}

      {mode === 'wire' && wireStart && (
        <div className="meta" style={{ marginTop: 8 }}>
          Click second point to complete wire. Wire auto-straightens to horizontal, vertical, or L-shape.
        </div>
      )}

      {/* ═══ TOP VIEW CONTENT ═══ */}
      {viewTab === 'top' && <>

      {/* Selected placement controls */}
      {selectedP && (
        <div className="card" style={{ marginTop: 8, padding: 8 }}>
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            <span className="placement-name">{selectedP.name}</span>
            <button className="btn-sm btn-outline" onClick={rotatePlacement}>Rotate 45&deg;</button>
            {selectedP.fixtureKey && (
              <>
                <button className="btn-sm btn-outline" onClick={() => resizePlacement(4)}>+</button>
                <button className="btn-sm btn-outline" onClick={() => resizePlacement(-4)}>-</button>
              </>
            )}
            <button className="btn-sm btn-delete" onClick={deletePlacement}>Delete</button>
          </div>
        </div>
      )}

      {/* Photo controls */}
      <div className="row" style={{ marginTop: 8, gap: 8, alignItems: 'center' }}>
        <label className="btn-outline btn-sm" style={{ cursor: 'pointer' }}>
          {room.photo ? 'Change Photo' : 'Add Photo'}
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </label>
        {room.photo && (
          <>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={photoOpacity}
              onChange={e => setPhotoOpacity(Number(e.target.value))}
              style={{ width: 80 }}
            />
            <span className="meta">{Math.round(photoOpacity * 100)}%</span>
            <button className="btn-sm btn-delete" onClick={removePhoto}>Remove</button>
          </>
        )}
        <button className="btn-sm btn-outline" onClick={() => { setShowDims(!showDims); setDimForm({ width: room.width, height: room.height, ceilingHeight: room.ceilingHeight || 9 }); }}>
          Dimensions
        </button>
      </div>

      {showDims && (
        <div className="card" style={{ marginTop: 8, padding: 8 }}>
          <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="dim-label">W</label>
            <input className="dim-input" type="number" min="4" max="100" value={dimForm.width} onChange={e => setDimForm({ ...dimForm, width: e.target.value })} />
            <span className="dim-unit">ft</span>
            <label className="dim-label">D</label>
            <input className="dim-input" type="number" min="4" max="100" value={dimForm.height} onChange={e => setDimForm({ ...dimForm, height: e.target.value })} />
            <span className="dim-unit">ft</span>
            <label className="dim-label">Ceil</label>
            <input className="dim-input" type="number" min="7" max="20" value={dimForm.ceilingHeight} onChange={e => setDimForm({ ...dimForm, ceilingHeight: e.target.value })} />
            <span className="dim-unit">ft</span>
            <button className="btn-sm btn-primary" onClick={saveDims}>Apply</button>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="canvas-wrapper" style={{ marginTop: 12 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="floor-plan-svg"
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseDown={(e) => {
            if (mode === 'draw') handleDrawStart(e);
            else if (mode !== 'wire') setSelectedPlacement(null);
          }}
          onMouseLeave={handleMouseUp}
        >
          {/* Background */}
          <rect x="0" y="0" width={svgW} height={svgH} fill="#1a1a2e" />

          {/* Photo overlay */}
          {room.photo && (
            <image
              href={room.photo}
              x={PAD}
              y={PAD}
              width={W}
              height={H}
              opacity={photoOpacity}
              preserveAspectRatio="xMidYMid slice"
            />
          )}

          {/* Grid */}
          {Array.from({ length: room.width + 1 }).map((_, i) => (
            <line key={'gv' + i} x1={PAD + i * SCALE} y1={PAD} x2={PAD + i * SCALE} y2={PAD + H} stroke="#333" strokeWidth="0.5" />
          ))}
          {Array.from({ length: room.height + 1 }).map((_, i) => (
            <line key={'gh' + i} x1={PAD} y1={PAD + i * SCALE} x2={PAD + W} y2={PAD + i * SCALE} stroke="#333" strokeWidth="0.5" />
          ))}

          {/* Room outline */}
          <rect x={PAD} y={PAD} width={W} height={H} fill="none" stroke="#667" strokeWidth="2" />

          {/* Dimension labels */}
          <text x={PAD + W / 2} y={PAD - 10} textAnchor="middle" fill="#999" fontSize="12" fontFamily="Arial">
            {room.width}&apos;
          </text>
          <text x={PAD - 14} y={PAD + H / 2} textAnchor="middle" fill="#999" fontSize="12" fontFamily="Arial" transform={`rotate(-90, ${PAD - 14}, ${PAD + H / 2})`}>
            {room.height}&apos;
          </text>

          {/* Freehand drawings */}
          {drawings.map(d => (
            <g key={d.id} onClick={(e) => { e.stopPropagation(); if (mode === 'draw') deleteDrawing(d.id); }}>
              <path
                d={pathToD(d.points)}
                fill="none"
                stroke={d.color || '#fff'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Current drawing path */}
          {drawing && currentPath.length > 1 && (
            <path
              d={pathToD(currentPath)}
              fill="none"
              stroke={drawColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          )}

          {/* Wires */}
          {wires.map(w => (
            <g key={w.id} onClick={(e) => { e.stopPropagation(); if (mode === 'wire') deleteWire(w.id); }}>
              <path
                d={pathToD(w.points)}
                fill="none"
                stroke="#4af"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {w.points.map((p, i) => (
                <circle key={i} cx={p.x + PAD} cy={p.y + PAD} r="3" fill="#4af" />
              ))}
            </g>
          ))}

          {/* Wire start indicator */}
          {wireStart && (
            <circle cx={wireStart.x + PAD} cy={wireStart.y + PAD} r="5" fill="none" stroke="#4af" strokeWidth="2" />
          )}

          {/* Placed items */}
          {placements.filter(p => p.cx !== undefined).map(p => {
            const isSelected = p.id === selectedPlacement;
            if (p.elecKey) {
              const def = ELEC[p.elecKey];
              if (!def) return null;
              return (
                <g
                  key={p.id}
                  transform={`translate(${p.cx + PAD}, ${p.cy + PAD}) rotate(${p.rotation || 0})`}
                  onMouseDown={(e) => handleMouseDown(e, p.id)}
                  style={{ cursor: 'move' }}
                >
                  <circle r="14" fill={isSelected ? 'rgba(34,211,238,0.2)' : 'rgba(0,0,0,0.6)'} stroke={isSelected ? '#22d3ee' : def.color} strokeWidth={isSelected ? 2 : 1.5} />
                  <text textAnchor="middle" dominantBaseline="middle" fill={def.color} fontSize={def.abbr.length > 2 ? '7' : '9'} fontWeight="bold" fontFamily="Arial">{def.abbr}</text>
                </g>
              );
            }
            if (p.fixtureKey) {
              const fw = (p.w || 30) * SCALE / 12;
              const fh = (p.h || 30) * SCALE / 12;
              const fcolor = p.color || '#888';
              return (
                <g
                  key={p.id}
                  transform={`translate(${p.cx + PAD}, ${p.cy + PAD}) rotate(${p.rotation || 0})`}
                  onMouseDown={(e) => handleMouseDown(e, p.id)}
                  style={{ cursor: 'move' }}
                >
                  <rect
                    x={-fw / 2}
                    y={-fh / 2}
                    width={fw}
                    height={fh}
                    rx="3"
                    fill={fcolor + '40'}
                    stroke={isSelected ? '#C47A15' : fcolor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isSelected ? '6 3' : 'none'}
                  />
                  <text textAnchor="middle" y={-2} dominantBaseline="middle" fontSize={Math.min(fw * 0.45, 15)} pointerEvents="none">{p.icon || '\u25AA'}</text>
                  <text textAnchor="middle" y={fh > 20 ? 11 : 8} dominantBaseline="middle" fill="#666" fontSize={Math.max(Math.min(fw / (p.name || '').length * 1.1, 9), 5)} fontWeight="600" fontFamily="sans-serif" pointerEvents="none">{p.name}</text>
                  {isSelected && <text textAnchor="middle" y={fh / 2 + 11} fill="#999" fontSize="7" fontFamily="monospace">{p.w}" x {p.h}"</text>}
                </g>
              );
            }
            return null;
          })}
        </svg>
      </div>

      {/* Placed items list */}
      <div className="section-header" style={{ marginTop: 16 }}>
        <h3 className="section-title">Items on Plan ({placements.filter(p => p.cx !== undefined).length})</h3>
      </div>
      {placements.filter(p => p.cx !== undefined).map(p => (
        <div key={p.id} className="placement-card">
          <div className="placement-header">
            <div className="placement-header-left">
              {p.elecKey && <SymIcon sym={p.elecKey} size={20} />}
              <span className="placement-name">{p.name}</span>
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

      </>}
      {/* ═══ END TOP VIEW CONTENT ═══ */}
    </div>
  );
}
