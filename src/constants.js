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
// Industry-standard NEC/IEEE plan symbols.
// All paths drawn in a 40×40 viewBox, centered at (20,20).
//
//   Outlets:  circle with internal prong detail
//   Switches: dot with angled toggle arm and modifier
//   Lights:   circle/square with radiating lines or detail
//   Safety:   circle with letter identifier
//   Panel:    rectangle with grid divisions

const SYM_OUTLET_CIRCLE = 'M20,4 A16,16 0 1,1 19.99,4 Z';

export const ELEC = {
  // ── Outlets ──────────────────────────────────────────────────────
  duplex: {
    name: 'Duplex Outlet',
    abbr: 'DX',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 15,
    // Circle with two short parallel vertical lines (prong slots)
    path: `${SYM_OUTLET_CIRCLE} M15,14 L15,26 M25,14 L25,26`
  },
  gfci: {
    name: 'GFCI Outlet',
    abbr: 'GFI',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 20,
    // Circle with two prong lines plus horizontal test/reset bar
    path: `${SYM_OUTLET_CIRCLE} M15,14 L15,26 M25,14 L25,26 M12,20 L28,20`
  },
  dedicated: {
    name: 'Dedicated Outlet',
    shortName: 'Dedicated',
    abbr: 'DED',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 20,
    // Circle with bold cross (dedicated circuit)
    path: `${SYM_OUTLET_CIRCLE} M12,20 L28,20 M20,12 L20,28`
  },
  range: {
    name: '240V Range Outlet',
    shortName: '240V Range',
    abbr: '240R',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 50,
    // Circle with three vertical lines (3-prong 240V)
    path: `${SYM_OUTLET_CIRCLE} M13,14 L13,26 M20,14 L20,26 M27,14 L27,26`
  },
  dryer: {
    name: '240V Dryer Outlet',
    shortName: '240V Dryer',
    abbr: '240D',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 30,
    // Circle with L-shape prong (two vertical + one horizontal)
    path: `${SYM_OUTLET_CIRCLE} M14,13 L14,27 M26,13 L26,27 M14,20 L26,20`
  },
  floor: {
    name: 'Floor Outlet',
    abbr: 'FLR',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 15,
    // Square floor-box outline with outlet circle inside
    path: 'M4,4 L36,4 L36,36 L4,36 Z M20,10 A10,10 0 1,1 19.99,10 Z M17,16 L17,24 M23,16 L23,24'
  },
  usb: {
    name: 'USB Outlet',
    abbr: 'USB',
    cat: 'Outlets',
    color: '#C47A15',
    amps: 15,
    // Circle with USB trident-style vertical bars
    path: `${SYM_OUTLET_CIRCLE} M16,13 L16,27 M20,10 L20,30 M24,13 L24,27`
  },

  // ── Switches ─────────────────────────────────────────────────────
  singlePole: {
    name: 'Single Pole Switch',
    shortName: 'Single Pole',
    abbr: 'S',
    cat: 'Switches',
    color: '#2070C8',
    // Dot with angled toggle arm extending upper-right
    path: 'M20,22 A4,4 0 1,1 19.99,22 Z M22,18 L34,6'
  },
  threeway: {
    name: '3-Way Switch',
    abbr: 'S3',
    cat: 'Switches',
    color: '#2070C8',
    // Dot with toggle arm + "3" indicator (small subscript mark)
    path: 'M20,22 A4,4 0 1,1 19.99,22 Z M22,18 L34,6 M33,12 Q36,12 36,15 Q36,18 33,18 Q30,18 30,15 M30,12 L36,12'
  },
  fourway: {
    name: '4-Way Switch',
    abbr: 'S4',
    cat: 'Switches',
    color: '#2070C8',
    // Dot with toggle arm + "4" indicator
    path: 'M20,22 A4,4 0 1,1 19.99,22 Z M22,18 L34,6 M31,12 L31,19 M29,15 L34,15'
  },
  dimmer: {
    name: 'Dimmer Switch',
    abbr: 'SD',
    cat: 'Switches',
    color: '#2070C8',
    // Dot with toggle arm + half-moon arc (dimmer indicator)
    path: 'M20,22 A4,4 0 1,1 19.99,22 Z M22,18 L34,6 M32,14 A5,5 0 0,1 32,24'
  },
  fan_switch: {
    name: 'Fan Speed Switch',
    shortName: 'Fan Speed',
    abbr: 'SF',
    cat: 'Switches',
    color: '#2070C8',
    // Dot with toggle arm + "F" letter
    path: 'M20,22 A4,4 0 1,1 19.99,22 Z M22,18 L34,6 M30,12 L30,20 M30,12 L36,12 M30,16 L34,16'
  },
  smart_switch: {
    name: 'Smart Switch',
    abbr: 'SS',
    cat: 'Switches',
    color: '#2070C8',
    // Dot with toggle arm + wifi arcs
    path: 'M20,22 A4,4 0 1,1 19.99,22 Z M22,18 L34,6 M31,19 A3,3 0 0,1 37,19 M29,22 A6,6 0 0,1 39,22 M27,25 A9,9 0 0,1 41,25'
  },

  // ── Lights ───────────────────────────────────────────────────────
  recessed: {
    name: 'Recessed Light',
    abbr: 'R',
    cat: 'Lights',
    color: '#1A8A50',
    // Circle with 4 radiating cross lines (standard recessed symbol)
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M20,4 L20,36 M4,20 L36,20'
  },
  surface: {
    name: 'Surface Mount Light',
    shortName: 'Surface Mount',
    abbr: 'SF',
    cat: 'Lights',
    color: '#1A8A50',
    // Square with X cross inside (standard surface-mount fixture)
    path: 'M6,6 L34,6 L34,34 L6,34 Z M6,6 L34,34 M34,6 L6,34'
  },
  pendant: {
    name: 'Pendant Light',
    abbr: 'P',
    cat: 'Lights',
    color: '#1A8A50',
    // Circle with cord/chain line extending upward
    path: 'M20,8 A12,12 0 1,1 19.99,8 Z M20,0 L20,8'
  },
  fanLight: {
    name: 'Ceiling Fan + Light',
    shortName: 'Fan + Light',
    abbr: 'F',
    cat: 'Lights',
    color: '#1A8A50',
    // Circle with 4 curved fan blades radiating from center
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M20,20 C14,20 8,14 8,8 M20,20 C20,14 26,8 32,8 M20,20 C26,20 32,26 32,32 M20,20 C20,26 14,32 8,32'
  },
  sconce: {
    name: 'Wall Sconce',
    abbr: 'WS',
    cat: 'Lights',
    color: '#1A8A50',
    // Half-circle (flat side against wall at top)
    path: 'M8,16 L32,16 A12,12 0 0,1 8,16 Z'
  },
  undercab: {
    name: 'Under Cabinet Light',
    shortName: 'Under Cabinet',
    abbr: 'UC',
    cat: 'Lights',
    color: '#1A8A50',
    // Thin horizontal rectangle with center line
    path: 'M4,16 L36,16 L36,24 L4,24 Z M4,20 L36,20'
  },
  exterior: {
    name: 'Exterior Light',
    abbr: 'EX',
    cat: 'Lights',
    color: '#1A8A50',
    // Circle with 4 radiating lines extending outside the circle (sun symbol)
    path: 'M20,8 A12,12 0 1,1 19.99,8 Z M8,20 L2,20 M32,20 L38,20 M20,8 L20,2 M20,32 L20,38'
  },

  // ── Safety ───────────────────────────────────────────────────────
  smoke: {
    name: 'Smoke Detector',
    abbr: 'SM',
    cat: 'Safety',
    color: '#D03030',
    // Circle with "S" curve inside and radiating dashes
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M16,14 Q24,14 24,20 Q24,26 16,26 M6,20 L2,20 M34,20 L38,20 M20,2 L20,0 M20,36 L20,38'
  },
  co: {
    name: 'CO Detector',
    abbr: 'CO',
    cat: 'Safety',
    color: '#D03030',
    // Circle with "CO" text paths inside
    path: 'M20,4 A16,16 0 1,1 19.99,4 Z M15,15 Q10,15 10,20 Q10,25 15,25 M22,15 Q27,15 27,20 Q27,25 22,25 Q17,25 17,20 Q17,15 22,15 Z'
  },

  // ── Panel ────────────────────────────────────────────────────────
  panel: {
    name: 'Electrical Panel',
    shortName: 'Elec Panel',
    abbr: 'PNL',
    cat: 'Panel',
    color: '#666',
    // Rectangle with grid divisions (breaker panel)
    path: 'M6,4 L34,4 L34,36 L6,36 Z M6,12 L34,12 M6,20 L34,20 M6,28 L34,28 M20,4 L20,36'
  }
};

// ─── Fixture / appliance presets (physical objects for floor plan) ─
// w/h are in inches for floor plan rendering
// planPath: top-down architectural silhouette SVG path (40×40 viewBox)
export const FIXTURES = {
  // ── Kitchen ──────────────────────────────────────────────────────
  refrigerator: {
    name: 'Refrigerator', w: 36, h: 30, wallH: 70, cat: 'Kitchen', color: '#7AAAC0', icon: '\u{1F9CA}',
    // Rectangle with horizontal door-seam line near top
    planPath: 'M4,4 L36,4 L36,36 L4,36 Z M4,10 L36,10'
  },
  range: {
    name: 'Range/Stove', w: 30, h: 25, wallH: 36, cat: 'Kitchen', color: '#C08080', icon: '\u{1F525}',
    // Rectangle with 4 burner circles in 2×2 grid
    planPath: 'M4,4 L36,4 L36,36 L4,36 Z M13,13 A4,4 0 1,1 12.99,13 Z M27,13 A4,4 0 1,1 26.99,13 Z M13,27 A4,4 0 1,1 12.99,27 Z M27,27 A4,4 0 1,1 26.99,27 Z'
  },
  dishwasher: {
    name: 'Dishwasher', w: 24, h: 24, wallH: 34, cat: 'Kitchen', color: '#7898B0', icon: '\u{1F4A7}',
    // Rectangle with horizontal handle line near front (bottom) edge
    planPath: 'M4,4 L36,4 L36,36 L4,36 Z M10,32 L30,32'
  },
  sink_k: {
    name: 'Kitchen Sink', w: 33, h: 22, wallH: 8, cat: 'Kitchen', color: '#68A0B0', icon: '\u{1F6B0}', defaultMountHeight: 28,
    // Rectangle with two oval basins and center drain dot
    planPath: 'M2,6 L38,6 L38,34 L2,34 Z M4,10 Q4,8 6,8 L17,8 Q19,8 19,10 L19,30 Q19,32 17,32 L6,32 Q4,32 4,30 Z M21,10 Q21,8 23,8 L34,8 Q36,8 36,10 L36,30 Q36,32 34,32 L23,32 Q21,32 21,30 Z M20,20 A1.5,1.5 0 1,1 19.99,20 Z'
  },
  microwave: {
    name: 'Microwave', w: 30, h: 16, wallH: 12, cat: 'Kitchen', color: '#909090', icon: '\u{1F4E1}', defaultMountHeight: 54,
    // Simple small rectangle
    planPath: 'M6,10 L34,10 L34,30 L6,30 Z'
  },
  island: {
    name: 'Island', w: 60, h: 36, wallH: 36, cat: 'Kitchen', color: '#A08868', icon: '\u{1F3DD}',
    // Large clean rectangle
    planPath: 'M3,6 L37,6 L37,34 L3,34 Z'
  },
  hood: {
    name: 'Range Hood', w: 30, h: 18, wallH: 6, cat: 'Kitchen', color: '#888', icon: '\u{1F32C}', defaultMountHeight: 66,
    // Rectangle with inner vent rectangle
    planPath: 'M4,6 L36,6 L36,34 L4,34 Z M10,12 L30,12 L30,28 L10,28 Z'
  },

  // ── Cabinets ─────────────────────────────────────────────────────
  upper_cab: {
    name: 'Upper Cabinet', w: 36, h: 12, wallH: 30, cat: 'Cabinets', color: '#B09878', icon: '\u{1F5C4}', defaultMountHeight: 54,
    // Rectangle with centered horizontal door division
    planPath: 'M4,8 L36,8 L36,32 L4,32 Z M4,20 L36,20'
  },
  lower_cab: {
    name: 'Lower Cabinet', w: 36, h: 24, wallH: 34, cat: 'Cabinets', color: '#A08868', icon: '\u{1F5C4}',
    // Rectangle with centered horizontal door division
    planPath: 'M4,6 L36,6 L36,34 L4,34 Z M4,20 L36,20'
  },
  cab_corner: {
    name: 'Corner Cabinet', w: 36, h: 36, wallH: 34, cat: 'Cabinets', color: '#A08060', icon: '\u{1F4D0}',
    // L-shape with diagonal cut
    planPath: 'M4,4 L24,4 L24,16 L36,16 L36,36 L4,36 Z M4,4 L36,36'
  },
  pantry_cab: {
    name: 'Pantry', w: 24, h: 24, wallH: 84, cat: 'Cabinets', color: '#987858', icon: '\u{1F5C4}',
    // Rectangle with vertical division line
    planPath: 'M6,4 L34,4 L34,36 L6,36 Z M20,4 L20,36'
  },

  // ── Bathroom ─────────────────────────────────────────────────────
  toilet: {
    name: 'Toilet', w: 20, h: 28, wallH: 28, cat: 'Bathroom', color: '#B0B8C0', icon: '\u{1F6BD}',
    // Rectangular tank at top + elongated oval bowl below — classic toilet plan symbol
    planPath: 'M10,4 L30,4 L30,12 L10,12 Z M20,12 Q32,12 32,24 Q32,36 20,38 Q8,36 8,24 Q8,12 20,12 Z'
  },
  bathtub: {
    name: 'Bathtub', w: 60, h: 32, wallH: 20, cat: 'Bathroom', color: '#90A8C0', icon: '\u{1F6C1}',
    // Rounded rectangle outer wall + nested rounded interior contour
    planPath: 'M4,4 Q4,2 6,2 L34,2 Q36,2 36,4 L36,36 Q36,38 34,38 L6,38 Q4,38 4,36 Z M8,6 Q8,5 9,5 L31,5 Q32,5 32,6 L32,34 Q32,35 31,35 L9,35 Q8,35 8,34 Z'
  },
  shower: {
    name: 'Shower', w: 36, h: 36, wallH: 80, cat: 'Bathroom', color: '#80A0B8', icon: '\u{1F6BF}',
    // Square with drain circle in corner
    planPath: 'M4,4 L36,4 L36,36 L4,36 Z M30,30 A3,3 0 1,1 29.99,30 Z'
  },
  vanity: {
    name: 'Vanity', w: 48, h: 22, wallH: 34, cat: 'Bathroom', color: '#A09888', icon: '\u{1FA9E}',
    // Rectangle with oval basin inset
    planPath: 'M3,6 L37,6 L37,34 L3,34 Z M14,14 A6,6 0 1,1 14,26 A6,6 0 1,1 14,14 Z'
  },
  sink_b: {
    name: 'Bath Sink', w: 20, h: 18, wallH: 8, cat: 'Bathroom', color: '#80A8B8', icon: '\u{1F6B0}', defaultMountHeight: 26,
    // Small oval basin
    planPath: 'M8,8 A12,12 0 1,1 8,32 A12,12 0 1,1 8,8 Z'
  },

  // ── Laundry ──────────────────────────────────────────────────────
  washer: {
    name: 'Washer', w: 27, h: 27, wallH: 36, cat: 'Laundry', color: '#88A8C0', icon: '\u{1F455}',
    // Rectangle with inscribed circle (drum)
    planPath: 'M4,4 L36,4 L36,36 L4,36 Z M20,8 A12,12 0 1,1 19.99,8 Z'
  },
  dryer: {
    name: 'Dryer', w: 27, h: 27, wallH: 36, cat: 'Laundry', color: '#B0A088', icon: '\u{1F300}',
    // Rectangle with inscribed circle (drum) + small vent notch at back
    planPath: 'M4,4 L18,4 L18,2 L22,2 L22,4 L36,4 L36,36 L4,36 Z M20,8 A12,12 0 1,1 19.99,8 Z'
  },
  water_heater: {
    name: 'Water Heater', w: 22, h: 22, wallH: 60, cat: 'Laundry', color: '#C08868', icon: '\u{2668}',
    // Circle (cylindrical tank from above)
    planPath: 'M20,4 A16,16 0 1,1 19.99,4 Z'
  },

  // ── Structure ────────────────────────────────────────────────────
  door_36: {
    name: 'Door 36\u2033', w: 36, h: 6, wallH: 80, cat: 'Structure', color: '#887766', icon: '\u{1F6AA}',
    // Thin door line with quarter-circle swing arc — classic architectural door symbol
    planPath: 'M4,36 L4,32 L36,32 L36,36 Z M4,32 A32,32 0 0,1 36,0'
  },
  door_30: {
    name: 'Door 30\u2033', w: 30, h: 6, wallH: 80, cat: 'Structure', color: '#887766', icon: '\u{1F6AA}',
    // Same door symbol with smaller arc radius
    planPath: 'M6,36 L6,32 L34,32 L34,36 Z M6,32 A28,28 0 0,1 34,4'
  },
  window_36: {
    name: 'Window 36\u2033', w: 36, h: 6, wallH: 36, cat: 'Structure', color: '#99BBDD', icon: '\u{1FA9F}', defaultMountHeight: 36,
    // Three parallel lines (wall break with glazing)
    planPath: 'M4,16 L36,16 M4,20 L36,20 M4,24 L36,24'
  },
  window_48: {
    name: 'Window 48\u2033', w: 48, h: 6, wallH: 36, cat: 'Structure', color: '#99BBDD', icon: '\u{1FA9F}', defaultMountHeight: 36,
    // Three parallel lines, wider
    planPath: 'M2,16 L38,16 M2,20 L38,20 M2,24 L38,24'
  },
  window_60: {
    name: 'Window 60\u2033', w: 60, h: 6, wallH: 36, cat: 'Structure', color: '#99BBDD', icon: '\u{1FA9F}', defaultMountHeight: 36,
    // Three parallel lines, widest
    planPath: 'M1,16 L39,16 M1,20 L39,20 M1,24 L39,24'
  },
  closet: {
    name: 'Closet', w: 48, h: 24, wallH: 96, cat: 'Structure', color: '#998877', icon: '\u{1F454}',
    // Rectangle with horizontal shelf line
    planPath: 'M4,4 L36,4 L36,36 L4,36 Z M4,12 L36,12'
  },
  stairs: {
    name: 'Stairs', w: 36, h: 96, wallH: 96, cat: 'Structure', color: '#887766', icon: '\u{1FA9C}',
    // Rectangle with parallel tread lines and direction arrow
    planPath: 'M4,2 L36,2 L36,38 L4,38 Z M4,7 L36,7 M4,12 L36,12 M4,17 L36,17 M4,22 L36,22 M4,27 L36,27 M4,32 L36,32 M20,38 L20,22 M15,27 L20,22 L25,27'
  },

  // ── Furniture ────────────────────────────────────────────────────
  bed_king: {
    name: 'King Bed', w: 76, h: 80, wallH: 24, cat: 'Furniture', color: '#9080B8', icon: '\u{1F6CF}',
    // Rectangle with headboard line at top and two pillow rectangles
    planPath: 'M3,3 L37,3 L37,37 L3,37 Z M3,3 L37,3 L37,7 L3,7 Z M5,8 L18,8 L18,14 L5,14 Z M22,8 L35,8 L35,14 L22,14 Z'
  },
  bed_queen: {
    name: 'Queen Bed', w: 60, h: 80, wallH: 24, cat: 'Furniture', color: '#8878A8', icon: '\u{1F6CF}',
    // Same as king, slightly narrower proportions
    planPath: 'M5,3 L35,3 L35,37 L5,37 Z M5,3 L35,3 L35,7 L5,7 Z M7,8 L19,8 L19,14 L7,14 Z M21,8 L33,8 L33,14 L21,14 Z'
  },
  desk: {
    name: 'Desk', w: 48, h: 24, wallH: 30, cat: 'Furniture', color: '#988058', icon: '\u{1F5A5}',
    // Simple rectangle
    planPath: 'M4,8 L36,8 L36,32 L4,32 Z'
  },
  sofa: {
    name: 'Sofa', w: 84, h: 36, wallH: 34, cat: 'Furniture', color: '#7888A8', icon: '\u{1F6CB}',
    // Rectangle with thick backrest at top and arm segments on sides
    planPath: 'M3,6 L37,6 L37,34 L3,34 Z M3,6 L37,6 L37,12 L3,12 Z M3,12 L7,12 L7,34 L3,34 Z M33,12 L37,12 L37,34 L33,34 Z'
  },
  tv_stand: {
    name: 'TV/Media', w: 60, h: 18, wallH: 24, cat: 'Furniture', color: '#686868', icon: '\u{1F4FA}',
    // Thin wide rectangle
    planPath: 'M2,14 L38,14 L38,26 L2,26 Z'
  },
  dining_table: {
    name: 'Dining Table', w: 72, h: 42, wallH: 30, cat: 'Furniture', color: '#A08050', icon: '\u{1F37D}',
    // Rounded rectangle / oval
    planPath: 'M10,6 L30,6 Q38,6 38,14 L38,26 Q38,34 30,34 L10,34 Q2,34 2,26 L2,14 Q2,6 10,6 Z'
  },
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
