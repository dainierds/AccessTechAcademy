"use client";

/* ============================================================
   lib/sandboxEngine.ts — Motor de Simulación Eléctrica Sandbox
   Clonado y replicado exactamente según la especificación técnica de engine.js & devices.js.
   ============================================================ */

export const V_SUPPLY = 12.0;

export function termKey(devId: string, termId: string): string {
  return devId + ':' + termId;
}

/* ---------- Union-Find (Redes Eléctricas) ---------- */
export class UF {
  p: Map<string, string>;

  constructor() {
    this.p = new Map();
  }

  find(x: string): string {
    if (!this.p.has(x)) this.p.set(x, x);
    let r = x;
    while (this.p.get(r) !== r) r = this.p.get(r)!;
    let c = x;
    while (this.p.get(c) !== c) {
      const n = this.p.get(c)!;
      this.p.set(c, r);
      c = n;
    }
    return r;
  }

  union(a: string, b: string): void {
    this.p.set(this.find(a), this.find(b));
  }
}

export interface ScenarioDevice {
  id: string;
  type: string;
  x?: number;
  y?: number;
  state?: any;
}

export interface ScenarioConductor {
  color: string;
  a: { dev: string; term: string };
  b: { dev: string; term: string };
}

export interface ScenarioCable {
  id: string;
  type: string;
  conductors: ScenarioConductor[];
}

export interface Scenario {
  name: string;
  devices: ScenarioDevice[];
  cables: ScenarioCable[];
}

/* Estado de interacción por defecto de cada dispositivo */
export function defaultSimState(scenario: Scenario): Record<string, any> {
  const s: Record<string, any> = {};
  for (const d of scenario.devices) {
    const def = SANDBOX_DEVICES[d.type];
    const st: Record<string, any> = {};
    if (def && def.action && def.action.def !== undefined) {
      st[def.action.stateKey] = def.action.def;
    }
    s[d.id] = st;
  }
  return s;
}

/* Puentes internos (contactos secos y relés) activos según el estado del dispositivo */
export function internalBridges(d: ScenarioDevice, devState: any, simSt: any): [string, string][] {
  const B: [string, string][] = [];
  switch (d.type) {
    case 'door-controller':
    case 'controller': {
      const relayOn = devState.relay; // relé energizado
      B.push(relayOn ? ['com', 'no'] : ['com', 'nc']);
      break;
    }
    case 'push-to-exit':
    case 'rex-button':
      if (simSt.pressed) B.push(['c', 'no']);
      break;
    case 'door-position':
    case 'dps':
      if (simSt.doorClosed !== false) B.push(['c', 'no']);
      break;
    case 'motion-sensor':
    case 'pir-sensor':
      if (devState.powered && simSt.motion) B.push(['c', 'no']);
      break;
  }
  return B;
}

/* Evaluación de punto fijo (Fixed-point net classification: HOT, GND, SHORT, FLOAT) */
export function buildModel(scenario: Scenario, simState: Record<string, any>) {
  const devState: Record<string, any> = {}; // estados calculados (energizado, relay, etc.)
  const faults: string[] = [];

  // inicializar
  for (const d of scenario.devices) {
    devState[d.id] = { energized: false, relay: false, powered: false, pwrLed: false };
  }

  let uf = new UF();
  let netClass: Record<string, string> = {};

  for (let iter = 0; iter < 8; iter++) {
    uf = new UF();
    // 1) conductores
    for (const cable of scenario.cables) {
      for (const c of cable.conductors) {
        uf.union(termKey(c.a.dev, c.a.term), termKey(c.b.dev, c.b.term));
      }
    }
    // 2) puentes internos (con estados de la iteración anterior)
    for (const d of scenario.devices) {
      for (const [t1, t2] of internalBridges(d, devState[d.id], simState[d.id] || {})) {
        uf.union(termKey(d.id, t1), termKey(d.id, t2));
      }
    }

    // 3) clasificar redes
    netClass = {};
    // fuentes de poder
    for (const d of scenario.devices) {
      if (d.type !== 'power-supply' && d.type !== 'powerSupply') continue;
      const on = simState[d.id] && simState[d.id].power !== false;
      if (on) {
        const pos = uf.find(termKey(d.id, 'pos'));
        const neg = uf.find(termKey(d.id, 'neg'));
        netClass[pos] = (netClass[pos] === 'GND') ? 'SHORT' : 'HOT';
        netClass[neg] = (netClass[neg] === 'HOT') ? 'SHORT' : 'GND';
      }
    }

    // 4) recalcular bobinas / dispositivos alimentados
    let changed = false;
    for (const d of scenario.devices) {
      const st = devState[d.id];
      const netOf = (t: string) => netClass[uf.find(termKey(d.id, t))] || 'FLOAT';

      const coil = (p: string, n: string) => (netOf(p) === 'HOT' && netOf(n) === 'GND');
      const rev = (p: string, n: string) => (netOf(p) === 'GND' && netOf(n) === 'HOT');

      switch (d.type) {
        case 'door-controller':
        case 'controller': {
          const powered = coil('pwrp', 'pwrn');
          if (rev('pwrp', 'pwrn')) {
            if (!faults.includes('rev-ctrl')) faults.push('rev-ctrl');
          }
          // REX activo cuando la entrada REX está a GND
          const rexActive = powered && netOf('rex') === 'GND';
          const relay = powered && !rexActive;
          if (powered !== st.powered || relay !== st.relay) {
            st.powered = powered;
            st.relay = relay;
            st.pwrLed = powered;
            changed = true;
          }
          st.rexActive = rexActive;
          break;
        }
        case 'maglock':
        case 'door-strike':
        case 'electricStrike':
        case 'crashbar':
        case 'panicBar': {
          const en = coil('pos', 'neg');
          if (en !== st.energized) {
            st.energized = en;
            changed = true;
          }
          st.reversed = rev('pos', 'neg');
          break;
        }
        case 'motion-sensor':
        case 'pirSensor': {
          const pw = coil('pwrp', 'pwrn');
          if (pw !== st.powered) {
            st.powered = pw;
            changed = true;
          }
          break;
        }
      }
    }
    if (!changed && iter > 0) break;
  }

  // ------- fallas -------
  const netOfKey = (k: string) => netClass[uf.find(k)] || 'FLOAT';
  for (const nid in netClass) {
    if (netClass[nid] === 'SHORT') {
      faults.push('¡CORTOCIRCUITO! Una red conecta +12V directo a GND. Revisa el cableado.');
      break;
    }
  }

  for (const d of scenario.devices) {
    const st = devState[d.id];
    const devDefName = SANDBOX_DEVICES[d.type]?.name || d.type;
    if ((d.type === 'maglock' || d.type === 'door-strike' || d.type === 'electricStrike' || d.type === 'crashbar' || d.type === 'panicBar') && st.reversed) {
      faults.push(`Polaridad inversa en ${devDefName}.`);
    }
  }

  return {
    uf,
    netClass,
    devices: devState,
    faults,
    netOf: (k: string) => uf.find(k),
    classOf: (k: string) => netOfKey(k),
    terminalLit: (k: string) => netOfKey(k) === 'HOT',
  };
}

/* Lectura del multímetro entre dos terminales (V DC / Continuidad) */
export function multimeterRead(model: any, keyA: string | null, keyB: string | null, mode: string) {
  if (!keyA || !keyB) return { text: '----', sub: mode === 'cont' ? 'OHM' : 'V DC', beep: false };
  if (mode === 'cont') {
    if (model.uf.find(keyA) === model.uf.find(keyB)) return { text: '0.0', sub: 'Ω · BEEP', beep: true };
    return { text: 'OL', sub: 'ABIERTO', beep: false };
  }
  const ca = model.classOf(keyA);
  const cb = model.classOf(keyB);
  const v = (c: string) => (c === 'HOT' ? V_SUPPLY : c === 'GND' ? 0 : null);
  const va = v(ca);
  const vb = v(cb);
  if (va === null || vb === null) {
    if (ca === 'SHORT' || cb === 'SHORT') return { text: 'ERR', sub: 'CORTO', beep: false };
    return { text: '0.00', sub: 'V DC · flotante', beep: false };
  }
  const diff = va - vb;
  return { text: (diff > 0 ? ' ' : '') + diff.toFixed(2), sub: 'V DC', beep: false };
}

/* ---------- DICCIONARIO DE DISPOSITIVOS Y DIBUJO EN CANVAS / SVG ---------- */
export interface DeviceDef {
  name: string;
  tag: string;
  desc: string;
  tips: string;
  w: number;
  h: number;
  terminals: { id: string; label: string; x: number; y: number; role: string }[];
  action?: { label: string; kind: 'toggle' | 'momentary'; stateKey: string; def?: any };
  draw: (ctx: CanvasRenderingContext2D, d: any, st: any) => void;
}

export const SANDBOX_DEVICES: Record<string, DeviceDef> = {
  'power-supply': {
    name: 'Power Supply 12VDC',
    tag: 'Fuentes de poder',
    desc: 'Fuente de alimentación conmutada para sistemas de control de acceso. Entrega 12 VDC regulados. Todo circuito comienza aquí: positivo (+) y negativo (−).',
    tips: 'El positivo (+12V) normalmente alimenta el controlador y, a través de los contactos del relé, las cerraduras. El negativo (GND) va directo a las cargas. Nunca puentees + y − directamente: eso es un cortocircuito.',
    w: 200,
    h: 160,
    terminals: [
      { id: 'pos', label: '+12VDC', x: 180, y: 50, role: 'source-pos' },
      { id: 'neg', label: 'GND', x: 180, y: 104, role: 'source-neg' },
    ],
    action: { label: 'Interruptor ON/OFF', kind: 'toggle', stateKey: 'power', def: true },
    draw(ctx, d, st) {
      bevelPanel(ctx, 0, 0, 200, 160, 8, '#454d5c', '#2e343f');
      innerSeam(ctx, 6, 6, 188, 148, 5);
      screw(ctx, 12, 12); screw(ctx, 188, 12); screw(ctx, 12, 148); screw(ctx, 188, 148);
      ctx.fillStyle = '#c9c4b8'; rrect(ctx, 16, 14, 92, 26, 3); ctx.fill();
      ctx.strokeStyle = '#8f8a7e'; ctx.lineWidth = 1; rrect(ctx, 16, 14, 92, 26, 3); ctx.stroke();
      label(ctx, 'PS-1203', 30, 24, '#3a3a35', 9, 'left', '800');
      label(ctx, '12VDC · 3A', 30, 34, '#6a6a62', 7, 'left', '600');
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      for (let i = 0; i < 6; i++) { rrect(ctx, 18, 50 + i * 9, 86, 4, 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let i = 0; i < 6; i++) { rrect(ctx, 18, 50 + i * 9, 86, 1.4, 1); ctx.fill(); }
      const on = st.power !== false;
      ctx.fillStyle = '#1a1e25'; rrect(ctx, 20, 112, 46, 30, 4); ctx.fill();
      ctx.strokeStyle = '#3c4452'; ctx.lineWidth = 1.5; rrect(ctx, 20, 112, 46, 30, 4); ctx.stroke();
      const swg = ctx.createLinearGradient(0, 112, 0, 142);
      if (on) { swg.addColorStop(0, '#2e8a56'); swg.addColorStop(1, '#1e5c38'); }
      else { swg.addColorStop(0, '#5c5c60'); swg.addColorStop(1, '#3c3c40'); }
      ctx.fillStyle = swg; rrect(ctx, 24, on ? 116 : 124, 38, on ? 22 : 14, 3); ctx.fill();
      if (!on) { ctx.fillStyle = '#26262a'; rrect(ctx, 24, 116, 38, 6, 3); ctx.fill(); }
      label(ctx, on ? 'I' : 'O', 43, on ? 127 : 132, '#eafff2', 10, 'center', '800');
      ctx.fillStyle = '#14171c'; ctx.beginPath(); ctx.arc(96, 127, 8, 0, 7); ctx.fill();
      ctx.strokeStyle = '#3c4452'; ctx.lineWidth = 1.5; ctx.stroke();
      led(ctx, 96, 127, on ? '#39d98a' : '#2c3833', on);
      euroBlock(ctx, 180, 50, '#c0392b', '+12V');
      euroBlock(ctx, 180, 104, '#20242a', 'GND');
      label(ctx, 'DC OUTPUT', 180, 26, '#9aa3b2', 8, 'center', '700');
    }
  },

  'door-controller': {
    name: 'Controlador de Puerta',
    tag: 'Control',
    desc: 'Controlador de acceso con relé de cerradura (COM / NO / NC) y entrada REX. Cuando está energizado, el relé cambia de estado. Una señal REX (a GND) libera la puerta momentáneamente.',
    tips: 'Cableado típico: PWR+ y PWR− al power supply. COM recibe +12V desde la fuente. NO alimenta cerraduras fail-secure (strike, crash bar). NC alimenta cerraduras fail-safe (maglock). REX recibe el contacto del botón o sensor de movimiento contra GND.',
    w: 240,
    h: 200,
    terminals: [
      { id: 'pwrp', label: 'PWR +', x: 22, y: 40, role: 'coil-pos' },
      { id: 'pwrn', label: 'PWR −', x: 22, y: 70, role: 'coil-neg' },
      { id: 'rex', label: 'REX IN', x: 22, y: 100, role: 'input' },
      { id: 'com', label: 'COM', x: 218, y: 40, role: 'contact' },
      { id: 'no', label: 'NO', x: 218, y: 70, role: 'contact' },
      { id: 'nc', label: 'NC', x: 218, y: 100, role: 'contact' },
    ],
    draw(ctx, d, st) {
      bevelPanel(ctx, 0, 0, 240, 200, 8, '#3f4756', '#2b313c');
      innerSeam(ctx, 6, 6, 228, 188, 5);
      screw(ctx, 12, 12); screw(ctx, 228, 12); screw(ctx, 12, 188); screw(ctx, 228, 188);
      ctx.fillStyle = '#c9c4b8'; rrect(ctx, 66, 12, 108, 22, 3); ctx.fill();
      ctx.strokeStyle = '#8f8a7e'; ctx.lineWidth = 1; rrect(ctx, 66, 12, 108, 22, 3); ctx.stroke();
      label(ctx, 'AC-1 ACCESS CTRL', 120, 24, '#3a3a35', 9, 'center', '800');
      const pg = ctx.createLinearGradient(0, 52, 0, 168);
      pg.addColorStop(0, '#14532d'); pg.addColorStop(1, '#0d3a20');
      ctx.fillStyle = pg; rrect(ctx, 48, 52, 144, 116, 4); ctx.fill();
      ctx.strokeStyle = '#0a2a17'; ctx.lineWidth = 2; rrect(ctx, 48, 52, 144, 116, 4); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,220,180,.18)'; ctx.lineWidth = 1.5;
      line(ctx, 58, 70, 110, 70); line(ctx, 110, 70, 110, 120);
      line(ctx, 58, 150, 150, 150); line(ctx, 150, 150, 180, 90);
      line(ctx, 58, 110, 90, 110); line(ctx, 160, 60, 182, 60);
      ctx.fillStyle = 'rgba(200,169,74,.5)';
      for (const [x, y] of [[58, 70], [58, 110], [58, 150], [182, 60], [180, 90], [150, 150]]) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); }
      const rg = ctx.createLinearGradient(0, 112, 0, 156);
      rg.addColorStop(0, '#22262e'); rg.addColorStop(1, '#14171d');
      ctx.fillStyle = rg; rrect(ctx, 96, 108, 48, 44, 3); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; rrect(ctx, 96, 108, 48, 44, 3); ctx.stroke();
      label(ctx, 'RELAY', 120, 122, '#6a7280', 7, 'center', '700');
      label(ctx, '12VDC', 120, 132, '#4a5058', 6, 'center');
      const energized = st.relay;
      ctx.strokeStyle = '#c8ccd4'; ctx.lineWidth = 2.5;
      line(ctx, 102, 143, 124, 143);
      ctx.beginPath(); ctx.moveTo(124, 143);
      if (energized) { ctx.lineTo(138, 136); } else { ctx.lineTo(136, 148); }
      ctx.stroke();
      led(ctx, 66, 160, st.pwrLed ? '#39d98a' : '#1e3329', st.pwrLed);
      label(ctx, 'PWR', 66, 174, '#8fb89e', 7, 'center');
      led(ctx, 176, 160, st.relay ? '#ffb020' : '#38301e', st.relay);
      label(ctx, 'RELAY', 176, 174, '#8fb89e', 7, 'center');
      euroBlock(ctx, 22, 40, '#c0392b', 'PWR+');
      euroBlock(ctx, 22, 70, '#20242a', 'PWR−');
      euroBlock(ctx, 22, 100, '#3a6ea8', 'REX');
      euroBlock(ctx, 218, 40, '#8a6d1f', 'COM');
      euroBlock(ctx, 218, 70, '#2e7d46', 'NO');
      euroBlock(ctx, 218, 100, '#7d3a2e', 'NC');
    }
  },

  'maglock': {
    name: 'Maglock (Cerradura Electromagnética)',
    tag: 'Cerraduras · Fail-Safe',
    desc: 'Cerradura electromagnética de 600/1200 lbs. Mientras recibe 12V permanece BLOQUEADA (fail-safe: sin energía, la puerta abre). Se alimenta típicamente desde el contacto NC del controlador.',
    tips: 'Maglock = fail-safe: energizada está cerrada. Conecta + al NC del controlador y − directo al GND de la fuente. Si el LED del maglock no enciende, mide voltaje entre sus terminales con el multímetro.',
    w: 230,
    h: 104,
    terminals: [
      { id: 'pos', label: '+', x: 210, y: 30, role: 'coil-pos' },
      { id: 'neg', label: '−', x: 210, y: 66, role: 'coil-neg' },
    ],
    draw(ctx, d, st) {
      const on = st.energized;
      const g = ctx.createLinearGradient(0, 8, 0, 68);
      g.addColorStop(0, '#5d6675'); g.addColorStop(.35, '#4a5261'); g.addColorStop(.55, '#3d4450'); g.addColorStop(1, '#2c313b');
      ctx.fillStyle = g; rrect(ctx, 4, 8, 196, 58, 4); ctx.fill();
      ctx.strokeStyle = '#1d222a'; ctx.lineWidth = 2; rrect(ctx, 4, 8, 196, 58, 4); ctx.stroke();
      ctx.fillStyle = '#232830'; rrect(ctx, 4, 8, 10, 58, 4); ctx.fill(); rrect(ctx, 190, 8, 10, 58, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) { line(ctx, 26 + i * 34, 14, 26 + i * 34, 60); }
      ctx.fillStyle = '#1c2027'; rrect(ctx, 58, 24, 88, 26, 3); ctx.fill();
      ctx.strokeStyle = '#3a414d'; ctx.lineWidth = 1; rrect(ctx, 58, 24, 88, 26, 3); ctx.stroke();
      label(ctx, 'MAGLOCK', 102, 34, '#cfd6e2', 10, 'center', '800');
      label(ctx, '600 lbs HOLDING', 102, 46, '#77808f', 7, 'center');
      const ag = ctx.createLinearGradient(0, 76, 0, 98);
      ag.addColorStop(0, '#6a7382'); ag.addColorStop(1, '#4a515d');
      ctx.fillStyle = ag; rrect(ctx, 4, 76, 196, 20, 3); ctx.fill();
      ctx.strokeStyle = '#2b313b'; ctx.lineWidth = 1.5; rrect(ctx, 4, 76, 196, 20, 3); ctx.stroke();
      ctx.fillStyle = '#8a93a3'; ctx.beginPath(); ctx.arc(102, 86, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#333a44'; ctx.lineWidth = 1.5; ctx.stroke();
      line(ctx, 98, 86, 106, 86);
      if (on) {
        ctx.fillStyle = 'rgba(57,217,138,.35)'; ctx.fillRect(6, 68, 192, 6);
        label(ctx, '● BLOQUEADA', 30, 37, '#39d98a', 9, 'left', '800');
      } else {
        label(ctx, '○ LIBRE', 30, 37, '#ffb020', 9, 'left', '800');
      }
      ctx.fillStyle = '#14171c'; ctx.beginPath(); ctx.arc(172, 37, 7, 0, 7); ctx.fill();
      ctx.strokeStyle = '#3c4452'; ctx.lineWidth = 1; ctx.stroke();
      led(ctx, 172, 37, on ? '#39d98a' : '#2c3833', on);
      euroBlock(ctx, 210, 30, '#c0392b', '+');
      euroBlock(ctx, 210, 66, '#20242a', '−');
    }
  },

  'door-strike': {
    name: 'Electric Door Strike',
    tag: 'Cerraduras · Fail-Secure',
    desc: 'Contrachapa eléctrica para marco de puerta. SIN energía permanece bloqueada (fail-secure). Al recibir 12V libera el pestillo. Se alimenta típicamente desde el contacto NO del controlador.',
    tips: 'Strike = fail-secure: energizada ABRE. Conecta + al NO del controlador y − al GND de la fuente. Si zumban pero no abre, verifica caída de voltaje con el multímetro bajo carga.',
    w: 104,
    h: 200,
    terminals: [
      { id: 'pos', label: '+', x: 84, y: 36, role: 'coil-pos' },
      { id: 'neg', label: '−', x: 84, y: 164, role: 'coil-neg' },
    ],
    draw(ctx, d, st) {
      const on = st.energized;
      const g = ctx.createLinearGradient(8, 0, 70, 0);
      g.addColorStop(0, '#7a828f'); g.addColorStop(.5, '#99a1ad'); g.addColorStop(1, '#666e7a');
      ctx.fillStyle = g; rrect(ctx, 8, 4, 62, 192, 4); ctx.fill();
      ctx.strokeStyle = '#3c424c'; ctx.lineWidth = 2; rrect(ctx, 8, 4, 62, 192, 4); ctx.stroke();
      screw(ctx, 39, 16); screw(ctx, 39, 184);
      ctx.fillStyle = '#0d1015'; rrect(ctx, 20, 48, 38, 104, 3); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1; rrect(ctx, 20, 48, 38, 104, 3); ctx.stroke();
      ctx.fillStyle = '#232830';
      ctx.beginPath(); ctx.moveTo(24, 56); ctx.lineTo(54, 76); ctx.lineTo(54, 124); ctx.lineTo(24, 144); ctx.closePath(); ctx.fill();
      ctx.save();
      if (on) { ctx.translate(58, 100); ctx.rotate(-0.55); ctx.translate(-58, -100); }
      const kg = ctx.createLinearGradient(0, 58, 0, 142);
      kg.addColorStop(0, '#8f97a4'); kg.addColorStop(1, '#5a626e');
      ctx.fillStyle = kg; rrect(ctx, 30, 58, 22, 84, 3); ctx.fill();
      ctx.strokeStyle = '#333a44'; ctx.lineWidth = 1.5; rrect(ctx, 30, 58, 22, 84, 3); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#2c313b'; rrect(ctx, 20, 158, 38, 24, 3); ctx.fill();
      ctx.strokeStyle = '#3c4452'; ctx.lineWidth = 1; rrect(ctx, 20, 158, 38, 24, 3); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,169,74,.6)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(24, 162 + i * 5); ctx.lineTo(54, 162 + i * 5); ctx.stroke(); }
      label(ctx, on ? 'ABIERTO' : 'CERRADO', 39, 34, on ? '#1e6b3e' : '#7a5a10', 7, 'center', '800');
      euroBlock(ctx, 84, 36, '#c0392b', '+');
      euroBlock(ctx, 84, 164, '#20242a', '−');
    }
  },

  'crashbar': {
    name: 'Crash Bar Electrificado',
    tag: 'Cerraduras · Egress',
    desc: 'Barra antipánico electrificada (ELR). Al recibir 12V retrae el pestillo y permite la salida. Consume corriente alta: requiere cable 18 AWG.',
    tips: 'Usa siempre 18/2 o compuesto para la alimentación del crash bar (alta corriente de arranque). + desde NO del controlador, − directo a GND. Si la barra no retrae, mide el voltaje en sus bornes mientras activas el relé.',
    w: 260,
    h: 90,
    terminals: [
      { id: 'pos', label: '+', x: 240, y: 28, role: 'coil-pos' },
      { id: 'neg', label: '−', x: 240, y: 62, role: 'coil-neg' },
    ],
    draw(ctx, d, st) {
      const on = st.energized;
      ctx.fillStyle = '#3a4049'; rrect(ctx, 8, 44, 196, 10, 3); ctx.fill();
      ctx.strokeStyle = '#242a32'; ctx.lineWidth = 1.5; rrect(ctx, 8, 44, 196, 10, 3); ctx.stroke();
      const mg = ctx.createLinearGradient(0, 18, 0, 64);
      mg.addColorStop(0, '#5d6675'); mg.addColorStop(1, '#3d4450');
      ctx.fillStyle = mg; rrect(ctx, 8, 18, 44, 46, 5); ctx.fill();
      ctx.strokeStyle = '#22272f'; ctx.lineWidth = 2; rrect(ctx, 8, 18, 44, 46, 5); ctx.stroke();
      screw(ctx, 16, 26); screw(ctx, 16, 56);
      ctx.fillStyle = on ? '#39d98a' : '#8a93a3';
      rrect(ctx, on ? 10 : 2, 66, 20, 10, 2); ctx.fill();
      ctx.strokeStyle = '#333a44'; ctx.lineWidth = 1; rrect(ctx, on ? 10 : 2, 66, 20, 10, 2); ctx.stroke();
      const bg = ctx.createLinearGradient(0, 24, 0, 50);
      bg.addColorStop(0, '#99a1ad'); bg.addColorStop(.5, '#7a828f'); bg.addColorStop(1, '#565e6a');
      ctx.fillStyle = bg; rrect(ctx, 44, 26, 166, 20, 10); ctx.fill();
      ctx.strokeStyle = '#333a44'; ctx.lineWidth = 2; rrect(ctx, 44, 26, 166, 20, 10); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
      line(ctx, 52, 30, 202, 30);
      label(ctx, 'PUSH', 127, 37, 'rgba(20,24,30,.65)', 10, 'center', '800');
      ctx.fillStyle = '#3d4450'; rrect(ctx, 204, 18, 16, 46, 4); ctx.fill();
      ctx.strokeStyle = '#22272f'; rrect(ctx, 204, 18, 16, 46, 4); ctx.stroke();
      led(ctx, 196, 60, on ? '#39d98a' : '#2c3833', on);
      euroBlock(ctx, 240, 28, '#c0392b', '+');
      euroBlock(ctx, 240, 62, '#20242a', '−');
    }
  },

  'door-position': {
    name: 'Sensor de Posición de Puerta',
    tag: 'Contactos · Monitoreo',
    desc: 'Contacto magnético (reed switch). El circuito CIERRA cuando la puerta está cerrada. Es un contacto seco: no lleva polaridad. Se usa para monitoreo y lógica de puerta forzada/abierta.',
    tips: 'Es contacto seco: C y NO se comportan como un interruptor. No importa la polaridad. Prueba con el multímetro en continuidad: debe pitar con puerta cerrada y quedar abierto (OL) con puerta abierta.',
    w: 160,
    h: 126,
    terminals: [
      { id: 'c', label: 'C', x: 142, y: 46, role: 'contact' },
      { id: 'no', label: 'NO', x: 142, y: 84, role: 'contact' },
    ],
    action: { label: 'Abrir/Cerrar puerta', kind: 'toggle', stateKey: 'doorClosed', def: true },
    draw(ctx, d, st) {
      const closed = st.doorClosed !== false;
      const gap = closed ? 4 : 26;
      plasticHousing(ctx, 10, 34, 50, 58);
      screw(ctx, 22, 48); screw(ctx, 22, 78);
      plasticHousing(ctx, 62 + gap, 34, 50, 58);
      screw(ctx, 74 + gap, 48); screw(ctx, 74 + gap, 78);
      ctx.fillStyle = '#8a8578'; rrect(ctx, 64 + gap, 40, 8, 46, 2); ctx.fill();
      label(ctx, 'REED', 35, 102, '#8b94a3', 8, 'center', '700');
      label(ctx, 'MAGNET', 87 + gap, 102, '#8b94a3', 8, 'center', '700');
      label(ctx, closed ? 'PUERTA CERRADA' : 'PUERTA ABIERTA', 70, 116, closed ? '#39d98a' : '#ffb020', 8, 'center', '700');
      led(ctx, 142, 110, closed ? '#39d98a' : '#2c3833', closed);
      euroBlock(ctx, 142, 46, '#8a6d1f', 'C');
      euroBlock(ctx, 142, 84, '#2e7d46', 'NO');
    }
  },

  'push-to-exit': {
    name: 'Botón Push-to-Exit',
    tag: 'Contactos · REX',
    desc: 'Pulsador momentáneo de salida (REX). Mientras se presiona, CIERRA el contacto C–NO. Se conecta entre GND y la entrada REX del controlador para liberar la puerta.',
    tips: 'Contacto seco momentáneo, sin polaridad. Cableado típico: un lado a GND, el otro a REX IN del controlador. Verifica con continuidad: pita solo mientras el botón está presionado.',
    w: 118,
    h: 140,
    terminals: [
      { id: 'c', label: 'C', x: 100, y: 46, role: 'contact' },
      { id: 'no', label: 'NO', x: 100, y: 96, role: 'contact' },
    ],
    action: { label: 'Presionar (mantener)', kind: 'momentary', stateKey: 'pressed' },
    draw(ctx, d, st) {
      const pressed = st.pressed;
      const g = ctx.createLinearGradient(8, 0, 84, 0);
      g.addColorStop(0, '#7a828f'); g.addColorStop(.5, '#9aa2ae'); g.addColorStop(1, '#646c78');
      ctx.fillStyle = g; rrect(ctx, 8, 6, 76, 128, 4); ctx.fill();
      ctx.strokeStyle = '#3c424c'; ctx.lineWidth = 2; rrect(ctx, 8, 6, 76, 128, 4); ctx.stroke();
      screw(ctx, 46, 18); screw(ctx, 46, 122);
      ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.arc(46, 66, 28, 0, 7); ctx.fill();
      const bg = ctx.createRadialGradient(42, 58, 4, 46, 66, 26);
      bg.addColorStop(0, pressed ? '#2b8a52' : '#4fd084');
      bg.addColorStop(.7, pressed ? '#237a48' : '#35a862');
      bg.addColorStop(1, pressed ? '#1a5c37' : '#237a48');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(46, 66, pressed ? 21 : 24, 0, 7); ctx.fill();
      ctx.strokeStyle = '#0d3a20'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(46, 66, pressed ? 17 : 20, 0, 7); ctx.stroke();
      label(ctx, 'EXIT', 46, 70, '#eafff2', 11, 'center', '800');
      label(ctx, 'PUSH TO EXIT', 46, 36, 'rgba(20,24,30,.55)', 7, 'center', '800');
      if (pressed) label(ctx, 'CONTACTO CERRADO', 46, 108, '#14532d', 7, 'center', '800');
      euroBlock(ctx, 100, 46, '#8a6d1f', 'C');
      euroBlock(ctx, 100, 96, '#2e7d46', 'NO');
    }
  },

  'motion-sensor': {
    name: 'Sensor de Movimiento (REX)',
    tag: 'Sensores · REX',
    desc: 'Detector de movimiento PIR/microondas para request-to-exit. Requiere 12V (+/−). Al detectar movimiento CIERRA su contacto C–NO hacia la entrada REX del controlador.',
    tips: 'Necesita alimentación: PWR+ y PWR− a la fuente. El contacto C–NO va a REX. Sin alimentación el sensor no cierra aunque haya movimiento — falla clásica para troubleshooting.',
    w: 160,
    h: 150,
    terminals: [
      { id: 'pwrp', label: 'PWR +', x: 144, y: 32, role: 'coil-pos' },
      { id: 'pwrn', label: 'PWR −', x: 144, y: 60, role: 'coil-neg' },
      { id: 'c', label: 'C', x: 144, y: 94, role: 'contact' },
      { id: 'no', label: 'NO', x: 144, y: 122, role: 'contact' },
    ],
    action: { label: 'Simular movimiento', kind: 'toggle', stateKey: 'motion', def: false },
    draw(ctx, d, st) {
      const pw = st.powered, mv = st.motion;
      const g = ctx.createLinearGradient(0, 8, 0, 138);
      g.addColorStop(0, '#f0eee8'); g.addColorStop(.6, '#dddad2'); g.addColorStop(1, '#c2bfb6');
      ctx.fillStyle = g; rrect(ctx, 10, 8, 104, 130, 12); ctx.fill();
      ctx.strokeStyle = '#96938a'; ctx.lineWidth = 2; rrect(ctx, 10, 8, 104, 130, 12); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1;
      rrect(ctx, 14, 12, 96, 122, 10); ctx.stroke();
      const lg = ctx.createLinearGradient(0, 40, 0, 96);
      lg.addColorStop(0, '#c3cad6'); lg.addColorStop(.5, '#aab2c0'); lg.addColorStop(1, '#98a0ae');
      ctx.fillStyle = lg; rrect(ctx, 30, 40, 64, 56, 8); ctx.fill();
      ctx.strokeStyle = '#7d8492'; ctx.lineWidth = 1.5; rrect(ctx, 30, 40, 64, 56, 8); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) { line(ctx, 34, 40 + i * 13, 90, 40 + i * 13); }
      ctx.strokeStyle = 'rgba(0,0,0,.15)';
      for (let i = 1; i < 4; i++) { line(ctx, 30 + i * 16, 44, 30 + i * 16, 92); }
      label(ctx, 'REX-PIR', 62, 26, '#6a6d73', 8, 'center', '800');
      if (pw && mv) {
        ctx.strokeStyle = 'rgba(61,165,244,.75)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(62, 68, 38 + i * 9, -0.5, 0.5); ctx.stroke(); }
      }
      led(ctx, 34, 112, pw ? '#39d98a' : '#b8b5ac', pw);
      label(ctx, 'PWR', 34, 126, '#6a6d73', 7, 'center');
      led(ctx, 90, 112, (pw && mv) ? '#ffb020' : '#b8b5ac', pw && mv);
      label(ctx, 'DET', 90, 126, '#6a6d73', 7, 'center');
      label(ctx, !pw ? 'SIN ALIMENTACIÓN' : (mv ? 'MOVIMIENTO' : 'SIN MOVIMIENTO'), 62, 104, !pw ? '#c0392b' : '#6a6d73', 7, 'center', '800');
      euroBlock(ctx, 144, 32, '#c0392b', '+');
      euroBlock(ctx, 144, 60, '#20242a', '−');
      euroBlock(ctx, 144, 94, '#8a6d1f', 'C');
      euroBlock(ctx, 144, 122, '#2e7d46', 'NO');
    }
  }
};

/* ---------- Utilidades de Dibujo Vectorial Compartidas ---------- */
export function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

export function label(ctx: CanvasRenderingContext2D, txt: string, x: number, y: number, color: string, size: number, align: CanvasTextAlign = 'left', weight = '600') {
  if (size <= 0) return;
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px "Segoe UI",Arial,sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
}

export function bevelPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, c1: string, c2: string) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; rrect(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = '#181d25'; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, r); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x + r, y + 1.5); ctx.lineTo(x + w - r, y + 1.5); ctx.stroke();
}

export function innerSeam(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
  rrect(ctx, x, y, w, h, r); ctx.stroke();
}

export function screw(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const g = ctx.createRadialGradient(x - 1, y - 1, 0.5, x, y, 5);
  g.addColorStop(0, '#c8ccd4'); g.addColorStop(1, '#6a7280');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3a414c'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#2c323c'; ctx.lineWidth = 1.2;
  line(ctx, x - 2.4, y, x + 2.4, y); line(ctx, x, y - 2.4, x, y + 2.4);
}

export function plasticHousing(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#e6e3da'); g.addColorStop(1, '#c6c3ba');
  ctx.fillStyle = g; rrect(ctx, x, y, w, h, 5); ctx.fill();
  ctx.strokeStyle = '#96938a'; ctx.lineWidth = 1.5; rrect(ctx, x, y, w, h, 5); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; rrect(ctx, x + 3, y + 3, w - 6, h - 6, 3); ctx.stroke();
}

export function euroBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, txt: string) {
  ctx.fillStyle = '#171c23'; rrect(ctx, x - 12, y - 12, 24, 24, 4); ctx.fill();
  ctx.strokeStyle = '#3a4350'; ctx.lineWidth = 1.5; rrect(ctx, x - 12, y - 12, 24, 24, 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - 12, y - 8); ctx.lineTo(x + 12, y - 8); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.stroke();
  const g = ctx.createRadialGradient(x - 0.7, y - 0.7, 0.3, x, y, 3.4);
  g.addColorStop(0, '#e8d489'); g.addColorStop(1, '#a8873a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#6a541f'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.strokeStyle = '#5c4a1c'; ctx.lineWidth = 1;
  line(ctx, x - 2, y, x + 2, y);
  label(ctx, txt, x, y - 19, '#aeb6c4', 8, 'center', '700');
}

export function led(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, on: boolean) {
  if (on) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, 11);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill();
  }
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.stroke();
  if (on) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x - 1.2, y - 1.2, 1.2, 0, 7); ctx.fill(); }
}
