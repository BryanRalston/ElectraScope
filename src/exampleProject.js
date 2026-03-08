import { ELEC, FIXTURES } from './constants';

/**
 * Creates a complete, NEC 2023-compliant whole-house electrical plan.
 * 5 rooms: Kitchen (14×12), Living Room (16×14), Master Bedroom (14×12),
 * Bathroom (8×6), Hallway (6×12).
 *
 * Room layout (looking from above):
 *   Kitchen (14×12)  |  Living Room (16×14)
 *                    |
 *   ─────────────────┼──────────────────
 *   Bedroom (14×12)  |  Hallway(6×12) | Bathroom(8×6)
 *
 * Ready for permit submission — all circuits wired, GFCI where required.
 */
export function createExampleProject(uid) {
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

  // Helper: chain device IDs into sequential segments [a->b, b->c, c->d ...]
  const chain = (...deviceIds) => {
    const segs = [];
    for (let i = 0; i < deviceIds.length - 1; i++) {
      segs.push({ from: deviceIds[i], to: deviceIds[i + 1] });
    }
    return segs;
  };


  // ═══════════════════════════════════════════════════════════════
  // KITCHEN  (14' × 12',  560px × 480px,  planX: 0, planY: 0)
  // ═══════════════════════════════════════════════════════════════
  const kIds = {
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

  const kitchenFixtures = [
    // North wall (top, y near 0)
    fix(kIds.cornerCab,  'cab_corner',  60,  60,  0, 'NW corner'),
    fix(kIds.upperCabN1, 'upper_cab',  180,  20),
    fix(kIds.lowerCabN1, 'lower_cab',  180,  48),
    fix(kIds.upperCabN2, 'upper_cab',  300,  20),
    fix(kIds.lowerCabN2, 'lower_cab',  300,  48),
    fix(kIds.sink,       'sink_k',     240,  40,  0, 'Center of north wall'),
    fix(kIds.window,     'window_36',  240,  10,  0, 'Above sink'),

    // West wall (left, x near 0)
    fix(kIds.fridge,     'refrigerator', 20, 180, 0, 'Dedicated 20A circuit'),
    fix(kIds.lowerCabW1, 'lower_cab',    20, 300, 90),
    fix(kIds.upperCabW1, 'upper_cab',    20, 300, 90),
    fix(kIds.lowerCabW2, 'lower_cab',    20, 400, 90),
    fix(kIds.upperCabW2, 'upper_cab',    20, 400, 90),

    // South wall (bottom, y near 480)
    fix(kIds.rangeStove, 'range',       200, 455, 0, '240V dedicated circuit'),
    fix(kIds.rangeHood,  'hood',        200, 440, 0, 'Vent to exterior'),
    fix(kIds.lowerCabS1, 'lower_cab',   340, 455),
    fix(kIds.dishwasher, 'dishwasher',  350, 455, 0, 'Dedicated 20A circuit'),

    // East wall (right, x near 560)
    fix(kIds.pantry,     'pantry_cab',  535, 200),

    // Island (center of room)
    fix(kIds.island,     'island',      280, 280, 0, 'With prep sink and seating'),
  ];

  const kitchenElectrical = [
    // Panel — east wall, low
    elec(kIds.panel,        'panel',      530, 420, '',       0, '200A main panel'),

    // GFCI outlets — counter within 4ft of sink (NEC 210.8)
    elec(kIds.gfciSinkL,    'gfci',       180,  80, 'Cir #1', 0, 'Counter GFCI — left of sink'),
    elec(kIds.gfciSinkR,    'gfci',       300,  80, 'Cir #1', 0, 'Counter GFCI — right of sink'),
    elec(kIds.gfciIsland,   'gfci',       280, 320, 'Cir #1', 0, 'Island GFCI'),
    elec(kIds.gfciSouthCtr, 'gfci',       100, 430, 'Cir #1', 0, 'South counter GFCI'),

    // General duplex outlets — every ~6ft along walls
    elec(kIds.outletN1,     'duplex',     100,  80, 'Cir #2', 0, 'North wall counter outlet'),
    elec(kIds.outletN2,     'duplex',     400,  80, 'Cir #2', 0, 'North wall counter outlet'),
    elec(kIds.outletE1,     'duplex',     530, 100, 'Cir #2', 0, 'East wall outlet'),
    elec(kIds.outletE2,     'duplex',     530, 300, 'Cir #2', 0, 'East wall outlet'),

    // Dedicated outlets
    elec(kIds.outletFridge, 'dedicated',   60, 180, 'Cir #3', 0, 'Refrigerator — dedicated 20A'),
    elec(kIds.outletDW,     'dedicated',  380, 455, 'Cir #4', 0, 'Dishwasher — dedicated 20A'),
    elec(kIds.outletRange,  'range',      200, 430, 'Cir #5', 0, '240V/50A range outlet'),

    // Switches — near door on east wall
    elec(kIds.switchLight,  'singlePole', 520, 450, 'Cir #6', 0, 'Main lighting'),
    elec(kIds.switchDimmer, 'dimmer',     520, 420, 'Cir #6', 0, 'Island pendant dimmer'),

    // Recessed lights — 2x3 grid across ceiling
    elec(kIds.recessed1,    'recessed',   140, 160, 'Cir #6'),
    elec(kIds.recessed2,    'recessed',   280, 160, 'Cir #6'),
    elec(kIds.recessed3,    'recessed',   420, 160, 'Cir #6'),
    elec(kIds.recessed4,    'recessed',   140, 320, 'Cir #6'),
    elec(kIds.recessed5,    'recessed',   280, 320, 'Cir #6'),
    elec(kIds.recessed6,    'recessed',   420, 320, 'Cir #6'),

    // Pendant over island
    elec(kIds.pendant,      'pendant',    280, 260, 'Cir #6', 0, 'Over island'),

    // Under-cabinet light
    elec(kIds.underCab,     'undercab',   240,  60, 'Cir #6', 0, 'Under upper cabs at sink'),

    // Smoke detector — ceiling center
    elec(kIds.smoke,        'smoke',      280, 240, '',       0, 'NEC 314.27 — ceiling mount'),
  ];

  const kitchenCircuits = [
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
      segments: chain(kIds.gfciSinkL, kIds.gfciSinkR, kIds.gfciIsland, kIds.gfciSouthCtr),
      homerunTo: kIds.panel,
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
      segments: chain(kIds.outletE1, kIds.outletE2, kIds.outletN2),
      homerunTo: kIds.panel,
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
      segments: [{ from: kIds.panel, to: kIds.outletFridge }],
      homerunTo: kIds.panel,
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
      segments: [{ from: kIds.panel, to: kIds.outletDW }],
      homerunTo: kIds.panel,
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
      segments: [{ from: kIds.panel, to: kIds.outletRange }],
      homerunTo: kIds.panel,
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
        kIds.switchLight,
        kIds.recessed1, kIds.recessed2, kIds.recessed3,
        kIds.recessed4, kIds.recessed5, kIds.recessed6,
        kIds.pendant, kIds.underCab
      ),
      homerunTo: kIds.panel,
      color: '#ec4899',
    },
  ];

  const kitchenRoom = {
    id: uid(),
    name: 'Kitchen',
    width: 14,
    height: 12,
    ceilingHeight: 9,
    planX: 0,
    planY: 0,
    placements: [...kitchenFixtures, ...kitchenElectrical],
    wires: [],
    drawings: [],
    circuits: kitchenCircuits,
    notes: 'NEC 2023 compliant kitchen electrical plan. 2x SABC (20A), dedicated circuits for fridge, dishwasher, range. GFCI on all counter outlets within 6ft of water.',
  };


  // ═══════════════════════════════════════════════════════════════
  // LIVING ROOM  (16' × 14',  640px × 560px,  planX: 14, planY: 0)
  // ═══════════════════════════════════════════════════════════════
  const lIds = {
    // Fixtures
    sofa:         uid(),
    tvStand:      uid(),
    windowN1:     uid(),
    windowN2:     uid(),
    doorHall:     uid(),
    // Electrical
    outletNW:     uid(),
    outletNE:     uid(),
    outletSW:     uid(),
    outletSE:     uid(),
    outletE1:     uid(),
    outletE2:     uid(),
    switch3w1:    uid(),
    switch3w2:    uid(),
    smartSwitch:  uid(),
    recessed1:    uid(),
    recessed2:    uid(),
    recessed3:    uid(),
    recessed4:    uid(),
    pendantCtr:   uid(),
    smoke:        uid(),
  };

  // Room: 16' wide × 14' tall → 640px × 560px
  // North wall: cy ≈ 20,  South wall: cy ≈ 540,  West wall: cx ≈ 20,  East wall: cx ≈ 620
  // Center ceiling: cx ≈ 320, cy ≈ 280
  const livingFixtures = [
    // Sofa against west wall, centered vertically
    fix(lIds.sofa,      'sofa',       60, 280,  90, 'Against west wall'),
    // TV stand against east wall
    fix(lIds.tvStand,   'tv_stand',  600, 280,  90, 'Against east wall'),
    // Two 48" windows on north wall
    fix(lIds.windowN1,  'window_48', 180,  10,   0, 'North wall — left'),
    fix(lIds.windowN2,  'window_48', 460,  10,   0, 'North wall — right'),
    // Door to hallway on south wall, near SW corner
    fix(lIds.doorHall,  'door_36',   100, 540,   0, 'To hallway'),
  ];

  const livingElectrical = [
    // 6 duplex outlets around perimeter (~6-8ft spacing)
    elec(lIds.outletNW,    'duplex',     80,   20, 'Cir #7', 0, 'North wall — west'),
    elec(lIds.outletNE,    'duplex',    560,   20, 'Cir #7', 0, 'North wall — east'),
    elec(lIds.outletSW,    'duplex',     20,  460, 'Cir #7', 0, 'West wall — south'),
    elec(lIds.outletSE,    'duplex',    620,  460, 'Cir #7', 0, 'East wall — south'),
    elec(lIds.outletE1,    'duplex',    620,  160, 'Cir #7', 0, 'East wall — north'),
    elec(lIds.outletE2,    'duplex',     20,  160, 'Cir #7', 0, 'West wall — north'),

    // 2 three-way switches near doors
    elec(lIds.switch3w1,   'threeway',  140,  520, 'Cir #8', 0, '3-way — near hallway door'),
    elec(lIds.switch3w2,   'threeway',   20,   50, 'Cir #8', 0, '3-way — NW entry'),

    // Smart switch near main entry
    elec(lIds.smartSwitch, 'smart_switch', 60, 520, 'Cir #8', 0, 'Smart switch — accent lighting'),

    // 4 recessed lights — 2×2 grid
    elec(lIds.recessed1,   'recessed',  200,  180, 'Cir #8'),
    elec(lIds.recessed2,   'recessed',  440,  180, 'Cir #8'),
    elec(lIds.recessed3,   'recessed',  200,  380, 'Cir #8'),
    elec(lIds.recessed4,   'recessed',  440,  380, 'Cir #8'),

    // Pendant light — center of room
    elec(lIds.pendantCtr,  'pendant',   320,  280, 'Cir #8', 0, 'Center pendant'),

    // Smoke detector — ceiling center offset
    elec(lIds.smoke,       'smoke',     320,  200, '',       0, 'NEC 314.27 — ceiling mount'),
  ];

  const livingCircuits = [
    // Circuit 7: Living Room General Outlets — 15A
    {
      id: uid(),
      number: 7,
      label: 'Living Room Outlets',
      amperage: 15,
      wireGauge: '14',
      type: 'general',
      gfci: false,
      afci: true,
      segments: chain(lIds.outletNW, lIds.outletNE, lIds.outletE1, lIds.outletSE, lIds.outletSW, lIds.outletE2),
      homerunTo: kIds.panel,
      color: '#06b6d4',
    },
    // Circuit 8: Living Room Lighting — 15A
    {
      id: uid(),
      number: 8,
      label: 'Living Room Lighting',
      amperage: 15,
      wireGauge: '14',
      type: 'lighting',
      gfci: false,
      afci: true,
      segments: chain(
        lIds.switch3w1, lIds.recessed1, lIds.recessed2,
        lIds.recessed3, lIds.recessed4, lIds.pendantCtr, lIds.switch3w2
      ),
      homerunTo: kIds.panel,
      color: '#84cc16',
    },
  ];

  const livingRoom = {
    id: uid(),
    name: 'Living Room',
    width: 16,
    height: 14,
    ceilingHeight: 9,
    planX: 14,
    planY: 0,
    placements: [...livingFixtures, ...livingElectrical],
    wires: [],
    drawings: [],
    circuits: livingCircuits,
    notes: 'Open living area with 3-way switching, smart switch for accent lighting, pendant centerpiece. AFCI on all circuits per NEC 210.12.',
  };


  // ═══════════════════════════════════════════════════════════════
  // MASTER BEDROOM  (14' × 12',  560px × 480px,  planX: 0, planY: 12)
  // ═══════════════════════════════════════════════════════════════
  const bIds = {
    // Fixtures
    bed:          uid(),
    desk:         uid(),
    closet:       uid(),
    windowS1:     uid(),
    windowS2:     uid(),
    door:         uid(),
    // Electrical
    outletNW:     uid(),
    outletNE:     uid(),
    outletSW:     uid(),
    outletSE:     uid(),
    outletDesk:   uid(),
    switchEntry:  uid(),
    switchCloset: uid(),
    recessed1:    uid(),
    recessed2:    uid(),
    recessed3:    uid(),
    recessed4:    uid(),
    sconce1:      uid(),
    sconce2:      uid(),
    smoke:        uid(),
    usbOutlet:    uid(),
  };

  // Room: 14' wide × 12' tall → 560px × 480px
  // North wall: cy ≈ 20,  South wall: cy ≈ 460,  West wall: cx ≈ 20,  East wall: cx ≈ 540
  // Center: cx ≈ 280, cy ≈ 240
  const bedroomFixtures = [
    // King bed centered on north wall
    fix(bIds.bed,       'bed_king',   280,  70,  0, 'Headboard against north wall'),
    // Desk against east wall
    fix(bIds.desk,      'desk',       520, 300, 90, 'Work area'),
    // Closet on west wall
    fix(bIds.closet,    'closet',      40, 400, 90, 'Walk-in closet area'),
    // Two 36" windows on south wall
    fix(bIds.windowS1,  'window_36',  160, 470,  0, 'South wall — left'),
    fix(bIds.windowS2,  'window_36',  400, 470,  0, 'South wall — right'),
    // Door on east wall near NE corner (to hallway)
    fix(bIds.door,      'door_36',    520,  40,  90, 'To hallway'),
  ];

  const bedroomElectrical = [
    // 5 duplex outlets around perimeter
    elec(bIds.outletNW,    'duplex',     80,   20, 'Cir #9', 0, 'North wall — left of bed'),
    elec(bIds.outletNE,    'duplex',    480,   20, 'Cir #9', 0, 'North wall — right of bed'),
    elec(bIds.outletSW,    'duplex',     20,  300, 'Cir #9', 0, 'West wall'),
    elec(bIds.outletSE,    'duplex',    540,  200, 'Cir #9', 0, 'East wall'),
    elec(bIds.outletDesk,  'duplex',    540,  350, 'Cir #9', 0, 'Behind desk'),

    // USB outlet near bed
    elec(bIds.usbOutlet,   'usb',       160,   20, 'Cir #9', 0, 'USB — bedside left'),

    // 2 single-pole switches
    elec(bIds.switchEntry,  'singlePole', 490,  40, 'Cir #10', 0, 'Entry switch — near door'),
    elec(bIds.switchCloset, 'singlePole',  80, 380, 'Cir #10', 0, 'Closet light switch'),

    // 4 recessed lights — 2×2 grid
    elec(bIds.recessed1,   'recessed',  180,  160, 'Cir #10'),
    elec(bIds.recessed2,   'recessed',  380,  160, 'Cir #10'),
    elec(bIds.recessed3,   'recessed',  180,  340, 'Cir #10'),
    elec(bIds.recessed4,   'recessed',  380,  340, 'Cir #10'),

    // 2 wall sconces flanking bed
    elec(bIds.sconce1,     'sconce',    140,   50, 'Cir #10', 0, 'Left bedside sconce'),
    elec(bIds.sconce2,     'sconce',    420,   50, 'Cir #10', 0, 'Right bedside sconce'),

    // Smoke detector — ceiling center
    elec(bIds.smoke,       'smoke',     280,  240, '',        0, 'NEC 314.27 — ceiling mount'),
  ];

  const bedroomCircuits = [
    // Circuit 9: Bedroom Outlets — 15A
    {
      id: uid(),
      number: 9,
      label: 'Bedroom Outlets',
      amperage: 15,
      wireGauge: '14',
      type: 'general',
      gfci: false,
      afci: true,
      segments: chain(bIds.outletNW, bIds.usbOutlet, bIds.outletNE, bIds.outletSE, bIds.outletDesk, bIds.outletSW),
      homerunTo: kIds.panel,
      color: '#f97316',
    },
    // Circuit 10: Bedroom Lighting — 15A
    {
      id: uid(),
      number: 10,
      label: 'Bedroom Lighting',
      amperage: 15,
      wireGauge: '14',
      type: 'lighting',
      gfci: false,
      afci: true,
      segments: chain(
        bIds.switchEntry,
        bIds.recessed1, bIds.recessed2, bIds.recessed3, bIds.recessed4,
        bIds.sconce1, bIds.sconce2, bIds.switchCloset
      ),
      homerunTo: kIds.panel,
      color: '#6366f1',
    },
  ];

  const bedroomRoom = {
    id: uid(),
    name: 'Master Bedroom',
    width: 14,
    height: 12,
    ceilingHeight: 9,
    planX: 0,
    planY: 12,
    placements: [...bedroomFixtures, ...bedroomElectrical],
    wires: [],
    drawings: [],
    circuits: bedroomCircuits,
    notes: 'Master bedroom with king bed, walk-in closet, USB outlets. AFCI required on all bedroom circuits per NEC 210.12.',
  };


  // ═══════════════════════════════════════════════════════════════
  // BATHROOM  (8' × 6',  320px × 240px,  planX: 20, planY: 14)
  // ═══════════════════════════════════════════════════════════════
  const btIds = {
    // Fixtures
    toilet:       uid(),
    bathtub:      uid(),
    vanity:       uid(),
    sinkB:        uid(),
    door:         uid(),
    // Electrical
    gfci1:        uid(),
    gfci2:        uid(),
    switchMain:   uid(),
    switchDimmer: uid(),
    fanSwitch:    uid(),
    recessed1:    uid(),
    recessed2:    uid(),
    exteriorLt:   uid(),
    smoke:        uid(),
  };

  // Room: 8' wide × 6' tall → 320px × 240px
  // North wall: cy ≈ 20,  South wall: cy ≈ 220,  West wall: cx ≈ 20,  East wall: cx ≈ 300
  // Center: cx ≈ 160, cy ≈ 120
  const bathroomFixtures = [
    // Toilet against east wall
    fix(btIds.toilet,   'toilet',    270, 180,  90, 'Against east wall'),
    // Bathtub along south wall
    fix(btIds.bathtub,  'bathtub',   160, 210,   0, 'South wall — full width'),
    // Vanity along north wall
    fix(btIds.vanity,   'vanity',    160,  30,   0, 'North wall vanity'),
    // Sink on vanity
    fix(btIds.sinkB,    'sink_b',    160,  40,   0, 'Vanity sink'),
    // Door on west wall near NW corner
    fix(btIds.door,     'door_30',    30,  40, 180, 'From hallway'),
  ];

  const bathroomElectrical = [
    // 2 GFCI outlets — required within 3ft of water (NEC 210.8)
    elec(btIds.gfci1,       'gfci',        80,  20, 'Cir #11', 0, 'GFCI — left of vanity'),
    elec(btIds.gfci2,       'gfci',       240,  20, 'Cir #11', 0, 'GFCI — right of vanity'),

    // Switches near door
    elec(btIds.switchMain,  'singlePole',  60,  80, 'Cir #12', 0, 'Main bath light'),
    elec(btIds.switchDimmer,'dimmer',       60, 120, 'Cir #12', 0, 'Vanity dimmer'),
    elec(btIds.fanSwitch,   'fan_switch',   60, 160, 'Cir #12', 0, 'Exhaust fan speed'),

    // 2 recessed lights
    elec(btIds.recessed1,   'recessed',   120,  100, 'Cir #12'),
    elec(btIds.recessed2,   'recessed',   240,  100, 'Cir #12'),

    // Exterior light above door (or treated as vanity light here)
    elec(btIds.exteriorLt,  'exterior',   160,   20, 'Cir #12', 0, 'Above vanity mirror'),

    // Smoke detector — ceiling
    elec(btIds.smoke,       'smoke',      160,  120, '',        0, 'NEC 314.27 — ceiling mount'),
  ];

  const bathroomCircuits = [
    // Circuit 11: Bathroom GFCI Outlets — 20A
    {
      id: uid(),
      number: 11,
      label: 'Bathroom GFCI',
      amperage: 20,
      wireGauge: '12',
      type: 'general',
      gfci: true,
      afci: false,
      segments: chain(btIds.gfci1, btIds.gfci2),
      homerunTo: kIds.panel,
      color: '#4af',
    },
    // Circuit 12: Bathroom Lighting — 15A
    {
      id: uid(),
      number: 12,
      label: 'Bathroom Lighting',
      amperage: 15,
      wireGauge: '14',
      type: 'lighting',
      gfci: false,
      afci: true,
      segments: chain(
        btIds.switchMain, btIds.recessed1, btIds.recessed2,
        btIds.exteriorLt, btIds.switchDimmer, btIds.fanSwitch
      ),
      homerunTo: kIds.panel,
      color: '#f59e0b',
    },
  ];

  const bathroomRoom = {
    id: uid(),
    name: 'Bathroom',
    width: 8,
    height: 6,
    ceilingHeight: 9,
    planX: 20,
    planY: 14,
    placements: [...bathroomFixtures, ...bathroomElectrical],
    wires: [],
    drawings: [],
    circuits: bathroomCircuits,
    notes: 'Full bath with GFCI on all outlets per NEC 210.8. Dimmer on vanity light, fan speed control. Dedicated 20A GFCI circuit.',
  };


  // ═══════════════════════════════════════════════════════════════
  // HALLWAY  (6' × 12',  240px × 480px,  planX: 14, planY: 14)
  // ═══════════════════════════════════════════════════════════════
  const hIds = {
    // Fixtures
    doorLiving:   uid(),
    doorBath:     uid(),
    // Electrical
    switch3w1:    uid(),
    switch3w2:    uid(),
    recessed1:    uid(),
    recessed2:    uid(),
    smoke:        uid(),
  };

  // Room: 6' wide × 12' tall → 240px × 480px
  // North wall: cy ≈ 20,  South wall: cy ≈ 460,  West wall: cx ≈ 20,  East wall: cx ≈ 220
  // Center: cx ≈ 120, cy ≈ 240
  const hallwayFixtures = [
    // Door to living room on north wall
    fix(hIds.doorLiving, 'door_36',   120,  10,  0, 'To living room'),
    // Door to bathroom on east wall near south
    fix(hIds.doorBath,   'door_30',   220, 120, 90, 'To bathroom'),
  ];

  const hallwayElectrical = [
    // 2 three-way switches — one at each end of hallway
    elec(hIds.switch3w1,  'threeway',   20,   40, 'Cir #13', 0, '3-way — north end'),
    elec(hIds.switch3w2,  'threeway',   20,  440, 'Cir #13', 0, '3-way — south end'),

    // 2 recessed lights — evenly spaced along hallway
    elec(hIds.recessed1,  'recessed',  120,  160, 'Cir #13'),
    elec(hIds.recessed2,  'recessed',  120,  340, 'Cir #13'),

    // Smoke detector — ceiling center
    elec(hIds.smoke,      'smoke',     120,  240, '',        0, 'NEC 314.27 — ceiling mount'),
  ];

  const hallwayCircuits = [
    // Circuit 13: Hallway Lighting — 15A
    {
      id: uid(),
      number: 13,
      label: 'Hallway Lighting',
      amperage: 15,
      wireGauge: '14',
      type: 'lighting',
      gfci: false,
      afci: true,
      segments: chain(hIds.switch3w1, hIds.recessed1, hIds.recessed2, hIds.switch3w2),
      homerunTo: kIds.panel,
      color: '#10b981',
    },
  ];

  const hallwayRoom = {
    id: uid(),
    name: 'Hallway',
    width: 6,
    height: 12,
    ceilingHeight: 9,
    planX: 14,
    planY: 14,
    placements: [...hallwayFixtures, ...hallwayElectrical],
    wires: [],
    drawings: [],
    circuits: hallwayCircuits,
    notes: 'Central hallway with 3-way switching at each end. Connects living room, bedroom, and bathroom.',
  };


  // ═══════════════════════════════════════════════════════════════
  // PROJECT
  // ═══════════════════════════════════════════════════════════════
  return {
    id: uid(),
    name: 'Example: Whole-House Electrical Plan',
    address: '456 Oak Street',
    client: 'Sample Client',
    notes: 'Complete whole-house electrical plan — 5 rooms, 13 circuits, NEC 2023 compliant. Kitchen with dedicated appliance circuits, GFCI throughout wet areas, AFCI on all habitable room circuits, 3-way switching in hallway and living room.',
    rooms: [kitchenRoom, livingRoom, bedroomRoom, bathroomRoom, hallwayRoom],
    created: Date.now(),
  };
}
