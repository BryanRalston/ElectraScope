import React, { useState } from 'react';
import { ELEC, FIXTURES, CIRCUIT_COLORS } from '../constants';
import { getDevicesOnCircuit } from '../circuitUtils';
import { circuitVA, circuitLoadCheck, wireGaugeCheck, projectLoadSummary, demandLoadCalc } from '../loadCalc';

// ─── NEC GFCI-required locations (NEC 210.8) ───────────────────────
const GFCI_REQUIRED_TYPES = new Set([
  'Kitchen', 'Bathroom', 'Garage', 'Laundry', 'Basement',
  'Porch', 'Patio', 'Mudroom',
]);

// ─── Inline style definitions ───────────────────────────────────────
const S = {
  page: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    fontSize: 13,
    color: '#1a1a2e',
    background: '#f8f9fa',
    padding: 32,
    maxWidth: 1100,
    margin: '0 auto',
    lineHeight: 1.5,
  },
  titleBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '3px solid #1a1a2e',
    paddingBottom: 16,
    marginBottom: 24,
  },
  titleLeft: {
    flex: 1,
  },
  titleRight: {
    textAlign: 'right',
    fontSize: 12,
    color: '#555',
    minWidth: 200,
  },
  h1: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    letterSpacing: '-0.02em',
  },
  h2: {
    margin: '24px 0 12px',
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    borderBottom: '1px solid #dee2e6',
    paddingBottom: 6,
  },
  h3: {
    margin: '20px 0 8px',
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  meta: {
    margin: '2px 0',
    fontSize: 13,
    color: '#444',
  },
  panelGrid: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
    marginBottom: 24,
  },
  thMain: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '8px 6px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  td: {
    padding: '5px 6px',
    borderBottom: '1px solid #dee2e6',
    verticalAlign: 'middle',
  },
  tdCenter: {
    padding: '5px 6px',
    borderBottom: '1px solid #dee2e6',
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  busBar: {
    width: 4,
    background: '#1a1a2e',
    border: 'none',
    padding: 0,
  },
  spare: {
    color: '#999',
    fontStyle: 'italic',
  },
  badge: {
    display: 'inline-block',
    padding: '1px 5px',
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 600,
    marginLeft: 3,
    verticalAlign: 'middle',
  },
  badgeGfci: {
    background: '#dbeafe',
    color: '#1e40af',
  },
  badgeAfci: {
    background: '#fef3c7',
    color: '#92400e',
  },
  badge240: {
    background: '#fce4ec',
    color: '#b71c1c',
  },
  colorSwatch: {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 5,
    verticalAlign: 'middle',
    border: '1px solid rgba(0,0,0,0.15)',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    background: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    padding: '16px 14px',
    textAlign: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a2e',
    lineHeight: 1.1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: 4,
  },
  loadBar: {
    height: 8,
    borderRadius: 4,
    background: '#e9ecef',
    overflow: 'hidden',
    width: '100%',
  },
  loadBarFill: (pct) => ({
    height: '100%',
    borderRadius: 4,
    width: `${Math.min(pct, 100)}%`,
    background: pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981',
    transition: 'width 0.3s ease',
  }),
  warningBox: {
    background: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    fontSize: 12,
  },
  warningIcon: {
    color: '#e53e3e',
    fontWeight: 700,
    marginRight: 6,
  },
  overloadRow: {
    background: '#fff5f5',
  },
  expandBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#4a90d9',
    fontSize: 11,
    padding: '2px 4px',
    textDecoration: 'underline',
  },
  detailRow: {
    background: '#f0f4f8',
    fontSize: 11,
  },
  circuitTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
    marginBottom: 16,
  },
  printHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    borderTop: '1px solid #dee2e6',
    paddingTop: 12,
  },
};

// ─── Helpers ────────────────────────────────────────────────────────

function getAllCircuits(rooms) {
  const result = [];
  for (const room of rooms) {
    for (const c of (room.circuits || [])) {
      result.push({ ...c, roomName: room.name || room.type || 'Unknown', placements: room.placements || [] });
    }
  }
  return result;
}

function is240V(circuit) {
  if (circuit.type === '240v' || circuit.type === '240V') return true;
  if (circuit.label && /240|range|dryer|oven|hvac|ac\b|water.?heater/i.test(circuit.label)) return true;
  if (circuit.amperage >= 30) return true;
  return false;
}

function getDeviceNames(circuit, placements) {
  const deviceIds = getDevicesOnCircuit(circuit);
  const placementMap = new Map(placements.map(p => [p.id, p]));
  const names = [];
  for (const id of deviceIds) {
    const p = placementMap.get(id);
    if (p) {
      const def = p.elecKey ? ELEC[p.elecKey] : (p.fixtureKey ? FIXTURES[p.fixtureKey] : null);
      names.push(def ? (def.shortName || def.name) : p.name);
    }
  }
  return names;
}

function checkGfciRequired(circuit, roomType) {
  if (circuit.gfci) return null;
  if (!GFCI_REQUIRED_TYPES.has(roomType)) return null;
  return `NEC 210.8: GFCI protection required in ${roomType}`;
}

// ─── Component ──────────────────────────────────────────────────────

export default function PanelSchedule({ project }) {
  const [expandedSlot, setExpandedSlot] = useState(null);

  const rooms = project.rooms || [];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Collect all circuits across all rooms
  const allCircuits = getAllCircuits(rooms);

  // Build slot map: breaker number -> circuit info
  const slotMap = new Map();
  for (const c of allCircuits) {
    slotMap.set(c.number, c);
    // 240V circuits occupy two slots (double-pole)
    if (is240V(c)) {
      const pairedSlot = c.number % 2 === 1 ? c.number + 1 : c.number - 1;
      slotMap.set(pairedSlot, { ...c, _paired: true });
    }
  }

  // Load summary
  const summary = projectLoadSummary(project);
  const demand = summary.demand;

  // Collect warnings
  const warnings = [];
  for (const detail of summary.circuits) {
    if (detail.loadCheck.overloaded) {
      warnings.push({
        type: 'overload',
        message: `Circuit #${detail.circuitNumber} "${detail.circuitLabel}" is overloaded at ${detail.loadCheck.percent}% capacity`,
      });
    }
    if (!detail.wireCheck.adequate && detail.wireCheck.recommendation) {
      warnings.push({
        type: 'wire',
        message: detail.wireCheck.recommendation,
      });
    }
  }

  // Check GFCI compliance
  for (const room of rooms) {
    for (const c of (room.circuits || [])) {
      const msg = checkGfciRequired(c, room.type);
      if (msg) {
        warnings.push({
          type: 'gfci',
          message: `Circuit #${c.number} "${c.label || 'Unlabeled'}" in ${room.name || room.type}: ${msg}`,
        });
      }
    }
  }

  const TOTAL_SLOTS = 42;
  const halfSlots = TOTAL_SLOTS / 2;

  // Build panel rows: each row has a left slot (odd) and right slot (even)
  const panelRows = [];
  for (let i = 0; i < halfSlots; i++) {
    const leftNum = i * 2 + 1;
    const rightNum = i * 2 + 2;
    panelRows.push({ left: leftNum, right: rightNum });
  }

  function renderSlotCell(slotNum) {
    const circuit = slotMap.get(slotNum);
    if (!circuit) {
      return (
        <>
          <td style={{ ...S.tdCenter, width: 30, fontWeight: 600, fontSize: 11, color: '#999' }}>{slotNum}</td>
          <td style={{ ...S.td, ...S.spare }}>SPARE</td>
          <td style={{ ...S.tdCenter, ...S.spare }}>--</td>
          <td style={{ ...S.tdCenter, ...S.spare }}>--</td>
          <td style={S.tdCenter}>--</td>
          <td style={S.tdCenter}>--</td>
        </>
      );
    }

    // If this is a paired half of a 240V, render a continuation indicator
    if (circuit._paired) {
      return (
        <>
          <td style={{ ...S.tdCenter, width: 30, fontWeight: 600, fontSize: 11, background: '#fce4ec' }}>{slotNum}</td>
          <td colSpan={5} style={{ ...S.td, textAlign: 'center', fontSize: 11, color: '#b71c1c', background: '#fce4ec', fontStyle: 'italic' }}>
            (paired with #{circuit.number} — 240V double-pole)
          </td>
        </>
      );
    }

    const va = circuitVA(circuit, circuit.placements);
    const check = circuitLoadCheck(circuit, circuit.placements);
    const isOverloaded = check.overloaded;
    const isExpanded = expandedSlot === slotNum;
    const color = circuit.color || CIRCUIT_COLORS[circuit.number % CIRCUIT_COLORS.length];

    return (
      <>
        <td style={{
          ...S.tdCenter,
          width: 30,
          fontWeight: 600,
          fontSize: 11,
          background: isOverloaded ? '#fff5f5' : undefined,
        }}>
          {slotNum}
        </td>
        <td style={{
          ...S.td,
          background: isOverloaded ? '#fff5f5' : undefined,
          maxWidth: 160,
        }}>
          <span style={{ ...S.colorSwatch, background: color }} />
          <button
            style={S.expandBtn}
            onClick={() => setExpandedSlot(isExpanded ? null : slotNum)}
            title="Show circuit details"
          >
            {circuit.label || `Circuit #${circuit.number}`}
          </button>
          {circuit.gfci && <span style={{ ...S.badge, ...S.badgeGfci }}>GFCI</span>}
          {circuit.afci && <span style={{ ...S.badge, ...S.badgeAfci }}>AFCI</span>}
          {is240V(circuit) && <span style={{ ...S.badge, ...S.badge240 }}>240V</span>}
        </td>
        <td style={{
          ...S.tdCenter,
          fontWeight: 600,
          background: isOverloaded ? '#fff5f5' : undefined,
        }}>
          {circuit.amperage}A
        </td>
        <td style={{
          ...S.tdCenter,
          background: isOverloaded ? '#fff5f5' : undefined,
        }}>
          #{circuit.wireGauge}
        </td>
        <td style={{
          ...S.tdCenter,
          background: isOverloaded ? '#fff5f5' : undefined,
        }}>
          {va.toLocaleString()}
        </td>
        <td style={{
          ...S.tdCenter,
          width: 80,
          background: isOverloaded ? '#fff5f5' : undefined,
        }}>
          <div style={S.loadBar}>
            <div style={S.loadBarFill(check.percent)} />
          </div>
          <span style={{
            fontSize: 10,
            color: isOverloaded ? '#ef4444' : '#666',
            fontWeight: isOverloaded ? 700 : 400,
          }}>
            {check.percent}%
          </span>
        </td>
      </>
    );
  }

  return (
    <div style={S.page}>
      {/* ─── Title Block ─── */}
      <div style={S.titleBlock}>
        <div style={S.titleLeft}>
          <h1 style={S.h1}>ELECTRICAL PANEL SCHEDULE</h1>
          <p style={{ ...S.meta, fontSize: 16, fontWeight: 500, marginTop: 4 }}>
            {project.name || 'Untitled Project'}
          </p>
          {project.address && <p style={S.meta}>{project.address}</p>}
          {project.client && <p style={S.meta}>Client: {project.client}</p>}
        </div>
        <div style={S.titleRight}>
          <p style={{ margin: '2px 0', fontWeight: 600 }}>Panel: Main Service</p>
          <p style={{ margin: '2px 0' }}>200A Main Breaker</p>
          <p style={{ margin: '2px 0' }}>120/240V, 1-Phase, 3-Wire</p>
          <p style={{ margin: '2px 0' }}>42-Space / 42-Circuit</p>
          <p style={{ margin: '6px 0 0', fontStyle: 'italic' }}>Date: {today}</p>
        </div>
      </div>

      {/* ─── Warnings ─── */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={S.h2}>Warnings ({warnings.length})</h2>
          {warnings.map((w, i) => (
            <div key={i} style={S.warningBox}>
              <span style={S.warningIcon}>
                {w.type === 'overload' ? '\u26A0' : w.type === 'wire' ? '\u26A1' : '\u2622'}
              </span>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* ─── Panel Grid ─── */}
      <h2 style={S.h2}>Panel Layout</h2>
      <table style={S.panelGrid}>
        <thead>
          <tr>
            <th style={{ ...S.thMain, width: 30 }}>#</th>
            <th style={S.thMain}>Left (Odd)</th>
            <th style={{ ...S.thMain, width: 45 }}>Amp</th>
            <th style={{ ...S.thMain, width: 40 }}>Wire</th>
            <th style={{ ...S.thMain, width: 55 }}>VA</th>
            <th style={{ ...S.thMain, width: 80 }}>Load</th>
            <th style={{ ...S.busBar }} />
            <th style={{ ...S.thMain, width: 30 }}>#</th>
            <th style={S.thMain}>Right (Even)</th>
            <th style={{ ...S.thMain, width: 45 }}>Amp</th>
            <th style={{ ...S.thMain, width: 40 }}>Wire</th>
            <th style={{ ...S.thMain, width: 55 }}>VA</th>
            <th style={{ ...S.thMain, width: 80 }}>Load</th>
          </tr>
        </thead>
        <tbody>
          {panelRows.map((row, i) => {
            const leftExpanded = expandedSlot === row.left;
            const rightExpanded = expandedSlot === row.right;
            return (
              <React.Fragment key={i}>
                <tr style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  {renderSlotCell(row.left)}
                  <td style={S.busBar} />
                  {renderSlotCell(row.right)}
                </tr>
                {leftExpanded && (
                  <tr>
                    <td colSpan={6} style={{ ...S.detailRow, padding: '6px 12px' }}>
                      {renderDetailContent(row.left)}
                    </td>
                    <td style={S.busBar} />
                    <td colSpan={6} />
                  </tr>
                )}
                {rightExpanded && (
                  <tr>
                    <td colSpan={6} />
                    <td style={S.busBar} />
                    <td colSpan={6} style={{ ...S.detailRow, padding: '6px 12px' }}>
                      {renderDetailContent(row.right)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* ─── Load Summary ─── */}
      <h2 style={S.h2}>Load Summary</h2>
      <div style={S.summaryGrid}>
        <div style={S.summaryCard}>
          <div style={S.summaryNumber}>{demand.connectedVA.toLocaleString()}</div>
          <div style={S.summaryLabel}>Connected VA</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryNumber}>{demand.demandVA.toLocaleString()}</div>
          <div style={S.summaryLabel}>Demand VA (NEC)</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryNumber}>{demand.demandAmps}</div>
          <div style={S.summaryLabel}>Demand Amps</div>
        </div>
        <div style={S.summaryCard}>
          <div style={{
            ...S.summaryNumber,
            color: demand.serviceSizeRec > 200 ? '#ef4444' : '#10b981',
          }}>
            {demand.serviceSizeRec}A
          </div>
          <div style={S.summaryLabel}>Service Size Rec.</div>
        </div>
      </div>

      {/* ─── Per-Circuit Load Breakdown ─── */}
      <h2 style={S.h2}>Circuit Load Breakdown</h2>
      <table style={S.circuitTable}>
        <thead>
          <tr>
            <th style={{ ...S.thMain, textAlign: 'left' }}>Circuit</th>
            <th style={{ ...S.thMain, textAlign: 'left' }}>Room</th>
            <th style={{ ...S.thMain, width: 50 }}>Amp</th>
            <th style={{ ...S.thMain, width: 60 }}>VA</th>
            <th style={{ ...S.thMain, width: 60 }}>Load %</th>
            <th style={{ ...S.thMain, width: 200 }}>Capacity Usage</th>
            <th style={{ ...S.thMain, width: 50 }}>Wire</th>
            <th style={{ ...S.thMain, textAlign: 'left' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {summary.circuits.map((d, i) => {
            const isOver = d.loadCheck.overloaded;
            const wireOk = d.wireCheck.adequate;
            return (
              <tr key={i} style={isOver ? S.overloadRow : { background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                <td style={{ ...S.td, fontWeight: 500 }}>
                  #{d.circuitNumber} {d.circuitLabel}
                </td>
                <td style={S.td}>{d.roomName}</td>
                <td style={S.tdCenter}>{d.loadCheck.loadAmps}A / {(d.loadCheck.maxAmps / 0.8).toFixed(0)}A</td>
                <td style={S.tdCenter}>{d.va.toLocaleString()}</td>
                <td style={{
                  ...S.tdCenter,
                  fontWeight: 600,
                  color: isOver ? '#ef4444' : d.loadCheck.percent > 60 ? '#f59e0b' : '#10b981',
                }}>
                  {d.loadCheck.percent}%
                </td>
                <td style={{ ...S.td, paddingTop: 8, paddingBottom: 8 }}>
                  <div style={S.loadBar}>
                    <div style={S.loadBarFill(d.loadCheck.percent)} />
                  </div>
                </td>
                <td style={{
                  ...S.tdCenter,
                  color: wireOk ? '#333' : '#ef4444',
                  fontWeight: wireOk ? 400 : 700,
                }}>
                  #{d.wireCheck.gauge}
                </td>
                <td style={S.td}>
                  {isOver && <span style={{ color: '#ef4444', fontWeight: 600, marginRight: 6 }}>OVERLOADED</span>}
                  {!wireOk && <span style={{ color: '#ef4444', fontWeight: 600 }}>UNDERSIZED WIRE</span>}
                  {!isOver && wireOk && <span style={{ color: '#10b981' }}>OK</span>}
                </td>
              </tr>
            );
          })}
          {summary.circuits.length === 0 && (
            <tr>
              <td colSpan={8} style={{ ...S.td, textAlign: 'center', color: '#999', padding: 20 }}>
                No circuits defined. Add circuits in the Room Editor to see load calculations.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ─── Footer ─── */}
      <div style={S.printHint}>
        Panel schedule generated by ElectraScope &middot; {today} &middot; Load calculations per NEC 220
      </div>
    </div>
  );

  // ─── Detail content renderer for expanded slots ────────────────────
  function renderDetailContent(slotNum) {
    const circuit = slotMap.get(slotNum);
    if (!circuit || circuit._paired) return null;

    const devices = getDeviceNames(circuit, circuit.placements);
    const wireCheck = wireGaugeCheck(circuit);

    return (
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11 }}>
        <div><strong>Room:</strong> {circuit.roomName}</div>
        <div><strong>Type:</strong> {circuit.type || 'general'}</div>
        <div>
          <strong>Wire:</strong> #{circuit.wireGauge} AWG
          {!wireCheck.adequate && (
            <span style={{ color: '#ef4444', marginLeft: 4, fontWeight: 600 }}>
              — {wireCheck.recommendation}
            </span>
          )}
        </div>
        <div>
          <strong>Devices ({devices.length}):</strong>{' '}
          {devices.length > 0 ? devices.join(', ') : 'None wired'}
        </div>
        {circuit.homerunTo && <div><strong>Homerun:</strong> {circuit.homerunTo}</div>}
      </div>
    );
  }
}
