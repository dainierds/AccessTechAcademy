/* ============================================================
   engine.js — Motor de simulación eléctrica
   Modela redes (nets), propagación de voltaje, relés,
   contactos secos, cortocircuitos y polaridad inversa.
   ============================================================ */

const V_SUPPLY = 12.0;

function termKey(devId, termId){ return devId + ':' + termId; }

/* ---------- Union-Find ---------- */
class UF {
  constructor(){ this.p = new Map(); }
  find(x){
    if(!this.p.has(x)) this.p.set(x,x);
    let r=x; while(this.p.get(r)!==r) r=this.p.get(r);
    let c=x; while(this.p.get(c)!==c){ const n=this.p.get(c); this.p.set(c,r); c=n; }
    return r;
  }
  union(a,b){ this.p.set(this.find(a), this.find(b)); }
}

/* Estado de interacción por defecto de cada dispositivo */
function defaultSimState(scenario){
  const s = {};
  for(const d of scenario.devices){
    const def = DEVICES[d.type];
    const st = {};
    if(def.action && def.action.def !== undefined) st[def.action.stateKey] = def.action.def;
    if(def.zones) for(const z of def.zones) st[z.stateKey]=z.def;
    s[d.id] = st;
  }
  return s;
}

/* Puentes internos (contactos) activos según estado previo */
function internalBridges(d, devState, simSt){
  const B = [];
  const def = DEVICES[d.type];
  // comportamiento genérico: contacto (botón/sensor personalizado)
  if(def && def.behavior==='contact' && def.action){
    const active=!!simSt[def.action.stateKey];
    const coms=def.terminals.filter(t=>t.role==='com');
    if(coms.length){
      // lógica de relé: activo COM→NO, reposo COM→NC (parejas por orden)
      const nos=def.terminals.filter(t=>t.role==='no');
      const ncs=def.terminals.filter(t=>t.role==='nc');
      coms.forEach((c,i)=>{
        const target = active ? (nos[i]||nos[0]) : (ncs[i]||ncs[0]);
        if(target) B.push([c.id,target.id]);
      });
    }else if(active){
      const cs=def.terminals.filter(t=>t.role==='contact');
      for(let i=0;i+1<cs.length;i+=2) B.push([cs[i].id,cs[i+1].id]);
    }
    return B;
  }
  switch(d.type){
    case 'door-controller': {
      const relayOn = devState.relay;           // relé energizado
      B.push(relayOn ? ['com','no'] : ['com','nc']);
      break;
    }
    case 'push-to-exit': case 'push-to-exit-lateral':
      if(simSt.pressed) B.push(['c','no']);
      break;
    case 'door-position':
      if(simSt.doorClosed !== false) B.push(['c','no']);
      break;
    case 'motion-sensor':
      // relé de alarma/REX: movimiento C1→NO1, reposo o sin alimentación C1→NC1
      if(devState.powered && simSt.motion) B.push(['c1','no1']);
      else B.push(['c1','nc1']);
      // tamper antisabotaje: siempre cerrado (supervisión)
      B.push(['c2','nc2']);
      break;
    case 'prox-reader': case 'rfid-reader-lateral':
      // tarjeta válida: el lector baja D0 a GND (colector abierto)
      if(devState.powered && simSt.card) B.push(['d0','pwrn']);
      break;
    case 'panel-4door': {
      // rieles de alimentación de lectores (cuando el panel está energizado)
      if(devState.powered){
        for(const r of [1,2]){
          B.push(['r'+r+'pwr','pwrp']);
          B.push(['r'+r+'g1','pwrn']);
          B.push(['r'+r+'g2','pwrn']);
          B.push(['r'+r+'g3','pwrn']);
        }
      }
      // relés de contacto seco: activo C→NO, reposo C→NC
      for(let i=1;i<=4;i++){
        const on = devState.relay && devState.relay[i];
        B.push(on ? ['r'+i+'c','r'+i+'no'] : ['r'+i+'c','r'+i+'nc']);
      }
      break;
    }
    case 'altronix-acm8': {
      // relés de salida: activo C→NO, reposo C→NC
      for(let i=1;i<=8;i++){
        const on = devState.relay && devState.relay[i];
        B.push(on ? ['o'+i+'c','o'+i+'no'] : ['o'+i+'c','o'+i+'nc']);
      }
      break;
    }
    case 'hid-aero-x100': {
      // rieles de alimentación de lectores (cuando el panel está energizado)
      if(devState.powered){
        for(const r of [1,2]){
          B.push(['r'+r+'_pwr','top_pwr_pos']);
          B.push(['r'+r+'_gnd1','top_pwr_neg']);
          B.push(['r'+r+'_gnd2','top_pwr_neg']);
          B.push(['r'+r+'_gnd3','top_pwr_neg']);
        }
      }
      // relés de contacto seco K1..K4: activo C→NO, reposo C→NC
      for(let i=1;i<=4;i++){
        const on = devState.relay && devState.relay[i];
        B.push(on ? ['rly'+i+'_c','rly'+i+'_no'] : ['rly'+i+'_c','rly'+i+'_nc']);
      }
      break;
    }
    case 'camden-relay': {
      // 2 relés Form-C independientes: activo C→NO, reposo C→NC
      for(let i=1;i<=2;i++){
        const on = devState.relay && devState.relay[i];
        B.push(on ? ['r'+i+'_c','r'+i+'_no'] : ['r'+i+'_c','r'+i+'_nc']);
      }
      break;
    }
  }
  return B;
}

/* Evaluación de punto fijo */
function buildModel(scenario, simState){
  const devState = {};   // estados calculados (energizado, relay, etc.)
  const faults = [];

  // inicializar
  for(const d of scenario.devices){
    devState[d.id] = { energized:false, relay:false, powered:false, pwrLed:false };
  }

  let uf, netClass;
  for(let iter=0; iter<8; iter++){
    uf = new UF();
    // 1) conductores
    for(const cable of scenario.cables){
      for(const c of cable.conductors){
        uf.union(termKey(c.a.dev,c.a.term), termKey(c.b.dev,c.b.term));
      }
    }
    // 2) puentes internos (con estados de la iteración anterior)
    for(const d of scenario.devices){
      for(const [t1,t2] of internalBridges(d, devState[d.id], simState[d.id]||{})){
        uf.union(termKey(d.id,t1), termKey(d.id,t2));
      }
    }

    // 3) clasificar redes
    netClass = {};
    const cls = k => netClass[uf.find(k)];
    // fuentes de poder (PSU tradicional, Altronix, inyector PoE, switch PoE)
    for(const d of scenario.devices){
      const def = DEVICES[d.type];
      if(!def) continue;
      const isSrc = def.source || def.behavior === 'source' || d.type.includes('power-supply') || d.type.includes('altronix') || d.type.includes('poe');
      if(!isSrc) continue;

      const on = simState[d.id] ? (simState[d.id].power !== false && simState[d.id].powered !== false) : true;
      if(!on) continue;

      const posList = (def.source && def.source.pos) ? def.source.pos : def.terminals.filter(t => t.role === 'source-pos' || t.role === 'coil-pos' || t.id === 'pos' || t.id === '12v' || t.id === 'dc_pos').map(t => t.id);
      const negList = (def.source && def.source.neg) ? def.source.neg : def.terminals.filter(t => t.role === 'source-neg' || t.role === 'coil-neg' || t.id === 'gnd' || t.id === 'neg' || t.id === 'dc_neg').map(t => t.id);

      for(const pid of posList){
        const net = uf.find(termKey(d.id, pid));
        netClass[net] = (netClass[net] === 'GND') ? 'SHORT' : 'HOT';
      }
      for(const nid of negList){
        const net = uf.find(termKey(d.id, nid));
        netClass[net] = (netClass[net] === 'HOT') ? 'SHORT' : 'GND';
      }
    }

    // 4) recalcular bobinas / dispositivos alimentados
    let changed = false;
    for(const d of scenario.devices){
      const def = DEVICES[d.type];
      if(!def) continue;
      const st = devState[d.id];
      const netOf = t => netClass[uf.find(termKey(d.id,t))] || 'FLOAT';

      const coil = (p,n)=> (netOf(p)==='HOT' && netOf(n)==='GND');
      const rev  = (p,n)=> (netOf(p)==='GND' && netOf(n)==='HOT');

      switch(d.type){
        case 'door-controller': {
          const powered = coil('pwrp','pwrn');
          if(rev('pwrp','pwrn')){
            const msg='Polaridad inversa en Controlador de Puerta.';
            if(!faults.includes(msg)) faults.push(msg);
          }
          // REX activo cuando la entrada REX está a GND
          const rexActive = powered && netOf('rex')==='GND';
          const relay = powered && !rexActive;
          if(powered!==st.powered || relay!==st.relay){ st.powered=powered; st.relay=relay; st.pwrLed=powered; changed=true; }
          st.rexActive = rexActive;
          break;
        }
        case 'maglock': case 'door-strike': case 'crashbar': case 'hes-5000': case 'preset-hes': {
          const tp = def.terminals.find(t => t.role==='coil-pos' || t.role==='source-pos' || t.id==='pos' || t.id==='12v')?.id || 'pos';
          const tn = def.terminals.find(t => t.role==='coil-neg' || t.role==='source-neg' || t.id==='neg' || t.id==='gnd')?.id || 'neg';
          const en = coil(tp, tn);
          if(en!==st.energized){ st.energized=en; changed=true; }
          st.reversed = rev(tp, tn);
          break;
        }
        case 'motion-sensor': {
          const pw = coil('pwrp','pwrn');
          if(pw!==st.powered){ st.powered=pw; changed=true; }
          break;
        }
        case 'prox-reader': case 'rfid-reader-lateral': {
          const pw = coil('pwrp','pwrn');
          if(pw!==st.powered){ st.powered=pw; changed=true; }
          break;
        }
        case 'panel-4door': {
          const powered = coil('pwrp','pwrn');
          if(rev('pwrp','pwrn')){
            const msg='Polaridad inversa en Panel de Control 4 Puertas.';
            if(!faults.includes(msg)) faults.push(msg);
          }
          const relay=[null], rex=[null], rd=[null];
          for(let i=1;i<=4;i++){
            // IN supervisada: activa cuando su + y su − quedan puenteados (contacto externo)
            rex[i] = powered && uf.find(termKey(d.id,'in'+i+'p'))===uf.find(termKey(d.id,'in'+i+'n'));
            // data de lector: puertas 1-2 → Reader 1, puertas 3-4 → Reader 2
            const rport = i<=2 ? 'r1d0' : 'r2d0';
            rd[i]  = powered && netOf(rport)==='GND';
            relay[i] = powered && (rex[i] || rd[i]);   // acceso concedido → liberar puerta
          }
          const sig = JSON.stringify([powered,relay,rex,rd]);
          if(st._sig!==sig){ st._sig=sig; st.powered=powered; st.pwrLed=powered; st.relay=relay; st.rex=rex; st.rd=rd; changed=true; }
          break;
        }
        case 'altronix-acm8': {
          // la fuente misma genera el DC; "powered" = switch principal ON
          const pw = (simState[d.id]||{}).power !== false;
          const allTrg = uf.find(termKey(d.id,'trg_p'))===uf.find(termKey(d.id,'trg_n'));
          const relay=[null], trig=[null];
          for(let i=1;i<=8;i++){
            trig[i] = uf.find(termKey(d.id,'in'+i+'p'))===uf.find(termKey(d.id,'in'+i+'g'));
            relay[i] = pw && (trig[i] || allTrg);
          }
          const sig=JSON.stringify([pw,relay,allTrg]);
          if(st._sig!==sig){ st._sig=sig; st.powered=pw; st.pwrLed=pw; st.relay=relay; st.trig=trig; st.allTrg=allTrg; changed=true; }
          break;
        }
        default: {
          // comportamiento genérico: bobina (cerradura/dispositivo personalizado)
          const isCoilDev = (def.behavior==='coil' || d.type.includes('strike') || d.type.includes('hes') || d.type.includes('maglock') || d.type.includes('crashbar'));
          if(isCoilDev){
            const tp=def.terminals.find(t=>t.role==='coil-pos' || t.role==='source-pos' || t.id==='pos' || t.id==='12v' || t.id==='pwrp' || t.id==='pwr_pos');
            const tn=def.terminals.find(t=>t.role==='coil-neg' || t.role==='source-neg' || t.id==='neg' || t.id==='gnd' || t.id==='pwrn' || t.id==='pwr_neg');
            if(tp&&tn){
              const en=coil(tp.id,tn.id);
              if(en!==st.energized){ st.energized=en; changed=true; }
              st.reversed=rev(tp.id,tn.id);
            }
          }
          break;
        }
        case 'hid-aero-x100': {
          const powered = coil('top_pwr_pos','top_pwr_neg');
          if(rev('top_pwr_pos','top_pwr_neg')){
            const msg='Polaridad inversa en Controladora de Acceso.';
            if(!faults.includes(msg)) faults.push(msg);
          }
          const relay=[null], rex=[null], rd=[null];
          for(let i=1;i<=4;i++){
            // IN supervisada: activa cuando su + y su − quedan puenteados (contacto externo, ej. botón REX)
            rex[i] = powered && uf.find(termKey(d.id,'in'+i+'_pos'))===uf.find(termKey(d.id,'in'+i+'_neg'));
            // data de lector: puertas 1-2 → Reader 1 (D0), puertas 3-4 → Reader 2 (D0)
            const rport = i<=2 ? 'r1_d0' : 'r2_d0';
            rd[i]  = powered && netOf(rport)==='GND';
            relay[i] = powered && (rex[i] || rd[i]);   // acceso concedido → energizar relé (NO)
          }
          const sig = JSON.stringify([powered,relay,rex,rd]);
          if(st._sig!==sig){ st._sig=sig; st.powered=powered; st.pwrLed=powered; st.relay=relay; st.rex=rex; st.rd=rd; changed=true; }
          break;
        }
        case 'camden-relay': {
          const powered = coil('pwr1','pwr2');
          const ss = simState[d.id] || {};
          const relay=[null];
          // Relé 1: dispara con DRY1 (puente externo) o el pulsador de prueba
          relay[1] = powered && (uf.find(termKey(d.id,'dry1_a'))===uf.find(termKey(d.id,'dry1_b')) || !!ss.dry1_trg);
          // Relé 2: dispara con DRY2
          relay[2] = powered && uf.find(termKey(d.id,'dry2_a'))===uf.find(termKey(d.id,'dry2_b'));
          const sig = JSON.stringify([powered,relay]);
          if(st._sig!==sig){ st._sig=sig; st.powered=powered; st.pwrLed=powered; st.relay=relay; changed=true; }
          break;
        }
      }
    }
    if(!changed && iter>0) break;
  }

  // ------- fallas -------
  const netOfKey = k => netClass[uf.find(k)] || 'FLOAT';
  for(const nid in netClass){
    if(netClass[nid]==='SHORT'){
      faults.push('¡CORTOCIRCUITO! Una red conecta +12V directo a GND. Revisa el cableado.');
      break;
    }
  }
  for(const d of scenario.devices){
    const st = devState[d.id];
    const def = DEVICES[d.type];
    if((d.type==='maglock'||d.type==='door-strike'||d.type==='crashbar'||def.behavior==='coil') && st.reversed){
      faults.push(`Polaridad inversa en ${def.name}.`);
    }
  }

  // voltaje del sistema: 24V si un Altronix o Fuente Dual tiene el selector en 24V (y está encendido)
  let voltage = V_SUPPLY;
  for(const d of scenario.devices){
    if(d.type==='altronix-acm8' || d.type==='dual-voltage-psu' || d.type==='altronix-al175'){
      const ss=simState[d.id]||{};
      if(ss.power!==false && ss.v24) voltage = 24.0;
    }
  }

  return {
    uf, netClass, devices: devState, faults, voltage,
    netOf: k => uf.find(k),
    classOf: k => netOfKey(k),
    terminalLit: k => netOfKey(k)==='HOT',
  };
}

/* Lectura del multímetro entre dos terminales */
function multimeterRead(model, keyA, keyB, mode){
  if(!keyA || !keyB) return {text:'----', sub: mode==='dcv'?'V DC':'OHM'};
  if(mode==='cont'){
    if(model.uf.find(keyA)===model.uf.find(keyB)) return {text:'0.0', sub:'Ω · BEEP', beep:true};
    return {text:'OL', sub:'ABIERTO'};
  }
  const ca = model.classOf(keyA), cb = model.classOf(keyB);
  const VS = model.voltage || V_SUPPLY;
  const v = c => c==='HOT'?VS : c==='GND'?0 : null;
  const va=v(ca), vb=v(cb);
  if(va===null || vb===null){
    if(ca==='SHORT'||cb==='SHORT') return {text:'ERR', sub:'CORTO'};
    return {text:'0.00', sub:'V DC · flotante'};
  }
  const diff = va-vb;
  return {text: (diff>0?' ':'') + diff.toFixed(2), sub:'V DC'};
}
