import { uid, CIRCUIT_COLORS, DEFAULT_AMPERAGE, DEFAULT_WIRE_GAUGE } from './constants';

export function findNearestDevice(placements, clickX, clickY, snapRadius) {
  let best = null, bestDist = Infinity;
  for (const p of placements) {
    if (p.cx == null || p.cy == null) continue;
    const d = Math.hypot(p.cx - clickX, p.cy - clickY);
    if (d < bestDist && d <= snapRadius) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

export function calculateRoute(fromP, toP) {
  const dx = Math.abs(toP.cx - fromP.cx);
  const dy = Math.abs(toP.cy - fromP.cy);
  const a = { x: fromP.cx, y: fromP.cy };
  const b = { x: toP.cx, y: toP.cy };
  if (dy < 5) return [a, b];
  if (dx < 5) return [a, b];
  return [a, { x: toP.cx, y: fromP.cy }, b];
}

export function createCircuit(existingCircuits) {
  const nextNum = existingCircuits.length
    ? Math.max(...existingCircuits.map(c => c.number)) + 1
    : 1;
  return {
    id: uid(),
    number: nextNum,
    label: '',
    amperage: DEFAULT_AMPERAGE,
    wireGauge: DEFAULT_WIRE_GAUGE,
    type: 'general',
    gfci: false,
    afci: true,
    segments: [],
    homerunTo: null,
    color: CIRCUIT_COLORS[nextNum % CIRCUIT_COLORS.length],
  };
}

export function addSegmentToCircuit(circuit, fromId, toId) {
  const dup = circuit.segments.some(
    s => (s.from === fromId && s.to === toId) || (s.from === toId && s.to === fromId)
  );
  if (dup) return circuit;
  return { ...circuit, segments: [...circuit.segments, { from: fromId, to: toId }] };
}

export function getCircuitForPlacement(circuits, placementId) {
  return circuits.find(c =>
    c.segments.some(s => s.from === placementId || s.to === placementId)
  ) || null;
}

export function getDevicesOnCircuit(circuit) {
  const ids = [];
  const seen = new Set();
  const add = id => { if (!seen.has(id)) { seen.add(id); ids.push(id); } };
  for (const s of circuit.segments) {
    add(s.from);
    add(s.to);
  }
  return ids;
}

export function findCircuitEndpoint(circuits, placementId) {
  for (const c of circuits) {
    if (!c.segments.length) continue;
    if (c.segments[0].from === placementId) return c;
    if (c.segments[c.segments.length - 1].to === placementId) return c;
  }
  return null;
}

export function removeDeviceFromCircuits(circuits, placementId) {
  return circuits
    .map(c => ({
      ...c,
      segments: c.segments.filter(s => s.from !== placementId && s.to !== placementId),
    }))
    .filter(c => c.segments.length > 0);
}

export function syncPlacementCircuitFields(placements, circuits) {
  const placementCircuitMap = new Map();
  for (const c of circuits) {
    for (const s of c.segments) {
      if (!placementCircuitMap.has(s.from)) placementCircuitMap.set(s.from, c.number);
      if (!placementCircuitMap.has(s.to)) placementCircuitMap.set(s.to, c.number);
    }
  }
  return placements.map(p => {
    const num = placementCircuitMap.get(p.id);
    if (num != null) {
      const label = `Cir #${num}`;
      return p.circuit === label ? p : { ...p, circuit: label };
    }
    return p;
  });
}
