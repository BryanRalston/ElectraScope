import React, { useState, useRef, useCallback, useEffect, useMemo, Suspense } from 'react';
import { ELEC, FIXTURES, ECAT, FCAT, WALLS, WALL_LABELS, DEFAULT_CEILING_HEIGHT, uid, clamp, SNAP_RADIUS, autoLabel } from '../constants';
import { findNearestDevice, calculateRoute, createCircuit, addSegmentToCircuit, getDevicesOnCircuit, findCircuitEndpoint, removeDeviceFromCircuits, syncPlacementCircuitFields, getCircuitForPlacement } from '../circuitUtils';
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
  const [circuitChain, setCircuitChain] = useState(null); // { circuitId, lastPlacementId }
  const [mousePos, setMousePos] = useState(null);
  const [hoveredDevice, setHoveredDevice] = useState(null);
  const [expandedCircuitId, setExpandedCircuitId] = useState(null);
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
        name: autoLabel(def.name, placements, false),
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
        name: autoLabel(def.name, placements, true),
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

    if (mode === 'circuit') {
      const nearest = findNearestDevice(placements, rx, ry, SNAP_RADIUS);
      if (!nearest) return;

      if (!circuitChain) {
        // Check if clicking an endpoint of existing circuit
        const existing = findCircuitEndpoint(room.circuits || [], nearest.id);
        if (existing) {
          setCircuitChain({ circuitId: existing.id, lastPlacementId: nearest.id });
          flash('Extending circuit #' + existing.number);
          return;
        }
        // Start new circuit
        const newCircuit = createCircuit(room.circuits || []);
        setCircuitChain({ circuitId: newCircuit.id, lastPlacementId: nearest.id });
        onUpdate({ ...room, circuits: [...(room.circuits || []), newCircuit] });
        flash('Circuit #' + newCircuit.number + ' started');
        return;
      }

      // Extending chain
      if (nearest.id === circuitChain.lastPlacementId) return;

      const circuits = (room.circuits || []).map(c => {
        if (c.id !== circuitChain.circuitId) return c;
        return addSegmentToCircuit(c, circuitChain.lastPlacementId, nearest.id);
      });
      const updatedPlacements = syncPlacementCircuitFields(placements, circuits);
      setCircuitChain({ ...circuitChain, lastPlacementId: nearest.id });
      onUpdate({ ...room, circuits, placements: updatedPlacements });
      flash('Connected');
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
  }, [mode, selectedElec, selectedFixture, wireStart, circuitChain, room, placements, wires, W, H, getSvgPoint, onUpdate, flash]);

  const handleMouseDown = useCallback((e, placementId) => {
    // In wire/circuit mode, don't start dragging — let click bubble for placement
    if (mode === 'wire' || mode === 'circuit') return;
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

    if (mode === 'circuit') {
      const pt = getSvgPoint(e);
      const rx = pt.x - PAD;
      const ry = pt.y - PAD;
      setMousePos({ x: rx, y: ry });
      setHoveredDevice(findNearestDevice(placements, rx, ry, SNAP_RADIUS)?.id || null);
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

  const resizePlacement = (dim, value) => {
    if (!selectedPlacement) return;
    const updated = placements.map(p => {
      if (p.id !== selectedPlacement || !p.fixtureKey) return p;
      return { ...p, [dim]: clamp(value, 6, 120) };
    });
    onUpdate({ ...room, placements: updated });
  };

  const autoFitPlacement = () => {
    if (!selectedPlacement) return;
    const p = placements.find(pl => pl.id === selectedPlacement);
    if (!p || !p.fixtureKey || p.cx == null || p.cy == null) return;

    const GAP_INCHES = 1; // 1 inch gap between items (real-world best practice)
    const GAP_PX = GAP_INCHES * SCALE / 12;

    // Determine which wall this item is nearest to
    const distN = p.cy;
    const distS = H - p.cy;
    const distW = p.cx;
    const distE = W - p.cx;
    const minDist = Math.min(distN, distS, distW, distE);
    const isHorizontalWall = (minDist === distN || minDist === distS);

    // Get neighboring fixtures that are truly side-by-side.
    // Only count items that sit ON THE FLOOR at the same depth class:
    // cabinets, appliances (fridge, range, dishwasher, washer, dryer).
    // Skip: sinks (drop into cabinets), windows (above), hoods (above),
    // upper cabinets (mounted above lowers), structural items.
    const FLOOR_ITEMS = new Set([
      'lower_cab', 'cab_corner', 'pantry_cab', 'island',
      'refrigerator', 'range', 'dishwasher', 'washer', 'dryer', 'water_heater',
      'bathtub', 'shower', 'vanity', 'toilet',
      'bed_king', 'bed_queen', 'desk', 'sofa', 'tv_stand', 'dining_table',
    ]);
    const UPPER_ITEMS = new Set(['upper_cab', 'microwave', 'hood']);
    const pIsUpper = UPPER_ITEMS.has(p.fixtureKey);
    const pIsFloor = FLOOR_ITEMS.has(p.fixtureKey);
    const pGroup = pIsUpper ? 'upper' : pIsFloor ? 'floor' : 'other';

    const neighbors = placements.filter(n => {
      if (n.id === p.id || n.cx == null || !n.fixtureKey) return false;
      // Must be in the same height group (floor items with floor, uppers with uppers)
      const nIsUpper = UPPER_ITEMS.has(n.fixtureKey);
      const nIsFloor = FLOOR_ITEMS.has(n.fixtureKey);
      const nGroup = nIsUpper ? 'upper' : nIsFloor ? 'floor' : 'other';
      if (nGroup !== pGroup) return false;

      // Must be on the same wall (close perpendicular distance)
      const WALL_THRESHOLD = 3 * SCALE;
      if (isHorizontalWall) {
        return Math.abs(n.cy - p.cy) < WALL_THRESHOLD;
      } else {
        return Math.abs(n.cx - p.cx) < WALL_THRESHOLD;
      }
    });

    if (isHorizontalWall) {
      // Working along x axis — find closest neighbor to left and right by CENTER position
      let leftBound = 0; // room wall (plan coordinates, not SVG)
      let rightBound = W;

      for (const n of neighbors) {
        const nHalfW = (n.w || 30) * SCALE / 24;
        const nLeft = n.cx - nHalfW;
        const nRight = n.cx + nHalfW;

        // Is this neighbor's center to the left of our center?
        if (n.cx < p.cx) {
          // Its right edge is a potential left boundary
          const bound = nRight + GAP_PX;
          if (bound > leftBound) leftBound = bound;
        }
        // Is this neighbor's center to the right?
        else if (n.cx > p.cx) {
          const bound = nLeft - GAP_PX;
          if (bound < rightBound) rightBound = bound;
        }
        // Same center — skip (probably overlapping)
      }

      const availablePx = Math.max(rightBound - leftBound, SCALE);
      const newWidthInches = Math.round(availablePx * 12 / SCALE);
      const newCx = (leftBound + rightBound) / 2;
      const updated = placements.map(pl =>
        pl.id === selectedPlacement ? { ...pl, w: clamp(newWidthInches, 6, 120), cx: newCx } : pl
      );
      onUpdate({ ...room, placements: updated });
      flash(`Auto-fit: ${newWidthInches}" wide`);
    } else {
      // Working along y axis
      let topBound = 0;
      let bottomBound = H;

      for (const n of neighbors) {
        const nHalfH = (n.h || 30) * SCALE / 24;
        const nTop = n.cy - nHalfH;
        const nBottom = n.cy + nHalfH;

        if (n.cy < p.cy) {
          const bound = nBottom + GAP_PX;
          if (bound > topBound) topBound = bound;
        } else if (n.cy > p.cy) {
          const bound = nTop - GAP_PX;
          if (bound < bottomBound) bottomBound = bound;
        }
      }

      const availablePx = Math.max(bottomBound - topBound, SCALE);
      const newDepthInches = Math.round(availablePx * 12 / SCALE);
      const newCy = (topBound + bottomBound) / 2;
      const updated = placements.map(pl =>
        pl.id === selectedPlacement ? { ...pl, h: clamp(newDepthInches, 6, 120), cy: newCy } : pl
      );
      onUpdate({ ...room, placements: updated });
      flash(`Auto-fit: ${newDepthInches}" deep`);
    }
  };

  const deletePlacement = () => {
    if (!selectedPlacement) return;
    const updated = placements.filter(p => p.id !== selectedPlacement);
    const updatedCircuits = removeDeviceFromCircuits(room.circuits || [], selectedPlacement);
    const syncedPlacements = syncPlacementCircuitFields(updated, updatedCircuits);
    onUpdate({ ...room, placements: syncedPlacements, circuits: updatedCircuits });
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

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && circuitChain) {
        setCircuitChain(null);
        flash('Circuit finished');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [circuitChain, flash]);

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
          {['fixture', 'electric', 'circuit', 'wire', 'draw'].map(m => (
            <button
              key={m}
              className={mode === m ? 'tool-btn tool-active' : 'tool-btn'}
              onClick={() => { setMode(m); setCircuitChain(null); setWireStart(null); setDrawing(false); setCurrentPath([]); }}
            >
              {m === 'circuit' ? '\u26A1 Circuit' : m.charAt(0).toUpperCase() + m.slice(1)}
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

      {mode === 'circuit' && (
        <div className="meta" style={{ marginTop: 8, textAlign: 'center', padding: 8 }}>
          {circuitChain
            ? '\u26A1 Click next device to connect. Press Esc to finish circuit.'
            : '\u26A1 Click a device to start a new circuit. Click endpoints to extend existing.'}
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
              <div className="row" style={{ alignItems: 'center', gap: 3 }}>
                <span className="meta" style={{ fontSize: 11 }}>W:</span>
                <button className="btn-sm btn-outline" style={{ padding: '2px 6px', fontSize: 11, minWidth: 0 }} onClick={() => resizePlacement('w', (selectedP.w || 30) - 2)}>&minus;</button>
                <input type="number" className="edit-input" style={{ width: 40, textAlign: 'center', padding: '2px 4px', fontSize: 11 }}
                  value={selectedP.w || 30} min={6} max={120}
                  onChange={e => resizePlacement('w', Number(e.target.value) || 30)} />
                <button className="btn-sm btn-outline" style={{ padding: '2px 6px', fontSize: 11, minWidth: 0 }} onClick={() => resizePlacement('w', (selectedP.w || 30) + 2)}>+</button>
                <span className="meta" style={{ marginLeft: 4, fontSize: 11 }}>D:</span>
                <button className="btn-sm btn-outline" style={{ padding: '2px 6px', fontSize: 11, minWidth: 0 }} onClick={() => resizePlacement('h', (selectedP.h || 30) - 2)}>&minus;</button>
                <input type="number" className="edit-input" style={{ width: 40, textAlign: 'center', padding: '2px 4px', fontSize: 11 }}
                  value={selectedP.h || 30} min={6} max={120}
                  onChange={e => resizePlacement('h', Number(e.target.value) || 30)} />
                <button className="btn-sm btn-outline" style={{ padding: '2px 6px', fontSize: 11, minWidth: 0 }} onClick={() => resizePlacement('h', (selectedP.h || 30) + 2)}>+</button>
                <button className="btn-sm btn-outline" style={{ padding: '2px 6px', fontSize: 11, minWidth: 0, marginLeft: 4, background: '#1a5c2a', color: '#fff', border: 'none' }} onClick={autoFitPlacement} title="Auto-size to fill gap between neighbors">Auto-Fit</button>
              </div>
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
            else if (mode !== 'wire' && mode !== 'circuit') setSelectedPlacement(null);
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
                  <path d={d} fill="none" stroke={circuit.color} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                  <text
                    x={mid.x + PAD} y={mid.y + PAD - 6}
                    textAnchor="middle" fill={circuit.color} fontSize="8" fontWeight="bold" fontFamily="Arial"
                  >#{circuit.number}</text>
                </g>
              );
            })
          )}

          {/* Homerun arrows to panel */}
          {(room.circuits || []).filter(c => c.homerunTo).map(circuit => {
            const devices = getDevicesOnCircuit(circuit);
            const firstId = devices[0];
            const panel = placements.find(p => p.id === circuit.homerunTo);
            const device = placements.find(p => p.id === firstId);
            if (!panel || !device || panel.cx === undefined || device.cx === undefined) return null;
            const route = calculateRoute(device, panel);
            const d = route.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x + PAD},${pt.y + PAD}`).join(' ');
            return (
              <g key={`hr-${circuit.id}`}>
                <path d={d} fill="none" stroke={circuit.color} strokeWidth="3" strokeDasharray="8 4" opacity="0.7" />
                <circle cx={panel.cx + PAD} cy={panel.cy + PAD} r="8" fill="none" stroke={circuit.color} strokeWidth="2" />
                <text x={panel.cx + PAD} y={panel.cy + PAD + 3} textAnchor="middle" fill={circuit.color} fontSize="7" fontWeight="bold">P</text>
              </g>
            );
          })}

          {/* Snap highlight */}
          {mode === 'circuit' && hoveredDevice && (() => {
            const p = placements.find(pl => pl.id === hoveredDevice);
            if (!p || p.cx === undefined) return null;
            return (
              <circle cx={p.cx + PAD} cy={p.cy + PAD} r={SNAP_RADIUS}
                fill="rgba(74,170,255,0.1)" stroke="#4af" strokeWidth="1.5" strokeDasharray="4 2" />
            );
          })()}

          {/* Preview line while chaining */}
          {mode === 'circuit' && circuitChain && mousePos && (() => {
            const lastP = placements.find(p => p.id === circuitChain.lastPlacementId);
            if (!lastP || lastP.cx === undefined) return null;
            const target = hoveredDevice ? placements.find(p => p.id === hoveredDevice) : { cx: mousePos.x, cy: mousePos.y };
            if (!target) return null;
            const route = calculateRoute(lastP, target);
            const d = route.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x + PAD},${pt.y + PAD}`).join(' ');
            return <path d={d} fill="none" stroke="#4af" strokeWidth="2" strokeDasharray="6 3" opacity="0.5" />;
          })()}

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
                  {def.amps && <text textAnchor="middle" y="22" fill={def.color} fontSize="7" fontWeight="bold" fontFamily="Arial" opacity="0.8">{def.amps}A</text>}
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
              {p.elecKey && ELEC[p.elecKey]?.amps && <span style={{ fontSize: 11, color: '#C47A15', fontWeight: 600, marginLeft: 6 }}>{ELEC[p.elecKey].amps}A</span>}
              {p.pos3d && <span style={{ fontSize: 9, color: '#22d3ee', fontWeight: 700, marginLeft: 6, background: 'rgba(34,211,238,0.15)', padding: '1px 4px', borderRadius: 3, letterSpacing: 0.5 }}>3D</span>}
            </div>
            <button className="btn-delete btn-sm" onClick={() => {
              const updated = placements.filter(pl => pl.id !== p.id);
              const updatedCircuits = removeDeviceFromCircuits(room.circuits || [], p.id);
              const syncedPlacements = syncPlacementCircuitFields(updated, updatedCircuits);
              onUpdate({ ...room, placements: syncedPlacements, circuits: updatedCircuits });
              if (selectedPlacement === p.id) setSelectedPlacement(null);
              flash('Item removed');
            }}>&times;</button>
          </div>
        </div>
      ))}

      {/* Circuit Summary */}
      {(room.circuits || []).length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 16 }}>
            <h3 className="section-title">Circuits ({(room.circuits || []).length})</h3>
          </div>
          {(room.circuits || []).map(circuit => {
            const devices = getDevicesOnCircuit(circuit);
            const isExpanded = expandedCircuitId === circuit.id;
            return (
              <div key={circuit.id} className="placement-card">
                <div className="placement-header" onClick={() => setExpandedCircuitId(isExpanded ? null : circuit.id)}>
                  <div className="placement-header-left">
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: circuit.color, marginRight: 6, flexShrink: 0 }} />
                    <span className="placement-name">Circuit #{circuit.number}</span>
                    <span className="meta" style={{ marginLeft: 8 }}>
                      {devices.length} devices &middot; {circuit.amperage}A &middot; #{circuit.wireGauge} AWG
                    </span>
                  </div>
                  <button className="btn-delete btn-sm" onClick={e => {
                    e.stopPropagation();
                    const updated = (room.circuits || []).filter(c => c.id !== circuit.id);
                    const updatedPlacements = syncPlacementCircuitFields(placements, updated);
                    onUpdate({ ...room, circuits: updated, placements: updatedPlacements });
                    flash('Circuit deleted');
                  }}>&times;</button>
                </div>
                {isExpanded && (
                  <div className="placement-edit">
                    <div className="edit-row">
                      <label className="edit-label">Label</label>
                      <input className="edit-input" placeholder="e.g. Kitchen Outlets"
                        value={circuit.label}
                        onChange={e => {
                          const updated = (room.circuits || []).map(c => c.id === circuit.id ? { ...c, label: e.target.value } : c);
                          onUpdate({ ...room, circuits: updated });
                        }} />
                    </div>
                    <div className="edit-row">
                      <label className="edit-label">Breaker</label>
                      <select className="edit-input" value={circuit.amperage}
                        onChange={e => {
                          const updated = (room.circuits || []).map(c => c.id === circuit.id ? { ...c, amperage: Number(e.target.value) } : c);
                          onUpdate({ ...room, circuits: updated });
                        }}>
                        <option value={15}>15A</option>
                        <option value={20}>20A</option>
                        <option value={30}>30A</option>
                        <option value={40}>40A</option>
                        <option value={50}>50A</option>
                      </select>
                    </div>
                    <div className="edit-row">
                      <label className="edit-label">Wire</label>
                      <select className="edit-input" value={circuit.wireGauge}
                        onChange={e => {
                          const updated = (room.circuits || []).map(c => c.id === circuit.id ? { ...c, wireGauge: e.target.value } : c);
                          onUpdate({ ...room, circuits: updated });
                        }}>
                        <option value="14">#14 AWG</option>
                        <option value="12">#12 AWG</option>
                        <option value="10">#10 AWG</option>
                        <option value="8">#8 AWG</option>
                        <option value="6">#6 AWG</option>
                      </select>
                    </div>
                    <div className="edit-row">
                      <label className="edit-label">Type</label>
                      <select className="edit-input" value={circuit.type}
                        onChange={e => {
                          const updated = (room.circuits || []).map(c => c.id === circuit.id ? { ...c, type: e.target.value } : c);
                          onUpdate({ ...room, circuits: updated });
                        }}>
                        <option value="general">General</option>
                        <option value="dedicated">Dedicated</option>
                        <option value="lighting">Lighting</option>
                      </select>
                    </div>
                    <div className="edit-row" style={{ gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={circuit.gfci}
                          onChange={e => {
                            const updated = (room.circuits || []).map(c => c.id === circuit.id ? { ...c, gfci: e.target.checked } : c);
                            onUpdate({ ...room, circuits: updated });
                          }} />
                        <span className="meta">GFCI</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={circuit.afci}
                          onChange={e => {
                            const updated = (room.circuits || []).map(c => c.id === circuit.id ? { ...c, afci: e.target.checked } : c);
                            onUpdate({ ...room, circuits: updated });
                          }} />
                        <span className="meta">AFCI</span>
                      </label>
                    </div>
                    <div className="edit-row">
                      <label className="edit-label">Homerun</label>
                      <select className="edit-input" value={circuit.homerunTo || ''}
                        onChange={e => {
                          const updated = (room.circuits || []).map(c => c.id === circuit.id ? { ...c, homerunTo: e.target.value || null } : c);
                          onUpdate({ ...room, circuits: updated });
                        }}>
                        <option value="">None</option>
                        {placements.filter(p => p.elecKey === 'panel').map(p => (
                          <option key={p.id} value={p.id}>Panel ({p.location || 'unnamed'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="meta" style={{ padding: '4px 0' }}>
                      Devices: {devices.map(dId => {
                        const dp = placements.find(p => p.id === dId);
                        return dp?.name || 'Unknown';
                      }).join(' \u2192 ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      </>}
      {/* ═══ END TOP VIEW CONTENT ═══ */}
    </div>
  );
}
