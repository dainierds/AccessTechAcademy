export type HardwareCategory = 
  | 'power_supply' 
  | 'strike' 
  | 'maglock' 
  | 'reader' 
  | 'controller' 
  | 'mortise_lock'
  | 'rex_button'
  | 'rex_pir'
  | 'panic_bar'
  | 'dps'
  | 'poe_supply'
  | 'other';

export type TerminalType = 'positive' | 'negative' | 'signal';

export interface HardwareTerminal {
  id: string;
  label: string;
  x: number; // Coordenada X (0-100 o % relativa al viewBox SVG)
  y: number; // Coordenada Y (0-100 o % relativa al viewBox SVG)
  type: TerminalType;
  color?: string; // Opcional: 'white' u otro color directo
}

export interface HardwareComponent {
  id: string;
  name: string;
  brand: string;
  category: HardwareCategory;
  svg_url: string;
  default_width: number;
  default_height: number;
  terminals: HardwareTerminal[];
  required_cable_type_ids?: string[]; // IDs de cable_types válidos para este componente
  is_active: boolean;
  created_by?: string;
  created_at?: string;
}

export const CATEGORY_LABELS: Record<HardwareCategory, string> = {
  power_supply: 'Fuente de Poder (Power Supply)',
  strike: 'Cerradero Eléctrico (Electric Strike)',
  maglock: 'Cerradura Magnética (Maglock)',
  reader: 'Lector Biométrico / RFID / Wiegand',
  controller: 'Panel de Control / PACS Controller',
  mortise_lock: 'Cerradura Eléctrica Embutida (Mortise Lock)',
  rex_button: 'Botón de Salida (Request-to-Exit / REX)',
  rex_pir: 'Sensor de Movimiento REX (PIR)',
  panic_bar: 'Barra de Pánico Eléctrica (Panic Bar)',
  dps: 'Contacto de Puerta (DPS Magnetic Switch)',
  poe_supply: 'Fuente / Inyector PoE (Power over Ethernet)',
  other: 'Otro Dispositivo / Componente'
};

export const TERMINAL_TYPE_LABELS: Record<TerminalType, string> = {
  positive: 'Positivo (+)',
  negative: 'Negativo / GND (-)',
  signal: 'Señal / Datos'
};

export const PRESET_SANDBOX_COMPONENTS: HardwareComponent[] = [
  {
    id: 'preset-dmm9000',
    name: 'Multímetro Digital DMM-9000 PRO',
    brand: 'ACCESSTECH',
    category: 'other',
    svg_url: '/svgs/digital_multimeter.svg',
    default_width: 380,
    default_height: 690,
    is_active: true,
    terminals: [
      { id: 'com', label: 'COM (-)', type: 'negative', x: 34.2, y: 84.8 },
      { id: 'vomega', label: 'VΩ (+)', type: 'positive', x: 65.8, y: 84.8 }
    ]
  },
  {
    id: 'preset-poe-switch',
    name: 'Switch PoE Gigabit Industrial',
    brand: 'ACCESSTECH',
    category: 'poe_supply',
    svg_url: '/svgs/poe_switch.svg',
    default_width: 525,
    default_height: 280,
    is_active: true,
    terminals: [
      { id: 'pwr_in_pos', label: '48V +', type: 'positive', x: 8.6, y: 24.3 },
      { id: 'pwr_in_neg', label: 'GND', type: 'negative', x: 8.6, y: 48.2 },
      { id: 'port1', label: 'P1 PoE', type: 'positive', x: 22.9, y: 67.9 },
      { id: 'port2', label: 'P2 PoE', type: 'positive', x: 37.1, y: 67.9 },
      { id: 'port3', label: 'P3 PoE', type: 'positive', x: 51.4, y: 67.9 },
      { id: 'port4', label: 'P4 PoE', type: 'positive', x: 65.7, y: 67.9 },
      { id: 'uplink', label: 'UP-LINK', type: 'signal', x: 80.0, y: 67.9 },
      { id: 'sfp', label: 'SFP OPT', type: 'signal', x: 91.4, y: 67.9 }
    ]
  },
  {
    id: 'preset-hid-aero-x100',
    name: 'Controladora de Acceso (2 Lectores)',
    brand: 'Genérico',
    category: 'controller',
    svg_url: '/svgs/hid_aero_x100.svg',
    default_width: 550,
    default_height: 475,
    is_active: true,
    terminals: [
      { id: 'top_tamper_pos', label: 'TAMPER (+)', type: 'signal', x: 41.2, y: 3.4 },
      { id: 'top_tamper_neg', label: 'TAMPER (-)', type: 'negative', x: 43.6, y: 3.4 },
      { id: 'top_ac_pos', label: 'AC FAIL (+)', type: 'signal', x: 46.1, y: 3.4 },
      { id: 'top_ac_neg', label: 'AC FAIL (-)', type: 'negative', x: 48.6, y: 3.4 },
      { id: 'top_bat_pos', label: 'BATT FAIL (+)', type: 'signal', x: 51.2, y: 3.4 },
      { id: 'top_bat_neg', label: 'BATT FAIL (-)', type: 'negative', x: 53.6, y: 3.4 },
      { id: 'top_pwr_neg', label: 'VIN (-)', type: 'negative', x: 56.1, y: 3.4 },
      { id: 'top_pwr_pos', label: '12-24VDC (+)', type: 'positive', x: 58.6, y: 3.4 },
      { id: 'r1_pwr', label: 'R1 PWR (+)', type: 'positive', x: 1.2, y: 14.9 },
      { id: 'r1_gnd1', label: 'R1 GND', type: 'negative', x: 1.2, y: 18.5 },
      { id: 'r1_d0', label: 'R1 D0 / DAT / B', type: 'signal', x: 1.2, y: 22.2 },
      { id: 'r1_d1', label: 'R1 D1 / CLK / A', type: 'signal', x: 1.2, y: 25.8 },
      { id: 'r1_gnd2', label: 'R1 GND', type: 'negative', x: 1.2, y: 29.5 },
      { id: 'r1_grnled', label: 'R1 GREEN LED', type: 'signal', x: 1.2, y: 33.1 },
      { id: 'r1_redled', label: 'R1 RED LED', type: 'signal', x: 1.2, y: 36.7 },
      { id: 'r1_beep', label: 'R1 BEEPER', type: 'signal', x: 1.2, y: 40.3 },
      { id: 'r1_nc', label: 'R1 NC', type: 'signal', x: 1.2, y: 44.0 },
      { id: 'r1_gnd3', label: 'R1 GND', type: 'negative', x: 1.2, y: 47.6 },
      { id: 'in1_pos', label: 'IN 1 (+)', type: 'signal', x: 1.2, y: 53.4 },
      { id: 'in1_neg', label: 'IN 1 (-)', type: 'negative', x: 1.2, y: 57.2 },
      { id: 'in2_pos', label: 'IN 2 (+)', type: 'signal', x: 1.2, y: 60.8 },
      { id: 'in2_neg', label: 'IN 2 (-)', type: 'negative', x: 1.2, y: 64.6 },
      { id: 'rly1_no', label: 'K1 NO', type: 'signal', x: 1.2, y: 70.2 },
      { id: 'rly1_c', label: 'K1 COM (C)', type: 'signal', x: 1.2, y: 73.9 },
      { id: 'rly1_nc', label: 'K1 NC', type: 'signal', x: 1.2, y: 77.7 },
      { id: 'rly2_no', label: 'K2 NO', type: 'signal', x: 1.2, y: 81.4 },
      { id: 'rly2_c', label: 'K2 COM (C)', type: 'signal', x: 1.2, y: 85.1 },
      { id: 'rly2_nc', label: 'K2 NC', type: 'signal', x: 1.2, y: 88.8 },
      { id: 'r2_pwr', label: 'R2 PWR (+)', type: 'positive', x: 92.9, y: 14.9 },
      { id: 'r2_gnd1', label: 'R2 GND', type: 'negative', x: 92.9, y: 18.5 },
      { id: 'r2_d0', label: 'R2 D0 / DAT / B', type: 'signal', x: 92.9, y: 22.2 },
      { id: 'r2_d1', label: 'R2 D1 / CLK / A', type: 'signal', x: 92.9, y: 25.8 },
      { id: 'r2_gnd2', label: 'R2 GND', type: 'negative', x: 92.9, y: 29.5 },
      { id: 'r2_grnled', label: 'R2 GREEN LED', type: 'signal', x: 92.9, y: 33.1 },
      { id: 'r2_redled', label: 'R2 RED LED', type: 'signal', x: 92.9, y: 36.7 },
      { id: 'r2_beep', label: 'R2 BEEPER', type: 'signal', x: 92.9, y: 40.3 },
      { id: 'r2_nc', label: 'R2 NC', type: 'signal', x: 92.9, y: 44.0 },
      { id: 'r2_gnd3', label: 'R2 GND', type: 'negative', x: 92.9, y: 47.6 },
      { id: 'in3_pos', label: 'IN 3 (+)', type: 'signal', x: 92.9, y: 53.4 },
      { id: 'in3_neg', label: 'IN 3 (-)', type: 'negative', x: 92.9, y: 57.2 },
      { id: 'in4_pos', label: 'IN 4 (+)', type: 'signal', x: 92.9, y: 60.8 },
      { id: 'in4_neg', label: 'IN 4 (-)', type: 'negative', x: 92.9, y: 64.6 },
      { id: 'rly3_no', label: 'K3 NO', type: 'signal', x: 92.9, y: 70.2 },
      { id: 'rly3_c', label: 'K3 COM (C)', type: 'signal', x: 92.9, y: 73.9 },
      { id: 'rly3_nc', label: 'K3 NC', type: 'signal', x: 92.9, y: 77.7 },
      { id: 'rly4_no', label: 'K4 NO', type: 'signal', x: 92.9, y: 81.4 },
      { id: 'rly4_c', label: 'K4 COM (C)', type: 'signal', x: 92.9, y: 85.1 },
      { id: 'rly4_nc', label: 'K4 NC', type: 'signal', x: 92.9, y: 88.8 }
    ]
  },
  {
    id: 'preset-camden-cx12',
    name: 'Módulo de Relé Lógico',
    brand: 'Genérico',
    category: 'controller',
    svg_url: '/svgs/camden_relay.svg',
    default_width: 550,
    default_height: 374,
    is_active: true,
    terminals: [
      { id: 'pwr1', label: '1 (PWR)', type: 'positive', x: 13.6, y: 75.4 },
      { id: 'pwr2', label: '2 (PWR)', type: 'negative', x: 18.9, y: 75.4 },
      { id: 'r1_no', label: '3 (R1 NO)', type: 'signal', x: 24.2, y: 75.4 },
      { id: 'r1_c', label: '4 (R1 C)', type: 'signal', x: 29.3, y: 75.4 },
      { id: 'r1_nc', label: '5 (R1 NC)', type: 'signal', x: 34.5, y: 75.4 },
      { id: 'r2_no', label: '6 (R2 NO)', type: 'signal', x: 39.6, y: 75.4 },
      { id: 'r2_c', label: '7 (R2 C)', type: 'signal', x: 44.9, y: 75.4 },
      { id: 'r2_nc', label: '8 (R2 NC)', type: 'signal', x: 50.2, y: 75.4 },
      { id: 'wet1_p', label: '9 (WET1+)', type: 'signal', x: 55.3, y: 75.4 },
      { id: 'wet1_n', label: '10 (WET1-)', type: 'negative', x: 60.5, y: 75.4 },
      { id: 'dry1_a', label: '11 (DRY1)', type: 'signal', x: 65.8, y: 75.4 },
      { id: 'dry1_b', label: '12 (DRY1)', type: 'signal', x: 70.9, y: 75.4 },
      { id: 'wet2_p', label: '13 (WET2+)', type: 'signal', x: 76.2, y: 75.4 },
      { id: 'wet2_n', label: '14 (WET2-)', type: 'negative', x: 81.5, y: 75.4 },
      { id: 'dry2_a', label: '15 (DRY2)', type: 'signal', x: 86.5, y: 75.4 },
      { id: 'dry2_b', label: '16 (DRY2)', type: 'signal', x: 91.8, y: 75.4 }
    ]
  },
  {
    id: 'preset-altronix-al600',
    name: 'Fuente de Poder (12V/24V)',
    brand: 'Genérico',
    category: 'power_supply',
    svg_url: '/svgs/altronix_power_supply.svg',
    default_width: 1100,
    default_height: 1380,
    is_active: true,
    terminals: [
      { id: 'ac1', label: 'AC L', type: 'positive', x: 9.1, y: 21.7 },
      { id: 'ac2', label: 'AC N', type: 'negative', x: 15.9, y: 21.7 },
      { id: 'bat_pos', label: 'BAT +', type: 'positive', x: 27.3, y: 88.8 },
      { id: 'bat_neg', label: 'BAT -', type: 'negative', x: 35.2, y: 88.8 },
      { id: 'dc_pos', label: '+12VDC', type: 'positive', x: 86.4, y: 43.5 },
      { id: 'dc_neg', label: 'GND', type: 'negative', x: 86.4, y: 49.8 }
    ]
  },
  {
    id: 'preset-maglock-600-lateral',
    name: 'Maglock 600 lbs con Bornera Lateral',
    brand: 'Genérico',
    category: 'maglock',
    svg_url: '/svgs/maglock_lateral.svg',
    default_width: 1080,
    default_height: 240,
    is_active: true,
    terminals: [
      { id: 'pos', label: '+ (Positivo 12/24V)', type: 'positive', x: 94.6, y: 35.4 },
      { id: 'neg', label: '- (Negativo GND)', type: 'negative', x: 94.6, y: 70.4 }
    ]
  },
  {
    id: 'preset-crashbar-elr',
    name: 'Crash Bar Electrificado (ELR/QEL)',
    brand: 'Genérico',
    category: 'panic_bar',
    svg_url: '/svgs/crashbar.svg',
    default_width: 500,
    default_height: 210,
    is_active: true,
    terminals: [
      { id: 'pos', label: '+ (Rojo)', type: 'positive', x: 92.0, y: 31.0 },
      { id: 'neg', label: '- (Negro)', type: 'negative', x: 92.0, y: 69.0 }
    ]
  },
  {
    id: 'preset-push-to-exit-lateral',
    name: 'Botón Push-to-Exit con Bornera Lateral',
    brand: 'Genérico',
    category: 'rex_button',
    svg_url: '/svgs/pushtoexit_lateral.svg',
    default_width: 460,
    default_height: 560,
    is_active: true,
    terminals: [
      { id: 'c', label: 'COM', type: 'signal', x: 86.5, y: 21.2 },
      { id: 'no', label: 'NO', type: 'signal', x: 86.5, y: 33.0 },
      { id: 'nc', label: 'NC', type: 'signal', x: 86.5, y: 44.8 },
      { id: 'ledp', label: 'LED + (+12V)', type: 'positive', x: 86.5, y: 56.6 },
      { id: 'ledn', label: 'LED - (GND)', type: 'negative', x: 86.5, y: 68.4 }
    ]
  },
  {
    id: 'preset-rfid-reader-lateral',
    name: 'Lector RFID / Teclado con Bornera Lateral',
    brand: 'Genérico',
    category: 'reader',
    svg_url: '/svgs/rfid_reader_lateral.svg',
    default_width: 500,
    default_height: 580,
    is_active: true,
    terminals: [
      { id: 'pwrp', label: '+12V (VIN)', type: 'positive', x: 87.6, y: 17.6 },
      { id: 'pwrn', label: 'GND (0V)', type: 'negative', x: 87.6, y: 29.6 },
      { id: 'd0', label: 'D0 (Data 0)', type: 'signal', x: 87.6, y: 41.7 },
      { id: 'd1', label: 'D1 (Data 1)', type: 'signal', x: 87.6, y: 53.8 },
      { id: 'beep', label: 'BEEP (Buzzer)', type: 'signal', x: 87.6, y: 65.9 },
      { id: 'ledc', label: 'LED (Control)', type: 'signal', x: 87.6, y: 77.9 }
    ]
  },
  {
    id: 'preset-door-position',
    name: 'Sensor de Contacto Magnético (DPS)',
    brand: 'Genérico',
    category: 'dps',
    svg_url: '/svgs/magnetic_door_sensor.svg',
    default_width: 480,
    default_height: 280,
    is_active: true,
    terminals: [
      { id: 'c', label: 'COM', type: 'signal', x: 89.6, y: 33.9 },
      { id: 'no', label: 'NO', type: 'signal', x: 89.6, y: 66.1 }
    ]
  },
  {
    id: 'preset-altronix',
    name: 'Fuente de Poder 12V/24V',
    brand: 'Genérico',
    category: 'power_supply',
    svg_url: '/svgs/altronix_al175_v2.svg',
    default_width: 320,
    default_height: 360,
    is_active: true,
    terminals: [
      { id: '12v', label: '+12VDC', type: 'positive', x: 82.2, y: 42.2 },
      { id: 'gnd', label: 'GND (-)', type: 'negative', x: 82.2, y: 54.4 }
    ]
  },
  {
    id: 'preset-hes',
    name: 'Cerradero Eléctrico',
    brand: 'Genérico',
    category: 'strike',
    svg_url: '/svgs/hes_5000_v2.svg',
    default_width: 200,
    default_height: 480,
    is_active: true,
    terminals: [
      { id: 'pos', label: 'POS(+)', type: 'positive', x: 33.0, y: 66.0 },
      { id: 'neg', label: 'NEG(-)', type: 'negative', x: 33.0, y: 73.1 },
      { id: 'com', label: 'COM', type: 'signal', x: 33.0, y: 80.2 }
    ]
  }
];
