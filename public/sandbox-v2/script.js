/**
 * AccessLab - Access Control & Electronic Wiring Simulator
 * Updates: Displays clear, visible on-canvas text badges (+12V, GND, W_D0, W_D1, COM, NC) on terminal nodes.
 */

const COMPONENT_DEFS = {
  psu: {
    name: 'Fuente 12VDC Regulada',
    desc: 'Suministra 12VDC continuos para la controladora, lectora y cerraduras electromagnéticas.',
    paramName: 'Voltaje (V)',
    paramUnit: 'V',
    defaultParam: 12,
    terminals: [
      { id: 'pos', name: '+12V (VCC)', label: '+12V', pos: 'term-left-1', offset: { x: -30, y: -25 } },
      { id: 'neg', name: 'GND (Tierra)', label: 'GND', pos: 'term-left-3', offset: { x: -30, y: 25 } }
    ]
  },
  controller: {
    name: 'Tarjeta Controladora IP',
    desc: 'Procesador de control de acceso. Recibe Wiegand D0/D1, procesa tarjetas RFID y conmuta el relé de puerta (NO/NC/COM).',
    paramName: 'Tiempo Relé (s)',
    paramUnit: 's',
    defaultParam: 5,
    terminals: [
      { id: 'pwr_in', name: '+12V PWR IN', label: 'PWR IN (+12V)', pos: 'term-left-1', offset: { x: -30, y: -30 } },
      { id: 'gnd_in', name: 'GND PWR IN', label: 'GND IN', pos: 'term-left-2', offset: { x: -30, y: 0 } },
      { id: 'w_d0', name: 'Wiegand D0 IN', label: 'W_D0', pos: 'term-left-3', offset: { x: -30, y: 30 } },
      { id: 'w_d1', name: 'Wiegand D1 IN', label: 'W_D1', pos: 'term-right-1', offset: { x: 30, y: -30 } },
      { id: 'relay_com', name: 'Relé COM', label: 'COM', pos: 'term-right-2', offset: { x: 30, y: 0 } },
      { id: 'relay_nc', name: 'Relé NC (Cerrado)', label: 'NC (Lock)', pos: 'term-right-3', offset: { x: 30, y: 30 } }
    ]
  },
  reader: {
    name: 'Lectora RFID Wiegand',
    desc: 'Lector de tarjetas de proximidad. Transmite código de tarjeta a la controladora por líneas Data 0 (Verde) y Data 1 (Azul).',
    terminals: [
      { id: 'vcc', name: '+12V VCC', label: '+12V', pos: 'term-left-1', offset: { x: -30, y: -20 } },
      { id: 'gnd', name: 'GND (Tierra)', label: 'GND', pos: 'term-left-3', offset: { x: -30, y: 20 } },
      { id: 'd0', name: 'Wiegand D0 (Verde)', label: 'D0 (Verde)', pos: 'term-right-1', offset: { x: 30, y: -20 } },
      { id: 'd1', name: 'Wiegand D1 (Azul)', label: 'D1 (Azul)', pos: 'term-right-3', offset: { x: 30, y: 20 } }
    ]
  },
  maglock: {
    name: 'Electroimán 600lbs',
    desc: 'Cerradura Fail-Safe (Normalmente Cerrada). Requiere 12V constante para mantener la puerta bloqueada.',
    terminals: [
      { id: 'pos', name: '+12V Lock', label: '+12V', pos: 'term-left-1', offset: { x: -30, y: -20 } },
      { id: 'neg', name: 'GND Lock', label: 'GND', pos: 'term-left-3', offset: { x: -30, y: 20 } }
    ]
  },
  strike: {
    name: 'Pestillo Eléctrico',
    desc: 'Cerradura Fail-Secure (Normalmente Abierta). Se libera únicamente cuando recibe un pulso de 12VDC.',
    terminals: [
      { id: 'pos', name: '+12V Lock', label: '+12V', pos: 'term-left-1', offset: { x: -30, y: -20 } },
      { id: 'neg', name: 'GND Lock', label: 'GND', pos: 'term-left-3', offset: { x: -30, y: 20 } }
    ]
  },
  rex: {
    name: 'Pulsador REX (Salida)',
    desc: 'Botonera de salida por presión. Corta o envía pulso al pulsar el botón físico.',
    terminals: [
      { id: 'in', name: 'Entrada REX', label: 'REX IN', pos: 'term-left', offset: { x: -30, y: 0 } },
      { id: 'out', name: 'Salida REX', label: 'REX OUT', pos: 'term-right', offset: { x: 30, y: 0 } }
    ]
  },
  crashbar: {
    name: 'Crashbar Electrificada',
    desc: 'Barra antipánico Von Duprin 75/99 Series con retracción eléctrica motorizada (QEL) de pestillo (Fail-Secure).',
    paramName: 'Tiempo Retracción (s)',
    paramUnit: 's',
    defaultParam: 5,
    terminals: [
      { id: 'pos', name: '+24V/+12V PWR (Rojo)', label: '+PWR', pos: 'term-left-1', offset: { x: -40, y: -20 } },
      { id: 'neg', name: 'GND Tierra (Negro)', label: 'GND', pos: 'term-left-3', offset: { x: -40, y: 20 } }
    ]
  },
  dps: {
    name: 'Door Position Sensor',
    desc: 'Sensor de posición de puerta y detector de movimiento REX. Cuenta con 12 bornes (NC/C/NO x2 arriba y -/+ R/T/T/T abajo), lente Fresnel PIR, relé doble Takamisawa y Dip Switch x10.',
    paramName: 'Tiempo Detección (s)',
    paramUnit: 's',
    defaultParam: 5,
    terminals: [
      // Top Row (6 terminals): NC, C, NO, NC, C, NO
      { id: 'top_nc1', name: 'Relé 1 NC (TS2-1)', label: 'NC', pos: 'term-top-1', offset: { x: -65, y: -45 } },
      { id: 'top_c1', name: 'Relé 1 COM (TS2-2)', label: 'C', pos: 'term-top-2', offset: { x: -39, y: -45 } },
      { id: 'top_no1', name: 'Relé 1 NO (TS2-3)', label: 'NO', pos: 'term-top-3', offset: { x: -13, y: -45 } },
      { id: 'top_nc2', name: 'Relé 2 NC (TS2-4)', label: 'NC', pos: 'term-top-4', offset: { x: 13, y: -45 } },
      { id: 'top_c2', name: 'Relé 2 COM (TS2-5)', label: 'C', pos: 'term-top-5', offset: { x: 39, y: -45 } },
      { id: 'top_no2', name: 'Relé 2 NO (TS2-6)', label: 'NO', pos: 'term-top-6', offset: { x: 65, y: -45 } },
      // Bottom Row (6 terminals): - , + , R , T , T , T
      { id: 'bot_gnd', name: 'GND Negativo (-) (TS1-1)', label: '-', pos: 'term-bot-1', offset: { x: -65, y: 45 } },
      { id: 'bot_vcc', name: '+12V VCC (+) (TS1-2)', label: '+', pos: 'term-bot-2', offset: { x: -39, y: 45 } },
      { id: 'bot_rex', name: 'REX Remote / Reset (R) (TS1-3)', label: 'R', pos: 'term-bot-3', offset: { x: -13, y: 45 } },
      { id: 'bot_tamper1', name: 'Tamper Switch A (T) (TS1-4)', label: 'T', pos: 'term-bot-4', offset: { x: 13, y: 45 } },
      { id: 'bot_tamper2', name: 'Tamper Switch B (T) (TS1-5)', label: 'T', pos: 'term-bot-5', offset: { x: 39, y: 45 } },
      { id: 'bot_timer', name: 'Timer / Trouble (T) (TS1-6)', label: 'T', pos: 'term-bot-6', offset: { x: 65, y: 45 } }
    ]
  },
  sensor: {
    name: 'Sensor Magnético Puerta',
    desc: 'Detecta si la hoja de la puerta está cerrada (Contacto NC).',
    terminals: [
      { id: 't1', name: 'Contacto A', label: 'SEN A', pos: 'term-left', offset: { x: -30, y: 0 } },
      { id: 't2', name: 'Contacto B', label: 'SEN B', pos: 'term-right', offset: { x: 30, y: 0 } }
    ]
  },
  multimeter: {
    name: 'Multímetro Digital',
    desc: 'Instrumento interactivo con puntas de prueba móvil para verificar voltajes VDC en cualquier terminal.',
    terminals: []
  }
};

const GUIDED_LESSONS = [
  {
    id: 1,
    title: 'Alimentación de Controladora de 1 Puerta',
    desc: 'Arrastra la Fuente Regulada 12VDC y la Tarjeta Controladora. Conecta el borne [+12V] de la Fuente al borne [PWR IN (+12V)] de la Controladora, y el borne [GND] de la Fuente a [GND IN].',
    hint: 'Arrastra un cable desde la etiqueta [+12V] de la Fuente hasta la etiqueta [PWR IN (+12V)] de la Controladora. Luego arrastra un cable negro desde [GND] a [GND IN].',
    check: (components, wires, sysState) => {
      const psu = components.find(c => c.type === 'psu');
      const ctrl = components.find(c => c.type === 'controller');
      return psu && ctrl && sysState.controllerPowered;
    }
  },
  {
    id: 2,
    title: 'Cableado de Lectora RFID Wiegand',
    desc: 'Conecta [+12V] y [GND] de la Lectora a la Fuente 12V. Luego conecta [D0 (Verde)] de la Lectora al borne [W_D0] de la Controladora, y [D1 (Azul)] a [W_D1].',
    hint: 'Las líneas de comunicación Wiegand requieren que D0 se conecte con W_D0 y D1 con W_D1.',
    check: (components, wires, sysState) => {
      return sysState.readerPowered && sysState.wiegandConnected;
    }
  },
  {
    id: 3,
    title: 'Cerradura Fail-Safe (Electroimán)',
    desc: 'Conecta [+12V] de la Fuente al borne [COM] de la Controladora. Conecta el borne [NC (Lock)] de la Controladora al borne [+12V] del Electroimán, y el [GND] del Electroimán al [GND] de la Fuente.',
    hint: 'El contacto normalmente cerrado (NC) mantiene el electroimán energizado para bloquear la puerta.',
    check: (components, wires, sysState) => {
      const maglock = components.find(c => c.type === 'maglock');
      return maglock && sysState.lockPowered;
    }
  },
  {
    id: 4,
    title: 'Prueba de Apertura y Multímetro',
    desc: 'Mide con el Multímetro los 12VDC en el Electroimán y luego presiona "Deslizar Tarjeta RFID" en el inspector para probar la apertura de puerta.',
    hint: 'Al leer la tarjeta, la controladora conmutará el relé liberando la cerradura durante 5 segundos.',
    check: (components, wires, sysState, dmmVoltage) => {
      return sysState.accessGranted && Math.abs(dmmVoltage) > 10;
    }
  }
];

// Application State
let state = {
  mode: 'guided',
  currentLessonIndex: 0,
  isSchematic: false,
  selectedColor: 'red',
  
  components: [],
  wires: [],
  selectedElement: null,
  
  activeWireDraft: null,
  draggedComponentId: null,
  dragOffset: { x: 0, y: 0 },
  
  multimeterProbes: {
    red: { targetCompId: null, targetTermId: null, x: 0, y: 0 },
    black: { targetCompId: null, targetTermId: null, x: 0, y: 0 }
  },
  draggedProbe: null,
  
  sysState: {
    controllerPowered: false,
    readerPowered: false,
    wiegandConnected: false,
    lockPowered: false,
    accessGranted: false,
    doorUnlocked: false,
    message: '',
    statusType: 'neutral'
  },

  history: [],
  historyIndex: -1
};

const DOM = {
  svgCanvas: document.getElementById('circuit-svg'),
  componentsLayer: document.getElementById('components-layer'),
  wiresLayer: document.getElementById('wires-layer'),
  activeWireLayer: document.getElementById('active-wire-layer'),
  gridLayer: document.getElementById('grid-layer'),
  multimeterLeadsLayer: document.getElementById('multimeter-leads-layer'),
  
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),
  btnReset: document.getElementById('btn-reset'),
  btnToggleSchematic: document.getElementById('btn-toggle-schematic'),
  btnModeGuided: document.getElementById('btn-mode-guided'),
  btnModeFree: document.getElementById('btn-mode-free'),
  btnModeLibrary: document.getElementById('btn-mode-library'),
  workbenchContainer: document.querySelector('.workbench-container'),
  libraryView: document.getElementById('library-view'),
  libCompTitle: document.getElementById('lib-comp-title'),
  libCompDesc: document.getElementById('lib-comp-desc'),
  libSvgViewport: document.getElementById('lib-svg-viewport'),
  libBottomPanel: document.getElementById('lib-bottom-panel'),
  libBtnCopySvg: document.getElementById('lib-btn-copy-svg'),
  libBtnDownloadSvg: document.getElementById('lib-btn-download-svg'),
  
  guidedBanner: document.getElementById('guided-banner'),
  lessonNumber: document.getElementById('lesson-number'),
  lessonTitle: document.getElementById('lesson-title'),
  lessonDesc: document.getElementById('lesson-desc'),
  lessonStatusTag: document.getElementById('lesson-status-tag'),
  btnHint: document.getElementById('btn-hint'),
  hintBox: document.getElementById('hint-box'),
  hintText: document.getElementById('hint-text'),
  btnCloseHint: document.getElementById('btn-close-hint'),
  
  emptyInspector: document.getElementById('empty-inspector'),
  componentInspector: document.getElementById('component-inspector'),
  multimeterInspector: document.getElementById('multimeter-inspector'),
  inspectTypeBadge: document.getElementById('inspect-type-badge'),
  inspectTitle: document.getElementById('inspect-title'),
  inspectDesc: document.getElementById('inspect-desc'),
  configGroup: document.getElementById('config-group'),
  inspectParamLabel: document.getElementById('inspect-param-label'),
  inspectParamInput: document.getElementById('inspect-param-input'),
  inspectParamUnit: document.getElementById('inspect-param-unit'),
  
  btnSwipe: document.getElementById('btn-action-swipe'),
  btnRex: document.getElementById('btn-action-rex'),
  btnDps: document.getElementById('btn-action-dps'),
  btnDeleteElement: document.getElementById('btn-delete-element'),
  
  readVoltage: document.getElementById('read-voltage'),
  readCurrent: document.getElementById('read-current'),
  readPower: document.getElementById('read-power'),
  
  dmmValue: document.getElementById('dmm-value'),
  probeRedTarget: document.getElementById('probe-red-target'),
  probeBlackTarget: document.getElementById('probe-black-target'),
  
  circuitStatusBar: document.getElementById('circuit-status-bar'),
  circuitStatusText: document.getElementById('circuit-status-text')
};

function init() {
  renderGrid();
  setupPaletteDragAndDrop();
  setupCanvasEvents();
  setupToolbarEvents();
  setupInspectorEvents();
  setupLibraryEvents();
  
  state.mode = 'library';
  if (DOM.workbenchContainer) DOM.workbenchContainer.classList.add('hidden');
  if (DOM.guidedBanner) DOM.guidedBanner.classList.add('hidden');
  if (DOM.libraryView) DOM.libraryView.classList.remove('hidden');
  loadLibraryComponent(currentLibComp);
}

function renderGrid() {
  const width = DOM.svgCanvas.clientWidth || window.innerWidth;
  const height = DOM.svgCanvas.clientHeight || window.innerHeight;
  const gridSize = 20;
  
  let dotsPattern = '';
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      dotsPattern += `<circle cx="${x}" cy="${y}" r="1" fill="#CBD5E1" opacity="0.5" />`;
    }
  }
  DOM.gridLayer.innerHTML = dotsPattern;
}

function createComponent(type, x, y) {
  const def = COMPONENT_DEFS[type];
  if (!def) return;
  
  const newComp = {
    id: 'dev_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: type,
    x: x,
    y: y,
    paramValue: def.defaultParam || 0,
    state: { relayActive: false },
    simData: { voltage: 0, statusStr: 'OK' }
  };

  state.components.push(newComp);
  
  if (type === 'multimeter') {
    state.multimeterProbes.red = { targetCompId: null, targetTermId: null, x: x - 40, y: y + 90 };
    state.multimeterProbes.black = { targetCompId: null, targetTermId: null, x: x + 40, y: y + 90 };
  }
  
  saveStateToHistory();
  render();
  selectElement('component', newComp.id);
}

function deleteSelectedElement() {
  if (!state.selectedElement) return;
  
  const { type, id } = state.selectedElement;
  if (type === 'component') {
    state.components = state.components.filter(c => c.id !== id);
    state.wires = state.wires.filter(w => w.fromCompId !== id && w.toCompId !== id);
    if (state.multimeterProbes.red.targetCompId === id) state.multimeterProbes.red.targetCompId = null;
    if (state.multimeterProbes.black.targetCompId === id) state.multimeterProbes.black.targetCompId = null;
  } else if (type === 'wire') {
    state.wires = state.wires.filter(w => w.id !== id);
  }
  
  state.selectedElement = null;
  saveStateToHistory();
  render();
}

function getTerminalAbsolutePos(compId, termId) {
  const comp = state.components.find(c => c.id === compId);
  if (!comp) return { x: 0, y: 0 };
  
  const def = COMPONENT_DEFS[comp.type];
  const termDef = def.terminals.find(t => t.id === termId);
  const offset = termDef ? termDef.offset : { x: 0, y: 0 };
  
  return {
    x: comp.x + offset.x,
    y: comp.y + offset.y
  };
}

function computeBezierPath(p1, p2) {
  const dx = Math.abs(p2.x - p1.x);
  const curvature = Math.max(dx * 0.5, 40);
  const cp1 = { x: p1.x + (p2.x > p1.x ? curvature : -curvature), y: p1.y };
  const cp2 = { x: p2.x + (p2.x > p1.x ? -curvature : curvature), y: p2.y };
  return `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
}

function getWireStrokeColor(colorName) {
  switch (colorName) {
    case 'red': return '#EF4444';
    case 'black': return '#1E293B';
    case 'green': return '#10B981';
    case 'blue': return '#2563EB';
    default: return '#EF4444';
  }
}

function setupPaletteDragAndDrop() {
  const paletteItems = document.querySelectorAll('.palette-item');
  paletteItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('component-type', item.getAttribute('data-type'));
    });
  });
  
  DOM.svgCanvas.addEventListener('dragover', (e) => e.preventDefault());
  
  DOM.svgCanvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('component-type');
    if (type) {
      const rect = DOM.svgCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createComponent(type, x, y);
    }
  });
}

function setupCanvasEvents() {
  DOM.svgCanvas.addEventListener('click', (e) => {
    if (e.target === DOM.svgCanvas || e.target.id === 'grid-layer') {
      state.selectedElement = null;
      renderInspector();
      renderWires();
      renderComponents();
    }
  });

  window.addEventListener('mousemove', (e) => {
    const rect = DOM.svgCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (state.draggedComponentId) {
      const comp = state.components.find(c => c.id === state.draggedComponentId);
      if (comp) {
        comp.x = Math.round((mouseX - state.dragOffset.x) / 10) * 10;
        comp.y = Math.round((mouseY - state.dragOffset.y) / 10) * 10;
        render();
      }
    }
    
    if (state.activeWireDraft) {
      state.activeWireDraft.currentX = mouseX;
      state.activeWireDraft.currentY = mouseY;
      
      let snappedTerm = findNearbyTerminal(mouseX, mouseY);
      if (snappedTerm) {
        state.activeWireDraft.currentX = snappedTerm.pos.x;
        state.activeWireDraft.currentY = snappedTerm.pos.y;
      }
      renderActiveWireDraft();
    }
    
    if (state.draggedProbe) {
      const probe = state.multimeterProbes[state.draggedProbe];
      probe.x = mouseX;
      probe.y = mouseY;
      
      let snappedTerm = findNearbyTerminal(mouseX, mouseY);
      if (snappedTerm) {
        probe.targetCompId = snappedTerm.compId;
        probe.targetTermId = snappedTerm.termId;
        probe.x = snappedTerm.pos.x;
        probe.y = snappedTerm.pos.y;
      } else {
        probe.targetCompId = null;
        probe.targetTermId = null;
      }
      
      renderMultimeterLeads();
      updateSimulation();
      renderInspector();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (state.draggedComponentId) {
      state.draggedComponentId = null;
      saveStateToHistory();
    }
    
    if (state.activeWireDraft) {
      const rect = DOM.svgCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const targetTerm = findNearbyTerminal(mouseX, mouseY);
      if (targetTerm && (targetTerm.compId !== state.activeWireDraft.fromCompId || targetTerm.termId !== state.activeWireDraft.fromTermId)) {
        const newWire = {
          id: 'wire_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          fromCompId: state.activeWireDraft.fromCompId,
          fromTermId: state.activeWireDraft.fromTermId,
          toCompId: targetTerm.compId,
          toTermId: targetTerm.termId,
          color: state.selectedColor
        };
        state.wires.push(newWire);
        saveStateToHistory();
      }
      
      state.activeWireDraft = null;
      DOM.activeWireLayer.innerHTML = '';
      render();
    }
    
    if (state.draggedProbe) {
      state.draggedProbe = null;
      saveStateToHistory();
    }
  });
}

function findNearbyTerminal(x, y, threshold = 30) {
  let closest = null;
  let minDist = threshold;
  
  state.components.forEach(comp => {
    const def = COMPONENT_DEFS[comp.type];
    def.terminals.forEach(term => {
      const pos = getTerminalAbsolutePos(comp.id, term.id);
      const dist = Math.hypot(pos.x - x, pos.y - y);
      if (dist < minDist) {
        minDist = dist;
        closest = { compId: comp.id, termId: term.id, pos: pos };
      }
    });
  });
  
  return closest;
}

function setupToolbarEvents() {
  DOM.btnUndo.addEventListener('click', undo);
  DOM.btnRedo.addEventListener('click', redo);
  
  DOM.btnReset.addEventListener('click', () => {
    if (confirm('¿Deseas reiniciar el banco de prueba de control de acceso?')) {
      state.components = [];
      state.wires = [];
      state.selectedElement = null;
      saveStateToHistory();
      render();
    }
  });
  
  DOM.btnToggleSchematic.addEventListener('click', () => {
    state.isSchematic = !state.isSchematic;
    DOM.btnToggleSchematic.classList.toggle('active', state.isSchematic);
    renderComponents();
  });
  
  DOM.btnModeGuided.addEventListener('click', () => {
    state.mode = 'guided';
    DOM.btnModeGuided.classList.add('active');
    DOM.btnModeFree.classList.remove('active');
    DOM.btnModeLibrary.classList.remove('active');
    DOM.workbenchContainer.classList.remove('hidden');
    DOM.libraryView.classList.add('hidden');
    DOM.guidedBanner.classList.remove('hidden');
    render();
  });
  
  DOM.btnModeFree.addEventListener('click', () => {
    state.mode = 'free';
    DOM.btnModeFree.classList.add('active');
    DOM.btnModeGuided.classList.remove('active');
    DOM.btnModeLibrary.classList.remove('active');
    DOM.workbenchContainer.classList.remove('hidden');
    DOM.libraryView.classList.add('hidden');
    DOM.guidedBanner.classList.add('hidden');
    render();
  });

  DOM.btnModeLibrary.addEventListener('click', () => {
    state.mode = 'library';
    DOM.btnModeLibrary.classList.add('active');
    DOM.btnModeGuided.classList.remove('active');
    DOM.btnModeFree.classList.remove('active');
    DOM.workbenchContainer.classList.add('hidden');
    DOM.guidedBanner.classList.add('hidden');
    DOM.libraryView.classList.remove('hidden');
    loadLibraryComponent(currentLibComp);
  });

  DOM.btnHint.addEventListener('click', () => DOM.hintBox.classList.toggle('hidden'));
  DOM.btnCloseHint.addEventListener('click', () => DOM.hintBox.classList.add('hidden'));

  const colorBtns = document.querySelectorAll('.color-btn');
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedColor = btn.getAttribute('data-color');
    });
  });
}

function setupInspectorEvents() {
  DOM.inspectParamInput.addEventListener('input', (e) => {
    if (!state.selectedElement || state.selectedElement.type !== 'component') return;
    const comp = state.components.find(c => c.id === state.selectedElement.id);
    if (comp) {
      comp.paramValue = parseFloat(e.target.value) || 0;
      updateSimulation();
      renderInspector();
    }
  });

  DOM.btnSwipe.addEventListener('click', () => triggerAccessGrant('RFID Card Swiped'));
  DOM.btnRex.addEventListener('click', () => triggerAccessGrant('REX Button Pressed'));
  if (DOM.btnDps) {
    DOM.btnDps.addEventListener('click', () => triggerDpsDetection());
  }
  DOM.btnDeleteElement.addEventListener('click', deleteSelectedElement);
}

function triggerDpsDetection() {
  const dps = state.components.find(c => c.type === 'dps');
  if (dps) {
    dps.state.motionDetected = true;
    dps.state.relayActive = true;
    
    // If controller is connected via REX or relay, trigger grant
    triggerAccessGrant('DPS Motion / REX Triggered');
    render();
    
    const holdTime = (dps.paramValue || 5) * 1000;
    setTimeout(() => {
      dps.state.motionDetected = false;
      dps.state.relayActive = false;
      render();
    }, holdTime);
  }
}

function triggerAccessGrant(reason) {
  const ctrl = state.components.find(c => c.type === 'controller');
  if (ctrl && state.sysState.controllerPowered) {
    ctrl.state.relayActive = true;
    state.sysState.accessGranted = true;
    state.sysState.doorUnlocked = true;
    
    render();
    
    const holdTime = (ctrl.paramValue || 5) * 1000;
    setTimeout(() => {
      ctrl.state.relayActive = false;
      state.sysState.doorUnlocked = false;
      render();
    }, holdTime);
  }
}

function selectElement(type, id) {
  state.selectedElement = { type, id };
  renderInspector();
  renderWires();
  renderComponents();
}

function renderInspector() {
  if (!state.selectedElement) {
    DOM.emptyInspector.classList.remove('hidden');
    DOM.componentInspector.classList.add('hidden');
    DOM.multimeterInspector.classList.add('hidden');
    return;
  }

  const { type, id } = state.selectedElement;

  if (type === 'component') {
    const comp = state.components.find(c => c.id === id);
    if (!comp) {
      state.selectedElement = null;
      renderInspector();
      return;
    }

    const def = COMPONENT_DEFS[comp.type];

    if (comp.type === 'multimeter') {
      DOM.emptyInspector.classList.add('hidden');
      DOM.componentInspector.classList.add('hidden');
      DOM.multimeterInspector.classList.remove('hidden');

      DOM.probeRedTarget.innerText = state.multimeterProbes.red.targetCompId ? 'Conectada a Borne' : 'Libre';
      DOM.probeBlackTarget.innerText = state.multimeterProbes.black.targetCompId ? 'Conectada a Borne' : 'Libre';
      return;
    }

    DOM.emptyInspector.classList.add('hidden');
    DOM.multimeterInspector.classList.add('hidden');
    DOM.componentInspector.classList.remove('hidden');

    DOM.inspectTypeBadge.innerText = def.name;
    DOM.inspectTitle.innerText = `${def.name} (#${comp.id.slice(-4)})`;
    DOM.inspectDesc.innerText = def.desc;

    if (def.paramName) {
      DOM.configGroup.classList.remove('hidden');
      DOM.inspectParamLabel.innerText = def.paramName;
      DOM.inspectParamInput.value = comp.paramValue;
    } else {
      DOM.configGroup.classList.add('hidden');
    }

    if (comp.type === 'reader') {
      DOM.btnSwipe.classList.remove('hidden');
      DOM.btnRex.classList.add('hidden');
      if (DOM.btnDps) DOM.btnDps.classList.add('hidden');
    } else if (comp.type === 'rex') {
      DOM.btnRex.classList.remove('hidden');
      DOM.btnSwipe.classList.add('hidden');
      if (DOM.btnDps) DOM.btnDps.classList.add('hidden');
    } else if (comp.type === 'dps') {
      if (DOM.btnDps) DOM.btnDps.classList.remove('hidden');
      DOM.btnSwipe.classList.add('hidden');
      DOM.btnRex.classList.add('hidden');
    } else {
      DOM.btnSwipe.classList.add('hidden');
      DOM.btnRex.classList.add('hidden');
      if (DOM.btnDps) DOM.btnDps.classList.add('hidden');
    }

    DOM.readVoltage.innerText = `${(state.sysState.controllerPowered ? 12.0 : 0.0).toFixed(1)} V`;
    DOM.readCurrent.innerText = comp.state.relayActive ? 'NO (Abierto/Conmutado)' : 'NC (Cerrado)';
    DOM.readPower.innerText = state.sysState.doorUnlocked ? 'ABIERTA 🔓' : 'BLOQUEADA 🔒';
  } else if (type === 'wire') {
    const wire = state.wires.find(w => w.id === id);
    if (!wire) return;
    
    DOM.emptyInspector.classList.add('hidden');
    DOM.multimeterInspector.classList.add('hidden');
    DOM.componentInspector.classList.remove('hidden');

    DOM.inspectTypeBadge.innerText = 'Cable de Acceso';
    DOM.inspectTitle.innerText = `Cableado (${wire.color.toUpperCase()})`;
    DOM.inspectDesc.innerText = 'Línea de transmisión eléctrica VDC o datos Wiegand entre equipos.';
    DOM.configGroup.classList.add('hidden');
    DOM.btnSwipe.classList.add('hidden');
    DOM.btnRex.classList.add('hidden');

    DOM.readVoltage.innerText = '12.0 V';
    DOM.readCurrent.innerText = 'Señal OK';
    DOM.readPower.innerText = 'Conexión Estable';
  }
}

function updateSimulation() {
  const psu = state.components.find(c => c.type === 'psu');
  const ctrl = state.components.find(c => c.type === 'controller');
  const reader = state.components.find(c => c.type === 'reader');
  const maglock = state.components.find(c => c.type === 'maglock');
  
  let ctrlPowered = false;
  let readerPowered = false;
  let wiegandOK = false;
  let lockPowered = false;
  
  if (psu && ctrl) {
    const posPower = isConnected(psu.id, 'pos', ctrl.id, 'pwr_in');
    const negPower = isConnected(psu.id, 'neg', ctrl.id, 'gnd_in');
    if (posPower && negPower) ctrlPowered = true;
  }

  if (ctrlPowered && reader && psu) {
    const rVcc = isConnected(psu.id, 'pos', reader.id, 'vcc');
    const rGnd = isConnected(psu.id, 'neg', reader.id, 'gnd');
    if (rVcc && rGnd) readerPowered = true;
    
    const d0Conn = isConnected(reader.id, 'd0', ctrl.id, 'w_d0');
    const d1Conn = isConnected(reader.id, 'd1', ctrl.id, 'w_d1');
    if (d0Conn && d1Conn) wiegandOK = true;
  }

  if (ctrlPowered && maglock && psu) {
    const psuToCom = isConnected(psu.id, 'pos', ctrl.id, 'relay_com');
    const ncToLock = isConnected(ctrl.id, 'relay_nc', maglock.id, 'pos');
    const lockToGnd = isConnected(maglock.id, 'neg', psu.id, 'neg');
    if (psuToCom && ncToLock && lockToGnd && !ctrl.state.relayActive) lockPowered = true;
  }

  state.sysState.controllerPowered = ctrlPowered;
  state.sysState.readerPowered = readerPowered;
  state.sysState.wiegandConnected = wiegandOK;
  state.sysState.lockPowered = lockPowered;

  let statusMessage = 'Circuito desenergizado. Conecta la Fuente Regulada (+12V y GND) a la Controladora [PWR IN y GND IN].';
  let statusType = 'neutral';

  if (ctrlPowered) {
    statusType = 'success';
    statusMessage = 'Controladora IP alimentada (12VDC OK).';
    if (readerPowered && wiegandOK) statusMessage += ' Lectora Wiegand en línea.';
    if (lockPowered) statusMessage += ' Electroimán retenido (Puerta Bloqueada 🔒).';
    else if (ctrl.state.relayActive) statusMessage = '¡ACCESO PERMITIDO! Relé activado. Puerta liberada 🔓 por 5s.';
  }

  DOM.circuitStatusBar.className = `circuit-status-bar ${statusType}`;
  DOM.circuitStatusText.innerText = statusMessage;

  let dmmVoltage = 0.0;
  const pRed = state.multimeterProbes.red;
  const pBlack = state.multimeterProbes.black;
  if (pRed.targetCompId && pBlack.targetCompId && ctrlPowered) {
    dmmVoltage = 12.0;
  }
  
  DOM.dmmValue.innerText = `${dmmVoltage.toFixed(1)} V`;

  if (state.mode === 'guided') checkLessonProgress(dmmVoltage);
}

function isConnected(c1, t1, c2, t2) {
  return state.wires.some(w => 
    (w.fromCompId === c1 && w.fromTermId === t1 && w.toCompId === c2 && w.toTermId === t2) ||
    (w.fromCompId === c2 && w.fromTermId === t2 && w.toCompId === c1 && w.toTermId === t1)
  );
}

function loadLesson(index) {
  if (index >= GUIDED_LESSONS.length) index = 0;
  state.currentLessonIndex = index;
  const lesson = GUIDED_LESSONS[index];
  
  DOM.lessonNumber.innerText = lesson.id;
  DOM.lessonTitle.innerText = lesson.title;
  DOM.lessonDesc.innerText = lesson.desc;
  DOM.hintText.innerText = lesson.hint;
  DOM.hintBox.classList.add('hidden');
  
  DOM.lessonStatusTag.className = 'status-tag pending';
  DOM.lessonStatusTag.innerText = 'En progreso';
}

function checkLessonProgress(dmmVoltage) {
  const currentLesson = GUIDED_LESSONS[state.currentLessonIndex];
  if (!currentLesson) return;
  
  const isPassed = currentLesson.check(state.components, state.wires, state.sysState, dmmVoltage);
  if (isPassed) {
    DOM.lessonStatusTag.className = 'status-tag completed';
    DOM.lessonStatusTag.innerText = '¡Práctica Completada! 🎉';
    
    setTimeout(() => {
      if (state.currentLessonIndex < GUIDED_LESSONS.length - 1) {
        loadLesson(state.currentLessonIndex + 1);
      }
    }, 2500);
  }
}

function render() {
  updateSimulation();
  renderComponents();
  renderWires();
  renderMultimeterLeads();
  renderInspector();
  updateUndoRedoButtons();
}

function renderComponents() {
  DOM.componentsLayer.innerHTML = '';
  
  state.components.forEach(comp => {
    const def = COMPONENT_DEFS[comp.type];
    const isSelected = state.selectedElement && state.selectedElement.type === 'component' && state.selectedElement.id === comp.id;
    const isEnergized = state.sysState.controllerPowered;
    
    const isDps = comp.type === 'dps';
    const nodeEl = document.createElement('div');
    nodeEl.className = `component-node ${isDps ? 'comp-dps' : ''} ${isSelected ? 'selected' : ''} ${isEnergized ? 'active-energized' : ''}`;
    nodeEl.style.left = `${comp.x - (isDps ? 110 : 85)}px`;
    nodeEl.style.top = `${comp.y - (isDps ? 70 : 60)}px`;
    
    nodeEl.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('terminal')) return;
      state.draggedComponentId = comp.id;
      state.dragOffset = {
        x: e.clientX - DOM.svgCanvas.getBoundingClientRect().left - comp.x,
        y: e.clientY - DOM.svgCanvas.getBoundingClientRect().top - comp.y
      };
      selectElement('component', comp.id);
      e.stopPropagation();
    });

    let visualIconHtml = getComponentVisualSvg(comp, isEnergized);
    
    // Render Terminals WITH VISIBLE TEXT LABELS
    let terminalsHtml = '';
    def.terminals.forEach(term => {
      terminalsHtml += `
        <div class="terminal-wrapper ${term.pos}">
          <div class="terminal" 
               data-comp-id="${comp.id}" 
               data-term-id="${term.id}">
          </div>
          <span class="terminal-label">${term.label}</span>
        </div>
      `;
    });

    nodeEl.innerHTML = `
      <div class="node-body">
        ${visualIconHtml}
        ${terminalsHtml}
      </div>
      <span class="node-title">${def.name}</span>
    `;

    nodeEl.querySelectorAll('.terminal').forEach(termEl => {
      termEl.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const compId = termEl.getAttribute('data-comp-id');
        const termId = termEl.getAttribute('data-term-id');
        const pos = getTerminalAbsolutePos(compId, termId);
        
        state.activeWireDraft = {
          fromCompId: compId,
          fromTermId: termId,
          currentX: pos.x,
          currentY: pos.y
        };
      });
    });

    DOM.componentsLayer.appendChild(nodeEl);
  });
}

function getComponentVisualSvg(comp, isEnergized) {
  if (state.isSchematic) {
    return `<svg viewBox="0 0 50 30" width="50" height="30"><rect x="5" y="5" width="40" height="20" fill="none" stroke="#334155" stroke-width="2"/></svg>`;
  }

  switch (comp.type) {
    case 'dps':
      const isMotion = comp.state && comp.state.motionDetected;
      return `<svg viewBox="0 0 180 75" width="180" height="75">
                <rect x="2" y="2" width="176" height="71" rx="6" fill="#cbd5e1" stroke="#334155" stroke-width="1.5"/>
                <!-- Green PCB Area -->
                <rect x="6" y="6" width="112" height="63" rx="3" fill="#0f5132" stroke="#064e3b" stroke-width="1"/>
                <!-- TS2 Top Terminal Block -->
                <rect x="10" y="9" width="54" height="14" rx="1.5" fill="#15803d"/>
                <!-- TS1 Bottom Terminal Block -->
                <rect x="10" y="52" width="54" height="14" rx="1.5" fill="#15803d"/>
                <!-- Takamisawa Relay -->
                <rect x="68" y="9" width="22" height="26" rx="1" fill="#f8fafc" stroke="#334155" stroke-width="0.6"/>
                <text x="79" y="22" font-size="4.5" font-family="monospace" font-weight="bold" fill="#0f172a" text-anchor="middle">A12W</text>
                <!-- Buzzer -->
                <circle cx="79" cy="48" r="9" fill="#111827"/>
                <circle cx="79" cy="48" r="2" fill="#ca8a04"/>
                <!-- Red 10-Pos DIP Switch -->
                <rect x="94" y="9" width="18" height="57" rx="2" fill="#dc2626" stroke="#991b1b" stroke-width="0.8"/>
                <text x="103" y="16" font-size="4" font-family="monospace" font-weight="bold" fill="#ffffff" text-anchor="middle">ON</text>
                <!-- Right Plastic Housing + Fresnel Lens -->
                <rect x="122" y="6" width="52" height="63" rx="4" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
                <!-- Status LED -->
                <circle cx="130" cy="37" r="3.5" fill="${isMotion ? '#ef4444' : (isEnergized ? '#22c55e' : '#475569')}"/>
                <!-- Fresnel Lens Window -->
                <rect x="138" y="12" width="32" height="51" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
                <path d="M 138 20 Q 154 26 170 20 L 170 55 Q 154 61 138 55 Z" fill="#e2e8f0" opacity="0.6"/>
                <text x="154" y="38" font-size="4.5" font-family="monospace" font-weight="bold" fill="#475569" text-anchor="middle">PIR</text>
              </svg>`;

    case 'psu':
      return `<svg viewBox="0 0 70 45" width="65" height="40">
                <rect x="4" y="4" width="62" height="36" rx="4" fill="#334155"/>
                <circle cx="14" cy="14" r="4" fill="${isEnergized ? '#10B981' : '#94A3B8'}"/>
                <text x="26" y="26" fill="#F8FAFC" font-size="10" font-weight="bold">12VDC</text>
              </svg>`;

    case 'controller':
      return `<svg viewBox="0 0 70 50" width="65" height="45">
                <rect x="4" y="4" width="62" height="42" rx="4" fill="#065F46"/>
                <rect x="12" y="10" width="46" height="16" rx="2" fill="#047857"/>
                <circle cx="16" cy="36" r="3" fill="${isEnergized ? '#34D399' : '#94A3B8'}"/>
                <circle cx="26" cy="36" r="3" fill="${comp.state.relayActive ? '#FBBF24' : '#94A3B8'}"/>
              </svg>`;

    case 'reader':
      return `<svg viewBox="0 0 50 50" width="45" height="45">
                <rect x="8" y="4" width="34" height="42" rx="6" fill="#1E293B"/>
                <circle cx="25" cy="16" r="6" fill="${state.sysState.readerPowered ? '#38BDF8' : '#64748B'}"/>
              </svg>`;

    case 'maglock':
      const isLocked = state.sysState.lockPowered;
      return `<svg viewBox="0 0 160 50" width="150" height="46">
                <!-- Top Bracket -->
                <rect x="2" y="2" width="156" height="10" rx="1.5" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
                <circle cx="10" cy="7" r="1.5" fill="#1e293b"/>
                <circle cx="20" cy="7" r="1.5" fill="#1e293b"/>
                <circle cx="140" cy="7" r="1.5" fill="#1e293b"/>
                <circle cx="150" cy="7" r="1.5" fill="#1e293b"/>
                <!-- Main Body -->
                <rect x="2" y="12" width="156" height="34" rx="2" fill="#e2e8f0" stroke="#334155" stroke-width="1"/>
                <!-- Magnetic Core -->
                <rect x="8" y="15" width="102" height="28" rx="1" fill="#0f172a"/>
                <rect x="12" y="18" width="94" height="4" fill="#ffffff"/>
                <rect x="12" y="24" width="94" height="10" fill="#f8fafc" stroke="#475569" stroke-width="0.5"/>
                <rect x="12" y="36" width="94" height="4" fill="#ffffff"/>
                <!-- Brand Text & LED -->
                <rect x="114" y="12" width="44" height="34" fill="#cbd5e1" stroke="#475569" stroke-width="0.5"/>
                <text x="118" y="22" font-size="3.5" font-family="sans-serif" font-weight="bold" fill="#0f172a">ALARM</text>
                <text x="118" y="27" font-size="3" font-family="sans-serif" font-weight="bold" font-style="italic" fill="#0f172a">CONTROLS</text>
                <text x="118" y="34" font-size="3.8" font-family="sans-serif" font-weight="bold" fill="#0f172a">ASSA ABLOY</text>
                <text x="118" y="41" font-size="2.8" font-family="monospace" font-weight="bold" fill="#475569">600 LBS</text>
                <circle cx="150" cy="22" r="2.5" fill="${isLocked ? '#22c55e' : '#475569'}"/>
              </svg>`;

    case 'rex':
      return `<svg viewBox="0 0 45 45" width="40" height="40">
                <rect x="4" y="4" width="37" height="37" rx="6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
                <circle cx="22.5" cy="22.5" r="10" fill="#EF4444"/>
              </svg>`;

    case 'multimeter':
      return `<svg viewBox="0 0 50 60" width="45" height="55">
                <rect x="4" y="4" width="42" height="52" rx="6" fill="#F97316"/>
                <rect x="8" y="8" width="34" height="16" rx="2" fill="#0F172A"/>
                <circle cx="25" cy="38" r="8" fill="#334155"/>
              </svg>`;

    default:
      return `<svg viewBox="0 0 40 30" width="40" height="30"><rect width="40" height="30" fill="#CBD5E1"/></svg>`;
  }
}

function renderWires() {
  DOM.wiresLayer.innerHTML = '';
  state.wires.forEach(wire => {
    const p1 = getTerminalAbsolutePos(wire.fromCompId, wire.fromTermId);
    const p2 = getTerminalAbsolutePos(wire.toCompId, wire.toTermId);
    const pathD = computeBezierPath(p1, p2);
    const color = getWireStrokeColor(wire.color);
    const isSelected = state.selectedElement && state.selectedElement.type === 'wire' && state.selectedElement.id === wire.id;
    
    const wirePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    wirePath.setAttribute('d', pathD);
    wirePath.setAttribute('class', `wire-path ${isSelected ? 'selected' : ''}`);
    wirePath.setAttribute('stroke', color);
    wirePath.setAttribute('stroke-width', '4');
    
    if (state.sysState.controllerPowered) {
      wirePath.setAttribute('stroke-dasharray', '8 6');
      wirePath.classList.add('energy-flow-dot');
    }

    wirePath.addEventListener('click', (e) => {
      e.stopPropagation();
      selectElement('wire', wire.id);
    });

    DOM.wiresLayer.appendChild(wirePath);
  });
}

function renderActiveWireDraft() {
  DOM.activeWireLayer.innerHTML = '';
  if (!state.activeWireDraft) return;

  const p1 = getTerminalAbsolutePos(state.activeWireDraft.fromCompId, state.activeWireDraft.fromTermId);
  const p2 = { x: state.activeWireDraft.currentX, y: state.activeWireDraft.currentY };
  const pathD = computeBezierPath(p1, p2);
  const color = getWireStrokeColor(state.selectedColor);

  const draftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  draftPath.setAttribute('d', pathD);
  draftPath.setAttribute('stroke', color);
  draftPath.setAttribute('stroke-width', '4');
  draftPath.setAttribute('stroke-dasharray', '4 4');
  draftPath.setAttribute('fill', 'none');

  DOM.activeWireLayer.appendChild(draftPath);
}

function renderMultimeterLeads() {
  DOM.multimeterLeadsLayer.innerHTML = '';
  const mmComp = state.components.find(c => c.type === 'multimeter');
  if (!mmComp) return;

  ['red', 'black'].forEach(probeKey => {
    const probe = state.multimeterProbes[probeKey];
    const color = probeKey === 'red' ? '#EF4444' : '#1E293B';
    
    const p1 = { x: mmComp.x, y: mmComp.y };
    const p2 = { x: probe.x, y: probe.y };
    const pathD = computeBezierPath(p1, p2);
    
    const leadPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    leadPath.setAttribute('d', pathD);
    leadPath.setAttribute('stroke', color);
    leadPath.setAttribute('stroke-width', '2.5');
    leadPath.setAttribute('fill', 'none');
    leadPath.setAttribute('opacity', '0.7');
    
    const tipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    tipCircle.setAttribute('cx', probe.x);
    tipCircle.setAttribute('cy', probe.y);
    tipCircle.setAttribute('r', '7');
    tipCircle.setAttribute('fill', color);
    tipCircle.setAttribute('stroke', '#FFFFFF');
    tipCircle.setAttribute('stroke-width', '2');
    tipCircle.setAttribute('style', 'cursor: grab;');

    tipCircle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      state.draggedProbe = probeKey;
    });

    DOM.multimeterLeadsLayer.appendChild(leadPath);
    DOM.multimeterLeadsLayer.appendChild(tipCircle);
  });
}

function saveStateToHistory() {
  const snapshot = {
    components: JSON.parse(JSON.stringify(state.components)),
    wires: JSON.parse(JSON.stringify(state.wires)),
    multimeterProbes: JSON.parse(JSON.stringify(state.multimeterProbes))
  };
  
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  state.historyIndex = state.history.length - 1;
  
  updateUndoRedoButtons();
}

function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    restoreSnapshot(state.history[state.historyIndex]);
  }
}

function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    restoreSnapshot(state.history[state.historyIndex]);
  }
}

function restoreSnapshot(snapshot) {
  state.components = JSON.parse(JSON.stringify(snapshot.components));
  state.wires = JSON.parse(JSON.stringify(snapshot.wires));
  state.multimeterProbes = JSON.parse(JSON.stringify(snapshot.multimeterProbes));
  render();
}

function updateUndoRedoButtons() {
  DOM.btnUndo.disabled = state.historyIndex <= 0;
  DOM.btnRedo.disabled = state.historyIndex >= state.history.length - 1;
}

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo();
  } else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    redo();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (document.activeElement.tagName !== 'INPUT') {
      deleteSelectedElement();
    }
  }
});

/* ==========================================================================
   In-App HD Vector Component Library Controller
   ========================================================================== */
let currentLibComp = 'controller';
let cachedLibrarySvgs = {
  controller: '',
  dps: '',
  maglock: '',
  crashbar: '',
  pushtoexit: '',
  altronix: '',
  dps_magnetic: '',
  rfid_reader: '',
  camden_relay: '',
  multimeter: '',
  hid_aero_x100: '',
  poe_switch: '',
  cable_18_2: ''
};

const LIB_COMP_INFO = {
  controller: {
    title: 'Door Controller (NTX700-CTLR)',
    desc: 'Controladora industrial multilínea con 4 relés Form-C, doble interfaz Wiegand, 50+ bornes y bus TCP/IP.',
    file: 'door_controller.svg'
  },
  dps: {
    title: 'Door Position Sensor PIR (DPS-800-REX)',
    desc: 'Sensor de posición de puerta y detector de movimiento con lente Fresnel PIR, 12 bornes, relé Takamisawa y DIP Switch x10.',
    file: 'door_position_sensor.svg'
  },
  maglock: {
    title: 'Electroimán 600 LBS (Maglock Fail-Safe)',
    desc: 'Cerradura electromagnética industrial en aluminio cepillado, núcleo de acero laminado con 2 bornes de conexión (+ / -).',
    file: 'maglock.svg'
  },
  crashbar: {
    title: 'Crashbar Electrificada (Von Duprin 75 / 99)',
    desc: 'Barra antipánico con retracción eléctrica motorizada de pestillo (QEL), acero inoxidable satinado y 2 bornes (+ / -).',
    file: 'crashbar.svg'
  },
  pushtoexit: {
    title: 'Pulsador Push to Exit (REX Iluminado)',
    desc: 'Botonera de salida con placa de acero inoxidable 304, botón iluminado verde y 5 bornes (COM Verde, NO Blanco, NC Naranja, + Rojo, - Negro).',
    file: 'pushtoexit.svg'
  },
  altronix: {
    title: 'Fuente Altronix AL400ULXB2 & ACM8',
    desc: 'Sistema de alimentación y distribución de control de acceso supervisado con 8 entradas de disparo (IN 1..8) y 8 salidas Form-C (NC/C/NO).',
    file: 'altronix_power_supply.svg'
  },
  dps_magnetic: {
    title: 'Contacto Magnético Empotrable (DPS Enforcer)',
    desc: 'Sensor magnético de posición de puerta con imán de neodimio, interruptor reed sellado y 2 cables (+ Señal / - GND).',
    file: 'magnetic_door_sensor.svg'
  },
  rfid_reader: {
    title: 'Lectora de Tarjetas RFID HID con Teclado',
    desc: 'Lector de tarjetas de proximidad y teclado de 12 dígitos con 6 bornes Wiegand (Rojo, Negro, Blanco, Verde, Azul, Marrón).',
    file: 'rfid_reader.svg'
  },
  camden_relay: {
    title: 'Relé de Interfaz Camden CX-12 PLUS',
    desc: 'Relé de secuenciamiento y control de puertas con 2 relés Form-C, 3 potenciómetros de retardo (DOR/DOO), DIP switch x3 y 16 bornes on-board.',
    file: 'camden_relay.svg'
  },
  multimeter: {
    title: 'Multímetro Digital Pro (DMM-9000)',
    desc: 'Instrumento industrial True RMS con selector de 3 posiciones (V= DC, V~ AC, •))) Continuidad), pantalla LCD retroiluminada y sondas de prueba.',
    file: 'digital_multimeter.svg'
  },
  hid_aero_x100: {
    title: 'Controladora HID Aero X100 (Dual Reader Interface)',
    desc: 'Módulo de interfaz industrial con soporte para 2 lectoras Wiegand/OSDP, 4 relés Omron, 4 entradas supervisadas, tamper, failover y 56 bornes on-board.',
    file: 'hid_aero_x100.svg'
  },
  poe_switch: {
    title: 'Switch PoE Gigabit Industrial (6 Puertos)',
    desc: 'Switch de red con 4 puertos PoE 48V (RJ45 8P8C), 1 puerto Up-link Gigabit, 1 slot SFP para fibra óptica, selector VLAN y protección 4KV.',
    file: 'poe_switch.svg'
  },
  cable_18_2: {
    title: 'Cable 18/2 AWG para Control de Acceso',
    desc: 'Cable de alimentación y señal de 2 conductores (Rojo + / Negro -) saliendo de ambas puntas, chaqueta PVC con serigrafía y cobre desnudo multifilar.',
    file: 'cable_18_2.svg'
  }
};

function setupLibraryEvents() {
  const libCards = document.querySelectorAll('.lib-card');
  libCards.forEach(card => {
    card.addEventListener('click', () => {
      libCards.forEach(c => {
        c.classList.remove('active');
        const pill = c.querySelector('.status-pill');
        if (pill) { pill.classList.remove('active'); pill.innerText = 'Disponible'; }
      });
      card.classList.add('active');
      const pill = card.querySelector('.status-pill');
      if (pill) { pill.classList.add('active'); pill.innerText = 'Activo'; }
      
      const compKey = card.getAttribute('data-comp');
      currentLibComp = compKey;
      loadLibraryComponent(compKey);
    });
  });

  if (DOM.libBtnCopySvg) {
    DOM.libBtnCopySvg.addEventListener('click', () => {
      const content = cachedLibrarySvgs[currentLibComp];
      if (content) {
        navigator.clipboard.writeText(content);
        alert(`¡Código SVG de ${LIB_COMP_INFO[currentLibComp].title} copiado al portapapeles!`);
      }
    });
  }

  if (DOM.libBtnDownloadSvg) {
    DOM.libBtnDownloadSvg.addEventListener('click', () => {
      const content = cachedLibrarySvgs[currentLibComp];
      if (content) {
        const blob = new Blob([content], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = LIB_COMP_INFO[currentLibComp].file;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}

async function loadLibraryComponent(compKey) {
  const info = LIB_COMP_INFO[compKey];
  if (!info) return;

  DOM.libCompTitle.innerText = info.title;
  DOM.libCompDesc.innerText = info.desc;

  try {
    if (!cachedLibrarySvgs[compKey]) {
      const response = await fetch(info.file);
      cachedLibrarySvgs[compKey] = await response.text();
    }

    DOM.libSvgViewport.innerHTML = cachedLibrarySvgs[compKey];
    renderLibraryBottomPanel(compKey);
  } catch (err) {
    console.error('Error loading library SVG:', err);
  }
}

function renderLibraryBottomPanel(compKey) {
  if (!DOM.libBottomPanel) return;

  if (compKey === 'controller') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <span style="font-size: 12px; font-weight: 700; color: #38bdf8; font-family: var(--font-mono);">RELÉS FORM-C:</span>
        <button class="lib-btn-action" id="lib-btn-rly1">Relé 1</button>
        <button class="lib-btn-action" id="lib-btn-rly2">Relé 2</button>
        <button class="lib-btn-action" id="lib-btn-rly3">Relé 3</button>
        <button class="lib-btn-action" id="lib-btn-rly4">Relé 4</button>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="door_controller_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    ['1', '2', '3', '4'].forEach(num => {
      const btn = document.getElementById(`lib-btn-rly${num}`);
      if (btn) {
        btn.addEventListener('click', () => {
          btn.classList.toggle('active');
          btn.style.background = btn.classList.contains('active') ? '#10b981' : '#0284c7';
        });
      }
    });

  } else if (compKey === 'dps') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <button class="lib-btn-action" id="lib-dps-motion" style="background: linear-gradient(135deg, #0284c7, #2563eb);">
          🚶 Simular Detección de Movimiento / REX
        </button>
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">12 BORNES: [NC C NO NC C NO] + [- + R T T T]</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="door_position_sensor_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    const btnMotion = document.getElementById('lib-dps-motion');
    if (btnMotion) {
      btnMotion.addEventListener('click', () => {
        const ledMotion = DOM.libSvgViewport.querySelector('#dps-led-motion');
        if (ledMotion) {
          ledMotion.setAttribute('fill', '#ef4444');
          setTimeout(() => ledMotion.setAttribute('fill', '#22c55e'), 3000);
        }
      });
    }

  } else if (compKey === 'maglock') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <span style="font-size: 13px; font-weight: 800; color: #10b981; font-family: var(--font-mono);" id="lib-ml-force">600 LBS • RETENCIÓN OK 🔒</span>
        <button class="lib-btn-action" id="lib-ml-toggle-pwr" style="background: #dc2626;">
          ⚡ Cortar Corriente (Liberar Puerta)
        </button>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">BORNES: (+) Positivo | (-) GND</span>
        <a href="maglock_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    const btnCut = document.getElementById('lib-ml-toggle-pwr');
    const forceLabel = document.getElementById('lib-ml-force');
    if (btnCut) {
      btnCut.addEventListener('click', () => {
        const led = DOM.libSvgViewport.querySelector('#ml-bond-led');
        if (led) led.setAttribute('fill', '#475569');
        if (forceLabel) {
          forceLabel.style.color = '#ef4444';
          forceLabel.innerText = '0 LBS • PUERTA LIBERADA 🔓';
        }
        setTimeout(() => {
          if (led) led.setAttribute('fill', '#22c55e');
          if (forceLabel) {
            forceLabel.style.color = '#10b981';
            forceLabel.innerText = '600 LBS • RETENCIÓN OK 🔒';
          }
        }, 4000);
      });
    }

  } else if (compKey === 'crashbar') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <span style="font-size: 13px; font-weight: 800; color: #10b981; font-family: var(--font-mono);" id="lib-cb-status">ENGANCHADO 🔒</span>
        <button class="lib-btn-action" id="lib-cb-retract" style="background: #0284c7;">
          ⚡ Pulso Retracción QEL (5s)
        </button>
        <button class="lib-btn-action" id="lib-cb-push" style="background: #059669;">
          🚪 Empuje Manual
        </button>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">BORNES: (+) Rojo | (-) Negro</span>
        <a href="crashbar_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    const btnRetract = document.getElementById('lib-cb-retract');
    const btnPush = document.getElementById('lib-cb-push');
    const statusLabel = document.getElementById('lib-cb-status');

    function animateLatch(isElec) {
      const latch = DOM.libSvgViewport.querySelector('#cb-latch-bolt');
      const pad = DOM.libSvgViewport.querySelector('#cb-pushpad-group');
      const led = DOM.libSvgViewport.querySelector('#cb-el-led');
      const text = DOM.libSvgViewport.querySelector('#cb-status-text');

      if (latch) latch.style.transform = 'translateX(28px)';
      if (pad && !isElec) pad.style.transform = 'translate(135px, 68px) scaleY(0.92)';
      if (led && isElec) led.setAttribute('fill', '#38bdf8');
      if (text) { text.setAttribute('fill', '#38bdf8'); text.textContent = 'UNLATCHED'; }
      if (statusLabel) { statusLabel.style.color = '#f59e0b'; statusLabel.innerText = 'RETRAÍDO 🔓'; }

      setTimeout(() => {
        if (latch) latch.style.transform = 'translateX(0)';
        if (pad) pad.style.transform = 'translate(135px, 62px)';
        if (led) led.setAttribute('fill', '#22c55e');
        if (text) { text.setAttribute('fill', '#059669'); text.textContent = 'LATCHED'; }
        if (statusLabel) { statusLabel.style.color = '#10b981'; statusLabel.innerText = 'ENGANCHADO 🔒'; }
      }, isElec ? 5000 : 2500);
    }

    if (btnRetract) btnRetract.addEventListener('click', () => animateLatch(true));
    if (btnPush) btnPush.addEventListener('click', () => animateLatch(false));

  } else if (compKey === 'pushtoexit') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <button class="lib-btn-action" id="lib-pte-press" style="background: linear-gradient(135deg, #16a34a, #15803d);">
          🔘 Presionar Botón "PUSH TO EXIT"
        </button>
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">5 BORNES: [COM: Verde | N.O.: Blanco | N.C.: Naranja | (+): Rojo | (-): Negro]</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="pushtoexit_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    const btnPress = document.getElementById('lib-pte-press');
    if (btnPress) {
      btnPress.addEventListener('click', () => {
        const svgBtn = DOM.libSvgViewport.querySelector('#pte-push-button');
        if (svgBtn) {
          svgBtn.style.transform = 'scale(0.95)';
          svgBtn.style.transformOrigin = '140px 255px';
          setTimeout(() => svgBtn.style.transform = 'none', 800);
        }
      });
    }

  } else if (compKey === 'altronix') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <span style="font-size: 12px; font-weight: 800; color: #38bdf8; font-family: var(--font-mono);">DISPARO ENTRADAS (IN 1-8):</span>
        <button class="lib-btn-action" id="lib-alt-in1">IN 1</button>
        <button class="lib-btn-action" id="lib-alt-in2">IN 2</button>
        <button class="lib-btn-action" id="lib-alt-in3">IN 3</button>
        <button class="lib-btn-action" id="lib-alt-in4">IN 4</button>
        <button class="lib-btn-action" id="lib-alt-in5">IN 5</button>
        <button class="lib-btn-action" id="lib-alt-in6">IN 6</button>
        <button class="lib-btn-action" id="lib-alt-in7">IN 7</button>
        <button class="lib-btn-action" id="lib-alt-in8">IN 8</button>
        <button class="lib-btn-action" id="lib-alt-facp" style="background: #dc2626;">🚨 FACP Incendio</button>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="altronix_power_supply_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    for (let i = 1; i <= 8; i++) {
      const btn = document.getElementById(`lib-alt-in${i}`);
      if (btn) {
        btn.addEventListener('click', () => {
          btn.classList.toggle('active');
          btn.style.background = btn.classList.contains('active') ? '#10b981' : '#0284c7';
          const led = DOM.libSvgViewport.querySelector(`#acm8-led-${i}`);
          if (led) led.setAttribute('fill', btn.classList.contains('active') ? '#ef4444' : '#22c55e');
        });
      }
    }

    const btnFacp = document.getElementById('lib-alt-facp');
    if (btnFacp) {
      let facp = false;
      btnFacp.addEventListener('click', () => {
        facp = !facp;
        btnFacp.style.background = facp ? '#10b981' : '#dc2626';
        btnFacp.innerText = facp ? 'FACP DISPARADO' : '🚨 FACP Incendio';
        for (let i = 1; i <= 8; i++) {
          const led = DOM.libSvgViewport.querySelector(`#acm8-led-${i}`);
          if (led) led.setAttribute('fill', facp ? '#ca8a04' : '#22c55e');
        }
      });
    }

  } else if (compKey === 'dps_magnetic') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <span style="font-size: 13px; font-weight: 800; color: #10b981; font-family: var(--font-mono);" id="lib-dps-status">PUERTA CERRADA (LAZO CERRADO) 🔒</span>
        <button class="lib-btn-action" id="lib-dps-toggle" style="background: #0284c7;">
          🚪 Abrir / Cerrar Puerta
        </button>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">BORNES: (+) Rojo/Señal | (-) Negro/GND</span>
        <a href="magnetic_door_sensor_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    const btnDoor = document.getElementById('lib-dps-toggle');
    const statusLabel = document.getElementById('lib-dps-status');
    let doorOpen = false;

    if (btnDoor) {
      btnDoor.addEventListener('click', () => {
        doorOpen = !doorOpen;
        const magnet = DOM.libSvgViewport.querySelector('#dps-magnet-assembly');
        const seam = DOM.libSvgViewport.querySelector('#dps-contact-seam');
        const seamDot = DOM.libSvgViewport.querySelector('#dps-seam-dot');
        const checkIcon = DOM.libSvgViewport.querySelector('#dps-check-icon');
        const gapText = DOM.libSvgViewport.querySelector('#dps-gap-text');
        const statText = DOM.libSvgViewport.querySelector('#dps-status-text');

        if (doorOpen) {
          if (magnet) magnet.style.transform = 'translate(20px, 140px)';
          if (seam) seam.style.opacity = '0';
          if (seamDot) seamDot.setAttribute('stroke', '#ef4444');
          if (checkIcon) {
            checkIcon.setAttribute('d', 'M -4 -4 L 4 4 M -4 4 L 4 -4');
            checkIcon.setAttribute('stroke', '#ef4444');
          }
          if (gapText) {
            gapText.textContent = 'GAP: 4" (100mm) - SEPARADO';
            gapText.setAttribute('fill', '#ef4444');
          }
          if (statText) {
            statText.textContent = 'CONTACTO ABIERTO (ALARMA DISPARADA)';
            statText.setAttribute('fill', '#ef4444');
          }
          if (statusLabel) {
            statusLabel.style.color = '#ef4444';
            statusLabel.innerText = 'PUERTA ABIERTA (SEPARADO) ⚠️';
          }
        } else {
          if (magnet) magnet.style.transform = 'translate(196px, 140px)';
          if (seam) seam.style.opacity = '0.9';
          if (seamDot) seamDot.setAttribute('stroke', '#22c55e');
          if (checkIcon) {
            checkIcon.setAttribute('d', 'M -4 0 L -1 3 L 5 -3');
            checkIcon.setAttribute('stroke', '#22c55e');
          }
          if (gapText) {
            gapText.textContent = 'GAP: 0.0mm (UNIÓN COMPLETA)';
            gapText.setAttribute('fill', '#22c55e');
          }
          if (statText) {
            statText.textContent = 'CONTACTO CERRADO (LAZO ACTIVO)';
            statText.setAttribute('fill', '#38bdf8');
          }
          if (statusLabel) {
            statusLabel.style.color = '#10b981';
            statusLabel.innerText = 'PUERTA CERRADA (UNIÓN TOTAL) 🔒';
          }
        }
      });
    }

  } else if (compKey === 'rfid_reader') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <button class="lib-btn-action" id="lib-rdr-swipe" style="background: linear-gradient(135deg, #0284c7, #2563eb);">
          💳 Presentar Tarjeta RFID (Acceso Concedido)
        </button>
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">6 BORNES: [Rojo: +12V | Negro: GND | Blanco: D1 | Verde: D0 | Azul: BEEP | Marrón: LED]</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="rfid_reader_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    const btnSwipe = document.getElementById('lib-rdr-swipe');
    if (btnSwipe) {
      btnSwipe.addEventListener('click', () => {
        const lightbar = DOM.libSvgViewport.querySelector('#rdr-lightbar');
        if (lightbar) {
          lightbar.setAttribute('fill', 'url(#rdr-led-green)');
          setTimeout(() => lightbar.setAttribute('fill', 'url(#rdr-led-red)'), 3000);
        }
      });
    }

  } else if (compKey === 'camden_relay') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <button class="lib-btn-action" id="lib-cx-trg1" style="background: #0284c7;">
          🔘 Disparar DRY 1 (Entrada Exterior)
        </button>
        <button class="lib-btn-action" id="lib-cx-trg2" style="background: #10b981;">
          🔘 Disparar DRY 2 (Entrada Interior)
        </button>
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">16 BORNES: POWER (1-2) | RELAY 1 (3-5) | RELAY 2 (6-8) | WET1 (9-10) | DRY1 (11-12) | WET2 (13-14) | DRY2 (15-16)</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="camden_relay_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    function triggerCxSequence() {
      const led1 = DOM.libSvgViewport.querySelector('#cx-led-rl1');
      const led2 = DOM.libSvgViewport.querySelector('#cx-led-rl2');

      if (led1) led1.setAttribute('fill', '#22c55e');
      setTimeout(() => {
        if (led2) led2.setAttribute('fill', '#38bdf8');
      }, 500);

      setTimeout(() => {
        if (led1) led1.setAttribute('fill', '#ef4444');
        if (led2) led2.setAttribute('fill', '#ef4444');
      }, 3500);
    }

    const btnTrg1 = document.getElementById('lib-cx-trg1');
    const btnTrg2 = document.getElementById('lib-cx-trg2');
    if (btnTrg1) btnTrg1.addEventListener('click', triggerCxSequence);
    if (btnTrg2) btnTrg2.addEventListener('click', triggerCxSequence);

  } else if (compKey === 'multimeter') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <button class="lib-btn-action" id="lib-dmm-dc" style="background: #ea580c;">
          V= (DC) 12.42V
        </button>
        <button class="lib-btn-action" id="lib-dmm-ac" style="background: #0284c7;">
          V~ (AC) 120.3V
        </button>
        <button class="lib-btn-action" id="lib-dmm-cont" style="background: #10b981;">
          •))) Continuidad (0.2Ω)
        </button>
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">JACKS: [COM (Negro) | VΩ•))) (Rojo)]</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="digital_multimeter_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    function updateDmmSvg(mode, val, unit) {
      const knob = DOM.libSvgViewport.querySelector('#dmm-knob-rotor');
      const modeInd = DOM.libSvgViewport.querySelector('#dmm-mode-ind');
      const subIcon = DOM.libSvgViewport.querySelector('#dmm-sub-icon');
      const dispVal = DOM.libSvgViewport.querySelector('#dmm-display-val');
      const unitsVal = DOM.libSvgViewport.querySelector('#dmm-units-val');
      const modeText = DOM.libSvgViewport.querySelector('#dmm-knob-mode-text');

      if (mode === 'dc') {
        if (knob) knob.style.transform = 'rotate(-45deg)';
        if (modeInd) modeInd.textContent = 'DC';
        if (subIcon) subIcon.textContent = '⎓';
        if (dispVal) dispVal.textContent = val || '12.42';
        if (unitsVal) unitsVal.textContent = unit || 'V';
        if (modeText) { modeText.textContent = 'MODO: V DC (⎓)'; modeText.setAttribute('fill', '#f97316'); }
      } else if (mode === 'ac') {
        if (knob) knob.style.transform = 'rotate(0deg)';
        if (modeInd) modeInd.textContent = 'AC';
        if (subIcon) subIcon.textContent = '∿';
        if (dispVal) dispVal.textContent = val || '120.3';
        if (unitsVal) unitsVal.textContent = unit || 'V';
        if (modeText) { modeText.textContent = 'MODO: V AC (∿)'; modeText.setAttribute('fill', '#38bdf8'); }
      } else if (mode === 'cont') {
        if (knob) knob.style.transform = 'rotate(45deg)';
        if (modeInd) modeInd.textContent = '•)))';
        if (subIcon) subIcon.textContent = 'Ω';
        if (dispVal) dispVal.textContent = val || '0.2';
        if (unitsVal) unitsVal.textContent = unit || 'Ω';
        if (modeText) { modeText.textContent = 'MODO: CONTINUIDAD (•)))'; modeText.setAttribute('fill', '#22c55e'); }
      }
    }

    const bDc = document.getElementById('lib-dmm-dc');
    const bAc = document.getElementById('lib-dmm-ac');
    const bCont = document.getElementById('lib-dmm-cont');
    if (bDc) bDc.addEventListener('click', () => updateDmmSvg('dc', '12.42', 'V'));
    if (bAc) bAc.addEventListener('click', () => updateDmmSvg('ac', '120.3', 'V'));
    if (bCont) bCont.addEventListener('click', () => updateDmmSvg('cont', '0.2', 'Ω'));

  } else if (compKey === 'hid_aero_x100') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <button class="lib-btn-action" id="lib-x100-rly1" style="background: #0284c7;">RLY 1 (Door 1)</button>
        <button class="lib-btn-action" id="lib-x100-rly2" style="background: #0284c7;">RLY 2 (Door 2)</button>
        <button class="lib-btn-action" id="lib-x100-rdr1" style="background: #10b981;">💳 Swipe RDR 1</button>
        <button class="lib-btn-action" id="lib-x100-rdr2" style="background: #10b981;">💳 Swipe RDR 2</button>
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">56 BORNES: [RDR 1/2: 20 | IN 1-4: 8 | RLY 1-4: 12 | TOP ALARMS: 8 | BTM IO: 8]</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="hid_aero_x100_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    function setupX100LibEvents() {
      const bR1 = document.getElementById('lib-x100-rly1');
      const bR2 = document.getElementById('lib-x100-rly2');
      const bSw1 = document.getElementById('lib-x100-rdr1');
      const bSw2 = document.getElementById('lib-x100-rdr2');

      if (bR1) {
        bR1.addEventListener('click', () => {
          bR1.classList.toggle('active');
          const led = DOM.libSvgViewport.querySelector('#led-x100-rly1');
          if (led) led.setAttribute('fill', bR1.classList.contains('active') ? '#22c55e' : '#ef4444');
        });
      }
      if (bR2) {
        bR2.addEventListener('click', () => {
          bR2.classList.toggle('active');
          const led = DOM.libSvgViewport.querySelector('#led-x100-rly2');
          if (led) led.setAttribute('fill', bR2.classList.contains('active') ? '#22c55e' : '#ef4444');
        });
      }
      if (bSw1) {
        bSw1.addEventListener('click', () => {
          const led = DOM.libSvgViewport.querySelector('#led-x100-rdr1');
          if (led) {
            led.setAttribute('fill', '#38bdf8');
            setTimeout(() => led.setAttribute('fill', '#22c55e'), 800);
          }
        });
      }
      if (bSw2) {
        bSw2.addEventListener('click', () => {
          const led = DOM.libSvgViewport.querySelector('#led-x100-rdr2');
          if (led) {
            led.setAttribute('fill', '#38bdf8');
            setTimeout(() => led.setAttribute('fill', '#22c55e'), 800);
          }
        });
      }
    }
    setupX100LibEvents();

  } else if (compKey === 'poe_switch') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <button class="lib-btn-action" id="lib-poe-traffic" style="background: #dc2626;">⚡ Tráfico Red / PoE</button>
        <button class="lib-btn-action" id="lib-poe-vlan" style="background: #0284c7;">VLAN Toggle (ON/OFF)</button>
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">PUERTOS: [SFP Slot | UP-LINK (RJ45) | POE 1..4 (48V AF/AT)]</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="poe_switch_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    function setupPoeLibEvents() {
      const bT = document.getElementById('lib-poe-traffic');
      const bV = document.getElementById('lib-poe-vlan');
      let vlanState = false;

      if (bT) {
        bT.addEventListener('click', () => {
          const leds = ['poe-led-uplink', 'poe-led-p1', 'poe-led-p2', 'poe-led-p3', 'poe-led-p4'];
          let c = 0;
          const itv = setInterval(() => {
            leds.forEach(id => {
              const el = DOM.libSvgViewport.querySelector('#' + id);
              if (el) el.setAttribute('fill', Math.random() > 0.4 ? '#22c55e' : '#090e17');
            });
            c++;
            if (c > 12) {
              clearInterval(itv);
              leds.forEach(id => {
                const el = DOM.libSvgViewport.querySelector('#' + id);
                if (el) el.setAttribute('fill', '#22c55e');
              });
            }
          }, 120);
        });
      }

      if (bV) {
        bV.addEventListener('click', () => {
          vlanState = !vlanState;
          const knob = DOM.libSvgViewport.querySelector('#poe-vlan-knob');
          const notch = DOM.libSvgViewport.querySelector('#poe-vlan-knob-notch');
          const vlanLed = DOM.libSvgViewport.querySelector('#poe-led-vlan');
          if (vlanState) {
            if (knob) knob.setAttribute('x', '0');
            if (notch) { notch.setAttribute('x1', '8'); notch.setAttribute('x2', '8'); }
            if (vlanLed) vlanLed.setAttribute('fill', '#f59e0b');
          } else {
            if (knob) knob.setAttribute('x', '-16');
            if (notch) { notch.setAttribute('x1', '-8'); notch.setAttribute('x2', '-8'); }
            if (vlanLed) vlanLed.setAttribute('fill', '#22c55e');
          }
        });
      }
    }
    setupPoeLibEvents();

  } else if (compKey === 'cable_18_2') {
    DOM.libBottomPanel.innerHTML = `
      <div class="lib-control-group">
        <button class="lib-btn-action" id="lib-c18-power" style="background: #ea580c;">⚡ Inyectar 12/24VDC</button>
        <button class="lib-btn-action" id="lib-c18-cont" style="background: #0284c7;">Test Continuidad Loop</button>
        <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">CONDUCTORES: [Punta A: Rojo(+) / Negro(-) | Punta B: Rojo(+) / Negro(-)]</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="cable_18_2_preview.html" target="_blank" class="lib-btn-action" style="background: #1e293b; text-decoration: none;">Abrir Simulador Standalone ↗</a>
      </div>
    `;

    function setupCable18LibEvents() {
      const bP = document.getElementById('lib-c18-power');
      const bC = document.getElementById('lib-c18-cont');

      if (bP) {
        bP.addEventListener('click', () => {
          const rL = DOM.libSvgViewport.querySelector('#term-c18-left-red');
          const rR = DOM.libSvgViewport.querySelector('#term-c18-right-red');
          if (rL && rR) {
            rL.style.filter = 'drop-shadow(0 0 16px #ef4444)';
            rR.style.filter = 'drop-shadow(0 0 16px #ef4444)';
            setTimeout(() => {
              rL.style.filter = '';
              rR.style.filter = '';
            }, 1200);
          }
        });
      }

      if (bC) {
        bC.addEventListener('click', () => {
          const bL = DOM.libSvgViewport.querySelector('#term-c18-left-black');
          const bR = DOM.libSvgViewport.querySelector('#term-c18-right-black');
          if (bL && bR) {
            bL.style.filter = 'drop-shadow(0 0 16px #22c55e)';
            bR.style.filter = 'drop-shadow(0 0 16px #22c55e)';
            setTimeout(() => {
              bL.style.filter = '';
              bR.style.filter = '';
            }, 1200);
          }
        });
      }
    }
    setupCable18LibEvents();
  }
}

document.addEventListener('DOMContentLoaded', init);

