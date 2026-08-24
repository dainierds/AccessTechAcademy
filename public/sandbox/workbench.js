/* ============================================================
   workbench.js — Lienzo de trabajo compartido (editor y simulador)
   Render realista-educativo de dispositivos y cables con
   SOPORTE DE LIENZO INFINITO, PANNING Y ZOOMING FLUIDO.
   ============================================================ */

function getDeviceBreakoutPoint(dev, terminals) {
  const def = DEVICES[dev.type];
  if (!def || !terminals || terminals.length === 0) return null;

  // Centro geométrico real de los bornes en uso para evitar sesgos
  let sumX = 0, sumY = 0;
  for (const t of terminals) {
    sumX += t.x;
    sumY += t.y;
  }
  const cx = sumX / terminals.length;
  const cy = sumY / terminals.length;

  const leftEdge = dev.x;
  const rightEdge = dev.x + def.w;
  const topEdge = dev.y;
  const bottomEdge = dev.y + def.h;

  const dLeft = Math.abs(cx - leftEdge);
  const dRight = Math.abs(cx - rightEdge);
  const dTop = Math.abs(cy - topEdge);
  const dBottom = Math.abs(cy - bottomEdge);

  const minDist = Math.min(dLeft, dRight, dTop, dBottom);
  const OUTSET = 28; // 28px outside

  if (minDist === dLeft) return { x: leftEdge - OUTSET, y: cy };
  if (minDist === dRight) return { x: rightEdge + OUTSET, y: cy };
  if (minDist === dTop) return { x: cx, y: topEdge - OUTSET };
  return { x: cx, y: bottomEdge + OUTSET };
}

class Workbench {
  constructor(canvas, mode, hooks={}){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = mode;                       // 'editor' | 'sim'
    this.hooks = hooks;                     // {onChange, onProbe, onAction, toast}
    this.scenario = { name:'Nuevo escenario', devices:[], cables:[] };
    this.simState = {};
    this.model = null;

    // Viewport infinito (Pan & Zoom)
    this.pan = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.panOrigin = { x: 0, y: 0 };
    this.spacePressed = false;
    this.hasMovedDuringClick = false;

    // cableado
    this.cableType = '18/2';
    this.conductorColor = 'red';
    this.activeCableId = null;
    this.pending = null;                    // {a:{dev,term}}
    this.hoveredTerm = null;                // {devId, termId}
    this.mouse = { x: 0, y: 0 };            // Screen coordinates
    this.worldMouse = { x: 0, y: 0 };       // World coordinates

    // sim
    this.tool = 'interact';
    this.mmMode = 'dcv';
    this.probes = { red:null, black:null }; // {dev,term}
    
    // interaccion editor
    this.dragDevice = null;
    this.dragOffset = { x: 0, y: 0 };
    this.showTerminals = false; // Solo visibles si el usuario activa el botón
    this.termEditMode = false;
    this.termEditDrag = null;

    // Historial Undo / Redo para deshacer/rehacer acciones
    this.undoStack = [];
    this.redoStack = [];

    this._bindEvents();
    this._bindUiControls();
    this.resize();
  }

  /* Gestion del Historial de Deshacer (Undo / Redo) */
  _recordState(){
    try {
      // Limpiar cables vacíos huérfanos antes de serializar
      const cleanScenario = {
        name: this.scenario.name,
        devices: JSON.parse(JSON.stringify(this.scenario.devices || [])),
        cables: JSON.parse(JSON.stringify((this.scenario.cables || []).filter(c => c.conductors && c.conductors.length > 0)))
      };
      const snap = JSON.stringify(cleanScenario);
      if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === snap) return;
      this.undoStack.push(snap);
      if (this.undoStack.length > 50) this.undoStack.shift();
      this.redoStack = []; // limpiar redo al registrar nueva acción
    } catch(e){}
  }

  undo(){
    if (this.undoStack.length === 0) {
      if (this.hooks.toast) this.hooks.toast('ℹ️ No hay más acciones para deshacer');
      return;
    }
    try {
      const cleanCurrent = {
        name: this.scenario.name,
        devices: JSON.parse(JSON.stringify(this.scenario.devices || [])),
        cables: JSON.parse(JSON.stringify((this.scenario.cables || []).filter(c => c.conductors && c.conductors.length > 0)))
      };
      this.redoStack.push(JSON.stringify(cleanCurrent));
      const prevSnap = this.undoStack.pop();
      const restored = JSON.parse(prevSnap);
      this.scenario.name = restored.name || this.scenario.name;
      this.scenario.devices = restored.devices || [];
      this.scenario.cables = restored.cables || [];
      this.pending = null;
      this.activeCableId = null;
      this._recalcModel();
      this.render();
      if (this.hooks.onChange) this.hooks.onChange();
      if (this.hooks.toast) this.hooks.toast('↩️ Acción deshecha (Paso atrás)');
    } catch(e){
      console.error('Error in undo:', e);
    }
  }

  redo(){
    if (this.redoStack.length === 0) {
      if (this.hooks.toast) this.hooks.toast('ℹ️ No hay acciones para rehacer');
      return;
    }
    try {
      const cleanCurrent = {
        name: this.scenario.name,
        devices: JSON.parse(JSON.stringify(this.scenario.devices || [])),
        cables: JSON.parse(JSON.stringify((this.scenario.cables || []).filter(c => c.conductors && c.conductors.length > 0)))
      };
      this.undoStack.push(JSON.stringify(cleanCurrent));
      const nextSnap = this.redoStack.pop();
      const restored = JSON.parse(nextSnap);
      this.scenario.name = restored.name || this.scenario.name;
      this.scenario.devices = restored.devices || [];
      this.scenario.cables = restored.cables || [];
      this.pending = null;
      this.activeCableId = null;
      this._recalcModel();
      this.render();
      if (this.hooks.onChange) this.hooks.onChange();
      if (this.hooks.toast) this.hooks.toast('↪️ Acción rehecha');
    } catch(e){
      console.error('Error in redo:', e);
    }
  }

  /* Gestion persistente de posiciones de terminales */
  getEffectiveTerminals(devType){
    const def = DEVICES[devType];
    if(!def || !def.terminals) return [];
    try {
      const key = 'term_overrides_' + devType;
      const overrides = JSON.parse(localStorage.getItem(key) || '{}');
      return def.terminals.map(t => {
        if(overrides[t.id]) return { ...t, x: overrides[t.id].x, y: overrides[t.id].y };
        return t;
      });
    } catch(e){
      return def.terminals;
    }
  }

  _saveTerminalOverride(devType, termId, x, y){
    try {
      const key = 'term_overrides_' + devType;
      const overrides = JSON.parse(localStorage.getItem(key) || '{}');
      overrides[termId] = { x: Math.round(x), y: Math.round(y) };
      localStorage.setItem(key, JSON.stringify(overrides));
    } catch(e){}
  }

  _resetTerminalOverrides(devType){
    try {
      localStorage.removeItem('term_overrides_' + devType);
    } catch(e){}
  }

  toggleTermEditMode(){
    this.termEditMode = !this.termEditMode;
    if(this.termEditMode) this.showTerminals = true;
    this.render();
    return this.termEditMode;
  }

  /* Conversiones de coordenadas */
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.pan.x) / this.zoom,
      y: (sy - this.pan.y) / this.zoom
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.zoom + this.pan.x,
      y: wy * this.zoom + this.pan.y
    };
  }

  setMode(newMode) {
    this.mode = newMode;
    this.pending = null;
    this.dragDevice = null;
    if (this.mode === 'sim') {
      this.simState = defaultSimState(this.scenario);
      this._recalcModel();
    }
    this.render();
  }

  setScenario(sc){
    this.scenario = sc;
    this.activeCableId = null;
    this.pending = null;
    this.probes = { red:null, black:null };
    this.simState = defaultSimState(sc);
    this._recalcModel();
    this.render();
  }

  resize(){
    if(!this.canvas || !this.canvas.parentElement) return;
    const r = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = r.width || window.innerWidth;
    this.canvas.height = r.height || window.innerHeight;
    this.render();
  }

  /* Control de Zoom y Pan */
  zoomAt(deltaY, screenX, screenY) {
    const oldZoom = this.zoom;
    const factor = deltaY < 0 ? 1.15 : 0.87;
    let newZoom = Math.min(Math.max(oldZoom * factor, 0.15), 4.0);
    if (Math.abs(newZoom - 1.0) < 0.02) newZoom = 1.0;

    // Mantener la posición del mundo bajo el cursor invariante
    const world = this.screenToWorld(screenX, screenY);
    this.pan.x = screenX - world.x * newZoom;
    this.pan.y = screenY - world.y * newZoom;
    this.zoom = newZoom;

    this._updateZoomBadge();
    this.render();
  }

  zoomIn() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.zoomAt(-1, cx, cy);
  }

  zoomOut() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.zoomAt(1, cx, cy);
  }

  resetView() {
    this.zoom = 1.0;
    this.pan = { x: 0, y: 0 };
    this._updateZoomBadge();
    this.render();
  }

  centerContent() {
    if (this.scenario.devices.length === 0) {
      this.resetView();
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const d of this.scenario.devices) {
      const def = DEVICES[d.type] || { w: 200, h: 200 };
      minX = Math.min(minX, d.x);
      minY = Math.min(minY, d.y);
      maxX = Math.max(maxX, d.x + def.w);
      maxY = Math.max(maxY, d.y + def.h);
    }
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const pad = 80;
    const zoomX = (this.canvas.width - pad * 2) / contentW;
    const zoomY = (this.canvas.height - pad * 2) / contentH;
    this.zoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.25), 1.5);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    this.pan.x = this.canvas.width / 2 - midX * this.zoom;
    this.pan.y = this.canvas.height / 2 - midY * this.zoom;
    this._updateZoomBadge();
    this.render();
  }

  _updateZoomBadge() {
    const badge = document.getElementById('zoom-badge');
    if (badge) {
      badge.textContent = Math.round(this.zoom * 100) + '%';
    }
  }

  _bindUiControls() {
    const btnIn = document.getElementById('btn-zoom-in') || document.querySelector('.zoom-btn[title*="Acercar"]');
    const btnOut = document.getElementById('btn-zoom-out') || document.querySelector('.zoom-btn[title*="Alejar"]');
    const btnReset = document.getElementById('btn-zoom-reset') || document.querySelector('.zoom-btn.reset');
    const btnBadge = document.getElementById('zoom-badge') || document.querySelector('.zoom-badge');

    if (btnIn) btnIn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.zoomIn(); };
    if (btnOut) btnOut.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.zoomOut(); };
    if (btnReset) btnReset.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.centerContent(); };
    if (btnBadge) btnBadge.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.resetView(); };

    // Enlazar todos los botones de Deshacer existentes (barra superior y flotantes)
    document.querySelectorAll('#btn-undo, .btn-undo').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.undo();
      };
    });

    // Enlazar todos los botones de Rehacer existentes (barra superior y flotantes)
    document.querySelectorAll('#btn-redo, .btn-redo').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.redo();
      };
    });
  }

  _bindEvents(){
    const getPos = e => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    // Zoom mediante rueda del mouse sin afectar la ventana del navegador
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const p = getPos(e);
      this.zoomAt(e.deltaY, p.x, p.y);
    }, { passive: false });

    // Detección de teclas (Espacio para paneo, Ctrl+Z para Deshacer, Ctrl+Y para Rehacer)
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      // Ctrl + Z -> Deshacer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
        return;
      }

      // Ctrl + Y ó Ctrl + Shift + Z -> Rehacer
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redo();
        return;
      }

      if (e.code === 'Space' && !this.spacePressed) {
        this.spacePressed = true;
        this.canvas.style.cursor = 'grab';
      }
    });

    window.addEventListener('keyup', e => {
      if (e.code === 'Space') {
        this.spacePressed = false;
        this.canvas.style.cursor = '';
      }
    });
    
    window.addEventListener('mousemove', e => {
      const p = getPos(e);
      this.mouse = p;
      this.worldMouse = this.screenToWorld(p.x, p.y);

      // Panning activo
      if (this.isPanning) {
        this.hasMovedDuringClick = true;
        this.pan.x = this.panOrigin.x + (p.x - this.panStart.x);
        this.pan.y = this.panOrigin.y + (p.y - this.panStart.y);
        this.render();
        return;
      }

      // Arrastre interactivo de terminales en modo de edicion
      if (this.termEditDrag) {
        e.preventDefault();
        this.hasMovedDuringClick = true;
        const w = this.worldMouse;
        const dev = this.termEditDrag.dev;
        const relX = Math.round(w.x - dev.x);
        const relY = Math.round(w.y - dev.y);
        this._saveTerminalOverride(dev.type, this.termEditDrag.termId, relX, relY);
        this.render();
        return;
      }

      // Detección del elemento bajo el cursor
      const hit = this.hitTest(p.x, p.y);
      const prevHovered = this.hoveredTerm;
      this.hoveredTerm = hit.term ? { devId: hit.dev.id, termId: hit.term.id } : null;
      const hoveredChanged = (prevHovered?.devId !== this.hoveredTerm?.devId || prevHovered?.termId !== this.hoveredTerm?.termId);

      // Arrastre de dispositivo o cableado en el editor
      if (this.mode === 'editor') {
        if (this.dragDevice) {
          e.preventDefault();
          this.hasMovedDuringClick = true;
          this.dragDevice.x = this.worldMouse.x - this.dragOffset.x;
          this.dragDevice.y = this.worldMouse.y - this.dragOffset.y;
          this.render();
        } else if (this.pending) {
          this.hasMovedDuringClick = true;
          this.canvas.style.cursor = 'crosshair';
          this.render();
        } else {
          if (!this.spacePressed) {
            if (this.termEditMode) {
              this.canvas.style.cursor = hit.term ? 'grab' : 'crosshair';
            } else {
              if (hit.term) this.canvas.style.cursor = 'crosshair';
              else if (hit.dev) this.canvas.style.cursor = 'move';
              else this.canvas.style.cursor = 'default';
            }
          }
          if (hoveredChanged && (this.showTerminals || this.termEditMode)) {
            this.render();
          }
        }
      } else if (this.mode === 'sim') {
        if (hit.term) {
          this.canvas.style.cursor = 'crosshair';
        } else if (hit.dev && DEVICES[hit.dev.type]?.action) {
          this.canvas.style.cursor = 'pointer';
        } else {
          this.canvas.style.cursor = 'default';
        }
        if (hoveredChanged && this.showTerminals) {
          this.render();
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.hoveredTerm) {
        this.hoveredTerm = null;
        if (this.showTerminals || this.pending || this.termEditMode) this.render();
      }
    });

    this.canvas.addEventListener('mousedown', e => {
      const p = getPos(e);
      const wPos = this.screenToWorld(p.x, p.y);
      this.hasMovedDuringClick = false;

      // Paneo con botón central (1), botón derecho (2), tecla espacio, o clic izquierdo en fondo vacío
      const isMiddle = e.button === 1;
      const isRight = e.button === 2;
      const isSpacePan = this.spacePressed && e.button === 0;

      const hit = this.hitTest(p.x, p.y);

      if (isMiddle || isRight || isSpacePan || (!hit.dev && !hit.term && e.button === 0)) {
        this.isPanning = true;
        this.panStart = { x: p.x, y: p.y };
        this.panOrigin = { x: this.pan.x, y: this.pan.y };
        this.canvas.style.cursor = 'grabbing';
        if (isMiddle || isRight || isSpacePan) {
          e.preventDefault();
          return;
        }
      }

      if (e.button !== 0) return; // Solo clic izquierdo para interactuar

      if(this.mode === 'editor'){
        if(this.termEditMode){
          if(hit.term){
            this.termEditDrag = { dev: hit.dev, termId: hit.term.id };
            this.canvas.style.cursor = 'grabbing';
            return;
          }
        } else {
          if(hit.term){
            // Inicio de cableado desde este borne
            if(!this.pending){
              if(!this.activeCableId) this.newCable();
              this.pending = { a: { dev: hit.dev.id, term: hit.term.id } };
              this.canvas.style.cursor = 'crosshair';
            } else {
              // Si se hace clic en otro borne para conectar
              if(hit.dev.id !== this.pending.a.dev || hit.term.id !== this.pending.a.term){
                this._recordState();
                const devAId = this.pending.a.dev;
                const devBId = hit.dev.id;
                const termAId = this.pending.a.term;
                const termBId = hit.term.id;

                // Buscar un cable existente compatible entre estos dos dispositivos del tipo seleccionado
                let cb = this.scenario.cables.find(c =>
                  c.id === this.activeCableId &&
                  c.type === this.cableType &&
                  (!c.conductors.length ||
                    (c.conductors.some(cond =>
                      (cond.a.dev === devAId && cond.b.dev === devBId) ||
                      (cond.a.dev === devBId && cond.b.dev === devAId)
                    ))
                  )
                );

                // Si no hay cable activo que coincida con estos 2 dispositivos, buscar cualquier cable existente entre ellos
                if(!cb) {
                  cb = this.scenario.cables.find(c =>
                    c.type === this.cableType &&
                    c.conductors.some(cond =>
                      (cond.a.dev === devAId && cond.b.dev === devBId) ||
                      (cond.a.dev === devBId && cond.b.dev === devAId)
                    )
                  );
                }

                // Si aún no existe, crear uno nuevo
                if(!cb) {
                  this.newCable();
                  cb = this.scenario.cables.find(c => c.id === this.activeCableId);
                } else {
                  this.activeCableId = cb.id;
                }

                if(cb) {
                  // Si ya existía este par EXACTO de bornes, actualizar color; si no, agregar nuevo conductor al cable
                  const existingIdx = cb.conductors.findIndex(cond =>
                    (cond.a.dev === devAId && cond.a.term === termAId && cond.b.dev === devBId && cond.b.term === termBId) ||
                    (cond.a.dev === devBId && cond.a.term === termBId && cond.b.dev === devAId && cond.b.term === termAId)
                  );

                  if (existingIdx >= 0) {
                    cb.conductors[existingIdx].color = this.conductorColor;
                  } else {
                    cb.conductors.push({
                      color: this.conductorColor,
                      a: { dev: devAId, term: termAId },
                      b: { dev: devBId, term: termBId }
                    });
                  }
                }
                this.pending = null;
                if(this.hooks.onChange) this.hooks.onChange();
              }
            }
          } else if(hit.dev){
            if(!this.pending){
              this.dragDevice = hit.dev;
              this.dragOffset = { x: wPos.x - hit.dev.x, y: wPos.y - hit.dev.y };
            }
          } else {
            this.pending = null;
          }
        }
      } 
      else if (this.mode === 'sim'){
        if(this.tool === 'multimeter'){
          if(hit.term){
            const t = { dev: hit.dev.id, term: hit.term.id };
            if(e.button === 2 || e.shiftKey) this.probes.black = t;
            else this.probes.red = t;
            if(this.hooks.onProbe) this.hooks.onProbe();
          } else {
            if(e.button === 2 || e.shiftKey) this.probes.black = null;
            else this.probes.red = null;
            if(this.hooks.onProbe) this.hooks.onProbe();
          }
        }
        else if(this.tool === 'interact'){
          if(hit.dev){
            const def = DEVICES[hit.dev.type];
            if(def && def.action){
              if(!this.simState[hit.dev.id]) this.simState[hit.dev.id] = {};
              const s = this.simState[hit.dev.id];
              if(def.action.kind === 'momentary'){
                s[def.action.stateKey] = true;
                this._recalcModel();
                this.render();
                if (this.hooks.toast) this.hooks.toast('⚡ ' + def.name + ': ' + def.action.label);
                
                // Duración de animación activa (1.2s)
                setTimeout(() => {
                  s[def.action.stateKey] = false;
                  this._recalcModel();
                  this.render();
                }, 1200);
              } else if (def.action.kind === 'toggle'){
                s[def.action.stateKey] = !s[def.action.stateKey];
                this._recalcModel();
                this.render();
                const stateTxt = s[def.action.stateKey] ? 'Activado / Conducido' : 'Reposo / Abierto';
                if (this.hooks.toast) this.hooks.toast('🔄 ' + def.name + ': ' + stateTxt);
              }
            } else if(def && def.zones) {
               for(const z of def.zones){
                  if(wPos.x >= hit.dev.x+z.x && wPos.x <= hit.dev.x+z.x+z.w &&
                     wPos.y >= hit.dev.y+z.y && wPos.y <= hit.dev.y+z.y+z.h){
                     const s = this.simState[hit.dev.id];
                     s[z.stateKey] = !s[z.stateKey];
                     this._recalcModel();
                     this.render();
                     break;
                  }
               }
            }
          }
        }
      }
      this.render();
    });

    window.addEventListener('mouseup', e => {
      this.isPanning = false;
      this.dragDevice = null;
      if (this.termEditDrag) {
        this.termEditDrag = null;
        if (this.hooks.toast) this.hooks.toast('📍 Posición de terminal guardada con éxito');
      }

      // Soporte drag-and-drop: si se estaba arrastrando un cable desde un borne y se suelta sobre otro borne
      if (this.mode === 'editor' && this.pending && this.hasMovedDuringClick) {
        const p = getPos(e);
        const hit = this.hitTest(p.x, p.y);
        if (hit.term && (hit.dev.id !== this.pending.a.dev || hit.term.id !== this.pending.a.term)) {
          this._recordState();
          const devAId = this.pending.a.dev;
          const devBId = hit.dev.id;
          const termAId = this.pending.a.term;
          const termBId = hit.term.id;

          let cb = this.scenario.cables.find(c =>
            c.id === this.activeCableId &&
            c.type === this.cableType &&
            (!c.conductors.length ||
              (c.conductors.some(cond =>
                (cond.a.dev === devAId && cond.b.dev === devBId) ||
                (cond.a.dev === devBId && cond.b.dev === devAId)
              ))
            )
          );

          if(!cb) {
            cb = this.scenario.cables.find(c =>
              c.type === this.cableType &&
              c.conductors.some(cond =>
                (cond.a.dev === devAId && cond.b.dev === devBId) ||
                (cond.a.dev === devBId && cond.b.dev === devAId)
              )
            );
          }

          if(!cb) {
            this.newCable();
            cb = this.scenario.cables.find(c => c.id === this.activeCableId);
          } else {
            this.activeCableId = cb.id;
          }

          if (cb) {
            const existingIdx = cb.conductors.findIndex(cond =>
              (cond.a.dev === devAId && cond.a.term === termAId && cond.b.dev === devBId && cond.b.term === termBId) ||
              (cond.a.dev === devBId && cond.a.term === termBId && cond.b.dev === devAId && cond.b.term === termAId)
            );

            if (existingIdx >= 0) {
              cb.conductors[existingIdx].color = this.conductorColor;
            } else {
              cb.conductors.push({
                color: this.conductorColor,
                a: { dev: devAId, term: termAId },
                b: { dev: devBId, term: termBId }
              });
            }
          }
          this.pending = null;
          if (this.hooks.onChange) this.hooks.onChange();
          this.render();
        }
      }

      if (this.spacePressed) this.canvas.style.cursor = 'grab';
      else {
        const p = getPos(e);
        const hit = this.hitTest(p.x, p.y);
        if (hit.term) this.canvas.style.cursor = 'crosshair';
        else if (hit.dev) this.canvas.style.cursor = 'move';
        else this.canvas.style.cursor = '';
      }
    });

    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (this.hasMovedDuringClick) return;

      if(this.mode === 'editor'){
        const p = getPos(e);
        const hit = this.hitTest(p.x, p.y);

        if(hit.term){
          // Click derecho sobre un terminal: borrar solo los cables conectados a ese borne
          this._recordState();
          const devId  = hit.dev.id;
          const termId = hit.term.id;
          this.scenario.cables = this.scenario.cables
            .map(c => ({
              ...c,
              conductors: c.conductors.filter(
                cond => !(
                  (cond.a.dev === devId && cond.a.term === termId) ||
                  (cond.b.dev === devId && cond.b.term === termId)
                )
              )
            }))
            .filter(c => c.conductors.length > 0);
          if(this.hooks.onChange) this.hooks.onChange();
          this.render();
          return;
        }

        if(hit.dev){
          // Click derecho sobre el cuerpo: borrar componente y todos sus cables
          this._recordState();
          this.scenario.devices = this.scenario.devices.filter(d => d.id !== hit.dev.id);
          this.scenario.cables  = this.scenario.cables.filter(c =>
            !c.conductors.some(cond => cond.a.dev === hit.dev.id || cond.b.dev === hit.dev.id)
          );
          if(this.hooks.onChange) this.hooks.onChange();
          this.render();
          return;
        }

        // Click derecho en espacio vacío: buscar cable cercano y eliminarlo
        const hitCable = this.hitCableTest(p.x, p.y);
        if(hitCable){
          this._recordState();
          this.scenario.cables = this.scenario.cables.filter(c => c.id !== hitCable.id);
          if(this.hooks.onChange) this.hooks.onChange();
          this.render();
        }
      }
    });

    // Soporte para gestos táctiles (Pinch to Zoom & Touch Pan)
    let touchDistance = null;
    let touchCenter = null;

    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const r = this.canvas.getBoundingClientRect();
        touchCenter = {
          x: (t1.clientX + t2.clientX) / 2 - r.left,
          y: (t1.clientY + t2.clientY) / 2 - r.top
        };
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && touchDistance) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const factor = newDist / touchDistance;
        const delta = factor > 1 ? -1 : 1;
        this.zoomAt(delta * (Math.abs(1 - factor) * 100), touchCenter.x, touchCenter.y);
        touchDistance = newDist;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', e => {
      if (e.touches.length < 2) touchDistance = null;
    });
  }

  devById(id){ return this.scenario.devices.find(d => d.id === id); }
  
  hitTest(screenX, screenY){
    const wPos = this.screenToWorld(screenX, screenY);
    // Al hacer zoom-in el radio se reduce para mayor precisión;
    // al alejarse crece para facilitar la selección.
    // Fórmula: clamp entre 6 y 18 px en espacio mundo.
    const hitRadius = Math.min(22, Math.max(14, 16 / this.zoom));

    // Buscar el terminal MÁS CERCANO en todos los dispositivos (closest-wins)
    let closestTerm = null;
    let closestDev  = null;
    let minDist = hitRadius; // solo se acepta si está dentro del radio

    for(let i = this.scenario.devices.length - 1; i >= 0; i--){
      const d = this.scenario.devices[i];
      const terms = this.getEffectiveTerminals(d.type);
      if(!terms || terms.length === 0) continue;
      for(const t of terms){
        const dist = Math.hypot(wPos.x - (d.x + t.x), wPos.y - (d.y + t.y));
        if(dist < minDist){
          minDist = dist;
          closestTerm = t;
          closestDev  = d;
        }
      }
    }

    if(closestTerm) return { dev: closestDev, term: closestTerm };

    // Sin terminal cercano: buscar cuerpo de dispositivo
    for(let i = this.scenario.devices.length - 1; i >= 0; i--){
      const d = this.scenario.devices[i];
      const def = DEVICES[d.type];
      if(!def) continue;
      if(wPos.x >= d.x && wPos.x <= d.x + def.w && wPos.y >= d.y && wPos.y <= d.y + def.h){
        return { dev: d, term: null };
      }
    }
    return { dev: null, term: null };
  }

  // Detectar click sobre el tronco de un cable (muestreo de curva cuadrática)
  hitCableTest(screenX, screenY){
    const wPos = this.screenToWorld(screenX, screenY);
    const threshold = Math.max(10, 10 / this.zoom); // px en espacio mundo

    let bestCable = null;
    let bestDist  = threshold;

    for(const cable of this.scenario.cables){
      if(!cable.conductors || cable.conductors.length === 0) continue;
      const firstCond = cable.conductors[0];
      const devA = this.devById(firstCond.a.dev);
      const devB = this.devById(firstCond.b.dev);
      if(!devA || !devB) continue;
      const defA = DEVICES[devA.type];
      const defB = DEVICES[devB.type];
      if(!defA || !defB) continue;

      // Calcular los mismos breakpoints que usa renderCables()
      const termsA = [], termsB = [];
      for(const cond of cable.conductors){
        const tA = defA.terminals.find(t => t.id === cond.a.term);
        const tB = defB.terminals.find(t => t.id === cond.b.term);
        if(tA) termsA.push({ x: devA.x + tA.x, y: devA.y + tA.y });
        if(tB) termsB.push({ x: devB.x + tB.x, y: devB.y + tB.y });
      }
      if(termsA.length === 0 || termsB.length === 0) continue;

      const breakA = getDeviceBreakoutPoint(devA, termsA) || { x: devA.x + defA.w + 28, y: devA.y + defA.h / 2 };
      const breakB = getDeviceBreakoutPoint(devB, termsB) || { x: devB.x - 28, y: devB.y + defB.h / 2 };

      const midX  = (breakA.x + breakB.x) / 2;
      const dist  = Math.hypot(breakB.x - breakA.x, breakB.y - breakA.y);
      const sag   = Math.min(50, dist * 0.12);
      const midY  = (breakA.y + breakB.y) / 2 + sag;

      // Muestrear 30 puntos sobre la curva cuadrática de Bézier
      const SAMPLES = 30;
      for(let i = 0; i <= SAMPLES; i++){
        const t  = i / SAMPLES;
        const mt = 1 - t;
        const bx = mt*mt*breakA.x + 2*mt*t*midX + t*t*breakB.x;
        const by = mt*mt*breakA.y + 2*mt*t*midY + t*t*breakB.y;
        const d  = Math.hypot(wPos.x - bx, wPos.y - by);
        if(d < bestDist){
          bestDist  = d;
          bestCable = cable;
        }
      }
    }
    return bestCable;
  }


  addDevice(type){
    const def = DEVICES[type];
    if(!def) return;
    const id = type + '_' + Math.random().toString(36).substr(2,4);
    
    // Posicionar el nuevo componente centrado en la vista visible actual
    const viewCenter = this.screenToWorld(this.canvas.width / 2, this.canvas.height / 2);
    const offset = (this.scenario.devices.length % 8) * 25;
    const posX = Math.round(viewCenter.x - def.w / 2 + offset);
    const posY = Math.round(viewCenter.y - def.h / 2 + offset);

    this._recordState();
    this.scenario.devices.push({ id, type, x: posX, y: posY });
    this.simState[id] = Object.assign({}, def.action ? {[def.action.stateKey]:def.action.def} : {});
    if(def.zones) for(const z of def.zones) this.simState[id][z.stateKey]=z.def;
    this._recalcModel();
    this.render();
    if(this.hooks.onChange) this.hooks.onChange();
  }

  newCable(){
    this.activeCableId = 'cab_' + Math.random().toString(36).substr(2,4);
    this.scenario.cables.push({ id: this.activeCableId, type: this.cableType, conductors: [] });
  }

  _recalcModel(){
    if(this.mode === 'sim') {
      this.model = buildModel(this.scenario, this.simState);
      if(this.hooks.onAction) this.hooks.onAction();
    }
  }

  /* DIBUJO DE CUADRÍCULA INFINITA ADAPTATIVA */
  _grid(ctx){
    // Fondo cálido infinito
    ctx.fillStyle = '#e2dbc9';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.pan.x, this.pan.y);
    ctx.scale(this.zoom, this.zoom);

    // Calcular límites visibles en el espacio del mundo
    const minX = -this.pan.x / this.zoom;
    const maxX = (this.canvas.width - this.pan.x) / this.zoom;
    const minY = -this.pan.y / this.zoom;
    const maxY = (this.canvas.height - this.pan.y) / this.zoom;

    const gridSize = 30;
    const startX = Math.floor(minX / gridSize) * gridSize;
    const endX = Math.ceil(maxX / gridSize) * gridSize;
    const startY = Math.floor(minY / gridSize) * gridSize;
    const endY = Math.ceil(maxY / gridSize) * gridSize;

    // Líneas principales de la cuadrícula
    ctx.strokeStyle = 'rgba(120, 110, 90, 0.16)';
    ctx.lineWidth = 1 / this.zoom;
    ctx.beginPath();
    for(let x = startX; x <= endX; x += gridSize){
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    for(let y = startY; y <= endY; y += gridSize){
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
    ctx.stroke();

    // Puntos de intersección sutiles de la cuadrícula
    ctx.fillStyle = 'rgba(100, 90, 70, 0.28)';
    const dotSize = Math.max(1.8, 2.2 / this.zoom);
    for(let x = startX; x <= endX; x += gridSize){
      for(let y = startY; y <= endY; y += gridSize){
        ctx.fillRect(x - dotSize/2, y - dotSize/2, dotSize, dotSize);
      }
    }

    ctx.restore();
  }

  render(){
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this._grid(ctx);

    ctx.save();
    ctx.translate(this.pan.x, this.pan.y);
    ctx.scale(this.zoom, this.zoom);

    // 1. Dibujar dispositivos primero
    for(const d of this.scenario.devices){
      const def = DEVICES[d.type];
      if(!def) continue;
      const st = (this.mode==='sim' && this.model) ? Object.assign({}, this.simState[d.id], this.model.devices[d.id]) : this.simState[d.id] || {};
      ctx.save();
      ctx.translate(d.x, d.y);
      def.draw(ctx, d, st);
      ctx.restore();
    }

    // 2. Dibujar Cables y Pigtails ENCIMA de los dispositivos
    this.renderCables(ctx);

    if(this.pending) this._drawPending(ctx);

    // 3. Guías visuales de terminales / bornes (si está activo el botón 'Puntos de Conexión', en modo ajuste o al cablear)
    if(this.showTerminals || this.termEditMode || this.pending){
      this._drawTerminalGuides(ctx);
    }

    // 4. Sondas en modo simulación
    if(this.mode === 'sim'){
      if(this.probes.red) this.drawProbe(ctx, this.probes.red, '#ff3b30');
      if(this.probes.black) this.drawProbe(ctx, this.probes.black, '#20242a');
    }

    ctx.restore();
  }

  toggleTerminals(){
    this.showTerminals = !this.showTerminals;
    this.render();
    return this.showTerminals;
  }

  _drawTerminalGuides(ctx){
    for(const d of this.scenario.devices){
      const terms = this.getEffectiveTerminals(d.type);
      if(!terms || terms.length === 0) continue;

      for(const t of terms){
        const tx = d.x + t.x;
        const ty = d.y + t.y;

        const isHovered = Boolean(this.hoveredTerm && this.hoveredTerm.devId === d.id && this.hoveredTerm.termId === t.id);
        const isSelectedOrigin = Boolean(this.pending && this.pending.a && this.pending.a.dev === d.id && this.pending.a.term === t.id);

        ctx.save();
        // En modo edición de terminales resaltar con halo ámbar/amarillo
        let pinColor = '#38bdf8'; // cian por defecto
        if(this.termEditMode){
          pinColor = '#facc15';
        } else {
          if(t.role === 'source-pos' || t.role === 'coil-pos') pinColor = '#ef4444'; // rojo
          else if(t.role === 'source-neg' || t.role === 'coil-neg') pinColor = '#3b82f6'; // azul
          else if(t.role === 'contact') pinColor = '#10b981'; // verde
          else if(t.role === 'input') pinColor = '#f59e0b'; // ámbar
        }

        // 1. Resplandor exterior (mayor e iluminado si está seleccionado o bajo el cursor)
        ctx.shadowColor = isSelectedOrigin ? '#fbbf24' : (isHovered ? '#38bdf8' : pinColor);
        ctx.shadowBlur = (isSelectedOrigin || isHovered) ? 22 : (this.termEditMode ? 16 : 10);
        
        // 2. Anillo de precisión
        let radius = this.termEditMode ? 14 : 12;
        if (isHovered || isSelectedOrigin) radius += 2.5;

        ctx.strokeStyle = isSelectedOrigin ? '#fbbf24' : (isHovered ? '#ffffff' : pinColor);
        ctx.lineWidth = ((isHovered || isSelectedOrigin) ? 3 : (this.termEditMode ? 2.5 : 2)) / Math.max(0.5, this.zoom);
        ctx.fillStyle = isSelectedOrigin ? 'rgba(251, 191, 36, 0.40)' : (isHovered ? 'rgba(56, 189, 248, 0.35)' : 'rgba(15, 23, 42, 0.85)');
        ctx.beginPath();
        ctx.arc(tx, ty, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2.1 Anillo concéntrico adicional de fijación de blanco (Target lock)
        if (isHovered || isSelectedOrigin) {
          ctx.strokeStyle = isSelectedOrigin ? '#f59e0b' : '#38bdf8';
          ctx.lineWidth = 1.5 / Math.max(0.5, this.zoom);
          ctx.beginPath();
          ctx.arc(tx, ty, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 3. Punto de mira central
        ctx.fillStyle = isSelectedOrigin ? '#ffffff' : (isHovered ? '#ffffff' : pinColor);
        ctx.beginPath();
        ctx.arc(tx, ty, (isHovered || isSelectedOrigin) ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();

        // 4. Cruz de alineación milimétrica
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isSelectedOrigin ? '#ffffff' : (isHovered ? '#ffffff' : pinColor);
        ctx.lineWidth = 1.5 / Math.max(0.5, this.zoom);
        ctx.beginPath();
        ctx.moveTo(tx - (radius + 4), ty); ctx.lineTo(tx + (radius + 4), ty);
        ctx.moveTo(tx, ty - (radius + 4)); ctx.lineTo(tx, ty + (radius + 4));
        ctx.stroke();

        // 5. Etiqueta del borne con caja de contraste si está seleccionado o hovered
        const labelText = t.label || t.id;
        const fontSize = Math.max(8.5, Math.min(11.5, 10 / this.zoom));
        ctx.font = `bold ${fontSize}px monospace`;

        if (isHovered || isSelectedOrigin) {
          const textW = ctx.measureText(labelText).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fillRect(tx + radius + 5, ty - fontSize + 2, textW + 8, fontSize + 4);
          ctx.strokeStyle = isSelectedOrigin ? '#fbbf24' : '#38bdf8';
          ctx.lineWidth = 1 / Math.max(0.5, this.zoom);
          ctx.strokeRect(tx + radius + 5, ty - fontSize + 2, textW + 8, fontSize + 4);

          ctx.fillStyle = isSelectedOrigin ? '#fbbf24' : '#ffffff';
          ctx.fillText(labelText, tx + radius + 9, ty + 3);
        } else {
          ctx.fillStyle = pinColor;
          ctx.fillText(labelText, tx + radius + 4, ty + 3);
        }

        ctx.restore();
      }
    }
  }

  _drawPending(ctx){
    const d = this.devById(this.pending.a.dev);
    if (!d) return;
    const terms = this.getEffectiveTerminals(d.type);
    const term = terms.find(t => t.id === this.pending.a.term);
    if (!term) return;

    let targetX = this.worldMouse.x;
    let targetY = this.worldMouse.y;

    // Si el cursor está sobre otro borne compatible, imantar el extremo del cable al borne
    if (this.hoveredTerm && this.hoveredTerm.devId && this.hoveredTerm.termId) {
      if (this.hoveredTerm.devId !== this.pending.a.dev || this.hoveredTerm.termId !== this.pending.a.term) {
        const targetDev = this.devById(this.hoveredTerm.devId);
        if (targetDev) {
          const targetTerms = this.getEffectiveTerminals(targetDev.type);
          const targetT = targetTerms.find(t => t.id === this.hoveredTerm.termId);
          if (targetT) {
            targetX = targetDev.x + targetT.x;
            targetY = targetDev.y + targetT.y;
          }
        }
      }
    }

    ctx.save();
    ctx.strokeStyle = CONDUCTOR_COLORS[this.conductorColor]?.hex || '#fff';
    ctx.lineWidth = 3.5 / this.zoom;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(d.x + term.x, d.y + term.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.restore();
  }

  drawProbe(ctx, probe, color){
    const dev = this.devById(probe.dev);
    if (!dev) return;
    const terms = this.getEffectiveTerminals(dev.type);
    const term = terms.find((t) => t.id === probe.term);
    if (!term) return;

    const px = dev.x + term.x;
    const py = dev.y + term.y;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 / this.zoom;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ================== DIBUJO DE CABLES Y PIGTAILS ================== */
  renderCables(ctx) {
    for (const cable of this.scenario.cables) {
      if (!cable.conductors || cable.conductors.length === 0) continue;

      const firstCond = cable.conductors[0];
      const devA = this.devById(firstCond.a.dev);
      const devB = this.devById(firstCond.b.dev);
      if (!devA || !devB) continue;

      const defA = DEVICES[devA.type];
      const defB = DEVICES[devB.type];
      if (!defA || !defB) continue;

      const termsADef = this.getEffectiveTerminals(devA.type);
      const termsBDef = this.getEffectiveTerminals(devB.type);

      const termsA = [];
      const termsB = [];

      for (const cond of cable.conductors) {
        const termAId = (cond.a.dev === devA.id) ? cond.a.term : cond.b.term;
        const termBId = (cond.b.dev === devB.id) ? cond.b.term : cond.a.term;
        const tA = termsADef.find((t) => t.id === termAId);
        const tB = termsBDef.find((t) => t.id === termBId);
        if (tA) termsA.push({ x: devA.x + tA.x, y: devA.y + tA.y });
        if (tB) termsB.push({ x: devB.x + tB.x, y: devB.y + tB.y });
      }

      if (termsA.length === 0 || termsB.length === 0) continue;

      const breakA = getDeviceBreakoutPoint(devA, termsA) || { x: devA.x + defA.w + 28, y: devA.y + defA.h / 2 };
      const breakB = getDeviceBreakoutPoint(devB, termsB) || { x: devB.x - 28, y: devB.y + defB.h / 2 };

      const dx = breakB.x - breakA.x;
      const dy = breakB.y - breakA.y;
      const dist = Math.hypot(dx, dy);
      const midX = (breakA.x + breakB.x) / 2;
      const sag = Math.min(50, dist * 0.12);
      const midY = (breakA.y + breakB.y) / 2 + sag;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 5;

      ctx.strokeStyle = '#222831';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(breakA.x, breakA.y);
      ctx.quadraticCurveTo(midX, midY, breakB.x, breakB.y);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(breakA.x, breakA.y - 2);
      ctx.quadraticCurveTo(midX, midY - 2, breakB.x, breakB.y - 2);
      ctx.stroke();

      [breakA, breakB].forEach(pt => {
        ctx.fillStyle = '#0f1318';
        ctx.strokeStyle = '#465366';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      for (const cond of cable.conductors) {
        const termAId = (cond.a.dev === devA.id) ? cond.a.term : cond.b.term;
        const termBId = (cond.b.dev === devB.id) ? cond.b.term : cond.a.term;
        const tA = termsADef.find((t) => t.id === termAId);
        const tB = termsBDef.find((t) => t.id === termBId);
        if (!tA || !tB) continue;

        const posA = { x: devA.x + tA.x, y: devA.y + tA.y };
        const posB = { x: devB.x + tB.x, y: devB.y + tB.y };

        this.drawPigtail(ctx, posA, breakA.x, breakA.y, cond.color, devA);
        this.drawPigtail(ctx, posB, breakB.x, breakB.y, cond.color, devB);
      }
    }
  }

  drawPigtail(ctx, termPos, breakX, breakY, colorName, dev) {
    ctx.save();
    const colorHex = CONDUCTOR_COLORS[colorName]?.hex || '#ffffff';
    const def = dev ? DEVICES[dev.type] : null;

    let cp1x = termPos.x;
    let cp1y = termPos.y;
    let cp2x = breakX;
    let cp2y = breakY;

    if (def && dev) {
      const isLeft = breakX < dev.x;
      const isRight = breakX > dev.x + def.w;
      const isTop = breakY < dev.y;
      const isBottom = breakY > dev.y + def.h;
      const stretch = Math.max(30, Math.hypot(breakX - termPos.x, breakY - termPos.y) * 0.4);

      if (isBottom) {
        cp1x = termPos.x;
        cp1y = termPos.y + stretch;
        cp2x = breakX;
        cp2y = breakY - stretch * 0.5;
      } else if (isTop) {
        cp1x = termPos.x;
        cp1y = termPos.y - stretch;
        cp2x = breakX;
        cp2y = breakY + stretch * 0.5;
      } else if (isRight) {
        cp1x = termPos.x + stretch;
        cp1y = termPos.y;
        cp2x = breakX - stretch * 0.5;
        cp2y = breakY;
      } else if (isLeft) {
        cp1x = termPos.x - stretch;
        cp1y = termPos.y;
        cp2x = breakX + stretch * 0.5;
        cp2y = breakY;
      }
    }

    // Sombra del conductor
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(termPos.x, termPos.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, breakX, breakY);
    ctx.stroke();

    // Hilo conductor coloreado puro
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(termPos.x, termPos.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, breakX, breakY);
    ctx.stroke();

    // Terminal de ojillo / puntera limpia en el borne
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(termPos.x, termPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
