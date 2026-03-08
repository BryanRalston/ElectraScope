import React from 'react';

export const STEPS = [
  {
    title: "Welcome to ElectraScope",
    body: "This tutorial walks you through a complete whole-house electrical plan — 5 rooms, 103 devices, and 13 circuits already built. We'll explore every tool including professional floor plans, architectural views, and the new House Plan. Let's dive in!",
    view: 'project',
    target: null,
    position: 'center',
    action: null,
  },
  {
    title: "Step 1: The Project View",
    body: "You're looking at the project view. Notice the **5 room cards** — Kitchen, Living Room, Master Bedroom, Bathroom, and Hallway — each showing electrical and fixture counts. This example project has **103 devices** across **13 circuits**. From here you can access **Scope of Work**, **Panel Schedule**, **House Plan**, and **Print**.",
    view: 'project',
    target: '.room-card',
    position: 'right',
    action: 'Click the Kitchen room card to open it',
    advanceOnClick: true,
  },
  {
    title: "Step 2: Project Tools",
    body: "These buttons let you **Share** your project, view the **Scope of Work**, check the **Panel Schedule**, open the **House Plan** (whole-house electrical layout), or **Print** a permit-ready document. We'll explore these later.",
    view: 'project',
    target: '.card .row',
    position: 'below',
    action: null,
  },
  {
    title: "Step 3: The Room Editor",
    body: "This is the Room Editor — every placed item is listed here. The **Electrical** tab shows outlets, switches, lights, safety devices, and the panel. The **Fixtures** tab shows physical items like cabinets, appliances, and furniture.",
    view: 'room',
    target: '.tabs',
    position: 'below',
    action: null,
  },
  {
    title: "Step 4: Electrical Symbols",
    body: "This grid shows all available electrical items in the current category. Click any symbol to add it to the room. Items are organized by category — Outlets, Switches, Lights, Safety, and Panel.",
    view: 'room',
    target: '.symbol-grid',
    position: 'below',
    action: 'Browse the electrical symbols',
  },
  {
    title: "Step 5: Placed Items",
    body: "Each placed item shows as a card below. Click to expand and see **Qty**, **Location**, **Height**, **Circuit**, and **Spec**. Try expanding a GFCI Outlet to see its circuit assignment.",
    view: 'room',
    target: '.placement-card',
    position: 'left',
    action: 'Expand an item to see its details',
  },
  {
    title: "Step 6: Open the Floor Plan",
    body: "Click **Floor Plan** to see the visual editor where everything is laid out — architectural fixture silhouettes, industry-standard electrical symbols, and circuit wires connecting devices.",
    view: 'room',
    target: '.btn-outline',
    position: 'below',
    action: 'Click Floor Plan to open the visual editor',
    advanceOnClick: true,
  },
  {
    title: "Step 7: The Floor Plan",
    body: "This is the professional top-down floor plan. You can see:\n• **Fixtures** rendered as architectural SVG silhouettes (cabinets, appliances, furniture)\n• **Thick walls** with door openings (gaps + swing arcs) and window openings (gaps + blue glass pane lines)\n• **Electrical symbols** as industry-standard NEC/IEEE SVG paths — blue for outlets, amber for lights, red for switches/safety\n• **Circuit wires** as teal dashed lines with directional arrows\n• **Smart labels** with collision detection — room names on white pills, circuit numbers on white pills, crowded rooms get smaller fonts",
    view: 'canvas',
    target: '.floor-plan-svg',
    position: 'right',
    action: 'Explore the floor plan — click items to select them',
  },
  {
    title: "Step 8: View Tabs",
    body: "Switch between **Top View**, wall elevations (**North**, **South**, **East**, **West**), and **3D** perspective. Wall elevations show items from each wall's perspective with correct mounting heights.",
    view: 'canvas',
    target: '.view-tabs',
    position: 'below',
    action: null,
  },
  {
    title: "Step 9: The Toolbar",
    body: "Mode selection controls what happens when you click the floor plan:\n• **Fixture** — place cabinets, appliances\n• **Electric** — place outlets, switches, lights\n• **Circuit** — wire devices together\n• **Wire** — draw freehand lines\n• **Draw** — annotate the plan",
    view: 'canvas',
    target: '.toolbar',
    position: 'below',
    action: null,
  },
  {
    title: "Step 10: Circuit Wiring",
    body: "The **Circuit** tool lets you chain electrical devices together. Click one outlet, then the next — a teal dashed wire with directional arrows snaps between them. Each circuit gets a number shown on a white pill label. Press **Escape** to finish a chain.",
    view: 'canvas',
    targetFn: () => {
      const btns = document.querySelectorAll('.tool-btn');
      for (const b of btns) { if (b.textContent.includes('Circuit')) return b; }
      return null;
    },
    position: 'below',
    action: 'Try the Circuit tool to wire devices together',
  },
  {
    title: "Step 11: Circuit Configuration",
    body: "Scroll down to the **Circuits** section. Click any circuit card to configure:\n• **Label** (e.g. 'Kitchen Counter GFCI')\n• **Breaker** size (15-50A)\n• **Wire gauge** (#14-#6 AWG)\n• **GFCI/AFCI** protection toggles\n• **Homerun** panel assignment",
    view: 'canvas',
    targetFn: () => {
      const titles = document.querySelectorAll('.section-title');
      for (const t of titles) { if (t.textContent.includes('Circuits')) return t; }
      return null;
    },
    position: 'above',
    action: 'Expand a circuit card to edit its settings',
  },
  {
    title: "Step 12: Wall Elevations",
    body: "Click a wall tab to see the elevation view. Cabinets, outlets, and fixtures appear from that wall's perspective with correct mounting heights. In **Electric** mode, fixtures fade out so you can place outlets without interference.",
    view: 'canvas',
    targetFn: () => {
      const tabs = document.querySelectorAll('.view-tab');
      for (const t of tabs) { if (t.textContent.includes('North')) return t; }
      return null;
    },
    position: 'below',
    action: 'Click a wall tab to see the elevation',
  },
  {
    title: "Step 13: 3D View",
    body: "The **3D** tab shows your room in isometric perspective — all fixtures, cabinets, electrical items, and circuit wires. Use the **Rotate** slider to view from different angles. Great for client presentations.",
    view: 'canvas',
    targetFn: () => {
      const tabs = document.querySelectorAll('.view-tab');
      for (const t of tabs) { if (t.textContent.includes('3D')) return t; }
      return null;
    },
    position: 'below',
    action: 'Click 3D to see the isometric view',
  },
  {
    title: "Step 14: House Plan",
    body: "Go back to the project view and click **House Plan** to see all 5 rooms together in one unified plan. The House Plan has two modes:\n\n• **Arrange Rooms** — Drag room rectangles on a grid to position them relative to each other in your house layout\n• **Plan View** — Professional whole-house electrical plan with all rooms, shared walls, fixtures, symbols, circuits, and dual legends (Circuit Legend + Symbol Legend). Use the scale slider to adjust zoom. Hit **Print** for a permit-ready whole-house document.",
    view: 'project',
    target: '.card .row',
    position: 'below',
    action: 'Click House Plan to see the whole-house layout',
  },
  {
    title: "Step 15: Panel Schedule & Reports",
    body: "Back on the project view, try **Panel Schedule** for a professional electrical panel layout with load calculations per NEC 220. Try **Scope of Work** for a complete materials and wiring document. **Print** generates a permit-ready PDF package. Combined with the **House Plan**, you have a full set of professional deliverables.",
    view: 'project',
    target: '.card .row',
    position: 'below',
    action: 'Try Panel Schedule, Scope of Work, or Print',
  },
  {
    title: "Tutorial Complete!",
    body: "You've explored every tool in ElectraScope! From professional architectural floor plans with NEC/IEEE symbols, to the whole-house **House Plan** with drag-to-arrange rooms and unified plan view, to panel schedules and scope of work — your tutorial project is saved with all 5 rooms. Keep experimenting.\n\n**NEC Quick Reference:**\n• GFCI required within 6ft of water sources\n• Kitchen needs min. 2 dedicated 20A small-appliance circuits\n• Dedicated circuits for fridge, dishwasher, range, microwave\n• AFCI protection on nearly all 120V circuits\n• Continuous loads must not exceed 80% of breaker rating\n\nHappy planning!",
    view: null,
    target: null,
    position: 'center',
    action: null,
  },
];

export default function Tutorial({ step, totalSteps, onNext, onPrev, onClose, title, body }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.85))',
      borderTop: '2px solid #C47A15',
      padding: '16px 24px',
      color: '#fff',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#C47A15', fontWeight: 700, fontSize: 13 }}>
            TUTORIAL — Step {step + 1} of {totalSteps}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18
          }}>✕</button>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff' }}>{title}</h3>
        <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {body.split('**').map((part, i) =>
            i % 2 === 1 ? <strong key={i} style={{ color: '#C47A15' }}>{part}</strong> : part
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          {step > 0 && (
            <button onClick={onPrev} style={{
              background: 'none', border: '1px solid #555', color: '#ccc', padding: '6px 16px',
              borderRadius: 6, cursor: 'pointer', fontSize: 13
            }}>← Back</button>
          )}
          {step < totalSteps - 1 ? (
            <button onClick={onNext} style={{
              background: '#C47A15', border: 'none', color: '#fff', padding: '6px 20px',
              borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600
            }}>Next →</button>
          ) : (
            <button onClick={onClose} style={{
              background: '#C47A15', border: 'none', color: '#fff', padding: '6px 20px',
              borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600
            }}>Finish Tutorial</button>
          )}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 12, height: 3, background: '#333', borderRadius: 2 }}>
          <div style={{
            height: '100%', background: '#C47A15', borderRadius: 2,
            width: `${((step + 1) / totalSteps) * 100}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
}
