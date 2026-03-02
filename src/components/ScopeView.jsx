import React from 'react';
import { ELEC, FIXTURES } from '../constants';
import { wireRunLengths } from '../loadCalc';
import { SymIcon } from './ui';

export default function ScopeView({ project, onPrint }) {
  const rooms = project.rooms || [];
  const allPlacements = rooms.flatMap(r => (r.placements || []).map(p => ({ ...p, roomName: r.name })));

  const uniqueTypes = new Set(allPlacements.map(p => p.name));

  // Materials summary: aggregate by name
  const materials = {};
  allPlacements.forEach(p => {
    const key = p.name;
    if (!materials[key]) {
      materials[key] = { name: p.name, qty: 0, elecKey: p.elecKey, fixtureKey: p.fixtureKey, spec: p.spec };
    }
    materials[key].qty += (p.qty || 1);
  });
  const materialList = Object.values(materials).sort((a, b) => a.name.localeCompare(b.name));

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="container">
      <div className="scope-header">
        <h2>Scope of Work</h2>
        <div className="scope-project-info">
          <div className="scope-project-name">{project.name}</div>
          {project.address && <div className="meta">{project.address}</div>}
          {project.client && <div className="meta">Client: {project.client}</div>}
          <div className="meta">Date: {today}</div>
        </div>
        {onPrint && (
          <button className="btn-primary no-print" onClick={onPrint}>Print</button>
        )}
      </div>

      {/* Summary */}
      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-number">{rooms.length}</div>
          <div className="summary-label">Rooms</div>
        </div>
        <div className="summary-item">
          <div className="summary-number">{allPlacements.length}</div>
          <div className="summary-label">Total Items</div>
        </div>
        <div className="summary-item">
          <div className="summary-number">{uniqueTypes.size}</div>
          <div className="summary-label">Types</div>
        </div>
      </div>

      {/* Materials Summary */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="card-title">Materials Summary</h3>
        <table className="scope-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Spec</th>
            </tr>
          </thead>
          <tbody>
            {materialList.map((m, i) => (
              <tr key={i}>
                <td>
                  <div className="scope-item-name">
                    {m.elecKey && <SymIcon sym={m.elecKey} size={18} />}
                    {m.name}
                  </div>
                </td>
                <td>{m.qty}</td>
                <td className="meta">{m.spec || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wire Length Estimates */}
      {(() => {
        const wires = wireRunLengths(project);
        if (wires.length === 0) return null;
        return (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">Wire Length Estimates</h3>
            <table className="scope-table">
              <thead>
                <tr>
                  <th>Wire Gauge</th>
                  <th>Estimated Length</th>
                  <th>Circuits</th>
                </tr>
              </thead>
              <tbody>
                {wires.map((w, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>#{w.gauge} AWG</td>
                    <td>{w.lengthFt} ft</td>
                    <td className="meta">
                      {w.circuits.map(n => `#${n}`).join(', ')}
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600, borderTop: '2px solid var(--border)' }}>
                  <td>Total</td>
                  <td>{wires.reduce((sum, w) => sum + w.lengthFt, 0)} ft</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="meta" style={{ marginTop: 6, fontSize: 11 }}>
              Includes 10% slack for routing. Homerun runs estimated at 6ft each. Verify actual runs on site.
            </div>
          </div>
        );
      })()}

      {/* Per-room breakdown */}
      {rooms.map(r => {
        const rp = r.placements || [];
        if (rp.length === 0) return null;
        return (
          <div key={r.id} className="scope-room">
            <div className="scope-room-header">
              <h3 className="card-title">{r.name}</h3>
              <div className="scope-room-tags">
                <span className="scope-tag">{r.type}</span>
                <span className="scope-tag">{r.width}&apos; &times; {r.height}&apos; &times; {r.ceilingHeight || 9}&apos; ceil</span>
              </div>
            </div>
            <table className="scope-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Wall</th>
                  <th>Location</th>
                  <th>Height</th>
                  <th>Circuit</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rp.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="scope-item-name">
                        {p.elecKey && <SymIcon sym={p.elecKey} size={18} />}
                        {p.name}
                      </div>
                    </td>
                    <td>{p.qty || 1}</td>
                    <td>{p.wall ? p.wall.charAt(0).toUpperCase() + p.wall.slice(1) : '-'}</td>
                    <td>{p.location || (p.wallPos ? p.wallPos.toFixed(1) + "' from left" : '-')}</td>
                    <td>{p.mountHeight ? p.mountHeight + '"' : p.height || '-'}</td>
                    <td>{p.circuit || '-'}</td>
                    <td className="meta">{[p.spec, p.notes].filter(Boolean).join('; ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {r.notes && <div className="scope-room-notes">Notes: {r.notes}</div>}
          </div>
        );
      })}

      {/* Footer */}
      <div className="scope-footer">
        <p>This scope of work is for planning purposes. All electrical work must comply with local building codes and NEC requirements. A licensed electrician should verify all specifications before installation.</p>
      </div>
    </div>
  );
}
