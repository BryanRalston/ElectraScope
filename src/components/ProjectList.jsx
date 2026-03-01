import React, { useState } from 'react';
import { uid } from '../constants';
import { decodeProject } from '../share';
import { EmptyState } from './ui';

export default function ProjectList({ projects, onSelect, onCreated, onDelete, onImport, flash }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', client: '', notes: '' });
  const [importCode, setImportCode] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const proj = {
      id: uid(),
      name: form.name.trim(),
      address: form.address.trim(),
      client: form.client.trim(),
      notes: form.notes.trim(),
      rooms: [],
      created: Date.now(),
    };
    onCreated(proj);
    setForm({ name: '', address: '', client: '', notes: '' });
    setShowForm(false);
  };

  const handleImport = () => {
    if (!importCode.trim()) return;
    const decoded = decodeProject(importCode.trim());
    if (!decoded) {
      flash('Invalid share code');
      return;
    }
    onImport(decoded);
    setImportCode('');
    setShowImport(false);
  };

  const totalItems = (proj) =>
    (proj.rooms || []).reduce((sum, r) => sum + (r.placements || []).length, 0);

  return (
    <div className="container">
      <div className="section-header">
        <h2 className="section-title">Projects</h2>
        <div className="row">
          <button className="btn-outline" onClick={() => { setShowImport(!showImport); setShowForm(false); }}>
            Import
          </button>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setShowImport(false); }}>
            + New Project
          </button>
        </div>
      </div>

      {showImport && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="card-title">Import Project</h3>
          <div className="import-row">
            <input
              className="input"
              placeholder="Paste share code here..."
              value={importCode}
              onChange={e => setImportCode(e.target.value)}
            />
            <button className="btn-primary" onClick={handleImport}>Import</button>
          </div>
        </div>
      )}

      {showForm && (
        <form className="card" onSubmit={handleCreate} style={{ marginBottom: 16 }}>
          <h3 className="card-title">New Project</h3>
          <input
            className="input"
            placeholder="Project name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <input
            className="input"
            placeholder="Address"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
          <input
            className="input"
            placeholder="Client name"
            value={form.client}
            onChange={e => setForm({ ...form, client: e.target.value })}
          />
          <textarea
            className="textarea"
            placeholder="Notes"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
          <div className="row">
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Project</button>
          </div>
        </form>
      )}

      {projects.length === 0 && !showForm ? (
        <EmptyState
          icon="📋"
          title="No projects yet"
          subtitle="Create your first electrical project to get started"
        />
      ) : (
        projects.map(p => (
          <div key={p.id} className="project-card" onClick={() => onSelect(p)}>
            <div className="project-card-body">
              <div>
                <div className="project-name">{p.name}</div>
                {p.address && <div className="meta">{p.address}</div>}
                {p.client && <div className="meta">Client: {p.client}</div>}
                <div className="meta">
                  {(p.rooms || []).length} room{(p.rooms || []).length !== 1 ? 's' : ''} &middot; {totalItems(p)} item{totalItems(p) !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="project-card-actions">
                <button
                  className="btn-delete btn-sm"
                  onClick={e => { e.stopPropagation(); onDelete(p.id); }}
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
