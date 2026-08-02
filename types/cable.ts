export interface CableConductor {
  position: number;
  color_name: string;
  color_hex: string;
  function: string;
}

export interface CableType {
  id: string;
  name: string; // ej. "18/2", "22/6 Shielded", "Banana/Compuesto"
  gauge: number; // ej. 18, 22
  conductor_count: number;
  is_shielded: boolean;
  is_composite: boolean;
  conductors: CableConductor[];
  created_at?: string;
}

export interface CompositeCableBundle {
  id?: string;
  composite_cable_type_id: string;
  bundled_cable_type_id: string;
  bundle_jacket_color_name: string; // ej. "Gris", "Naranja", "Blanco", "Azul"
  bundle_jacket_color_hex: string;  // ej. "#64748b", "#f97316", "#ffffff", "#3b82f6"
  bundled_cable?: CableType;
}
