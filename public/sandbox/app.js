/* ============================================================
   app.js — Navegación, biblioteca, editor y simulador (UI)
   ============================================================ */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2400);
}

/* Sincronización de Tema Claro / Oscuro con la Aplicación Principal */
function syncThemeFromParent() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    if (themeParam) {
      document.documentElement.setAttribute('data-theme', themeParam);
      return;
    }
    const isParentLight = window.parent && window.parent.document && window.parent.document.documentElement.classList.contains('light');
    if (isParentLight) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
}
syncThemeFromParent();

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'THEME_CHANGE') {
    document.documentElement.setAttribute('data-theme', e.data.theme);
  }
});

/* ---------------- Tabs ---------------- */
$$('.tab').forEach(b=>b.addEventListener('click',()=>{
  $$('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-'+b.dataset.view).classList.add('active');
  if(b.dataset.view==='editor') window.editor.resize();
  if(b.dataset.view==='simulator'){ refreshSimScenarioList(); window.sim.resize(); }
  if(b.dataset.view==='studio' && window.studio) window.studio.resize();
}));

/* Soporte para vista directa desde la URL (ej. view=simulator o view=library) */
function checkDirectView() {
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get('view');
  if (view === 'simulator') {
    $$('.view').forEach(v=>v.classList.remove('active'));
    const simView = $('#view-simulator');
    if (simView) {
      simView.classList.add('active');
      $('#topbar').style.display = 'none';
      setTimeout(() => {
        refreshSimScenarioList();
        if (window.sim) window.sim.resize();
      }, 100);
    }
  } else if (view === 'library') {
    $$('.view').forEach(v=>v.classList.remove('active'));
    const libView = $('#view-library');
    if (libView) {
      libView.classList.add('active');
      $('#topbar').style.display = 'none';
      renderLibrary();
    }
  }
}
window.addEventListener('DOMContentLoaded', checkDirectView);
setTimeout(checkDirectView, 200);

/* Eventos para la nueva carcasa del Laboratorio Sandbox */
function initLabHeaderEvents() {
  const btnIfThen = $('#btn-toggle-ifthen');
  const panelIfThen = $('#panel-ifthen');
  const closeIfThen = $('#close-ifthen-btn');

  if (btnIfThen && panelIfThen) {
    btnIfThen.addEventListener('click', () => {
      panelIfThen.classList.toggle('closed');
      setTimeout(() => { if (window.editor) window.editor.resize(); }, 100);
    });
  }
  if (closeIfThen && panelIfThen) {
    closeIfThen.addEventListener('click', () => {
      panelIfThen.classList.add('closed');
      setTimeout(() => { if (window.editor) window.editor.resize(); }, 100);
    });
  }

  const btnLibrary = $('#btn-toggle-library');
  const panelLibrary = $('#panel-library');
  const closeLibrary = $('#close-library-btn');

  if (btnLibrary && panelLibrary) {
    btnLibrary.addEventListener('click', () => {
      panelLibrary.classList.toggle('closed');
      setTimeout(() => { if (window.editor) window.editor.resize(); }, 100);
    });
  }
  if (closeLibrary && panelLibrary) {
    closeLibrary.addEventListener('click', () => {
      panelLibrary.classList.add('closed');
      setTimeout(() => { if (window.editor) window.editor.resize(); }, 100);
    });
  }

  const btnUndo = $('#btn-undo');
  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      if (window.editor) window.editor.undo();
    });
  }

  const btnRedo = $('#btn-redo');
  if (btnRedo) {
    btnRedo.addEventListener('click', () => {
      if (window.editor) window.editor.redo();
    });
  }

  const btnSimMode = $('#btn-toggle-sim-mode');
  if (btnSimMode) {
    btnSimMode.addEventListener('click', () => {
      if (!window.editor) return;
      const isSim = window.editor.mode === 'sim';
      if (isSim) {
        window.editor.setMode('editor');
        btnSimMode.textContent = '▶️ Probar Simulación';
        btnSimMode.classList.remove('active');
        toast('🛠️ Modo Edición: Puedes arrastrar y cablear componentes');
      } else {
        window.editor.setMode('sim');
        btnSimMode.textContent = '🛠️ Volver a Modo Edición';
        btnSimMode.classList.add('active');
        toast('⚡ Modo Simulación Activo: Toca los componentes para interactuar');
      }
    });
  }

  const btnTerminals = $('#btn-toggle-terminals');
  if (btnTerminals) {
    btnTerminals.addEventListener('click', () => {
      if (!window.editor) return;
      const isShowing = window.editor.toggleTerminals();
      if (isShowing) {
        btnTerminals.classList.add('active');
        btnTerminals.textContent = '📍 Ocultar Puntos';
        toast('🎯 Puntos de conexión y bornes activados');
      } else {
        btnTerminals.classList.remove('active');
        btnTerminals.textContent = '🎯 Puntos de Conexión';
        toast('📍 Puntos de conexión ocultados');
      }
    });
  }

  const btnTermEdit = $('#btn-term-edit-mode');
  const btnTermReset = $('#btn-reset-term-overrides');
  if (btnTermEdit) {
    btnTermEdit.addEventListener('click', () => {
      if (!window.editor) return;
      const isEdit = window.editor.toggleTermEditMode();
      if (isEdit) {
        btnTermEdit.classList.add('active');
        btnTermEdit.textContent = '💾 Terminar Ajuste';
        if (btnTermReset) btnTermReset.style.display = '';
        toast('✏️ Modo Ajuste de Bornes: Arrastra directamente cualquier punto con el mouse para alinearlo');
      } else {
        btnTermEdit.classList.remove('active');
        btnTermEdit.textContent = '✏️ Mover Bornes';
        if (btnTermReset) btnTermReset.style.display = 'none';
        toast('✅ Nuevas posiciones de bornes guardadas de forma permanente');
      }
    });
  }

  if (btnTermReset) {
    btnTermReset.addEventListener('click', () => {
      if (!window.editor) return;
      // Encontrar el dispositivo mas cercano al centro de la vista
      const viewCenter = window.editor.screenToWorld(window.editor.canvas.width / 2, window.editor.canvas.height / 2);
      let closest = null, minDist = Infinity;
      for (const dev of window.editor.scenario.devices) {
        const def = DEVICES[dev.type];
        if (!def) continue;
        const cx = dev.x + def.w / 2;
        const cy = dev.y + def.h / 2;
        const d = Math.hypot(cx - viewCenter.x, cy - viewCenter.y);
        if (d < minDist) { minDist = d; closest = dev; }
      }
      if (closest) {
        window.editor._resetTerminalOverrides(closest.type);
        window.editor.render();
        toast('↺ Posiciones originales restauradas para ' + DEVICES[closest.type].name);
      } else {
        // Reset all overrides if no devices found
        for (const type of Object.keys(DEVICES)) {
          window.editor._resetTerminalOverrides(type);
        }
        window.editor.render();
        toast('↺ Todas las posiciones restablecidas por defecto');
      }
    });
  }

  const btnCables = $('#btn-toggle-cables');
  const cableBar = $('#lab-cable-bar');
  if (btnCables && cableBar) {
    btnCables.addEventListener('click', () => {
      const isClosed = cableBar.classList.toggle('closed');
      btnCables.textContent = isClosed ? 'v Paleta Cables' : '^ Paleta Cables';
      setTimeout(() => { if (window.editor) window.editor.resize(); }, 120);
    });
  }

  const btnClearTop = $('#btn-clear-canvas-top');
  if (btnClearTop) {
    btnClearTop.addEventListener('click', () => {
      if (window.editor) {
        window.editor.scenario = { name: 'Escenario Limpio', devices: [], cables: [] };
        window.editor.render();
        toast('Canvas reiniciado');
      }
    });
  }

  const btnFullscreenTop = $('#btn-fullscreen-top');
  if (btnFullscreenTop) {
    btnFullscreenTop.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // Interacción de botones de Selector de Función del Multímetro
  $$('.mm-func-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mm-func-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      const unitEl = $('#mm-unit');
      if (unitEl) {
        if (mode === 'dcv') unitEl.textContent = 'V';
        else if (mode === 'acv') unitEl.textContent = 'V~';
        else if (mode === 'res') unitEl.textContent = 'Ω';
        else if (mode === 'cont') unitEl.textContent = ')))';
      }
      toast('Multímetro: ' + btn.textContent);
    });
  });

  // Interacción de botones de Voltaje Manual Simulado
  $$('.v-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.textContent.replace(' V', '');
      const valEl = $('#mm-value');
      if (valEl) valEl.textContent = val;
      toast('Voltaje Simulado Set: ' + btn.textContent);
    });
  });
}

// Ejecutar initLabHeaderEvents de forma inmediata y diferida
initLabHeaderEvents();
window.addEventListener('DOMContentLoaded', initLabHeaderEvents);
setTimeout(initLabHeaderEvents, 200);
const drawer = $('#bottom-device-drawer');
const drawerBtn = $('#drawer-toggle-btn');
if(drawerBtn && drawer){
  drawerBtn.addEventListener('click', ()=>{
    drawer.classList.toggle('collapsed');
    const isCollapsed = drawer.classList.contains('collapsed');
    const iconBtn = drawerBtn.querySelector('.drawer-toggle-icon');
    if(iconBtn) iconBtn.textContent = isCollapsed ? '▲ Ver Dispositivos' : '▼ Ocultar Dispositivos';
  });
}

/* Toggle del Cajón de Cableado (Editor - Superior) */
const cableDrawer = $('#top-cable-drawer');
const cableDrawerBtn = $('#cable-drawer-toggle-btn');
if(cableDrawerBtn && cableDrawer){
  cableDrawerBtn.addEventListener('click', ()=>{
    cableDrawer.classList.toggle('collapsed');
    const isCollapsed = cableDrawer.classList.contains('collapsed');
    const iconBtn = cableDrawerBtn.querySelector('.drawer-toggle-icon');
    if(iconBtn) iconBtn.textContent = isCollapsed ? '▼ Ver Cableado' : '▲ Ocultar Cableado';
  });
}

/* ---------------- Biblioteca ---------------- */
function renderLibrary(){
  const grid=$('#library-grid'); 
  if(!grid) return;
  grid.innerHTML='';
  for(const [type,def] of Object.entries(DEVICES)){
    const card=document.createElement('div'); card.className='dev-card';
    const cv=document.createElement('canvas'); cv.width=220; cv.height=100;
    card.appendChild(cv);
    const tag=document.createElement('div'); tag.className='tag'; tag.textContent=def.tag;
    const h=document.createElement('h3'); h.textContent=def.name;
    const p=document.createElement('p'); p.textContent=def.desc.slice(0,90)+'…';
    card.appendChild(tag); card.appendChild(h); card.appendChild(p);
    card.addEventListener('click',()=>showDeviceModal(type));
    grid.appendChild(card);
    // miniatura
    const ctx=cv.getContext('2d');
    const scale=Math.min(210/def.w, 90/def.h);
    ctx.save();
    ctx.translate((220-def.w*scale)/2, (100-def.h*scale)/2);
    ctx.scale(scale,scale);
    const demoState = def.action ? {[def.action.stateKey]:def.action.def} : {};
    if(type==='maglock') demoState.energized=true;
    if(type==='door-controller'){ demoState.pwrLed=true; demoState.relay=true; }
    if(type==='motion-sensor'){ demoState.powered=true; }
    def.draw(ctx,{id:'x',type},demoState);
    ctx.restore();
  }
}

function showDeviceModal(type){
  const def=DEVICES[type];
  const box=$('#device-modal-content');
  box.innerHTML='';
  const flex=document.createElement('div'); flex.className='dm-flex';
  const cv=document.createElement('canvas'); cv.width=def.w+30; cv.height=def.h+30;
  const ctx=cv.getContext('2d'); ctx.translate(15,15);
  const demoState = def.action ? {[def.action.stateKey]:def.action.def} : {};
  if(type==='maglock') demoState.energized=true;
  if(type==='door-controller'){ demoState.pwrLed=true; demoState.relay=true; }
  if(type==='motion-sensor'){ demoState.powered=true; demoState.motion=true; }
  if(type==='push-to-exit') demoState.pressed=true;
  def.draw(ctx,{id:'x',type},demoState);
  const info=document.createElement('div'); info.className='dm-info';
  let rows=def.terminals.map(t=>`<tr><td>${t.label}</td><td>${roleName(t.role)}</td></tr>`).join('');
  info.innerHTML=`<div class="tag">${def.tag}</div><h3>${def.name}</h3>
    <p>${def.desc}</p>
    <table>${rows}</table>
    <div class="tips"><strong>Consejo de campo:</strong> ${def.tips}</div>`;
  flex.appendChild(cv); flex.appendChild(info);
  box.appendChild(flex);
  $('#device-modal').classList.remove('hidden');
}
function roleName(r){
  return {'source-pos':'Salida +12VDC','source-neg':'Salida GND','coil-pos':'Alimentación +','coil-neg':'Alimentación −','contact':'Contacto seco','input':'Entrada de señal'}[r]||r;
}
$('#device-modal-close').addEventListener('click',()=>$('#device-modal').classList.add('hidden'));
$('#load-modal-close').addEventListener('click',()=>$('#load-modal').classList.add('hidden'));

/* ---------------- Editor ---------------- */
window.editor = new Workbench($('#editor-canvas'),'editor',{toast, onChange:()=>{}});

// paleta de dispositivos con miniaturas canvas
function renderPalette(){
  const pal=$('#palette-devices');
  if(!pal) return;
  pal.innerHTML='';

  let deletedKeys = [];
  try {
    const savedDeleted = localStorage.getItem('deleted_library_component_ids');
    if (savedDeleted) deletedKeys = JSON.parse(savedDeleted);
  } catch(e){}

  for(const [type,def] of Object.entries(DEVICES)){
    if(!def) continue;

    // Filtrar si el componente fue eliminado en la biblioteca
    if (deletedKeys.includes(type) || deletedKeys.includes(def.name) || deletedKeys.includes(`${def.brand || ''}_${def.name}`)) {
      continue;
    }

    const el=document.createElement('div'); 
    el.className='pal-item pal-item-with-thumb';
    
    // Canvas miniatura del componente
    const cv=document.createElement('canvas'); 
    cv.width=56; 
    cv.height=44;
    cv.className='pal-thumb-canvas';

    const info = document.createElement('div');
    info.className = 'pal-item-info';
    info.innerHTML = `<strong>${def.name || type}${def.custom?' ◈':''}</strong><small>${def.tag||''}</small>`;

    el.appendChild(cv);
    el.appendChild(info);

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.editor) {
        window.editor.addDevice(type);
        toast((def.name || type) + ' agregado al lienzo');
      }
    });
    pal.appendChild(el);

    // Dibujar miniatura en el canvas de forma segura
    try {
      const ctx=cv.getContext('2d');
      const scale=Math.min(52/(def.w || 100), 40/(def.h || 100));
      ctx.save();
      ctx.translate((56 - (def.w || 100)*scale)/2, (44 - (def.h || 100)*scale)/2);
      ctx.scale(scale, scale);
      const demoState = def.action ? {[def.action.stateKey]:def.action.def} : {};
      if(type==='maglock' || type==='maglock-lateral') demoState.energized=true;
      if(type==='door-controller'){ demoState.pwrLed=true; demoState.relay=true; }
      if(type==='motion-sensor'){ demoState.powered=true; }
      if(typeof def.draw === 'function'){
        def.draw(ctx,{id:'thumb',type},demoState);
      }
      ctx.restore();
    } catch(err) {
      console.warn('[sandbox] Error rendering thumbnail for', type, err);
    }
  }
  if (window.editor) {
    window.editor._bindUiControls();
  }
}
window.renderPalette = renderPalette;
renderPalette();

// Sincronización dinámica en vivo con /api/components (Library / Components)
async function syncLibraryComponents() {
  try {
    const res = await fetch('/api/components');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.components || !Array.isArray(data.components)) return;

    let deletedKeys = [];
    try {
      const savedDeleted = localStorage.getItem('deleted_library_component_ids');
      if (savedDeleted) deletedKeys = JSON.parse(savedDeleted);
    } catch(e){}

    for (const comp of data.components) {
      const isDeleted = deletedKeys.includes(comp.id) || deletedKeys.includes(comp.name) || deletedKeys.includes(`${comp.brand}_${comp.name}`);
      if (isDeleted) continue;

      const typeKey = comp.id || (comp.brand + '_' + comp.name).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const w = comp.default_width || 400;
      const h = comp.default_height || 300;

      // Verificar si ya existe en DEVICES por ID o por Nombre exacto
      const cleanCompName = comp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const alreadyExists = Object.entries(DEVICES).some(([key, d]) => {
        const cleanDevName = (d.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return key === typeKey || cleanDevName === cleanCompName || cleanDevName.includes(cleanCompName) || cleanCompName.includes(cleanDevName);
      });
      if (alreadyExists) continue;

      const terminals = (comp.terminals || []).map(t => ({
        id: t.id,
        label: t.label,
        x: Math.round((t.x / 100) * w),
        y: Math.round((t.y / 100) * h),
        role: t.type === 'positive' ? 'coil-pos' : t.type === 'negative' ? 'coil-neg' : 'contact'
      }));

      const isPowerSupply = comp.category === 'power_supply' || comp.category === 'poe_supply';
      const isStrikeOrLock = comp.category === 'strike' || comp.category === 'maglock' || comp.category === 'panic_bar' || comp.category === 'mortise_lock';
      const posTerms = terminals.filter(t => t.role === 'coil-pos' || t.role === 'source-pos').map(t => t.id);
      const negTerms = terminals.filter(t => t.role === 'coil-neg' || t.role === 'source-neg').map(t => t.id);

      DEVICES[typeKey] = {
        name: comp.name,
        brand: comp.brand,
        tag: `${comp.brand || 'ACCESSTECH'} · ${comp.category || 'Hardware'}`,
        desc: `${comp.name} - Componente oficial de la biblioteca de hardware.`,
        tips: isPowerSupply ? 'Haz clic en el switch para alternar entre 12V y 24V.' : 'Conecta los bornes correspondientes en el simulador.',
        w, h,
        terminals,
        custom: true,
        source: isPowerSupply ? { pos: posTerms, neg: negTerms } : undefined,
        behavior: isPowerSupply ? 'source' : isStrikeOrLock ? 'coil' : 'contact',
        action: isPowerSupply
          ? { label: 'Conmutar Selector (12V / 24V)', kind: 'toggle', stateKey: 'v24', def: false }
          : isStrikeOrLock
            ? { label: 'Pulso de Desbloqueo Strike', kind: 'momentary', stateKey: 'energized' }
            : { label: 'Alimentación ' + comp.name, kind: 'toggle', stateKey: 'powered', def: true },
        draw(ctx, d, st) {
          if (typeKey === 'preset-altronix' || (comp.brand && comp.brand.toLowerCase().includes('altronix') && comp.name.includes('175'))) {
            DEVICES['altronix-al175'].draw(ctx, d, st);
          } else if (typeKey === 'preset-hes' || (comp.name && comp.name.toLowerCase().includes('5000'))) {
            DEVICES['hes-5000'].draw(ctx, d, st);
          } else {
            drawNativeVector(ctx, typeKey, w, h, st);
          }
        }
      };

      if (comp.svg_url) {
        if (!window._nativeSvgImages[typeKey]) {
          const img = new Image();
          img.onload = () => {
            renderPalette();
            if (window.editor) window.editor.render();
          };
          img.src = comp.svg_url;
          window._nativeSvgImages[typeKey] = img;
        }
      }
    }
    renderPalette();
  } catch (e) {
    console.warn('[sandbox] Error synchronizing library components:', e);
  }
}
syncLibraryComponents();

// tipos de cable con selectores de color integrados por tarjeta
function renderCableTypes(){
  const box=$('#cable-types'); box.innerHTML='';
  for(const [id,ct] of Object.entries(CABLE_TYPES)){
    const isSelected = window.editor.cableType === id;
    const card = document.createElement('div');
    card.className = 'cable-card' + (isSelected ? ' sel' : '');

    // Para Cat6 Ethernet UTP no hay selección de color de hilo activo manual
    const hasColorPicker = id !== 'cat6' && ct.conductors && ct.conductors.length > 0;

    let colorPickerHtml = '';
    if (hasColorPicker) {
      const chips = ct.conductors.map(c => {
        const isChipSel = isSelected && window.editor.conductorColor === c;
        const colorHex = CONDUCTOR_COLORS[c]?.hex || '#fff';
        const colorName = CONDUCTOR_COLORS[c]?.name || c;
        return `<div class="cond-chip-inline${isChipSel ? ' sel' : ''}" data-color="${c}" style="background:${colorHex}" title="${colorName}"></div>`;
      }).join('');
      colorPickerHtml = `<div class="cable-card-conductors"><span class="cond-label">Color activo:</span><div class="chips-row">${chips}</div></div>`;
    }

    card.innerHTML = `
      <div class="cable-card-header">
        <span class="sw">${ct.conductors.map(c=>`<i style="background:${CONDUCTOR_COLORS[c]?.hex || '#fff'}"></i>`).join('')}</span>
        <div class="cable-card-info">
          <strong>${ct.name}</strong>
          <small>${ct.desc}</small>
        </div>
      </div>
      ${colorPickerHtml}
    `;

    // Evento al seleccionar el cable
    card.addEventListener('click', (e) => {
      const chipTarget = e.target.closest('.cond-chip-inline');
      if (chipTarget) {
        // Clic directo en un color
        window.editor.cableType = id;
        window.editor.conductorColor = chipTarget.dataset.color;
      } else {
        // Clic en la tarjeta de cable
        window.editor.cableType = id;
        if (hasColorPicker && !ct.conductors.includes(window.editor.conductorColor)) {
          window.editor.conductorColor = ct.conductors[0];
        }
      }
      renderCableTypes();
    });

    box.appendChild(card);
  }
}
renderCableTypes();

$('#btn-new-cable').addEventListener('click',()=>{ window.editor.newCable(); toast('Nuevo cable '+CABLE_TYPES[window.editor.cableType].name+' iniciado'); });

/* ---------- persistencia ---------- */
const LS_KEY='aclab_scenarios';
const getScenarios=()=>JSON.parse(localStorage.getItem(LS_KEY)||'{}');
const setScenarios=o=>localStorage.setItem(LS_KEY,JSON.stringify(o));

$('#scenario-name').value = window.editor.scenario.name;

$('#btn-save-scenario').addEventListener('click',()=>{
  const name=$('#scenario-name').value.trim()||'Sin nombre';
  window.editor.scenario.name=name;
  const all=getScenarios(); all[name]=window.editor.scenario; setScenarios(all);
  toast('Escenario "'+name+'" guardado');
});
$('#btn-load-scenario').addEventListener('click',()=>{
  const all=getScenarios(); const list=$('#load-list'); list.innerHTML='';
  const names=Object.keys(all);
  if(!names.length) list.innerHTML='<p style="color:var(--muted);font-size:12px">No hay escenarios guardados.</p>';
  for(const n of names){
    const el=document.createElement('div'); el.className='load-item';
    el.innerHTML=`<span>${n}</span><span class="acts"><button class="ld">Cargar</button><button class="del">Eliminar</button></span>`;
    el.querySelector('.ld').addEventListener('click',()=>{
      window.editor.setScenario(JSON.parse(JSON.stringify(all[n])));
      $('#scenario-name').value=n;
      $('#load-modal').classList.add('hidden'); toast('Escenario cargado');
    });
    el.querySelector('.del').addEventListener('click',()=>{
      const a=getScenarios(); delete a[n]; setScenarios(a);
      el.remove(); toast('Eliminado');
    });
    list.appendChild(el);
  }
  $('#load-modal').classList.remove('hidden');
});
$('#btn-clear-scenario').addEventListener('click',()=>{
  if(!confirm('¿Limpiar el escenario actual?')) return;
  window.editor.setScenario({name:'Nuevo escenario',devices:[],cables:[]});
  $('#scenario-name').value='Nuevo escenario';
});
$('#btn-export-scenario').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(window.editor.scenario,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=(window.editor.scenario.name||'escenario')+'.json'; a.click();
});
$('#btn-import-scenario').addEventListener('click',()=>$('#import-file').click());
$('#import-file').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{
    const sc=JSON.parse(r.result);
    window.editor.setScenario(sc); $('#scenario-name').value=sc.name||'Importado';
    toast('Escenario importado');
  }catch{ toast('Archivo inválido'); } };
  r.readAsText(f); e.target.value='';
});

/* ---------------- Simulador ---------------- */
window.sim = new Workbench($('#sim-canvas'),'sim',{
  toast,
  onChange:updateSimStatus,
  onProbe:updateMultimeter,
  onAction:updateSimStatus,
});

function refreshSimScenarioList(){
  const sel=$('#sim-scenario-select'); sel.innerHTML='';
  const all=getScenarios();
  const names=Object.keys(all);
  if(!names.length){ sel.innerHTML='<option value="">(Guarda un escenario en el editor)</option>'; return; }
  for(const n of names){ const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); }
  if(!sel.dataset.loaded || sel.value!==sel.dataset.loaded){
    window.sim.setScenario(JSON.parse(JSON.stringify(all[sel.value])));
    sel.dataset.loaded=sel.value;
    updateSimStatus(); updateMultimeter();
  }
}
$('#sim-scenario-select').addEventListener('change',e=>{
  const all=getScenarios();
  window.sim.setScenario(JSON.parse(JSON.stringify(all[e.target.value])));
  e.target.dataset.loaded=e.target.value;
  updateSimStatus(); updateMultimeter();
});

$$('.tool-btn').forEach(b=>b.addEventListener('click',()=>{
  $$('.tool-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); window.sim.tool=b.dataset.tool;
}));
$$('.mm-mode').forEach(b=>b.addEventListener('click',()=>{
  $$('.mm-mode').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); window.sim.mmMode=b.dataset.mode; updateMultimeter();
}));
$('#mm-clear').addEventListener('click',()=>{ window.sim.probes={red:null,black:null}; window.sim.render(); updateMultimeter(); });

function updateMultimeter(){
  const r=window.sim.probes.red, b=window.sim.probes.black;
  const fmt=t=> t? `${DEVICES[window.sim.devById(t.dev).type].name} · ${t.term.toUpperCase()}` : '—';
  $('#mm-probes-info').textContent=`Roja: ${fmt(r)} · Negra: ${fmt(b)}`;
  if(!window.sim.model) return;
  const res=multimeterRead(window.sim.model, r?r.dev+':'+r.term:null, b?b.dev+':'+b.term:null, window.sim.mmMode);
  $('#mm-value').textContent=res.text;
  $('#mm-unit').textContent=res.sub;
  if(res.beep && navigator.vibrate) navigator.vibrate(60);
}

function updateSimStatus(){
  const box=$('#sim-status'); box.innerHTML='';
  if(!window.sim.model) return;
  for(const d of window.sim.scenario.devices){
    const def=DEVICES[d.type], st=Object.assign({},window.sim.simState[d.id],window.sim.model.devices[d.id]);
    let txt='', on=false;
    switch(d.type){
      case 'power-supply': txt=st.power?'ENERGIZADA · 12V':'APAGADA'; on=st.power; break;
      case 'door-controller': txt=st.powered?(st.relay?'RELÉ ENERGIZADO (COM→NO)':'RELÉ LIBERADO (REX ACTIVO)'):'SIN ALIMENTACIÓN'; on=st.powered; break;
      case 'maglock': txt=st.energized?'ENERGIZADA · PUERTA BLOQUEADA':'SIN ENERGÍA · PUERTA LIBRE'; on=st.energized; break;
      case 'door-strike': txt=st.energized?'ENERGIZADO · ABIERTO':'SIN ENERGÍA · CERRADO'; on=st.energized; break;
      case 'crashbar': txt=st.energized?'ENERGIZADA · PESTILLO RETRAÍDO':'SIN ENERGÍA · BLOQUEADA'; on=st.energized; break;
      case 'door-position': txt=st.doorClosed!==false?'PUERTA CERRADA (contacto cerrado)':'PUERTA ABIERTA (contacto abierto)'; on=st.doorClosed!==false; break;
      case 'push-to-exit': txt=st.pressed?'PRESIONADO (contacto cerrado)':'EN REPOSO'; on=st.pressed; break;
      case 'motion-sensor': txt=!st.powered?'SIN ALIMENTACIÓN':(st.motion?'MOVIMIENTO DETECTADO':'SIN MOVIMIENTO'); on=st.powered&&st.motion; break;
      case 'prox-reader': txt=!st.powered?'SIN ALIMENTACIÓN':(st.card?'TARJETA VÁLIDA · DATOS ENVIADOS':'ENERGIZADO · ESPERANDO TARJETA'); on=st.powered&&st.card; break;
      case 'panel-4door': {
        if(!st.powered){ txt='SIN ALIMENTACIÓN'; on=false; break; }
        const act=[1,2,3,4].filter(i=>st.relay&&st.relay[i]);
        txt=`EN LÍNEA · PUERTAS ACTIVAS: ${act.length?act.join(', '):'ninguna'}`;
        on=act.length>0; break;
      }
      case 'poe-injector': txt=st.power!==false?'PoE ACTIVO · 2 puertos':'APAGADO'; on=st.power!==false; break;
      case 'poe-switch': txt=st.power!==false?'PoE ACTIVO · 8 puertos':'APAGADO'; on=st.power!==false; break;
      case 'altronix-acm8': {
        if(st.power===false){ txt='SIN CORRIENTE AC'; on=false; break; }
        const act=[1,2,3,4,5,6,7,8].filter(i=>st.relay&&st.relay[i]);
        txt=`AC OK · SALIDA ${st.v24?24:12}VDC · SALIDAS ACTIVAS: ${act.length?act.join(','):'0'}`;
        on=true; break;
      }
      case 'dual-voltage-psu': {
        const pwr = st.power !== false;
        txt = pwr ? `FUENTE ACTIVA · SALIDA ${st.v24 ? '24VDC' : '12VDC'}` : 'APAGADA';
        on = pwr;
        break;
      }
      default: {
        const beh=def.behavior;
        if(beh==='coil'){ on=!!st.energized; txt=on?'ENERGIZADO':'SIN ENERGÍA'; }
        else if(beh==='contact'){ const k=def.action&&def.action.stateKey; on=k?!!st[k]:false; txt=on?'ACTIVADO':'EN REPOSO'; }
        else if(beh==='source'){ on=st.power!==false; txt=on?'FUENTE ACTIVA':'APAGADA'; }
        else { txt='—'; on=false; }
      }
    }
    const el=document.createElement('div'); el.className='st-row';
    el.innerHTML=`<span>${def.name}</span><span class="${on?'on':'off'}">${txt}</span>`;
    box.appendChild(el);
  }
  for(const f of window.sim.model.faults){
    const el=document.createElement('div'); el.className='st-fault'; el.textContent='⚠ '+f;
    box.appendChild(el);
  }
  updateMultimeter();
}

/* ---------------- escenario de demostración ---------------- */
function seedDemo(){
  const all=getScenarios();
  all['Demo — Puerta con Strike y REX']={
    name:'Demo — Puerta con Strike y REX',
    devices:[
      {id:'ps1',type:'power-supply',x:50,y:50},
      {id:'ct1',type:'door-controller',x:330,y:30},
      {id:'st1',type:'door-strike',x:660,y:30},
      {id:'px1',type:'push-to-exit',x:330,y:300},
      {id:'dp1',type:'door-position',x:650,y:290},
    ],
    cables:[
      {id:'c1',type:'18/2',conductors:[
        {color:'red', a:{dev:'ps1',term:'pos'}, b:{dev:'ct1',term:'pwrp'}},
        {color:'black', a:{dev:'ps1',term:'neg'}, b:{dev:'ct1',term:'pwrn'}},
      ]},
      {id:'c2',type:'18/2',conductors:[
        {color:'red', a:{dev:'ps1',term:'pos'}, b:{dev:'ct1',term:'com'}},
        {color:'black', a:{dev:'ps1',term:'neg'}, b:{dev:'st1',term:'neg'}},
      ]},
      {id:'c3',type:'18/2',conductors:[
        {color:'red', a:{dev:'ct1',term:'no'}, b:{dev:'st1',term:'pos'}},
      ]},
      {id:'c4',type:'22/6',conductors:[
        {color:'white', a:{dev:'ps1',term:'neg'}, b:{dev:'px1',term:'c'}},
        {color:'green', a:{dev:'px1',term:'no'}, b:{dev:'ct1',term:'rex'}},
      ]},
    ]
  };
  all['Demo — Panel 4 Puertas + PoE']={
    name:'Demo — Panel 4 Puertas + PoE',
    devices:[
      {id:'sw1',type:'poe-switch',x:40,y:420},
      {id:'rd1',type:'prox-reader',x:60,y:80},
      {id:'pn1',type:'panel-4door',x:320,y:20},
      {id:'st1',type:'door-strike',x:880,y:60},
      {id:'px1',type:'push-to-exit',x:870,y:330},
    ],
    cables:[
      // alimentación del panel desde el switch PoE
      {id:'c2',type:'cat6',conductors:[
        {color:'blue',   a:{dev:'sw1',term:'p2p'}, b:{dev:'pn1',term:'pwrp'}},
        {color:'w-blue', a:{dev:'sw1',term:'p2n'}, b:{dev:'pn1',term:'pwrn'}},
      ]},
      // lector alimentado desde el puerto READER 1 del panel + data D0
      {id:'c1',type:'22/6',conductors:[
        {color:'red',    a:{dev:'pn1',term:'r1pwr'}, b:{dev:'rd1',term:'pwrp'}},
        {color:'black',  a:{dev:'pn1',term:'r1g1'},  b:{dev:'rd1',term:'pwrn'}},
        {color:'w-green',a:{dev:'rd1',term:'d0'},    b:{dev:'pn1',term:'r1d0'}},
      ]},
      // relé 1: C recibe +12 del switch (puerto 3), NO alimenta el strike
      {id:'c3',type:'18/2',conductors:[
        {color:'red',   a:{dev:'sw1',term:'p3p'}, b:{dev:'pn1',term:'r1c'}},
        {color:'black', a:{dev:'sw1',term:'p3n'}, b:{dev:'st1',term:'neg'}},
      ]},
      {id:'c5',type:'18/2',conductors:[
        {color:'red',   a:{dev:'pn1',term:'r1no'}, b:{dev:'st1',term:'pos'}},
      ]},
      // botón de salida puentea IN1 +/−
      {id:'c4',type:'22/6',conductors:[
        {color:'white', a:{dev:'px1',term:'c'},  b:{dev:'pn1',term:'in1p'}},
        {color:'blue',  a:{dev:'px1',term:'no'}, b:{dev:'pn1',term:'in1n'}},
      ]},
    ]
  };
  setScenarios(all);
}

/* ---------------- init ---------------- */
renderLibrary();
seedDemo();
setTimeout(() => { if (window.editor) window.editor.resize(); }, 150);
window.addEventListener('resize',()=>{ window.editor.resize(); window.sim.resize(); });
window.renderPalette = renderPalette;
window.renderLibrary = renderLibrary;
window.refreshSelect = function(){}; // mock for early call
