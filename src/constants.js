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

// ─── Electrical symbol categories ──────────────────────────────────
export const ECAT = ['Outlets', 'Switches', 'Lights', 'Safety', 'Panel'];

// ─── Fixture categories ───────────────────────────────────────────
export const FCAT = ['Can Light', 'Pendant', 'Chandelier', 'Sconce', 'Bath Bar', 'Flush Mount', 'Fan', 'Under Cabinet', 'Landscape', 'Track', 'Other'];

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
    path: `${SYM_OUTLET_CIRCLE} ${SYM_OUTLET_LINES}`
  },
  gfci: {
    name: 'GFCI Outlet',
    abbr: 'GFI',
    cat: 'Outlets',
    color: '#C47A15',
    path: `${SYM_OUTLET_CIRCLE} M13,21 L17,21 M23,21 L27,21 M20,16 L20,26`
  },
  dedicated: {
    name: 'Dedicated Outlet',
    abbr: 'DED',
    cat: 'Outlets',
    color: '#C47A15',
    path: `${SYM_OUTLET_CIRCLE} M14,20 L26,20 M20,14 L20,26`
  },
  range: {
    name: '240V Range Outlet',
    abbr: '240R',
    cat: 'Outlets',
    color: '#C47A15',
    path: `${SYM_OUTLET_CIRCLE} M13,14 L13,26 M20,14 L20,26 M27,14 L27,26`
  },
  dryer: {
    name: '240V Dryer Outlet',
    abbr: '240D',
    cat: 'Outlets',
    color: '#C47A15',
    path: `${SYM_OUTLET_CIRCLE} M14,14 L14,26 M26,14 L26,26 M14,20 L26,20`
  },
  floor: {
    name: 'Floor Outlet',
    abbr: 'FLR',
    cat: 'Outlets',
    color: '#C47A15',
    path: `M4,4 L36,4 L36,36 L4,36 Z M12,14 L12,26 M28,14 L28,26`
  },
  usb: {
    name: 'USB Outlet',
    abbr: 'USB',
    cat: 'Outlets',
    color: '#C47A15',
    path: `${SYM_OUTLET_CIRCLE} M16,13 L16,27 M20,10 L20,30 M24,13 L24,27`
  },
  // ── Switches ──
  singlePole: {
    name: 'Single Pole Switch',
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
    abbr: 'PNL',
    cat: 'Panel',
    color: '#666',
    path: 'M6,4 L34,4 L34,36 L6,36 Z M6,12 L34,12 M6,20 L34,20 M6,28 L34,28 M20,4 L20,36'
  }
};

// ─── Fixture presets ──────────────────────────────────────────────
export const FIXTURES = {
  can4: { name: '4" Can Light', cat: 'Can Light', watts: 10, defaultQty: 4, finish: 'White', trim: 'Baffle' },
  can6: { name: '6" Can Light', cat: 'Can Light', watts: 14, defaultQty: 4, finish: 'White', trim: 'Baffle' },
  can4_gimbal: { name: '4" Gimbal Can', cat: 'Can Light', watts: 10, defaultQty: 2, finish: 'White', trim: 'Gimbal' },
  can6_gimbal: { name: '6" Gimbal Can', cat: 'Can Light', watts: 14, defaultQty: 2, finish: 'White', trim: 'Gimbal' },
  pendant_single: { name: 'Single Pendant', cat: 'Pendant', watts: 12, defaultQty: 1, finish: 'Brushed Nickel', trim: '' },
  pendant_cluster: { name: 'Pendant Cluster (3)', cat: 'Pendant', watts: 36, defaultQty: 1, finish: 'Black', trim: '' },
  pendant_linear: { name: 'Linear Pendant', cat: 'Pendant', watts: 40, defaultQty: 1, finish: 'Black', trim: '' },
  chandelier_small: { name: 'Small Chandelier', cat: 'Chandelier', watts: 40, defaultQty: 1, finish: 'Brushed Nickel', trim: '' },
  chandelier_large: { name: 'Large Chandelier', cat: 'Chandelier', watts: 80, defaultQty: 1, finish: 'Bronze', trim: '' },
  sconce_single: { name: 'Wall Sconce', cat: 'Sconce', watts: 8, defaultQty: 2, finish: 'Brushed Nickel', trim: '' },
  sconce_double: { name: 'Double Sconce', cat: 'Sconce', watts: 16, defaultQty: 2, finish: 'Brushed Nickel', trim: '' },
  bath_2: { name: '2-Light Bath Bar', cat: 'Bath Bar', watts: 16, defaultQty: 1, finish: 'Chrome', trim: '' },
  bath_3: { name: '3-Light Bath Bar', cat: 'Bath Bar', watts: 24, defaultQty: 1, finish: 'Chrome', trim: '' },
  bath_4: { name: '4-Light Bath Bar', cat: 'Bath Bar', watts: 32, defaultQty: 1, finish: 'Chrome', trim: '' },
  flush_small: { name: 'Small Flush Mount', cat: 'Flush Mount', watts: 15, defaultQty: 1, finish: 'White', trim: '' },
  flush_large: { name: 'Large Flush Mount', cat: 'Flush Mount', watts: 30, defaultQty: 1, finish: 'Brushed Nickel', trim: '' },
  fan_42: { name: '42" Ceiling Fan', cat: 'Fan', watts: 55, defaultQty: 1, finish: 'White', trim: '' },
  fan_52: { name: '52" Ceiling Fan', cat: 'Fan', watts: 65, defaultQty: 1, finish: 'Brushed Nickel', trim: '' },
  fan_60: { name: '60" Ceiling Fan', cat: 'Fan', watts: 75, defaultQty: 1, finish: 'Matte Black', trim: '' },
  undercab_12: { name: '12" Under Cabinet', cat: 'Under Cabinet', watts: 6, defaultQty: 2, finish: 'White', trim: '' },
  undercab_24: { name: '24" Under Cabinet', cat: 'Under Cabinet', watts: 10, defaultQty: 2, finish: 'White', trim: '' },
  undercab_36: { name: '36" Under Cabinet', cat: 'Under Cabinet', watts: 14, defaultQty: 1, finish: 'White', trim: '' },
  landscape_path: { name: 'Path Light', cat: 'Landscape', watts: 3, defaultQty: 6, finish: 'Bronze', trim: '' },
  landscape_spot: { name: 'Spot Light', cat: 'Landscape', watts: 7, defaultQty: 4, finish: 'Bronze', trim: '' },
  landscape_well: { name: 'Well Light', cat: 'Landscape', watts: 5, defaultQty: 2, finish: 'Stainless', trim: '' },
  track_3: { name: '3-Head Track', cat: 'Track', watts: 30, defaultQty: 1, finish: 'White', trim: '' },
  track_4: { name: '4-Head Track', cat: 'Track', watts: 40, defaultQty: 1, finish: 'Brushed Nickel', trim: '' },
  led_strip: { name: 'LED Strip (per ft)', cat: 'Other', watts: 4, defaultQty: 8, finish: '', trim: '' },
  emergency: { name: 'Emergency Light', cat: 'Other', watts: 5, defaultQty: 1, finish: 'White', trim: '' },
  exit_sign: { name: 'Exit Sign', cat: 'Other', watts: 3, defaultQty: 1, finish: 'White', trim: '' },
};
