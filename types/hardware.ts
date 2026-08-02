export type HardwareCategory = 
  | 'power_supply' 
  | 'strike' 
  | 'maglock' 
  | 'reader' 
  | 'controller' 
  | 'other';

export type TerminalType = 'positive' | 'negative' | 'signal';

export interface HardwareTerminal {
  id: string;
  label: string;
  x: number; // Coordenada X (0-100 o % relativa al viewBox SVG)
  y: number; // Coordenada Y (0-100 o % relativa al viewBox SVG)
  type: TerminalType;
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
  power_supply: 'Fuente de Poder',
  strike: 'Cerradero Electrónico',
  maglock: 'Cerradura Magnética',
  reader: 'Lector Biométrico / Wiegand',
  controller: 'Panel de Control / PACS',
  other: 'Otro Dispositivo'
};

export const TERMINAL_TYPE_LABELS: Record<TerminalType, string> = {
  positive: 'Positivo (+)',
  negative: 'Negativo / GND (-)',
  signal: 'Señal / Datos'
};
