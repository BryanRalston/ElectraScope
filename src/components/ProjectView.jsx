import React, { useState } from 'react';
import { uid, RTYPES } from '../constants';
import { makeShareUrl } from '../share';
import { EmptyState } from './ui';

export default function ProjectView({ project, onUpdate, onSelectRoom, onDeleteRoom, onScope, onPrint, flash }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'Living Room', customName: '', width: 12, height: 10 });
  const [shareCode, setShareCode] = useState('');

  const handleAddRoom = (e) => {
    e.preventDefault();
    const name = form.customName.trim() || form.type;
    const r = {
      id: uid(),
      name,
      type: form.type,
      width: Math.max(4, Math.min(100, Number(form.width) || 12)),
      height: Math.max(4, Math.min(100, Number(form.height) || 10)),
      placements: [],
      wires: [],
      drawings: [],
      notes: '',
      photo: null,
    };
    const updated = { ...project, rooms: [...(project.rooms || []), r] };
    onUpdate(updated);
    setShowForm(false);
    setForm({ type: 'Living Room', customName: '', width: 12, height: 10 });
    flash('Room added');
  };

  const handleShare = () => {
    const url = makeShareUrl(project);
    navigator.clipboard.writeText(url).then(() => {
      flash('Share link copied to clipboard');
    }).catch(() => {
      setShareCode(url);
    });
  };

  const itemCount = (room) => (room.placements || []).length;
  const fixtureCount = (room) => (room.placements || []).filter(p => p.fixtureKey).length;
  const elecCount = (room) => (room.placements || []).filter(p => p.elecKey).length;

  return (
    <div className="container">
      <div className="card">
        <h2 className="card-title">{project.name}</h2>
        {project.address && <div className="meta">{project.address}</div>}
        {project.client && <div className="meta">Client: {project.client}</div>}
        {project.notes && <div className="meta">{project.notes}</div>}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn-outline" onClick={handleShare}>Share</button>
          <button className="btn-outline" onClick={onScope}>Scope of Work</button>
          <button className="btn-primary" onClick={onPrint}>Print</button>
        </div>
      </div>

      {shareCode && (
        <div className="share-box">
          <div className="share-code">{shareCode}</div>
          <button className="btn-ghost" onClick={() => setShareCode('')}>Close</button>
        </div>
      )}

      <div className="section-header">
        <h3 className="section-title">Rooms ({(project.rooms || []).length})</h3>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Room</button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleAddRoom} style={{ marginBottom: 16 }}>
          <h3 className="card-title">New Room</h3>
          <select
            className="input select"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          >
            {RTYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            className="input"
            placeholder="Custom name (optional)"
            value={form.customName}
            onChange={e => setForm({ ...form, customName: e.target.value })}
          />
          <div className="row">
            <div>
              <label className="dim-label">Width (ft)</label>
              <input
                className="dim-input"
                type="number"
                min="4"
                max="100"
                value={form.width}
                onChange={e => setForm({ ...form, width: e.target.value })}
              />
            </div>
            <div>
              <label className="dim-label">Height (ft)</label>
              <input
                className="dim-input"
                type="number"
                min="4"
                max="100"
                value={form.height}
                onChange={e => setForm({ ...form, height: e.target.value })}
              />
            </div>
          </div>
          <div className="row">
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Add Room</button>
          </div>
        </form>
      )}

      {(project.rooms || []).length === 0 && !showForm ? (
        <EmptyState
          icon="🏠"
          title="No rooms yet"
          subtitle="Add your first room to start planning"
        />
      ) : (
        (project.rooms || []).map(r => (
          <div key={r.id} className="room-card" onClick={() => onSelectRoom(r)}>
            <div className="room-card-body">
              <div>
                <div className="room-name">{r.name}</div>
                <div className="room-type">{r.type} &middot; {r.width}' &times; {r.height}'</div>
                <div className="meta">
                  {elecCount(r)} electrical &middot; {fixtureCount(r)} fixtures
                </div>
              </div>
              <div className="room-card-actions">
                <button
                  className="btn-delete btn-sm"
                  onClick={e => { e.stopPropagation(); onDeleteRoom(r.id); }}
                >
                  &times;
                </button>
                <span className="chevron">&rsaquo;</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
