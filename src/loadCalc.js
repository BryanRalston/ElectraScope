// ─── loadCalc.js ─────────────────────────────────────────────────────
// Pure utility module for NEC-based electrical load calculations.
// No React dependencies. All functions operate on plain data objects.
// ─────────────────────────────────────────────────────────────────────

// ─── VA (volt-ampere) estimates per device type ─────────────────────
// NEC 220.14(I): 180VA per general-purpose receptacle outlet.
// 240V appliances use nameplate/typical ratings.
// Switches and safety devices carry negligible or zero load.
export const DEVICE_VA = {
  // Outlets — NEC 220.14(I): 180VA per general outlet
  duplex: 180,
  gfci: 180,
  dedicated: 180,
  floor: 180,
  usb: 180,
  // 240V — rated by appliance
  range: 8000,
  dryer: 5000,
  // Lights — typical wattage (VA ≈ W for resistive loads)
  recessed: 75,
  surface: 100,
  pendant: 100,
  fanLight: 150,
  sconce: 60,
  undercab: 40,
  exterior: 75,
  // Switches — negligible load (control only)
  singlePole: 0,
  threeway: 0,
  fourway: 0,
  dimmer: 0,
  fan_switch: 0,
  smart_switch: 5,
  // Safety — minimal standby draw
  smoke: 5,
  co: 5,
  // Panel — no load itself
  panel: 0,
};

// ─── NEC 310.16 wire ampacity table (copper, 60°C column) ──────────
const WIRE_AMPACITY = {
  '14': 15,
  '12': 20,
  '10': 30,
  '8': 40,
  '6': 55,
  '4': 70,
  '3': 85,
  '2': 95,
  '1': 110,
  '1/0': 125,
  '2/0': 145,
  '3/0': 165,
  '4/0': 195,
};

// Keys that indicate a 240V circuit
const HIGH_VOLTAGE_KEYS = new Set(['range', 'dryer']);

// ─── Helper: resolve device key from a placement ────────────────────
// Placements use `elecKey` for electrical symbols or `fixtureKey` for
// physical fixtures. Only elecKey devices contribute electrical load.
function deviceKey(placement) {
  return placement.elecKey || null;
}

// ─── Helper: determine voltage for a device key ─────────────────────
function voltageForKey(key) {
  return HIGH_VOLTAGE_KEYS.has(key) ? 240 : 120;
}

// ─── Helper: collect all placements belonging to a circuit ──────────
// A placement belongs to a circuit if its id appears in any segment.
function placementsOnCircuit(circuit, allPlacements) {
  const ids = new Set();
  for (const seg of circuit.segments || []) {
    ids.add(seg.from);
    ids.add(seg.to);
  }
  return allPlacements.filter(p => ids.has(p.id));
}

// ─── circuitVA ──────────────────────────────────────────────────────
// Calculate the total VA load for a single circuit given its segments
// and the full placements array for the room.
//
// Only devices with an `elecKey` that exists in DEVICE_VA contribute.
// Fixtures (fixtureKey) are physical objects, not electrical loads.
export function circuitVA(circuit, placements) {
  const devices = placementsOnCircuit(circuit, placements);
  let total = 0;
  for (const p of devices) {
    const key = deviceKey(p);
    if (key && key in DEVICE_VA) {
      total += DEVICE_VA[key];
    }
  }
  return total;
}

// ─── roomConnectedLoad ──────────────────────────────────────────────
// Calculate total connected VA across all circuits in a room.
// `room` must have `circuits[]` and `placements[]`.
export function roomConnectedLoad(room) {
  const circuits = room.circuits || [];
  const placements = room.placements || [];
  let total = 0;
  for (const c of circuits) {
    total += circuitVA(c, placements);
  }
  return total;
}

// ─── demandLoadCalc ─────────────────────────────────────────────────
// NEC demand load calculation across multiple rooms.
//
// NEC 220.42 — General lighting demand factors:
//   First 3,000 VA at 100%, remainder at 35%.
//
// NEC 220.52 — Small appliance branch circuits:
//   Each kitchen/dining/laundry room adds 1,500 VA to the base.
//
// 240V appliance loads (range, dryer) are added at full value.
//
// Returns: { connectedVA, demandVA, demandAmps, serviceSizeRec }
export function demandLoadCalc(rooms) {
  const SMALL_APPLIANCE_TYPES = new Set([
    'Kitchen', 'Dining Room', 'Laundry', 'Pantry',
  ]);
  const SERVICE_SIZES = [100, 125, 150, 200, 225, 300, 400];

  let generalVA = 0;        // general lighting + receptacle load
  let applianceVA = 0;      // 240V appliance load (range, dryer)
  let smallApplianceCount = 0;

  for (const room of rooms) {
    const placements = room.placements || [];
    const circuits = room.circuits || [];

    // Count small-appliance circuits per NEC 220.52
    if (SMALL_APPLIANCE_TYPES.has(room.type)) {
      smallApplianceCount++;
    }

    for (const c of circuits) {
      const devices = placementsOnCircuit(c, placements);
      for (const p of devices) {
        const key = deviceKey(p);
        if (!key || !(key in DEVICE_VA)) continue;
        const va = DEVICE_VA[key];
        if (HIGH_VOLTAGE_KEYS.has(key)) {
          applianceVA += va;
        } else {
          generalVA += va;
        }
      }
    }
  }

  // NEC 220.52: small appliance circuits at 1,500 VA each
  const smallApplianceVA = smallApplianceCount * 1500;
  const totalGeneralVA = generalVA + smallApplianceVA;

  // NEC 220.42: demand factors for general lighting
  let demandGeneralVA;
  if (totalGeneralVA <= 3000) {
    demandGeneralVA = totalGeneralVA;
  } else {
    demandGeneralVA = 3000 + (totalGeneralVA - 3000) * 0.35;
  }

  const connectedVA = generalVA + smallApplianceVA + applianceVA;
  const demandVA = Math.round(demandGeneralVA + applianceVA);
  const demandAmps = Math.round((demandVA / 240) * 10) / 10; // service entrance is 240V

  // Recommend the smallest standard service size that covers demand
  let serviceSizeRec = SERVICE_SIZES[SERVICE_SIZES.length - 1];
  for (const size of SERVICE_SIZES) {
    if (size >= demandAmps) {
      serviceSizeRec = size;
      break;
    }
  }

  return { connectedVA, demandVA, demandAmps, serviceSizeRec };
}

// ─── circuitLoadCheck ───────────────────────────────────────────────
// NEC 210.20: Continuous loads must not exceed 80% of the breaker
// rating. We treat all loads as continuous for safety margin.
//
// Returns: { overloaded, loadAmps, maxAmps, percent }
export function circuitLoadCheck(circuit, placements, voltage = 120) {
  const va = circuitVA(circuit, placements);

  // Auto-detect voltage from circuit devices: if any 240V device
  // is present, use 240V for the calculation.
  let effectiveVoltage = voltage;
  const devices = placementsOnCircuit(circuit, placements);
  for (const p of devices) {
    const key = deviceKey(p);
    if (key && HIGH_VOLTAGE_KEYS.has(key)) {
      effectiveVoltage = 240;
      break;
    }
  }

  const loadAmps = Math.round((va / effectiveVoltage) * 100) / 100;
  const maxAmps = (circuit.amperage || 20) * 0.8; // 80% rule
  const percent = maxAmps > 0 ? Math.round((loadAmps / (circuit.amperage || 20)) * 100) : 0;

  return {
    overloaded: loadAmps > maxAmps,
    loadAmps,
    maxAmps,
    percent,
  };
}

// ─── wireGaugeCheck ─────────────────────────────────────────────────
// NEC 310.16: Verify the wire gauge can carry the circuit's amperage.
//
// Returns: { adequate, gauge, ampacity, amperage, recommendation }
export function wireGaugeCheck(circuit) {
  const gauge = circuit.wireGauge || '12';
  const amperage = circuit.amperage || 20;
  const ampacity = WIRE_AMPACITY[gauge];

  if (ampacity === undefined) {
    return {
      adequate: false,
      gauge,
      ampacity: 0,
      amperage,
      recommendation: `Unknown wire gauge "${gauge}". Use 14, 12, 10, 8, 6, 4, 3, 2, 1, 1/0, 2/0, 3/0, or 4/0 AWG.`,
    };
  }

  const adequate = ampacity >= amperage;

  // If inadequate, find the smallest gauge that works
  let recommendation = null;
  if (!adequate) {
    const gaugeOrder = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0'];
    for (const g of gaugeOrder) {
      if (WIRE_AMPACITY[g] >= amperage) {
        recommendation = `Wire gauge ${gauge} AWG (${ampacity}A capacity) is insufficient for ${amperage}A breaker. Use ${g} AWG or larger.`;
        break;
      }
    }
  }

  return { adequate, gauge, ampacity, amperage, recommendation };
}

// ─── projectLoadSummary ─────────────────────────────────────────────
// Generate a full load summary for a project.
//
// `project` must have `rooms[]`, each with `circuits[]` and
// `placements[]`.
//
// Returns: {
//   circuits: [{ roomName, circuitNumber, circuitLabel, type, va,
//                loadCheck, wireCheck }],
//   roomTotals: [{ roomName, connectedVA }],
//   demand: { connectedVA, demandVA, demandAmps, serviceSizeRec }
// }
export function projectLoadSummary(project) {
  const rooms = project.rooms || [];
  const circuitDetails = [];
  const roomTotals = [];

  for (const room of rooms) {
    const placements = room.placements || [];
    const circuits = room.circuits || [];
    let roomTotal = 0;

    for (const c of circuits) {
      const va = circuitVA(c, placements);
      roomTotal += va;

      circuitDetails.push({
        roomName: room.name || room.type || 'Unknown',
        circuitNumber: c.number,
        circuitLabel: c.label || `Circuit #${c.number}`,
        type: c.type || 'general',
        va,
        loadCheck: circuitLoadCheck(c, placements),
        wireCheck: wireGaugeCheck(c),
      });
    }

    roomTotals.push({
      roomName: room.name || room.type || 'Unknown',
      connectedVA: roomTotal,
    });
  }

  const demand = demandLoadCalc(rooms);

  return { circuits: circuitDetails, roomTotals, demand };
}

// ─── wireRunLengths ──────────────────────────────────────────────
// Calculate total wire run lengths by gauge across all circuits.
// Uses placement positions to estimate distances between devices,
// adding 10% slack and 6ft per homerun for panel connections.
//
// Returns: [{ gauge, lengthFt, circuits }]
export function wireRunLengths(project) {
  const SCALE = 40; // must match constants.js SCALE
  const SLACK_FACTOR = 1.1; // 10% extra for routing
  const HOMERUN_FT = 6; // average homerun stub length

  const gaugeMap = {}; // gauge -> { totalInches, circuitNums }

  for (const room of (project.rooms || [])) {
    const placements = room.placements || [];
    const placementMap = new Map(placements.map(p => [p.id, p]));

    for (const c of (room.circuits || [])) {
      const gauge = c.wireGauge || '12';
      if (!gaugeMap[gauge]) gaugeMap[gauge] = { totalInches: 0, circuitNums: [] };
      gaugeMap[gauge].circuitNums.push(c.number);

      let segmentTotal = 0;
      for (const seg of (c.segments || [])) {
        const fromP = placementMap.get(seg.from);
        const toP = placementMap.get(seg.to);
        if (!fromP || !toP) continue;
        if (fromP.cx == null || toP.cx == null) continue;
        // Manhattan distance (L-route) in pixels, convert to inches
        const dx = Math.abs(toP.cx - fromP.cx);
        const dy = Math.abs(toP.cy - fromP.cy);
        const distPx = dx + dy; // L-route
        const distInches = (distPx / SCALE) * 12; // px -> ft -> inches
        segmentTotal += distInches;
      }

      // Add homerun distance if panel connection exists
      if (c.homerunTo) {
        segmentTotal += HOMERUN_FT * 12;
      }

      gaugeMap[gauge].totalInches += segmentTotal * SLACK_FACTOR;
    }
  }

  return Object.entries(gaugeMap)
    .map(([gauge, data]) => ({
      gauge,
      lengthFt: Math.ceil(data.totalInches / 12),
      circuits: [...new Set(data.circuitNums)].sort((a, b) => a - b),
    }))
    .sort((a, b) => a.gauge.localeCompare(b.gauge, undefined, { numeric: true }));
}
