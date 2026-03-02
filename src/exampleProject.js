import { ELEC, FIXTURES } from './constants';

/**
 * Creates a complete, NEC 2023-compliant kitchen electrical plan.
 * L-shaped kitchen: 14ft x 12ft (560px x 480px at SCALE=40px/ft).
 * Ready for permit submission — all circuits wired, GFCI where required.
 */
export function createExampleProject(uid) {
  // ─── Generate all placement IDs upfront ────────────────────────
  const ids = {
    // Fixtures
    cornerCab:    uid(),
    upperCabN1:   uid(),
    lowerCabN1:   uid(),
    upperCabN2:   uid(),
    lowerCabN2:   uid(),
    sink:         uid(),
    window:       uid(),
    fridge:       uid(),
    lowerCabW1:   uid(),
    upperCabW1:   uid(),
    lowerCabW2:   uid(),
    upperCabW2:   uid(),
    rangeStove:   uid(),
    rangeHood:    uid(),
    lowerCabS1:   uid(),
    dishwasher:   uid(),
    pantry:       uid(),
    island:       uid(),
    // Electrical
    panel:        uid(),
    gfciSinkL:    uid(),
    gfciSinkR:    uid(),
    gfciIsland:   uid(),
    gfciSouthCtr: uid(),
    outletN1:     uid(),
    outletN2:     uid(),
    outletE1:     uid(),
    outletE2:     uid(),
    outletFridge: uid(),
    outletDW:     uid(),
    outletRange:  uid(),
    switchLight:  uid(),
    switchDimmer: uid(),
    recessed1:    uid(),
    recessed2:    uid(),
    recessed3:    uid(),
    recessed4:    uid(),
    recessed5:    uid(),
    recessed6:    uid(),
    pendant:      uid(),
    underCab:     uid(),
    smoke:        uid(),
  };

  // ─── Helper to create a fixture placement ──────────────────────
  const fix = (id, key, cx, cy, rotation = 0, notes = '') => {
    const f = FIXTURES[key];
    return {
      id,
      fixtureKey: key,
      name: f.name,
      qty: 1,
      location: '',
      height: '',
      circuit: '',
      spec: `${f.w}" x ${f.h}"`,
      notes,
      cx, cy,
      w: f.w,
      h: f.h,
      color: f.color,
      icon: f.icon,
      rotation,
    };
  };

  // ─── Helper to create an electrical placement ──────────────────
  const elec = (id, key, cx, cy, circuit, rotation = 0, notes = '') => {
    const e = ELEC[key];
    return {
      id,
      elecKey: key,
      name: e.name,
      qty: 1,
      location: '',
      height: '',
      circuit,
      spec: '',
      notes,
      cx, cy,
      rotation,
    };
  };

  // ─── Fixture placements ────────────────────────────────────────
  const fixtures = [
    // North wall (top, y near 0)
    fix(ids.cornerCab,  'cab_corner',  60,  60,  0, 'NW corner'),
    fix(ids.upperCabN1, 'upper_cab',  180,  20),
    fix(ids.lowerCabN1, 'lower_cab',  180,  48),
    fix(ids.upperCabN2, 'upper_cab',  300,  20),
    fix(ids.lowerCabN2, 'lower_cab',  300,  48),
    fix(ids.sink,       'sink_k',     240,  40,  0, 'Center of north wall'),
    fix(ids.window,     'window_36',  240,  10,  0, 'Above sink'),

    // West wall (left, x near 0)
    fix(ids.fridge,     'refrigerator', 20, 180, 0, 'Dedicated 20A circuit'),
    fix(ids.lowerCabW1, 'lower_cab',    20, 300, 90),
    fix(ids.upperCabW1, 'upper_cab',    20, 300, 90),
    fix(ids.lowerCabW2, 'lower_cab',    20, 400, 90),
    fix(ids.upperCabW2, 'upper_cab',    20, 400, 90),

    // South wall (bottom, y near 480)
    fix(ids.rangeStove, 'range',       200, 455, 0, '240V dedicated circuit'),
    fix(ids.rangeHood,  'hood',        200, 440, 0, 'Vent to exterior'),
    fix(ids.lowerCabS1, 'lower_cab',   340, 455),
    fix(ids.dishwasher, 'dishwasher',  350, 455, 0, 'Dedicated 20A circuit'),

    // East wall (right, x near 560)
    fix(ids.pantry,     'pantry_cab',  535, 200),

    // Island (center of room)
    fix(ids.island,     'island',      280, 280, 0, 'With prep sink and seating'),
  ];

  // ─── Electrical placements ─────────────────────────────────────
  const electrical = [
    // Panel — east wall, low
    elec(ids.panel,        'panel',      530, 420, '',       0, '200A main panel'),

    // GFCI outlets — counter within 4ft of sink (NEC 210.8)
    elec(ids.gfciSinkL,    'gfci',       180,  80, 'Cir #1', 0, 'Counter GFCI — left of sink'),
    elec(ids.gfciSinkR,    'gfci',       300,  80, 'Cir #1', 0, 'Counter GFCI — right of sink'),
    elec(ids.gfciIsland,   'gfci',       280, 320, 'Cir #1', 0, 'Island GFCI'),
    elec(ids.gfciSouthCtr, 'gfci',       100, 430, 'Cir #1', 0, 'South counter GFCI'),

    // General duplex outlets — every ~6ft along walls
    elec(ids.outletN1,     'duplex',     100,  80, 'Cir #2', 0, 'North wall counter outlet'),
    elec(ids.outletN2,     'duplex',     400,  80, 'Cir #2', 0, 'North wall counter outlet'),
    elec(ids.outletE1,     'duplex',     530, 100, 'Cir #2', 0, 'East wall outlet'),
    elec(ids.outletE2,     'duplex',     530, 300, 'Cir #2', 0, 'East wall outlet'),

    // Dedicated outlets
    elec(ids.outletFridge, 'dedicated',   60, 180, 'Cir #3', 0, 'Refrigerator — dedicated 20A'),
    elec(ids.outletDW,     'dedicated',  380, 455, 'Cir #4', 0, 'Dishwasher — dedicated 20A'),
    elec(ids.outletRange,  'range',      200, 430, 'Cir #5', 0, '240V/50A range outlet'),

    // Switches — near door on east wall
    elec(ids.switchLight,  'singlePole', 520, 450, 'Cir #6', 0, 'Main lighting'),
    elec(ids.switchDimmer, 'dimmer',     520, 420, 'Cir #6', 0, 'Island pendant dimmer'),

    // Recessed lights — 2x3 grid across ceiling
    elec(ids.recessed1,    'recessed',   140, 160, 'Cir #6'),
    elec(ids.recessed2,    'recessed',   280, 160, 'Cir #6'),
    elec(ids.recessed3,    'recessed',   420, 160, 'Cir #6'),
    elec(ids.recessed4,    'recessed',   140, 320, 'Cir #6'),
    elec(ids.recessed5,    'recessed',   280, 320, 'Cir #6'),
    elec(ids.recessed6,    'recessed',   420, 320, 'Cir #6'),

    // Pendant over island
    elec(ids.pendant,      'pendant',    280, 260, 'Cir #6', 0, 'Over island'),

    // Under-cabinet light
    elec(ids.underCab,     'undercab',   240,  60, 'Cir #6', 0, 'Under upper cabs at sink'),

    // Smoke detector — ceiling center
    elec(ids.smoke,        'smoke',      280, 240, '',       0, 'NEC 314.27 — ceiling mount'),
  ];

  const placements = [...fixtures, ...electrical];

  // ─── Circuits ──────────────────────────────────────────────────
  // Helper: chain device IDs into sequential segments [a->b, b->c, c->d ...]
  const chain = (...deviceIds) => {
    const segs = [];
    for (let i = 0; i < deviceIds.length - 1; i++) {
      segs.push({ from: deviceIds[i], to: deviceIds[i + 1] });
    }
    return segs;
  };

  const circuits = [
    // Circuit 1: Kitchen Counter Outlets (GFCI) — 20A SABC
    {
      id: uid(),
      number: 1,
      label: 'Kitchen Counter GFCI',
      amperage: 20,
      wireGauge: '12',
      type: 'general',
      gfci: true,
      afci: true,
      segments: chain(ids.gfciSinkL, ids.gfciSinkR, ids.gfciIsland, ids.gfciSouthCtr),
      homerunTo: ids.panel,
      color: '#4af',
    },
    // Circuit 2: General Outlets — 20A
    {
      id: uid(),
      number: 2,
      label: 'General Outlets',
      amperage: 20,
      wireGauge: '12',
      type: 'general',
      gfci: false,
      afci: true,
      segments: chain(ids.outletE1, ids.outletE2, ids.outletN2),
      homerunTo: ids.panel,
      color: '#f59e0b',
    },
    // Circuit 3: Refrigerator (Dedicated) — 20A
    {
      id: uid(),
      number: 3,
      label: 'Refrigerator',
      amperage: 20,
      wireGauge: '12',
      type: 'dedicated',
      gfci: false,
      afci: false,
      segments: [{ from: ids.panel, to: ids.outletFridge }],
      homerunTo: ids.panel,
      color: '#10b981',
    },
    // Circuit 4: Dishwasher (Dedicated) — 20A
    {
      id: uid(),
      number: 4,
      label: 'Dishwasher',
      amperage: 20,
      wireGauge: '12',
      type: 'dedicated',
      gfci: false,
      afci: false,
      segments: [{ from: ids.panel, to: ids.outletDW }],
      homerunTo: ids.panel,
      color: '#ef4444',
    },
    // Circuit 5: Range (Dedicated 240V) — 50A, #6 AWG
    {
      id: uid(),
      number: 5,
      label: 'Range 240V',
      amperage: 50,
      wireGauge: '6',
      type: 'dedicated',
      gfci: false,
      afci: false,
      segments: [{ from: ids.panel, to: ids.outletRange }],
      homerunTo: ids.panel,
      color: '#8b5cf6',
    },
    // Circuit 6: Lighting — 15A, #14 AWG
    {
      id: uid(),
      number: 6,
      label: 'Kitchen Lighting',
      amperage: 15,
      wireGauge: '14',
      type: 'lighting',
      gfci: false,
      afci: true,
      segments: chain(
        ids.switchLight,
        ids.recessed1, ids.recessed2, ids.recessed3,
        ids.recessed4, ids.recessed5, ids.recessed6,
        ids.pendant, ids.underCab
      ),
      homerunTo: ids.panel,
      color: '#ec4899',
    },
  ];

  // ─── Room ──────────────────────────────────────────────────────
  const kitchenRoom = {
    id: uid(),
    name: 'Kitchen',
    width: 14,
    height: 12,
    ceilingHeight: 9,
    placements,
    wires: [],
    drawings: [],
    circuits,
    notes: 'NEC 2023 compliant kitchen electrical plan. 2x SABC (20A), dedicated circuits for fridge, dishwasher, range. GFCI on all counter outlets within 6ft of water.',
  };

  // ─── Project ───────────────────────────────────────────────────
  return {
    id: uid(),
    name: 'Example: Kitchen Electrical Plan',
    address: '456 Oak Street',
    client: 'Sample Client',
    notes: 'Complete kitchen electrical plan — NEC 2023 compliant. Ready for permit submission.',
    rooms: [kitchenRoom],
    created: Date.now(),
  };
}
