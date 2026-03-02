import React, { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as THREE from 'three';
import { ELEC, FIXTURES, uid } from '../constants';
import useModelLoader from '../hooks/useModelLoader';
import ModelSymbol3D from './ModelSymbol3D';

function AutoFitCamera({ target }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!target) return;
    const box = new THREE.Box3().setFromObject(target);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 1.8;
    camera.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.7);
    camera.lookAt(center);
    camera.near = maxDim * 0.01;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
  }, [target, camera, controls]);
  return null;
}

function GLBModel({ url, onSurfaceClick, placementMode, onHover, onSceneLoaded }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone();
    return c;
  }, [scene]);

  useEffect(() => {
    if (cloned && onSceneLoaded) onSceneLoaded(cloned);
  }, [cloned, onSceneLoaded]);

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    if (!placementMode) return;
    const intersection = event.intersections[0];
    if (!intersection) return;

    const point = intersection.point;
    const faceNormal = intersection.face.normal.clone();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
    const worldNormal = faceNormal.applyMatrix3(normalMatrix).normalize();

    onSurfaceClick({ point, normal: worldNormal });
  }, [placementMode, onSurfaceClick]);

  const handlePointerMove = useCallback((event) => {
    event.stopPropagation();
    if (!placementMode) {
      onHover(null);
      return;
    }
    const intersection = event.intersections[0];
    if (!intersection) {
      onHover(null);
      return;
    }

    const point = intersection.point;
    const faceNormal = intersection.face.normal.clone();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
    const worldNormal = faceNormal.applyMatrix3(normalMatrix).normalize();

    onHover({ point, normal: worldNormal });
  }, [placementMode, onHover]);

  const handlePointerLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  return (
    <primitive
      object={cloned}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  );
}

function OBJModel({ url, onSurfaceClick, placementMode, onHover, onSceneLoaded }) {
  const obj = useLoader(OBJLoader, url);
  const cloned = useMemo(() => {
    const c = obj.clone();
    c.traverse(child => {
      if (child.isMesh && (!child.material || child.material.type === 'MeshBasicMaterial')) {
        child.material = new THREE.MeshStandardMaterial({ color: '#b0b0b0', roughness: 0.7, metalness: 0.1 });
      }
    });
    return c;
  }, [obj]);

  useEffect(() => {
    if (cloned && onSceneLoaded) onSceneLoaded(cloned);
  }, [cloned, onSceneLoaded]);

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    if (!placementMode) return;
    const intersection = event.intersections[0];
    if (!intersection) return;

    const point = intersection.point;
    const faceNormal = intersection.face.normal.clone();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
    const worldNormal = faceNormal.applyMatrix3(normalMatrix).normalize();

    onSurfaceClick({ point, normal: worldNormal });
  }, [placementMode, onSurfaceClick]);

  const handlePointerMove = useCallback((event) => {
    event.stopPropagation();
    if (!placementMode) {
      onHover(null);
      return;
    }
    const intersection = event.intersections[0];
    if (!intersection) {
      onHover(null);
      return;
    }

    const point = intersection.point;
    const faceNormal = intersection.face.normal.clone();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
    const worldNormal = faceNormal.applyMatrix3(normalMatrix).normalize();

    onHover({ point, normal: worldNormal });
  }, [placementMode, onHover]);

  const handlePointerLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  return (
    <primitive
      object={cloned}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  );
}

function HoverPreview({ position, normal, elecKey }) {
  if (!position) return null;
  const def = ELEC[elecKey];
  const offsetPos = [
    position.x + normal.x * 0.02,
    position.y + normal.y * 0.02,
    position.z + normal.z * 0.02,
  ];
  return (
    <group position={offsetPos}>
      <Html center distanceFactor={5}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `2px solid ${def?.color || '#C47A15'}`,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: def?.color || '#C47A15',
          fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial',
          opacity: 0.7, pointerEvents: 'none',
        }}>
          {def?.abbr || '?'}
        </div>
      </Html>
    </group>
  );
}

// Derive wall assignment from a 3D surface normal and position
// so wall elevation views can display model-placed items
function deriveWallFromNormal(normal, point, W, D, CH) {
  const nx = normal.x, ny = normal.y, nz = normal.z;
  const absX = Math.abs(nx), absY = Math.abs(ny), absZ = Math.abs(nz);

  // Floor or ceiling — derive top-view coordinates
  if (absZ > absX && absZ > absY) {
    const SCALE = 40;
    return {
      wall: null,
      cx: Math.round(Math.max(0, Math.min(point.x, W)) * SCALE),
      cy: Math.round(Math.max(0, Math.min(point.y, D)) * SCALE),
      mountHeight: nz > 0 ? 0 : Math.round(CH * 12),
    };
  }

  let wall, wallPos, mountHeight;
  if (absX >= absY) {
    // Normal points along X axis — east or west wall
    wall = nx > 0 ? 'east' : 'west';
    wallPos = Math.max(0, Math.min(point.y, D));       // position along wall in feet
    mountHeight = Math.max(0, point.z * 12);            // z in feet → inches
  } else {
    // Normal points along Y axis — north or south wall
    wall = ny > 0 ? 'south' : 'north';
    wallPos = Math.max(0, Math.min(point.x, W));
    mountHeight = Math.max(0, point.z * 12);
  }
  return { wall, wallPos: Math.round(wallPos * 10) / 10, mountHeight: Math.round(mountHeight) };
}

/* ---------- inline styles for model controls ---------- */
const controlsBarStyle = {
  display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
  padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
  borderTop: '1px solid rgba(196,122,21,0.15)', fontSize: 12, color: '#a1a1aa',
};
const controlGroupStyle = {
  display: 'flex', alignItems: 'center', gap: 6,
};
const controlLabelStyle = {
  fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em',
  minWidth: 42,
};
const numInputStyle = {
  width: 60, padding: '2px 4px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
  color: '#e4e4e7', fontSize: 12, textAlign: 'center',
};
const rangeStyle = { width: 100, accentColor: '#C47A15' };
const valSpanStyle = { minWidth: 40, textAlign: 'right', fontFamily: 'monospace', color: '#C47A15' };

export default function ModelView({ room, onUpdate, flash, selectedElec, selectedFixture, mode, onClearSelection }) {
  const handleClearModel = () => {
    onUpdate({ ...room, model: undefined });
  };
  const { url, loading, error, format } = useModelLoader(room, handleClearModel);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [hoverNormal, setHoverNormal] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Model transform state
  const [modelScale, setModelScale] = useState(room.model?.scale || 1);
  const [modelPos, setModelPos] = useState(room.model?.position || { x: 0, y: 0, z: 0 });
  const [modelRotY, setModelRotY] = useState(room.model?.rotationY || 0);

  // Scene ref for auto-fit and fit-to-room
  const sceneRef = useRef(null);

  const placements = room.placements || [];

  const placementMode = mode === 'electric' && selectedElec;

  const W = room.width;
  const D = room.height;
  const CH = room.ceilingHeight || 9;

  const persistTransform = useCallback((updates) => {
    onUpdate({ ...room, model: { ...room.model, ...updates } });
  }, [room, onUpdate]);

  const handleSceneLoaded = useCallback((scene) => {
    sceneRef.current = scene;
  }, []);

  const handleFitToRoom = useCallback(() => {
    if (!sceneRef.current) return;
    const box = new THREE.Box3().setFromObject(sceneRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxModelDim = Math.max(size.x, size.y);
    const maxRoomDim = Math.max(room.width, room.height);
    const newScale = maxRoomDim / maxModelDim;
    setModelScale(newScale);
    setModelPos({ x: 0, y: 0, z: 0 });
    setModelRotY(0);
    persistTransform({ scale: newScale, position: { x: 0, y: 0, z: 0 }, rotationY: 0 });
    flash(`Model scaled to ${newScale.toFixed(2)}x to fit room`);
  }, [room, persistTransform, flash]);

  const handleSurfaceClick = useCallback((intersection) => {
    if (!placementMode) return;

    const def = ELEC[selectedElec];
    if (!def) return;

    const { point, normal } = intersection;

    // Derive wall/wallPos/mountHeight so wall elevation views can show this item
    const wallData = deriveWallFromNormal(normal, point, W, D, CH);

    const newPlacement = {
      id: uid(),
      elecKey: selectedElec,
      name: def.name,
      qty: 1,
      location: '',
      height: '',
      circuit: '',
      spec: '',
      notes: '',
      pos3d: { x: point.x, y: point.y, z: point.z },
      normal3d: { x: normal.x, y: normal.y, z: normal.z },
      ...wallData,
    };

    onUpdate({ ...room, placements: [...placements, newPlacement] });
    flash(`Placed ${def.name}`);

    // Clear selection so subsequent clicks don't keep adding
    if (onClearSelection) onClearSelection();
  }, [selectedElec, placementMode, room, placements, onUpdate, flash, onClearSelection, W, D, CH]);

  const handleSurfaceHover = useCallback((intersection) => {
    if (!placementMode) {
      setHoverPoint(null);
      return;
    }
    if (intersection) {
      setHoverPoint(intersection.point);
      setHoverNormal(intersection.normal);
    } else {
      setHoverPoint(null);
      setHoverNormal(null);
    }
  }, [placementMode]);

  const handleDeletePlacement = useCallback((id) => {
    const updated = placements.filter(p => p.id !== id);
    onUpdate({ ...room, placements: updated });
    flash('Removed placement');
    setSelectedId(null);
  }, [placements, room, onUpdate, flash]);

  if (loading) {
    return <div className="meta" style={{ textAlign: 'center', padding: 60 }}>Loading 3D model...</div>;
  }
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ color: '#f87171', marginBottom: 12 }}>{error}</div>
        <button className="btn-outline" onClick={() => {
          onUpdate({ ...room, model: null });
          flash('Model removed. You can re-import.');
        }}>Remove &amp; Re-import</button>
      </div>
    );
  }
  if (!url) {
    return <div className="meta" style={{ textAlign: 'center', padding: 60 }}>No 3D model imported for this room.</div>;
  }

  const model3dPlacements = placements.filter(p => p.pos3d);

  return (
    <div>
      <div className="model-info-bar">
        <span>{room.model.fileName}</span>
        <span className="meta">{(room.model.fileSize / 1024 / 1024).toFixed(1)} MB</span>
        {placementMode && <span style={{ color: '#C47A15' }}>Click surface to place {ELEC[selectedElec]?.name}</span>}
      </div>
      <div className="canvas-wrapper" style={{ height: '500px', position: 'relative' }}>
        <Canvas
          camera={{ position: [5, 5, 5], fov: 50, near: 0.01, far: 1000 }}
          style={{ background: '#09090B' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />

          <Suspense fallback={null}>
            <group
              scale={[modelScale, modelScale, modelScale]}
              position={[modelPos.x, modelPos.y, modelPos.z]}
              rotation={[0, modelRotY * Math.PI / 180, 0]}
            >
              {format === 'obj' ? (
                <OBJModel url={url} onSurfaceClick={handleSurfaceClick} placementMode={placementMode} onHover={handleSurfaceHover} onSceneLoaded={handleSceneLoaded} />
              ) : (
                <GLBModel url={url} onSurfaceClick={handleSurfaceClick} placementMode={placementMode} onHover={handleSurfaceHover} onSceneLoaded={handleSceneLoaded} />
              )}
            </group>
          </Suspense>

          {model3dPlacements.map(p => (
            <ModelSymbol3D
              key={p.id}
              placement={p}
              selected={selectedId === p.id}
              onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
              onDelete={() => handleDeletePlacement(p.id)}
            />
          ))}

          {hoverPoint && hoverNormal && selectedElec && (
            <HoverPreview position={hoverPoint} normal={hoverNormal} elecKey={selectedElec} />
          )}

          <gridHelper args={[20, 20, '#333333', '#1a1a1a']} />

          {/* Room boundary outline */}
          <group position={[W / 2, D / 2, 0.01]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[W, D]} />
              <meshBasicMaterial color="#C47A15" opacity={0.08} transparent side={THREE.DoubleSide} />
            </mesh>
            <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(W, D)]} />
              <lineBasicMaterial color="#C47A15" opacity={0.4} transparent />
            </lineSegments>
          </group>

          <AutoFitCamera target={sceneRef.current} />

          <OrbitControls
            makeDefault
            enablePan={true}
            enableRotate={true}
            enableZoom={true}
            minDistance={0.5}
            maxDistance={50}
          />
        </Canvas>
      </div>

      {/* Model transform controls */}
      <div style={controlsBarStyle}>
        <div style={controlGroupStyle}>
          <label style={controlLabelStyle}>Scale</label>
          <input type="range" min="0.01" max="10" step="0.01" value={modelScale} style={rangeStyle}
            onChange={e => { const v = Number(e.target.value); setModelScale(v); persistTransform({ scale: v }); }} />
          <span style={valSpanStyle}>{modelScale.toFixed(2)}x</span>
        </div>
        <div style={controlGroupStyle}>
          <label style={controlLabelStyle}>Rotate</label>
          <input type="range" min="0" max="360" step="1" value={modelRotY} style={rangeStyle}
            onChange={e => { const v = Number(e.target.value); setModelRotY(v); persistTransform({ rotationY: v }); }} />
          <span style={valSpanStyle}>{modelRotY}&deg;</span>
        </div>
        <div style={controlGroupStyle}>
          <label style={controlLabelStyle}>Position</label>
          <input type="number" step="0.5" value={modelPos.x} style={numInputStyle}
            onChange={e => { const p = { ...modelPos, x: Number(e.target.value) }; setModelPos(p); persistTransform({ position: p }); }} />
          <input type="number" step="0.5" value={modelPos.y} style={numInputStyle}
            onChange={e => { const p = { ...modelPos, y: Number(e.target.value) }; setModelPos(p); persistTransform({ position: p }); }} />
          <input type="number" step="0.5" value={modelPos.z} style={numInputStyle}
            onChange={e => { const p = { ...modelPos, z: Number(e.target.value) }; setModelPos(p); persistTransform({ position: p }); }} />
        </div>
        <button className="btn-outline" onClick={handleFitToRoom} style={{ fontSize: 12, padding: '4px 10px' }}>
          Fit to Room
        </button>
      </div>
    </div>
  );
}
