import React from 'react';
import { Html } from '@react-three/drei';
import { ELEC } from '../constants';

export default function ModelSymbol3D({ placement, selected, onClick, onDelete }) {
  const def = placement.elecKey ? ELEC[placement.elecKey] : null;
  const { x, y, z } = placement.pos3d;
  const normal = placement.normal3d || { x: 0, y: 0, z: 1 };

  // Offset slightly along surface normal to prevent z-fighting
  const pos = [
    x + normal.x * 0.03,
    y + normal.y * 0.03,
    z + normal.z * 0.03,
  ];

  const color = def?.color || '#C47A15';
  const abbr = def?.abbr || '?';

  return (
    <group position={pos}>
      <Html center distanceFactor={4} style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            borderColor: selected ? '#fff' : color,
            background: selected ? 'rgba(196, 122, 21, 0.4)' : 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: selected ? '#fff' : color,
            fontSize: 11,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
            boxShadow: selected ? '0 0 8px rgba(196, 122, 21, 0.6)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {abbr}
        </div>
        {selected && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 4,
            background: 'rgba(0, 0, 0, 0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            fontSize: 11,
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>{def?.name || placement.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              style={{
                background: 'rgba(239, 68, 68, 0.3)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: 4,
                color: '#f87171',
                padding: '1px 6px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        )}
      </Html>
    </group>
  );
}
