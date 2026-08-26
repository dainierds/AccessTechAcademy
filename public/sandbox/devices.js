/* ============================================================
   devices.js — Biblioteca de dispositivos y tipos de cable
   Representación vectorial educativa-realista.
   ============================================================ */

const CONDUCTOR_COLORS = {
  red:    { name:'Rojo',     hex:'#d33a2c' },
  black:  { name:'Negro',    hex:'#20242a' },
  white:  { name:'Blanco',   hex:'#e8e6df' },
  green:  { name:'Verde',    hex:'#2e9e4f' },
  blue:   { name:'Azul',     hex:'#2f6fd0' },
  yellow: { name:'Amarillo', hex:'#e8c832' },
  orange: { name:'Naranja',  hex:'#e07b28' },
  brown:  { name:'Marrón',   hex:'#7a4a28' },
  /* pares UTP con franja (TIA-568) */
  'w-orange': { name:'Blanco/Naranja', hex:'#e07b28', stripe:'#f2f0ea' },
  'w-green':  { name:'Blanco/Verde',   hex:'#2e9e4f', stripe:'#f2f0ea' },
  'w-blue':   { name:'Blanco/Azul',    hex:'#2f6fd0', stripe:'#f2f0ea' },
  'w-brown':  { name:'Blanco/Marrón',  hex:'#7a4a28', stripe:'#f2f0ea' },
};

const CABLE_TYPES = {
  '18/2': {
    name:'Cable 18/2', gauge:18, jacket:'#d8d5cd',
    desc:'2 conductores 18 AWG — alimentación de cerraduras',
    conductors:['red','black'],
    jacketR:7,
  },
  '18/4': {
    name:'Cable 18/4', gauge:18, jacket:'#d8d5cd',
    desc:'4 conductores 18 AWG — cerradura + contacto de puerta',
    conductors:['red','black','white','green'],
    jacketR:8,
  },
  '22/6': {
    name:'Cable 22/6', gauge:22, jacket:'#c9cdd6',
    desc:'6 conductores 22 AWG — señales, REX, contactos',
    conductors:['red','black','white','green','blue','yellow'],
    jacketR:7,
  },
  'composite': {
    name:'Cable Compuesto', gauge:0, jacket:'#3f4653',
    desc:'Compuesto: 18/2 (potencia) + 22/6 (señales) bajo una chaqueta',
    conductors:['red','black','white','green','blue','yellow','orange','brown'],
    jacketR:10,
  },
  'cat6': {
    name:'Cable Ethernet Cat6 UTP', gauge:23, jacket:'#2f6fd0',
    desc:'4 pares trenzados TIA-568 — red y PoE para lectores, controladores y switches',
    conductors:['w-orange','orange','w-green','green','w-blue','blue','w-brown','brown'],
    jacketR:8,
  },
};

const DEVICES = {

  /* ---------------- DIGITAL MULTIMETER DMM-9000 PRO (EXACT SVG HD RENDER) ---------------- */
  'digital-multimeter': {
    name:'Multímetro Digital DMM-9000 PRO',
    tag:'Instrumentación · True RMS',
    desc:'Multímetro digital profesional ultrarealista ACCESSTECH® DMM-9000 PRO. Pantalla LCD FSTN retroiluminada de alto contraste, bargraph analógico superior, selector rotativo de 3 posiciones (V= DC, V~ AC, •))) Continuidad) y jacks receptáculos circulares de alta precisión COM (-) y VΩ (+).',
    tips:'Conecta la sonda negra en el jack COM (-) y la sonda roja en VΩ (+). Permite medir tensiones DC en fuentes (12V/24V), voltajes de controladoras y verificar la continuidad en lazos de cerraduras y botones REX.',
    w:380, h:690,
    terminals:[
      {id:'com',    label:'COM (−)', x:130, y:585, role:'source-neg'},
      {id:'vomega', label:'VΩ (+)',  x:250, y:585, role:'source-pos'},
    ],
    action:{label:'Selector Rotativo Modo (DC/AC/Ω)', kind:'toggle', stateKey:'mode_rot', def:true},
    draw(ctx,d,st){
      const isDc = st.mode_rot !== false;
      
      // Cache de imagen SVG para renderizado instantáneo a 60 FPS
      if(!window._dmmSvgImg_dc || !window._dmmSvgImg_ac){
        const svgContent = (dc) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 690" width="380" height="690">
  <defs>
    <linearGradient id="dmm-orange-boot" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c" />
      <stop offset="25%" stop-color="#f97316" />
      <stop offset="70%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>
    <linearGradient id="dmm-body-charcoal" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="30%" stop-color="#1e293b" />
      <stop offset="80%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#090e17" />
    </linearGradient>
    <linearGradient id="dmm-lcd-glass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f2b26" />
      <stop offset="30%" stop-color="#134e4a" />
      <stop offset="70%" stop-color="#0f3b37" />
      <stop offset="100%" stop-color="#042f2e" />
    </linearGradient>
    <linearGradient id="dmm-lcd-recess" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#021f1d" />
      <stop offset="50%" stop-color="#042f2e" />
      <stop offset="100%" stop-color="#115e59" />
    </linearGradient>
    <linearGradient id="dmm-knob-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="40%" stop-color="#1e293b" />
      <stop offset="80%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="dmm-knob-ridge" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#64748b" />
      <stop offset="50%" stop-color="#334155" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="dmm-metal-screw" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>
  </defs>

  <g id="dmm-unit">
    <path d="M 60 0 L 320 0 C 355 0, 380 25, 380 60 L 380 180 C 370 200, 370 240, 380 260 L 380 620 C 380 660, 350 690, 310 690 L 70 690 C 30 690, 0 660, 0 620 L 0 260 C 10 240, 10 200, 0 180 L 0 60 C 0 25, 25 0, 60 0 Z" fill="url(#dmm-orange-boot)" stroke="#9a3412" stroke-width="3" />
    <rect x="155" y="-14" width="70" height="16" rx="6" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />
    <circle cx="190" cy="-6" r="4" fill="#ea580c" />
    
    <g fill="#9a3412" opacity="0.7">
      <rect x="4" y="290" width="8" height="18" rx="4" />
      <rect x="4" y="320" width="8" height="18" rx="4" />
      <rect x="4" y="350" width="8" height="18" rx="4" />
      <rect x="4" y="380" width="8" height="18" rx="4" />
      <rect x="368" y="290" width="8" height="18" rx="4" />
      <rect x="368" y="320" width="8" height="18" rx="4" />
      <rect x="368" y="350" width="8" height="18" rx="4" />
      <rect x="368" y="380" width="8" height="18" rx="4" />
    </g>

    <rect x="22" y="22" width="336" height="646" rx="26" fill="url(#dmm-body-charcoal)" stroke="#0f172a" stroke-width="2" />

    <g transform="translate(190, 52)">
      <text x="0" y="0" font-family="'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#f97316" text-anchor="middle" letter-spacing="2">ACCESSTECH®</text>
      <text x="0" y="16" font-family="'Segoe UI', Roboto, monospace" font-size="9" font-weight="800" fill="#94a3b8" text-anchor="middle" letter-spacing="1">DMM-9000 PRO • TRUE RMS</text>
    </g>

    <g transform="translate(42, 80)">
      <rect x="0" y="0" width="296" height="175" rx="14" fill="url(#dmm-lcd-recess)" stroke="#090e17" stroke-width="2.5" />
      <rect x="6" y="6" width="284" height="163" rx="10" fill="url(#dmm-lcd-glass)" stroke="#042f2e" stroke-width="1.5" />

      <path d="M 24 35 A 190 70 0 0 1 260 35" fill="none" stroke="#2dd4bf" stroke-width="2.5" stroke-dasharray="2 4" opacity="0.8" />
      <circle cx="28" cy="36" r="3" fill="#2dd4bf" />
      <text x="24" y="24" font-family="monospace" font-size="8" font-weight="800" fill="#5eead4">0</text>
      <text x="142" y="18" font-family="monospace" font-size="8" font-weight="800" fill="#5eead4">30</text>
      <text x="256" y="24" font-family="monospace" font-size="8" font-weight="800" fill="#5eead4">60</text>

      <text x="24" y="60" font-family="monospace" font-size="14" font-weight="900" fill="#5eead4">${dc ? 'DC' : 'AC'}</text>
      <text x="24" y="76" font-family="monospace" font-size="9" font-weight="800" fill="#2dd4bf">AUTO</text>
      <text x="24" y="92" font-family="monospace" font-size="10" font-weight="900" fill="#2dd4bf">${dc ? '⎓' : '∿'}</text>

      <text x="210" y="125" font-family="monospace" font-size="64" font-weight="900" fill="#5eead4" text-anchor="end">${dc ? '12.42' : '118.5'}</text>
      <text x="258" y="122" font-family="monospace" font-size="24" font-weight="900" fill="#5eead4" text-anchor="end">V</text>

      <text x="24" y="152" font-family="monospace" font-size="9" font-weight="700" fill="#2dd4bf">HOLD: OFF  |  MAX/MIN: NORM  |  600V CAT III</text>
    </g>

    <g transform="translate(50, 272)" font-family="monospace" font-size="9" font-weight="800" fill="#f8fafc">
      <g transform="translate(0, 0)"><rect x="0" y="0" width="60" height="26" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.2" /><text x="30" y="17" text-anchor="middle">SELECT</text></g>
      <g transform="translate(74, 0)"><rect x="0" y="0" width="60" height="26" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.2" /><text x="30" y="17" text-anchor="middle" fill="#fbbf24">HOLD</text></g>
      <g transform="translate(148, 0)"><rect x="0" y="0" width="60" height="26" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.2" /><text x="30" y="17" text-anchor="middle">MAX/MIN</text></g>
      <g transform="translate(222, 0)"><rect x="0" y="0" width="60" height="26" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.2" /><text x="30" y="17" text-anchor="middle">Hz / %</text></g>
    </g>

    <g transform="translate(190, 420)">
      <circle cx="0" cy="0" r="105" fill="#090e17" stroke="#1e293b" stroke-width="2.5" />
      <circle cx="0" cy="0" r="95" fill="none" stroke="#f97316" stroke-width="2" opacity="0.6" />

      <g transform="translate(-56, -46)">
        <circle cx="0" cy="0" r="22" fill="#0f172a" stroke="#f97316" stroke-width="1.5" />
        <text x="0" y="2" font-family="monospace" font-size="16" font-weight="900" fill="#f8fafc" text-anchor="middle">V=</text>
        <text x="0" y="15" font-family="monospace" font-size="8" font-weight="800" fill="#fb923c" text-anchor="middle">DC</text>
      </g>

      <g transform="translate(0, -72)">
        <circle cx="0" cy="0" r="22" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
        <text x="0" y="2" font-family="monospace" font-size="16" font-weight="900" fill="#f8fafc" text-anchor="middle">V~</text>
        <text x="0" y="15" font-family="monospace" font-size="8" font-weight="800" fill="#38bdf8" text-anchor="middle">AC</text>
      </g>

      <g transform="translate(56, -46)">
        <circle cx="0" cy="0" r="22" fill="#0f172a" stroke="#22c55e" stroke-width="1.5" />
        <text x="0" y="3" font-family="monospace" font-size="15" font-weight="900" fill="#22c55e" text-anchor="middle">•)))</text>
        <text x="0" y="15" font-family="monospace" font-size="8" font-weight="800" fill="#86efac" text-anchor="middle">Ω</text>
      </g>

      <g transform="rotate(${dc ? '-45' : '0'})">
        <circle cx="0" cy="0" r="56" fill="url(#dmm-knob-grad)" stroke="#090e17" stroke-width="3" />
        <circle cx="0" cy="0" r="48" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <rect x="-14" y="-48" width="28" height="96" rx="8" fill="url(#dmm-knob-ridge)" stroke="#090e17" stroke-width="1.5" />
        <polygon points="0,-46 -8,-24 8,-24" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
        <circle cx="0" cy="0" r="6" fill="#090e17" />
      </g>
      
      <rect x="-65" y="66" width="130" height="24" rx="6" fill="#0f172a" stroke="#1e293b" stroke-width="1.2" />
      <text x="0" y="82" font-family="monospace" font-size="11" font-weight="900" fill="#f97316" text-anchor="middle">MODO: ${dc ? 'V DC (⎓)' : 'V AC (∿)'}</text>
    </g>

    <g transform="translate(100, 585)">
      <g transform="translate(30, 0)">
        <circle cx="0" cy="0" r="28" fill="#090e17" stroke="#1e293b" stroke-width="2" />
        <circle cx="0" cy="0" r="20" fill="#1e293b" stroke="#475569" stroke-width="2" />
        <circle cx="0" cy="0" r="11" fill="#000000" />
        <circle cx="0" cy="0" r="16" fill="#f8fafc" stroke="#0b1329" stroke-width="2.5" />
        <circle cx="0" cy="0" r="11" fill="url(#dmm-metal-screw)" stroke="#334155" stroke-width="1" />
        <circle cx="0" cy="0" r="6" fill="#0b1329" />
        <circle cx="0" cy="0" r="3" fill="#38bdf8" />
        <text x="0" y="44" font-family="monospace" font-size="13" font-weight="900" fill="#cbd5e1" text-anchor="middle">COM</text>
        <text x="0" y="58" font-family="monospace" font-size="8.5" font-weight="700" fill="#64748b" text-anchor="middle">MAX 600V</text>
      </g>

      <g transform="translate(150, 0)">
        <circle cx="0" cy="0" r="28" fill="#090e17" stroke="#1e293b" stroke-width="2" />
        <circle cx="0" cy="0" r="20" fill="#7f1d1d" stroke="#ef4444" stroke-width="2" />
        <circle cx="0" cy="0" r="11" fill="#000000" />
        <circle cx="0" cy="0" r="16" fill="#f8fafc" stroke="#0b1329" stroke-width="2.5" />
        <circle cx="0" cy="0" r="11" fill="url(#dmm-metal-screw)" stroke="#334155" stroke-width="1" />
        <circle cx="0" cy="0" r="6" fill="#0b1329" />
        <circle cx="0" cy="0" r="3" fill="#ef4444" />
        <text x="0" y="44" font-family="monospace" font-size="13" font-weight="900" fill="#ef4444" text-anchor="middle">V Ω •)))</text>
        <text x="0" y="58" font-family="monospace" font-size="8.5" font-weight="700" fill="#fca5a5" text-anchor="middle">600V CAT III</text>
      </g>
    </g>
  </g>
</svg>`;
        
        const blobDc = new Blob([svgContent(true)], {type: 'image/svg+xml'});
        const blobAc = new Blob([svgContent(false)], {type: 'image/svg+xml'});
        window._dmmSvgImg_dc = new Image();
        window._dmmSvgImg_dc.src = URL.createObjectURL(blobDc);
        window._dmmSvgImg_ac = new Image();
        window._dmmSvgImg_ac.src = URL.createObjectURL(blobAc);
      }

      const activeImg = isDc ? window._dmmSvgImg_dc : window._dmmSvgImg_ac;
      if(activeImg && activeImg.complete && activeImg.naturalWidth > 0){
        ctx.drawImage(activeImg, 0, 0, 380, 690);
      } else {
        rrect(ctx, 0, 0, 380, 690, 20);
        ctx.fill();
      }
    }
  },

  /* ---------------- INDUSTRIAL POE SWITCH (EXACT SVG HD) ---------------- */
  'poe-switch': {
    name:'Switch PoE Gigabit Industrial',
    tag:'Red · Infraestructura PoE',
    desc:'Conmutador de red PoE industrial de 6 puertos (4 PoE+ 802.3at/af hasta 30W por puerto + 1 Uplink Gigabit + 1 Slot SFP Fibra). Diseñado para alimentar lectoras IP, cámaras, teclados y controladoras PACS a través de cable Cat6.',
    tips:'Los puertos 1 a 4 entregan datos y energía 48VDC (PoE+) simultáneamente por los pares del cable Ethernet Cat6. El puerto 5 (Uplink) conecta al switch central del edificio o router principal.',
    w:525, h:280,
    terminals:[
      {id:'pwr_in_pos', label:'48V +',  x:45,  y:68,  role:'source-pos'},
      {id:'pwr_in_neg', label:'GND',   x:45,  y:135, role:'source-neg'},
      {id:'port1',      label:'P1 PoE', x:120, y:190, role:'source-pos'},
      {id:'port2',      label:'P2 PoE', x:195, y:190, role:'source-pos'},
      {id:'port3',      label:'P3 PoE', x:270, y:190, role:'source-pos'},
      {id:'port4',      label:'P4 PoE', x:345, y:190, role:'source-pos'},
      {id:'uplink',     label:'UP-LINK',x:420, y:190, role:'contact'},
      {id:'sfp',        label:'SFP OPT',x:480, y:190, role:'contact'},
    ],
    action:{label:'Alimentación Switch PoE', kind:'toggle', stateKey:'powered', def:true},
    source:{pos:['pwr_in_pos','port1','port2','port3','port4'], neg:['pwr_in_neg']},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'poe-switch', 525, 280, st);
    }
  },

  /* ---------------- HID AERO X100 DUAL READER CONTROLLER (EXACT SVG HD) ---------------- */
  'hid-aero-x100': {
    name:'Controladora de Acceso (2 Lectores)',
    tag:'Control · Multi-puerta OSDP/Wiegand',
    desc:'Controladora de acceso profesional de 2 lectores (OSDP/Wiegand), 4 relés de salida para cerraduras, 4 entradas supervisadas, tamper, alarma de fuego e indicadores LED de diagnóstico on-board.',
    tips:'Conecta alimentación 12-24VDC en la parte superior. Alimenta Reader 1/2 con GND/PWR/D0/D1/LED. Cablea las cerraduras a los relés K1..K4 (C/NO/NC).',
    w:550, h:475,
    terminals:[
      // Bornera Superior (Tamper, Fallas de Energía, Alimentación VIN 12-24V) - y=31
      {id:'top_tamper_pos', label:'TAMPER (+)',   x:227, y:31,  role:'input'},
      {id:'top_tamper_neg', label:'TAMPER (-)',   x:240, y:31,  role:'source-neg'},
      {id:'top_ac_pos',     label:'AC FAIL (+)',  x:254, y:31,  role:'input'},
      {id:'top_ac_neg',     label:'AC FAIL (-)',  x:268, y:31,  role:'source-neg'},
      {id:'top_bat_pos',    label:'BATT FAIL (+)',x:282, y:31,  role:'input'},
      {id:'top_bat_neg',    label:'BATT FAIL (-)',x:295, y:31,  role:'source-neg'},
      {id:'top_pwr_neg',    label:'VIN (-)',      x:309, y:31,  role:'coil-neg'},
      {id:'top_pwr_pos',    label:'VIN (+)',      x:323, y:31,  role:'coil-pos'},

      // Bornera Izquierda — Lector 1 (Reader 1 - 10 Bornes) - x=39
      {id:'r1_pwr',    label:'R1 PWR (+)',     x:39,  y:71,  role:'source-pos'},
      {id:'r1_gnd1',   label:'R1 GND',         x:39,  y:88,  role:'source-neg'},
      {id:'r1_d0',     label:'R1 D0 / DAT / B',x:39,  y:105, role:'input'},
      {id:'r1_d1',     label:'R1 D1 / CLK / A',x:39,  y:123, role:'input'},
      {id:'r1_gnd2',   label:'R1 GND',         x:39,  y:140, role:'source-neg'},
      {id:'r1_grnled', label:'R1 GREEN LED',   x:39,  y:157, role:'input'},
      {id:'r1_redled', label:'R1 RED LED',     x:39,  y:174, role:'input'},
      {id:'r1_beep',   label:'R1 BEEPER',      x:39,  y:191, role:'input'},
      {id:'r1_nc',     label:'R1 NC',          x:39,  y:209, role:'input'},
      {id:'r1_gnd3',   label:'R1 GND',         x:39,  y:226, role:'source-neg'},

      // Bornera Izquierda — Entradas Supervisadas 1 y 2 (Inputs IN 1 & IN 2) - x=39
      {id:'in1_pos', label:'IN 1 (+)', x:39, y:254, role:'input'},
      {id:'in1_neg', label:'IN 1 (-)', x:39, y:272, role:'source-neg'},
      {id:'in2_pos', label:'IN 2 (+)', x:39, y:289, role:'input'},
      {id:'in2_neg', label:'IN 2 (-)', x:39, y:307, role:'source-neg'},

      // Bornera Izquierda — Relés 1 y 2 (Relays K1 & K2) - x=39
      {id:'rly1_no', label:'K1 NO',      x:39, y:333, role:'contact'},
      {id:'rly1_c',  label:'K1 COM (C)', x:39, y:351, role:'contact'},
      {id:'rly1_nc', label:'K1 NC',      x:39, y:369, role:'contact'},
      {id:'rly2_no', label:'K2 NO',      x:39, y:387, role:'contact'},
      {id:'rly2_c',  label:'K2 COM (C)', x:39, y:404, role:'contact'},
      {id:'rly2_nc', label:'K2 NC',      x:39, y:422, role:'contact'},

      // Bornera Derecha — Lector 2 (Reader 2 - 10 Bornes) - x=511
      {id:'r2_pwr',    label:'R2 PWR (+)',     x:511, y:71,  role:'source-pos'},
      {id:'r2_gnd1',   label:'R2 GND',         x:511, y:88,  role:'source-neg'},
      {id:'r2_d0',     label:'R2 D0 / DAT / B',x:511, y:105, role:'input'},
      {id:'r2_d1',     label:'R2 D1 / CLK / A',x:511, y:123, role:'input'},
      {id:'r2_gnd2',   label:'R2 GND',         x:511, y:140, role:'source-neg'},
      {id:'r2_grnled', label:'R2 GREEN LED',   x:511, y:157, role:'input'},
      {id:'r2_redled', label:'R2 RED LED',     x:511, y:174, role:'input'},
      {id:'r2_beep',   label:'R2 BEEPER',      x:511, y:191, role:'input'},
      {id:'r2_nc',     label:'R2 NC',          x:511, y:209, role:'input'},
      {id:'r2_gnd3',   label:'R2 GND',         x:511, y:226, role:'source-neg'},

      // Bornera Derecha — Entradas Supervisadas 3 y 4 (Inputs IN 3 & IN 4) - x=511
      {id:'in3_pos', label:'IN 3 (+)', x:511, y:254, role:'input'},
      {id:'in3_neg', label:'IN 3 (-)', x:511, y:272, role:'source-neg'},
      {id:'in4_pos', label:'IN 4 (+)', x:511, y:289, role:'input'},
      {id:'in4_neg', label:'IN 4 (-)', x:511, y:307, role:'source-neg'},

      // Bornera Derecha — Relés 3 y 4 (Relays K3 & K4) - x=511
      {id:'rly3_no', label:'K3 NO',      x:511, y:333, role:'contact'},
      {id:'rly3_c',  label:'K3 COM (C)', x:511, y:351, role:'contact'},
      {id:'rly3_nc', label:'K3 NC',      x:511, y:369, role:'contact'},
      {id:'rly4_no', label:'K4 NO',      x:511, y:387, role:'contact'},
      {id:'rly4_c',  label:'K4 COM (C)', x:511, y:404, role:'contact'},
      {id:'rly4_nc', label:'K4 NC',      x:511, y:422, role:'contact'},

      // Bornera Inferior (IO Module + Alimentacion) - y=451
      {id:'btm_in_a',     label:'IO IN: A',     x:222, y:451, role:'input'},
      {id:'btm_in_b',     label:'IO IN: B',     x:237, y:451, role:'input'},
      {id:'btm_in_gnd',   label:'IO IN: GND',   x:252, y:451, role:'source-neg'},
      {id:'btm_out_a',    label:'IO OUT: A',    x:267, y:451, role:'input'},
      {id:'btm_out_b',    label:'IO OUT: B',    x:282, y:451, role:'input'},
      {id:'btm_out_gnd',  label:'IO OUT: GND',  x:297, y:451, role:'source-neg'},
      {id:'btm_pwr_neg',  label:'12-24VDC (-)', x:312, y:451, role:'coil-neg'},
      {id:'btm_pwr_pos',  label:'12-24VDC (+)', x:327, y:451, role:'coil-pos'},
    ],
    action:{label:'Alimentación Controlador', kind:'toggle', stateKey:'powered', def:true},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'hid-aero-x100', 550, 475, st);

      // LED de alimentación (verde = energizada)
      led(ctx, 275, 16, '#39d98a', !!st.pwrLed);

      // LEDs de estado de relés K1..K4 (ámbar = relé activo / acceso concedido)
      const relays = st.relay || [];
      led(ctx, 23, 351, '#ffb020', !!relays[1]);
      led(ctx, 23, 404, '#ffb020', !!relays[2]);
      led(ctx, 527, 351, '#ffb020', !!relays[3]);
      led(ctx, 527, 404, '#ffb020', !!relays[4]);
    }
  },

  /* ---------------- CAMDEN CX-12 PLUS LOGIC RELAY (EXACT SVG HD EMBEDDED) ---------------- */
  'camden-relay': {
    name:'Módulo de Relé Lógico',
    tag:'Lógica de Control · Relé',
    desc:'Módulo de control de puertas y lógica de esclusa (interlock/mantrap). Posee 2 relés Form-C independientes, entradas DRY 1 / DRY 2 y WET 1 / WET 2, potenciómetros de temporización, switch DIP y LEDs de estado.',
    tips:'Alimenta 12–24V en POWER (Pins 1-2). Dispara la secuencia mediante DRY 1 (11-12) o DRY 2 (15-16). Controla cerraduras o automatismos con Relay 1 (3-5) y Relay 2 (6-8).',
    w:550, h:374,
    terminals:[
      {id:'pwr1',   label:'1 (PWR)',   x:75,  y:282, role:'coil-pos'},
      {id:'pwr2',   label:'2 (PWR)',   x:104, y:282, role:'coil-neg'},
      {id:'r1_no',  label:'3 (R1 NO)', x:133, y:282, role:'contact'},
      {id:'r1_c',   label:'4 (R1 C)',  x:161, y:282, role:'contact'},
      {id:'r1_nc',  label:'5 (R1 NC)', x:190, y:282, role:'contact'},
      {id:'r2_no',  label:'6 (R2 NO)', x:218, y:282, role:'contact'},
      {id:'r2_c',   label:'7 (R2 C)',  x:247, y:282, role:'contact'},
      {id:'r2_nc',  label:'8 (R2 NC)', x:276, y:282, role:'contact'},
      {id:'wet1_p', label:'9 (WET1+)', x:304, y:282, role:'input'},
      {id:'wet1_n', label:'10 (WET1−)',x:333, y:282, role:'input'},
      {id:'dry1_a', label:'11 (DRY1)', x:362, y:282, role:'input'},
      {id:'dry1_b', label:'12 (DRY1)', x:390, y:282, role:'input'},
      {id:'wet2_p', label:'13 (WET2+)',x:419, y:282, role:'input'},
      {id:'wet2_n', label:'14 (WET2−)',x:448, y:282, role:'input'},
      {id:'dry2_a', label:'15 (DRY2)', x:476, y:282, role:'input'},
      {id:'dry2_b', label:'16 (DRY2)', x:505, y:282, role:'input'},
    ],
    action:{label:'Disparo Entrada DRY 1', kind:'momentary', stateKey:'dry1_trg'},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'camden-relay', 550, 374, st);

      // LED de alimentación (verde = energizado)
      led(ctx, 75, 260, '#39d98a', !!st.pwrLed);

      // LEDs de estado de relés R1 y R2 (ámbar = relé activo)
      const relays = st.relay || [];
      led(ctx, 161, 260, '#ffb020', !!relays[1]);
      led(ctx, 247, 260, '#ffb020', !!relays[2]);
    }
  },

  /* ---------------- ALTRONIX POWER SUPPLY (EXACT SVG HD) ---------------- */
  'altronix-power-supply': {
    name:'Fuente de Poder (12V/24V)',
    tag:'Fuentes de poder · Supervisada',
    desc:'Fuente de poder y cargador supervisado profesional de 12V/24V @ 6A. Gabinete metálico con cerradura, transformador toroidal, supervisión de pérdida de CA y batería baja.',
    tips:'Alimenta controladoras y cerraduras magnéticas de alta potencia. Conecta salida DC (+) y (-) a las barras de distribución.',
    w:440, h:552,
    terminals:[
      {id:'ac1',     label:'AC L',   x:40,  y:120, role:'coil-pos'},
      {id:'ac2',     label:'AC N',   x:70,  y:120, role:'coil-neg'},
      {id:'bat_pos', label:'BAT +',  x:120, y:490, role:'source-pos'},
      {id:'bat_neg', label:'BAT -',  x:155, y:490, role:'source-neg'},
      {id:'dc_pos',  label:'+12VDC', x:380, y:240, role:'source-pos'},
      {id:'dc_neg',  label:'GND',    x:380, y:275, role:'source-neg'},
    ],
    action:{label:'Interruptor Alimentación CA', kind:'toggle', stateKey:'power', def:true},
    source:{pos:['dc_pos','bat_pos'], neg:['dc_neg','bat_neg']},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'altronix-power-supply', 440, 552, st);
    }
  },

  /* ---------------- ELECTRIFIED CRASH BAR (EXACT SVG HD) ---------------- */
  'crashbar': {
    name:'Crash Bar Electrificado (ELR/QEL)',
    tag:'Cerraduras · Egress',
    desc:'Barra antipánico electrificada (Motorized Latch Retraction) con riel de acero inoxidable, pushpad ergonómico y pestillo retráctil con LED indicador de bloqueo.',
    tips:'Conecta + al contacto NO del relé del controlador y - al GND común. Al activarse el pulso de 12/24V, retrae el pestillo permitiendo el paso.',
    w:550, h:176,
    terminals:[
      {id:'pos', label:'+ (Rojo)',  x:65, y:65,  role:'coil-pos'},
      {id:'neg', label:'− (Negro)', x:65, y:120, role:'coil-neg'},
    ],
    action:{label:'Pulso Retracción / Empuje', kind:'momentary', stateKey:'energized'},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'crashbar', 550, 176, st);
      // LED de estado: verde = energizado (pestillo retraído)
      led(ctx, 41, 68, st.energized ? '#39d98a' : '#262c33', !!st.energized);
    }
  },

  /* ---------------- MAGNETIC DOOR SENSOR DPS (EXACT SVG HD) ---------------- */
  'door-position': {
    name:'Sensor de Contacto Magnético (DPS)',
    tag:'Contactos · Monitoreo',
    desc:'Sensor de contacto magnético de puerta de alta calidad. Cuerpo con interruptor reed switch encapsulado e imán de neodimio que cierra el lazo cuando la puerta está alineada.',
    tips:'Contacto seco normalmente cerrado (NC con imán presente). Al abrir la puerta, el lazo se abre disparando la alarma.',
    w:480, h:190,
    terminals:[
      {id:'c',  label:'COM', x:460, y:75,  role:'contact'},
      {id:'no', label:'NO',  x:460, y:125, role:'contact'},
    ],
    action:{label:'Abrir/Cerrar Puerta', kind:'toggle', stateKey:'doorClosed', def:true},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'door-position', 480, 190, st);
      // Indicador de estado: verde = puerta cerrada, rojo = puerta abierta (alarma)
      const closed = st.doorClosed !== false;
      led(ctx, 20, 20, closed ? '#39d98a' : '#ef4444', true);
    }
  },

  /* ---------------- MAGLOCK CON BORNERA LATERAL ---------------- */
  'maglock-lateral': {
    name:'Maglock 600 lbs con Bornera Lateral',
    tag:'Cerraduras · Fail-Safe',
    desc:'Cerradura electromagnética de 600 lbs con regleta de terminales lateral reforzada para conexionado rápido (+ y -).',
    tips:'Alimentación 12VDC en + y -. Al cortar energía se desimanta liberando el acceso.',
    w:540, h:120,
    terminals:[
      {id:'pos', label:'+ (Positivo 12/24V)', x:510, y:42, role:'coil-pos'},
      {id:'neg', label:'- (Negativo GND)',    x:510, y:84, role:'coil-neg'},
    ],
    action:{label:'Alimentación Maglock', kind:'toggle', stateKey:'energized', def:true},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'maglock-lateral', 540, 120, st);
      // LED de estado (fail-safe): verde = energizado (bloqueado), apagado = libre
      if (st.energized) {
        led(ctx, 418, 47, '#22c55e', true);
      } else {
        // Desmagnetizado: apagar el LED del SVG
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(418, 47, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }
  },

  /* ---------------- PUSH TO EXIT CON BORNERA LATERAL ---------------- */
  'push-to-exit-lateral': {
    name:'Botón Push-to-Exit con Bornera Lateral',
    tag:'Contactos · REX',
    desc:'Pulsador de salida de acero inoxidable con regleta lateral de 5 terminales (COM, NO, NC, LED+, LED-).',
    tips:'Conecta alimentación LED y contactos COM/NO a la entrada REX del controlador.',
    w:230, h:280,
    terminals:[
      {id:'c',    label:'COM',          x:200, y:60,  role:'contact'},
      {id:'no',   label:'NO',           x:200, y:92,  role:'contact'},
      {id:'nc',   label:'NC',           x:200, y:125, role:'contact'},
      {id:'ledp', label:'LED + (+12V)', x:200, y:158, role:'coil-pos'},
      {id:'ledn', label:'LED - (GND)',  x:200, y:191, role:'coil-neg'},
    ],
    action:{label:'Presionar Botón EXIT', kind:'momentary', stateKey:'pressed'},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'push-to-exit-lateral', 230, 280, st);

      // Animación de hundimiento físico del botón al presionarlo
      if (st.pressed) {
        ctx.save();
        // 1. Sombra suave del bisel sobre la parte superior del botón hundido (gradiente, no caja)
        const g = ctx.createLinearGradient(39, 99, 39, 99 + 26);
        g.addColorStop(0, 'rgba(0,0,0,0.6)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        rrect(ctx, 39, 99, 77, 26, 8);
        ctx.fill();

        // 2. Receso/gap del botón al retraerse: borde interior oscuro sutil
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        rrect(ctx, 39, 99, 77, 77, 8);
        ctx.stroke();

        // 3. Ligero oscurecimiento global (muy sutil) para dar sensación de presión
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        rrect(ctx, 39, 99, 77, 77, 8);
        ctx.fill();

        ctx.restore();
      }
    }
  },

  /* ---------------- LECTOR RFID CON BORNERA LATERAL ---------------- */
  'rfid-reader-lateral': {
    name:'Lector RFID / Teclado con Bornera Lateral',
    tag:'Lectores · Credenciales',
    desc:'Lector de proximidad y teclado con regleta lateral de 6 bornes de conexionado directo (PWR, GND, D0, D1, BEEP, LED).',
    tips:'Alimentación +12V y GND. Líneas Wiegand Data 0 y Data 1.',
    w:250, h:290,
    terminals:[
      {id:'pwrp', label:'+12V (VIN)',    x:220, y:51,  role:'coil-pos'},
      {id:'pwrn', label:'GND (0V)',      x:220, y:86,  role:'coil-neg'},
      {id:'d0',   label:'D0 (Data 0)',   x:220, y:121, role:'contact'},
      {id:'d1',   label:'D1 (Data 1)',   x:220, y:156, role:'contact'},
      {id:'beep', label:'BEEP (Buzzer)', x:220, y:191, role:'input'},
      {id:'ledc', label:'LED (Control)', x:220, y:226, role:'input'},
    ],
    action:{label:'Presentar Tarjeta RFID', kind:'momentary', stateKey:'card'},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'rfid-reader-lateral', 250, 290, st);
      // LED verde cuando se presenta una tarjeta válida (acceso concedido)
      if (st.card) {
        led(ctx, 125, 20, '#39d98a', true);
      }
    }
  },


  /* ---------------- FUENTE ALTRONIX AL175 (12V / 24V DUAL) ---------------- */
  'altronix-al175': {
    name:'Fuente de Poder 12V/24V',
    tag:'Fuentes de poder · Supervisada',
    desc:'Fuente de poder supervisada lineal de 12VDC/24VDC seleccionable con switch conmutable y salida directa de 2 bornes: Rojo (+VDC) y Negro (GND).',
    tips:'Haz clic en el switch para alternar entre 12V y 24V. Conecta el cable Rojo a +VDC y el cable Negro a GND.',
    w:320, h:360,
    terminals:[
      {id:'pos', label:'+VDC (Rojo)', x:263, y:152, role:'source-pos'},
      {id:'gnd', label:'GND (Negro)', x:263, y:196, role:'source-neg'},
    ],
    behavior:'source',
    action:{label:'Conmutar Selector (12V / 24V)', kind:'toggle', stateKey:'v24', def:false},
    source:{pos:['pos','12v'], neg:['gnd']},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'altronix-al175', 320, 360, st);
      
      const is24V = !!st.v24;
      const isPowered = (st.powered !== false && st.power !== false);

      ctx.save();
      // 1. Selector Switch Slider interactivo (x: 35, y: 195, w: 120, h: 42)
      ctx.translate(35, 195);
      
      // Fondo del switch
      ctx.fillStyle = '#090e17';
      ctx.strokeStyle = is24V ? '#38bdf8' : '#f59e0b';
      ctx.lineWidth = 1.5;
      rrect(ctx, 0, 0, 120, 42, 5);
      ctx.fill();
      ctx.stroke();

      // Textos 12V y 24V
      ctx.fillStyle = is24V ? '#475569' : '#f59e0b';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('12V', 14, 25);

      ctx.fillStyle = is24V ? '#38bdf8' : '#475569';
      ctx.textAlign = 'right';
      ctx.fillText('24V', 106, 25);

      // Marco de la corredera
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      rrect(ctx, 36, 6, 48, 30, 3);
      ctx.fill();
      ctx.stroke();

      // Botón deslizante conmutador (Animado de izquierda 12V a derecha 24V)
      const knobX = is24V ? 60 : 42;
      ctx.fillStyle = is24V ? '#0284c7' : '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = is24V ? '#38bdf8' : '#ef4444';
      ctx.shadowBlur = 8;
      rrect(ctx, knobX, 9, 18, 24, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 2. LED Indicador de Voltaje / Potencia de Salida
      if (isPowered) {
        ctx.save();
        ctx.fillStyle = is24V ? '#38bdf8' : '#22c55e';
        ctx.shadowColor = is24V ? '#38bdf8' : '#22c55e';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(263, 105, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 0;
        ctx.fillText(is24V ? '24V OUT' : '12V OUT', 263, 90);
        ctx.restore();
      }
    }
  },

  /* ---------------- CERRADERO ELECTRICO HES 5000 ---------------- */
  'hes-5000': {
    name:'Cerradero Eléctrico',
    tag:'Cerraderos · Fail-Secure',
    desc:'Cerradero eléctrico de perfil bajo para marcos estrechos con alimentación de 12V/24VDC y contacto de monitoreo.',
    tips:'Apertura mediante pulso de 12VDC en bornes POS(+) y NEG(-).',
    w:200, h:480,
    terminals:[
      {id:'pos', label:'POS(+)', x:66, y:317, role:'coil-pos'},
      {id:'neg', label:'NEG(-)', x:66, y:351, role:'coil-neg'},
      {id:'com', label:'COM',    x:66, y:385, role:'contact'},
    ],
    behavior:'coil',
    action:{label:'Pulso Desbloqueo Strike', kind:'momentary', stateKey:'energized'},
    draw(ctx,d,st){
      drawNativeVector(ctx, 'hes-5000', 200, 480, st);
      const isEnergized = Boolean(st && st.energized);

      ctx.save();
      if (isEnergized) {
        // 1. Hueco del pestillo abierto
        ctx.fillStyle = '#020617';
        ctx.fillRect(62, 148, 44, 84);

        // 2. Pestillo retraído / abierto (Keeper pivoteado) — animación física sin glow verde
        ctx.save();
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#3c424c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(54, 154);
        ctx.quadraticCurveTo(74, 166, 74, 190);
        ctx.quadraticCurveTo(74, 214, 54, 226);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  },
};

/* ---------- utilidades de dibujo compartidas ---------- */
function rrect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function line(ctx,x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function label(ctx,txt,x,y,color,size,align='left',weight='600'){
  if(size<=0) return;
  ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Segoe UI",Arial`;
  ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(txt,x,y);
}
/* panel metálico con bisel e iluminación superior */
function bevelPanel(ctx,x,y,w,h,r,c1,c2){
  const g=ctx.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,c1);g.addColorStop(1,c2);
  ctx.fillStyle=g;rrect(ctx,x,y,w,h,r);ctx.fill();
  ctx.strokeStyle='#181d25';ctx.lineWidth=2;rrect(ctx,x,y,w,h,r);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x+r,y+1.5);ctx.lineTo(x+w-r,y+1.5);ctx.stroke();
}
function innerSeam(ctx,x,y,w,h,r){
  ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;
  rrect(ctx,x,y,w,h,r);ctx.stroke();
}
/* tornillo Phillips */
function screw(ctx,x,y){
  const g=ctx.createRadialGradient(x-1,y-1,0.5,x,y,5);
  g.addColorStop(0,'#c8ccd4');g.addColorStop(1,'#6a7280');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();
  ctx.strokeStyle='#3a414c';ctx.lineWidth=1;ctx.stroke();
  ctx.strokeStyle='#2c323c';ctx.lineWidth=1.2;
  line(ctx,x-2.4,y,x+2.4,y);line(ctx,x,y-2.4,x,y+2.4);
}
/* carcasa plástica con costura (sensores de puerta) */
function plasticHousing(ctx,x,y,w,h){
  const g=ctx.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,'#e6e3da');g.addColorStop(1,'#c6c3ba');
  ctx.fillStyle=g;rrect(ctx,x,y,w,h,5);ctx.fill();
  ctx.strokeStyle='#96938a';ctx.lineWidth=1.5;rrect(ctx,x,y,w,h,5);ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.12)';ctx.lineWidth=1;rrect(ctx,x+3,y+3,w-6,h-6,3);ctx.stroke();
}
/* borne euro-block: bloque plástico + tornillo metálico ranurado + anillo de color */
function euroBlock(ctx,x,y,color,txt){
  // bloque
  ctx.fillStyle='#171c23';rrect(ctx,x-12,y-12,24,24,4);ctx.fill();
  ctx.strokeStyle='#3a4350';ctx.lineWidth=1.5;rrect(ctx,x-12,y-12,24,24,4);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x-12,y-8);ctx.lineTo(x+12,y-8);ctx.stroke();
  // anillo de color (entrada del conductor)
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,6.5,0,7);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1;ctx.stroke();
  // tornillo
  const g=ctx.createRadialGradient(x-0.7,y-0.7,0.3,x,y,3.4);
  g.addColorStop(0,'#e8d489');g.addColorStop(1,'#a8873a');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,3.2,0,7);ctx.fill();
  ctx.strokeStyle='#6a541f';ctx.lineWidth=0.8;ctx.stroke();
  ctx.strokeStyle='#5c4a1c';ctx.lineWidth=1;
  line(ctx,x-2,y,x+2,y);
  // etiqueta
  label(ctx,txt,x,y-19,'#aeb6c4',8,'center','700');
}
/* puerto RJ45 con pines dorados y LEDs de enlace/actividad */
function rj45(ctx,x,y,on,txt){
  // jack
  ctx.fillStyle='#101318';rrect(ctx,x-13,y-12,26,24,3);ctx.fill();
  ctx.strokeStyle='#3a4350';ctx.lineWidth=1.5;rrect(ctx,x-13,y-12,26,24,3);ctx.stroke();
  // cavidad
  ctx.fillStyle='#05070a';rrect(ctx,x-9,y-7,18,14,2);ctx.fill();
  // pines dorados
  ctx.fillStyle='#c8a94a';
  for(let i=0;i<8;i++){ ctx.fillRect(x-7.5+i*2.1,y-6,1.4,5); }
  // muesca del clip
  ctx.strokeStyle='#3a4350';ctx.lineWidth=1;
  line(ctx,x-5,y+7,x+5,y+7);
  // LEDs de enlace
  led(ctx,x-8,y-16,on?'#39d98a':'#262c34',on);
  led(ctx,x+8,y-16,on?'#ffb020':'#262c34',on&&Math.random()>0.3);
  // indicadores de polaridad PoE (+ arriba / − abajo)
  label(ctx,'+',x-14,y-8,on?'#ff8a8a':'#5a626e',8,'center','800');
  label(ctx,'−',x-14,y+8,'#8b94a3',9,'center','800');
  label(ctx,txt,x,y+22,'#aeb6c4',7,'center','700');
}
/* ============================================================
   Dispositivos personalizados (Estudio de Dispositivos)
   Renderizador paramétrico siguiendo las directrices de estilo.
   ============================================================ */
const TERM_ROLE_COLORS = {
  'coil-pos':'#c0392b', 'source-pos':'#c0392b',
  'coil-neg':'#20242a', 'source-neg':'#20242a',
  'contact':'#8a6d1f', 'input':'#3a6ea8',
  'com':'#8a6d1f', 'no':'#2e7d46', 'nc':'#7d3a2e', 'rex':'#3a6ea8',
};
function genericDeviceDraw(def){
  return function(ctx,d,st){
    const c=def.custom||{};
    const w=def.w,h=def.h;
    // ---- cuerpo según estilo ----
    if(c.body==='plastic'){
      const g=ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#f0eee8');g.addColorStop(.6,'#dddad2');g.addColorStop(1,'#c2bfb6');
      ctx.fillStyle=g;rrect(ctx,2,2,w-4,h-4,10);ctx.fill();
      ctx.strokeStyle='#96938a';ctx.lineWidth=2;rrect(ctx,2,2,w-4,h-4,10);ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,.12)';ctx.lineWidth=1;rrect(ctx,7,7,w-14,h-14,7);ctx.stroke();
      if(c.screws!==false){screw(ctx,14,14);screw(ctx,w-14,14);screw(ctx,14,h-14);screw(ctx,w-14,h-14);}
    }else if(c.body==='plate'){
      const g=ctx.createLinearGradient(0,0,w,0);
      g.addColorStop(0,'#7a828f');g.addColorStop(.5,'#9aa2ae');g.addColorStop(1,'#646c78');
      ctx.fillStyle=g;rrect(ctx,2,2,w-4,h-4,5);ctx.fill();
      ctx.strokeStyle='#3c424c';ctx.lineWidth=2;rrect(ctx,2,2,w-4,h-4,5);ctx.stroke();
      if(c.screws!==false){screw(ctx,w/2,14);screw(ctx,w/2,h-14);}
    }else{
      bevelPanel(ctx,0,0,w,h,8,'#454d5c','#2e343f');
      innerSeam(ctx,6,6,w-12,h-12,5);
      if(c.screws!==false){screw(ctx,12,12);screw(ctx,w-12,12);screw(ctx,12,h-12);screw(ctx,w-12,h-12);}
      if(c.body==='rack'){
        ctx.fillStyle='#1f242d';rrect(ctx,0,14,8,30,2);ctx.fill();rrect(ctx,w-8,14,8,30,2);ctx.fill();
      }
    }
    const dark = c.body!=='plastic';
    const txtMain = dark?'#cfd6e2':'#4a4d53';
    const txtSub  = dark?'#77808f':'#7a7d83';
    // ---- placa de identificación ----
    ctx.fillStyle='#c9c4b8';
    const pw2=Math.min(w-50, Math.max(70, def.name.length*6.2));
    rrect(ctx,(w-pw2)/2,10,pw2,20,3);ctx.fill();
    ctx.strokeStyle='#8f8a7e';ctx.lineWidth=1;rrect(ctx,(w-pw2)/2,10,pw2,20,3);ctx.stroke();
    label(ctx,def.name.toUpperCase().slice(0,26),w/2,21,'#3a3a35',8,'center','800');
    // ---- ventilación opcional ----
    if(c.vents){
      ctx.fillStyle='rgba(0,0,0,.3)';
      for(let i=0;i<4;i++){rrect(ctx,18,40+i*8,Math.min(70,w/3),3.5,2);ctx.fill();}
    }
    // ---- estado + LED ----
    let on=false, txt='';
    if(def.behavior==='coil'){ on=!!st.energized; txt=on?'ENERGIZADO':'SIN ENERGÍA'; }
    else if(def.behavior==='contact'){ const k=def.action?def.action.stateKey:null; on=k?!!st[k]:false; txt=on?'ACTIVADO':'EN REPOSO'; }
    else if(def.behavior==='source'){ on=st.power!==false; txt=on?'ENCENDIDO':'APAGADO'; }
    if(txt){
      led(ctx,w/2-40,h-16,on?'#39d98a':'#2c3833',on);
      label(ctx,txt,w/2-28,h-16,on?'#39d98a':txtSub,8,'left','800');
    }
    if(def.tag) label(ctx,def.tag,w/2,38,txtSub,7,'center','700');
    // ---- bornes ----
    for(const t of def.terminals){
      const col=TERM_ROLE_COLORS[t.role]||'#8a6d1f';
      if(c.termStyle==='rj45') rj45(ctx,t.x,t.y,on,t.label);
      else euroBlock(ctx,t.x,t.y,col,t.label);
    }
  };
}
function registerCustomDevice(def){
  def.draw = genericDeviceDraw(def);
  DEVICES[def.id] = def;
}
/* cargar personalizados guardados */
(function loadCustomDevices(){
  try{
    const saved = JSON.parse(localStorage.getItem('aclab_custom_devices')||'{}');
    for(const id in saved) registerCustomDevice(saved[id]);
  }catch(e){}
})();
function led(ctx,x,y,color,on){
  if(on){
    const halo=ctx.createRadialGradient(x,y,1,x,y,13);
    halo.addColorStop(0,color);
    halo.addColorStop(0.5,color+'99');
    halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=halo;
    ctx.beginPath();ctx.arc(x,y,13,0,7);ctx.fill();
  }
  ctx.fillStyle=on?color:'#262c33';
  ctx.beginPath();ctx.arc(x,y,4.5,0,7);ctx.fill();
  ctx.strokeStyle='#0b0e13';ctx.lineWidth=1;ctx.stroke();
  if(on){
    const core=ctx.createRadialGradient(x-1.2,y-1.2,0.3,x,y,3);
    core.addColorStop(0,'#ffffff');
    core.addColorStop(0.5,color);
    core.addColorStop(1,color);
    ctx.fillStyle=core;
    ctx.beginPath();ctx.arc(x,y,3.4,0,7);ctx.fill();
  }
}

/* ============================================================
   Cargador y Renderizador Síncrono de SVGs Vectoriales HD (V2 -> V1)
   ============================================================ */
window._hdSvgImages = window._hdSvgImages || {};

(function initHdSvgImages() {
  if (typeof window !== 'undefined' && window.HD_SVGS) {
    for (const [filename, svgStr] of Object.entries(window.HD_SVGS)) {
      try {
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          if (window.editor && typeof window.editor.render === 'function') {
            window.editor.render();
          }
          if (typeof renderPalette === 'function') {
            renderPalette();
          }
        };
        img.src = url;
        window._hdSvgImages[filename] = img;
      } catch (e) {
        console.error('Error creating SVG image for', filename, e);
      }
    }
  }
})();

function drawHdSvg(ctx, filename, w, h, fallbackFn) {
  const img = window._hdSvgImages[filename];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, w, h);
  } else if (fallbackFn) {
    fallbackFn(ctx);
  } else {
    ctx.fillStyle = '#1e293b';
    rrect(ctx, 0, 0, w, h, 8);
    ctx.fill();
  }
}

