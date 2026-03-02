// ─── Unique ID generator ───────────────────────────────────────────
let _uidCounter = 0;
export function uid() {
  return Date.now().toString(36) + (++_uidCounter).toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Utility helpers ───────────────────────────────────────────────
export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function inToFt(inches) {
  const ft = Math.floor(inches / 12);
  const rem = Math.round(inches % 12);
  return rem === 0 ? `${ft}'` : `${ft}' ${rem}"`;
}

// ─── Room defaults ──────────────────────────────────────────────
export const DEFAULT_CEILING_HEIGHT = 9; // feet
export const WALLS = ['north', 'south', 'east', 'west'];
export const WALL_LABELS = { north: 'North Wall', south: 'South Wall', east: 'East Wall', west: 'West Wall' };

// Default mount heights in inches by symbol category
export const DEFAULT_MOUNT_HEIGHTS = {
  Outlets: 12,    // standard low outlet
  Switches: 44,   // standard switch height
  Lights: 96,     // ceiling mount (will be at ceiling height)
  Safety: 96,     // ceiling mount
  Panel: 60,      // panel center
};

// Reference height lines for wall elevation view (inches from floor)
export const HEIGHT_REFERENCES = [
  { y: 12, label: '12" Outlet', color: '#888' },
  { y: 18, label: '18" Counter Outlet', color: '#888' },
  { y: 44, label: '44" Switch', color: '#888' },
  { y: 48, label: '48" Counter', color: '#888' },
  { y: 72, label: '72" Sconce', color: '#888' },
  { y: 84, label: '84" Header', color: '#888' },
];

// ─── Electrical symbol categories ──────────────────────────────────
export const ECAT = ['Outlets', 'Switches', 'Lights', 'Safety', 'Panel'];

// ─── Fixture categories ───────────────────────────────────────────
export const FCAT = ['Kitchen', 'Cabinets', 'Bathroom', 'Laundry', 'Structure', 'Furniture'];

// ─── Room types ───────────────────────────────────────────────────
export const RTYPES = [
  'Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Dining Room',
  'Office', 'Garage', 'Laundry', 'Hallway', 'Closet',
  'Basement', 'Attic', 'Porch', 'Patio', 'Mudroom',
  'Pantry', 'Den', 'Foyer', 'Nursery', 'Other'
];

// ─── SVG path constants for electrical symbols ─────────────────────
// Standard NEC/IEEE-style plan symbols:
//   Outlets: circle with internal detail
//   Switches: "S" based with subscript modifier
//   Lights: circle with radiating lines or letter
//   Safety: circle with dot or letter
//   Panel: rectangle with divisions
//
// All paths are drawn in a 40x40 viewBox coordinate space.

const SYM_OUTLET_CIRCLE = 'M20,4 A16,16 0 1,1 19.99,4 Z';
const SYM_OUTLET_LINES = 'M12,14 L12,26 M28,14 L28,26';
const SYM_SWITCH_BASE = ''; // switches use text rendering

export const ELEC = {
  duplex: {
    name: 'Duplex Outlet',
    abbr: 'DX',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 15,
    path: `${SYM_OUTLET_CIRCLE} ${SYM_OUTLET_LINES}`
  },
  gfci: {
    name: 'GFCI Outlet',
    abbr: 'GFI',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 20,
    path: `${SYM_OUTLET_CIRCLE} M13,21 L17,21 M23,21 L27,21 M20,16 L20,26`
  },
  dedicated: {
    name: 'Dedicated Outlet',
    shortName: 'Dedicated',
    abbr: 'DED',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 20,
    path: `${SYM_OUTLET_CIRCLE} M14,20 L26,20 M20,14 L20,26`
  },
  range: {
    name: '240V Range Outlet',
    shortName: '240V Range',
    abbr: '240R',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 50,
    path: `${SYM_OUTLET_CIRCLE} M13,14 L13,26 M20,14 L20,26 M27,14 L27,26`
  },
  dryer: {
    name: '240V Dryer Outlet',
    shortName: '240V Dryer',
    abbr: '240D',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 30,
    path: `${SYM_OUTLET_CIRCLE} M14,14 L14,26 M26,14 L26,26 M14,20 L26,20`
  },
  floor: {
    name: 'Floor Outlet',
    abbr: 'FLR',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 15,
    path: `M4,4 L36,4 L36,36 L4,36 Z M12,14 L12,26 M28,14 L28,26`
  },
  usb: {
    name: 'USB Outlet',
    abbr: 'USB',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 15,
    path: `${SYM_OUTLET_CIRCLE} M16,13 L16,27 M20,10 L20,30 M24,13 L24,27`
  },
  // ── Switches ──
  singlePole: {
    name: 'Single Pole Switch',
    shortName: 'Single Pole',
    abbr: 'S',
    cat: 'Switches',
    color: '#2070C8',
    path: `${SYM_OUTLET_CIRCLE}`
  },
  threeway: {
    name: '3-Way Switch',
    abbr: 'S3',
    cat: 'Switches',
    color: '#2070C8',
    path: `${SYM_OUTLET_CIRCLE}`
  },
  fourway: {
    name: '4-Way Switch',
    abbr: 'S4',
    cat: 'Switches',
    color: '#2070C8',
    path: `${SYM_OUTLET_CIRCLE}`
  },
  dimmer: {
    name: 'Dimmer Switch',
    abbr: 'SD',
    cat: 'Switches',
    color: '#2070C8',
    path: `${SYM_OUTLET_CIRCLE}`
  },
  fan_switch: {
    name: 'Fan Speed Switch',
    shortName: 'Fan Speed',
    abbr: 'SF',
    cat: 'Switches',
    color: '#2070C8',
    path: `${SYM_OUTLET_CIRCLE}`
  },
  smart_switch: {
    name: 'Smart Switch',
    abbr: 'SS',
    cat: 'Switches',
    color: '#2070C8',
    path: `${SYM_OUTLET_CIRCLE}`
  },
  // ── Lights ──
  recessed: {
    name: 'Recessed Light',
    abbr: 'R',
    cat: 'Lights',
    color: '#1A8A50',
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M20,8 L20,32 M8,20 L32,20 M11,11 L29,29 M29,11 L11,29'
  },
  surface: {
    name: 'Surface Mount Light',
    shortName: 'Surface Mount',
    abbr: 'SF',
    cat: 'Lights',
    color: '#1A8A50',
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M10,20 L30,20'
  },
  pendant: {
    name: 'Pendant Light',
    abbr: 'P',
    cat: 'Lights',
    color: '#1A8A50',
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M20,0 L20,4'
  },
  fanLight: {
    name: 'Ceiling Fan + Light',
    shortName: 'Fan + Light',
    abbr: 'F',
    cat: 'Lights',
    color: '#1A8A50',
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M12,12 L28,28 M28,12 L12,28'
  },
  sconce: {
    name: 'Wall Sconce',
    abbr: 'WS',
    cat: 'Lights',
    color: '#1A8A50',
    path: 'M10,10 A14,14 0 0,1 30,10 L30,30 A14,14 0 0,1 10,30 Z'
  },
  undercab: {
    name: 'Under Cabinet Light',
    shortName: 'Under Cabinet',
    abbr: 'UC',
    cat: 'Lights',
    color: '#1A8A50',
    path: 'M6,14 L34,14 L34,26 L6,26 Z M10,20 L30,20'
  },
  exterior: {
    name: 'Exterior Light',
    abbr: 'EX',
    cat: 'Lights',
    color: '#1A8A50',
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M8,20 L2,20 M32,20 L38,20 M20,8 L20,2 M20,32 L20,38'
  },
  // ── Safety ──
  smoke: {
    name: 'Smoke Detector',
    abbr: 'SM',
    cat: 'Safety',
    color: '#D03030',
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M20,17 A3,3 0 1,1 19.99,17 Z'
  },
  co: {
    name: 'CO Detector',
    abbr: 'CO',
    cat: 'Safety',
    color: '#D03030',
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M20,17 A3,3 0 1,1 19.99,17 Z'
  },
  // ── Panel ──
  panel: {
    name: 'Electrical Panel',
    shortName: 'Elec Panel',
    abbr: 'PNL',
    cat: 'Panel',
    color: '#666',
    path: 'M6,4 L34,4 L34,36 L6,36 Z M6,12 L34,12 M6,20 L34,20 M6,28 L34,28 M20,4 L20,36'
  }
};

// ─── Fixture / appliance presets (physical objects for floor plan) ─
// w/h are in inches for floor plan rendering
export const FIXTURES = {
  // Kitchen
  refrigerator:  { name: 'Refrigerator',   w: 36, h: 30, wallH: 70, cat: 'Kitchen',   color: '#7AAAC0', icon: '\u{1F9CA}' },
  range:         { name: 'Range/Stove',     w: 30, h: 25, wallH: 36, cat: 'Kitchen',   color: '#C08080', icon: '\u{1F525}' },
  dishwasher:    { name: 'Dishwasher',      w: 24, h: 24, wallH: 34, cat: 'Kitchen',   color: '#7898B0', icon: '\u{1F4A7}' },
  sink_k:        { name: 'Kitchen Sink',    w: 33, h: 22, wallH: 8,  cat: 'Kitchen',   color: '#68A0B0', icon: '\u{1F6B0}', defaultMountHeight: 28 },
  microwave:     { name: 'Microwave',       w: 30, h: 16, wallH: 12, cat: 'Kitchen',   color: '#909090', icon: '\u{1F4E1}', defaultMountHeight: 54 },
  island:        { name: 'Island',          w: 60, h: 36, wallH: 36, cat: 'Kitchen',   color: '#A08868', icon: '\u{1F3DD}' },
  hood:          { name: 'Range Hood',      w: 30, h: 18, wallH: 6,  cat: 'Kitchen',   color: '#888',    icon: '\u{1F32C}', defaultMountHeight: 66 },
  // Cabinets
  upper_cab:     { name: 'Upper Cabinet',   w: 36, h: 12, wallH: 30, cat: 'Cabinets',  color: '#B09878', icon: '\u{1F5C4}', defaultMountHeight: 54 },
  lower_cab:     { name: 'Lower Cabinet',   w: 36, h: 24, wallH: 34, cat: 'Cabinets',  color: '#A08868', icon: '\u{1F5C4}' },
  cab_corner:    { name: 'Corner Cabinet',  w: 36, h: 36, wallH: 34, cat: 'Cabinets',  color: '#A08060', icon: '\u{1F4D0}' },
  pantry_cab:    { name: 'Pantry',          w: 24, h: 24, wallH: 84, cat: 'Cabinets',  color: '#987858', icon: '\u{1F5C4}' },
  // Bathroom
  toilet:        { name: 'Toilet',          w: 20, h: 28, wallH: 28, cat: 'Bathroom',  color: '#B0B8C0', icon: '\u{1F6BD}' },
  bathtub:       { name: 'Bathtub',         w: 60, h: 32, wallH: 20, cat: 'Bathroom',  color: '#90A8C0', icon: '\u{1F6C1}' },
  shower:        { name: 'Shower',          w: 36, h: 36, wallH: 80, cat: 'Bathroom',  color: '#80A0B8', icon: '\u{1F6BF}' },
  vanity:        { name: 'Vanity',          w: 48, h: 22, wallH: 34, cat: 'Bathroom',  color: '#A09888', icon: '\u{1FA9E}' },
  sink_b:        { name: 'Bath Sink',       w: 20, h: 18, wallH: 8,  cat: 'Bathroom',  color: '#80A8B8', icon: '\u{1F6B0}', defaultMountHeight: 26 },
  // Laundry
  washer:        { name: 'Washer',          w: 27, h: 27, wallH: 36, cat: 'Laundry',   color: '#88A8C0', icon: '\u{1F455}' },
  dryer:         { name: 'Dryer',           w: 27, h: 27, wallH: 36, cat: 'Laundry',   color: '#B0A088', icon: '\u{1F300}' },
  water_heater:  { name: 'Water Heater',    w: 22, h: 22, wallH: 60, cat: 'Laundry',   color: '#C08868', icon: '\u{2668}' },
  // Structure
  door_36:       { name: 'Door 36\u2033',   w: 36, h: 6,  wallH: 80, cat: 'Structure', color: '#887766', icon: '\u{1F6AA}' },
  door_30:       { name: 'Door 30\u2033',   w: 30, h: 6,  wallH: 80, cat: 'Structure', color: '#887766', icon: '\u{1F6AA}' },
  window_36:     { name: 'Window 36\u2033', w: 36, h: 6,  wallH: 36, cat: 'Structure', color: '#99BBDD', icon: '\u{1FA9F}', defaultMountHeight: 36 },
  window_48:     { name: 'Window 48\u2033', w: 48, h: 6,  wallH: 36, cat: 'Structure', color: '#99BBDD', icon: '\u{1FA9F}', defaultMountHeight: 36 },
  window_60:     { name: 'Window 60\u2033', w: 60, h: 6,  wallH: 36, cat: 'Structure', color: '#99BBDD', icon: '\u{1FA9F}', defaultMountHeight: 36 },
  closet:        { name: 'Closet',          w: 48, h: 24, wallH: 96, cat: 'Structure', color: '#998877', icon: '\u{1F454}' },
  stairs:        { name: 'Stairs',          w: 36, h: 96, wallH: 96, cat: 'Structure', color: '#887766', icon: '\u{1FA9C}' },
  // Furniture
  bed_king:      { name: 'King Bed',        w: 76, h: 80, wallH: 24, cat: 'Furniture', color: '#9080B8', icon: '\u{1F6CF}' },
  bed_queen:     { name: 'Queen Bed',       w: 60, h: 80, wallH: 24, cat: 'Furniture', color: '#8878A8', icon: '\u{1F6CF}' },
  desk:          { name: 'Desk',            w: 48, h: 24, wallH: 30, cat: 'Furniture', color: '#988058', icon: '\u{1F5A5}' },
  sofa:          { name: 'Sofa',            w: 84, h: 36, wallH: 34, cat: 'Furniture', color: '#7888A8', icon: '\u{1F6CB}' },
  tv_stand:      { name: 'TV/Media',        w: 60, h: 18, wallH: 24, cat: 'Furniture', color: '#686868', icon: '\u{1F4FA}' },
  dining_table:  { name: 'Dining Table',    w: 72, h: 42, wallH: 30, cat: 'Furniture', color: '#A08050', icon: '\u{1F37D}' },
};

// ─── Auto-labeling ──────────────────────────────────────────────
// Returns "Upper Cabinet A", "Upper Cabinet B", etc. for fixtures
// Returns "Duplex Outlet 1", "Duplex Outlet 2", etc. for electrical
export function autoLabel(baseName, existingPlacements, isFixture = false) {
  const same = existingPlacements.filter(p => {
    const pBase = (p.name || '').replace(/\s+[A-Z]$/, '').replace(/\s+\d+$/, '');
    return pBase === baseName;
  });
  const n = same.length + 1;
  if (isFixture) {
    // A, B, C, ... Z, AA, AB, ...
    const letter = n <= 26 ? String.fromCharCode(64 + n) : String.fromCharCode(64 + Math.floor((n - 1) / 26)) + String.fromCharCode(65 + ((n - 1) % 26));
    return `${baseName} ${letter}`;
  }
  return `${baseName} ${n}`;
}

// ─── Circuit Wiring ─────────────────────────────────────────────
export const SNAP_RADIUS = 20; // px — how close a click must be to snap to a device
export const DEFAULT_AMPERAGE = 20;
export const DEFAULT_WIRE_GAUGE = '12';
export const CIRCUIT_COLORS = [
  '#4af',     // blue
  '#f59e0b',  // amber
  '#10b981',  // green
  '#ef4444',  // red
  '#8b5cf6',  // purple
  '#ec4899',  // pink
  '#06b6d4',  // cyan
  '#84cc16',  // lime
  '#f97316',  // orange
  '#6366f1',  // indigo
];
