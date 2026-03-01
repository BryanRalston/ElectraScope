import React, { useState, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as THREE from 'three';
import { ELEC, FIXTURES, uid } from '../constants';
import useModelLoader from '../hooks/useModelLoader';
import ModelSymbol3D from './ModelSymbol3D';

function GLBModel({ url, onSurfaceClick, placementMode, onHover }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(), [scene]);

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

function OBJModel({ url, onSurfaceClick, placementMode, onHover }) {
  const obj = useLoader(OBJLoader, url);
  const cloned = useMemo(() => obj.clone(), [obj]);

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

  // If normal points mostly up/down, it's a floor/ceiling surface — no wall
  if (absZ > absX && absZ > absY) return {};

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

export default function ModelView({ room, onUpdate, flash, selectedElec, selectedFixture, mode, onClearSelection }) {
  const { url, loading, error, format } = useModelLoader(room);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [hoverNormal, setHoverNormal] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const placements = room.placements || [];

  const placementMode = mode === 'electric' && selectedElec;

  const W = room.width;
  const D = room.height;
  const CH = room.ceilingHeight || 9;

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
    return <div className="meta" style={{ textAlign: 'center', padding: 60, color: '#f87171' }}>{error}</div>;
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
            {format === 'obj' ? (
              <OBJModel url={url} onSurfaceClick={handleSurfaceClick} placementMode={placementMode} onHover={handleSurfaceHover} />
            ) : (
              <GLBModel url={url} onSurfaceClick={handleSurfaceClick} placementMode={placementMode} onHover={handleSurfaceHover} />
            )}
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
          <OrbitControls
            enablePan={true}
            enableRotate={true}
            enableZoom={true}
            minDistance={0.5}
            maxDistance={50}
          />
        </Canvas>
      </div>
    </div>
  );
}
