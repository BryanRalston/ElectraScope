import React, { useState } from 'react';
import { ELEC, FIXTURES, ECAT, FCAT, uid, clamp } from '../constants';
import { SymIcon } from './ui';
import ModelImport from './ModelImport';

export default function RoomEditor({ room, onUpdate, onCanvas, flash }) {
  const [tab, setTab] = useState('electrical');
  const [eCat, setECat] = useState(ECAT[0]);
  const [fCat, setFCat] = useState(FCAT[0]);
  const [expandedId, setExpandedId] = useState(null);

  const placements = room.placements || [];

  const addElectrical = (key) => {
    const def = ELEC[key];
    if (!def) return;
    const p = {
      id: uid(),
      elecKey: key,
      name: def.name,
      qty: 1,
      location: '',
      height: '',
      circuit: '',
      spec: '',
      notes: '',
    };
    onUpdate({ ...room, placements: [...placements, p] });
    flash(`Added ${def.name}`);
  };

  const addFixture = (key) => {
    const def = FIXTURES[key];
    if (!def) return;
    const p = {
      id: uid(),
      fixtureKey: key,
      name: def.name,
      qty: 1,
      location: '',
      height: '',
      circuit: '',
      spec: `${def.w}" x ${def.h}"`,
      notes: '',
    };
    onUpdate({ ...room, placements: [...placements, p] });
    flash(`Added ${def.name}`);
  };

  const updatePlacement = (id, field, value) => {
    const updated = placements.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onUpdate({ ...room, placements: updated });
  };

  const removePlacement = (id) => {
    const updated = placements.filter(p => p.id !== id);
    onUpdate({ ...room, placements: updated });
    flash('Item removed');
  };

  const updateNotes = (notes) => {
    onUpdate({ ...room, notes });
  };

  const elecKeys = Object.entries(ELEC).filter(([, v]) => v.cat === eCat);
  const fixKeys = Object.entries(FIXTURES).filter(([, v]) => v.cat === fCat);

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 16, gap: 8 }}>
        <button className="btn-outline" onClick={onCanvas}>Floor Plan</button>
        <ModelImport room={room} onUpdate={onUpdate} flash={flash} />
      </div>

      <div className="tabs">
        <button
          className={tab === 'electrical' ? 'tab tab-active' : 'tab'}
          onClick={() => setTab('electrical')}
        >
          Electrical
        </button>
        <button
          className={tab === 'fixtures' ? 'tab tab-active' : 'tab'}
          onClick={() => setTab('fixtures')}
        >
          Fixtures
        </button>
      </div>

      {tab === 'electrical' && (
        <>
          <div className="tabs" style={{ marginTop: 8 }}>
            {ECAT.map(c => (
              <button
                key={c}
                className={eCat === c ? 'tab tab-active' : 'tab'}
                onClick={() => setECat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="symbol-grid">
            {elecKeys.map(([key, def]) => (
              <button key={key} className="symbol-btn" onClick={() => addElectrical(key)}>
                <SymIcon sym={key} size={36} />
                <span className="symbol-label">{def.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'fixtures' && (
        <>
          <div className="tabs" style={{ marginTop: 8, flexWrap: 'wrap' }}>
            {FCAT.map(c => (
              <button
                key={c}
                className={fCat === c ? 'tab tab-active' : 'tab'}
                onClick={() => setFCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="fixture-grid">
            {fixKeys.map(([key, def]) => (
              <button key={key} className="fixture-btn" onClick={() => addFixture(key)}>
                <span style={{ fontSize: 20 }}>{def.icon}</span>
                <div className="fixture-btn-name">{def.name}</div>
                <div className="meta">{def.w}" x {def.h}"</div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="section-header" style={{ marginTop: 24 }}>
        <h3 className="section-title">Placed Items ({placements.length})</h3>
      </div>

      {placements.length === 0 ? (
        <div className="meta" style={{ textAlign: 'center', padding: 24 }}>
          No items placed yet. Select from above to add.
        </div>
      ) : (
        placements.map(p => (
          <div key={p.id} className="placement-card">
            <div
              className="placement-header"
              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
            >
              <div className="placement-header-left">
                {p.elecKey && <SymIcon sym={p.elecKey} size={24} />}
                <span className="placement-name">{p.name}</span>
                {p.qty > 1 && <span className="placement-detail">&times;{p.qty}</span>}
              </div>
              <div className="placement-header-right">
                {p.location && <span className="placement-detail">{p.location}</span>}
                <button
                  className="btn-delete btn-sm"
                  onClick={e => { e.stopPropagation(); removePlacement(p.id); }}
                >
                  &times;
                </button>
              </div>
            </div>
            {expandedId === p.id && (
              <div className="placement-edit">
                <div className="edit-row">
                  <label className="edit-label">Qty</label>
                  <input
                    className="edit-input"
                    type="number"
                    min="1"
                    max="100"
                    value={p.qty}
                    onChange={e => updatePlacement(p.id, 'qty', Number(e.target.value) || 1)}
                  />
                </div>
                <div className="edit-row">
                  <label className="edit-label">Location</label>
                  <input
                    className="edit-input"
                    placeholder="e.g. North wall, above counter"
                    value={p.location}
                    onChange={e => updatePlacement(p.id, 'location', e.target.value)}
                  />
                </div>
                <div className="edit-row">
                  <label className="edit-label">Height</label>
                  <input
                    className="edit-input"
                    placeholder='e.g. 48"'
                    value={p.height}
                    onChange={e => updatePlacement(p.id, 'height', e.target.value)}
                  />
                </div>
                <div className="edit-row">
                  <label className="edit-label">Circuit</label>
                  <input
                    className="edit-input"
                    placeholder="e.g. Circuit 4"
                    value={p.circuit}
                    onChange={e => updatePlacement(p.id, 'circuit', e.target.value)}
                  />
                </div>
                {p.fixtureKey ? (
                  <div className="edit-row">
                    <label className="edit-label">Size</label>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span className="meta">W</span>
                      <input className="edit-input" type="number" min={6} max={120}
                        style={{ width: 60 }}
                        value={p.w || 30}
                        onChange={e => updatePlacement(p.id, 'w', clamp(Number(e.target.value) || 6, 6, 120))} />
                      <span className="meta">"</span>
                      <span className="meta">&times;</span>
                      <span className="meta">H</span>
                      <input className="edit-input" type="number" min={6} max={120}
                        style={{ width: 60 }}
                        value={p.h || 30}
                        onChange={e => updatePlacement(p.id, 'h', clamp(Number(e.target.value) || 6, 6, 120))} />
                      <span className="meta">"</span>
                    </div>
                  </div>
                ) : (
                  <div className="edit-row">
                    <label className="edit-label">Spec</label>
                    <input className="edit-input" placeholder="Specifications"
                      value={p.spec}
                      onChange={e => updatePlacement(p.id, 'spec', e.target.value)} />
                  </div>
                )}
                <div className="edit-row">
                  <label className="edit-label">Notes</label>
                  <input
                    className="edit-input"
                    placeholder="Additional notes"
                    value={p.notes}
                    onChange={e => updatePlacement(p.id, 'notes', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <div className="section-header" style={{ marginTop: 24 }}>
        <h3 className="section-title">Room Notes</h3>
      </div>
      <textarea
        className="textarea"
        placeholder="General notes for this room..."
        value={room.notes || ''}
        onChange={e => updateNotes(e.target.value)}
        rows={3}
      />
    </div>
  );
}
