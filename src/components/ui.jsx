import React from 'react';
import { ELEC } from '../constants';

export function SymIcon({ sym, size = 32 }) {
  const def = ELEC[sym];
  if (!def) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="sym-icon">
      <circle cx="20" cy="20" r="18" fill="none" stroke={def.color} strokeWidth="2" />
      <text
        x="20"
        y="22"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={def.color}
        fontSize={def.abbr.length > 2 ? '9' : '12'}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {def.abbr}
      </text>
    </svg>
  );
}

export function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Delete {name}?</h3>
        <p>This cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {subtitle && <div className="empty-state-body">{subtitle}</div>}
    </div>
  );
}
